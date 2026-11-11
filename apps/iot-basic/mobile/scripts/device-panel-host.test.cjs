/** 文件说明：运行实际嵌入宿主的 setup 与 Vue 生命周期，验证页面隐藏、恢复、失败回退和账号退出。 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { parse, compileScript } = require("vue/compiler-sfc");
const vue = require("vue");
/** harness 仅替换 Provider/桥/platform 边界，运行真实组件的 watch 和销毁逻辑。 */
function harness() {
  const file = path.resolve(
    __dirname,
    "../src/components/device-panel-host/device-panel-host.vue",
  );
  const source = fs
    .readFileSync(file, "utf8")
    .replace(/\/\/ #ifdef APP-PLUS[\s\S]*?\/\/ #endif/g, "");
  const script = compileScript(parse(source).descriptor, {
    id: "panel-host-test",
  }).content;
  const compiled = ts.transpileModule(script, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const calls = [],
    bridges = [],
    events = new Map(),
    availability = [];
  let listener, provider;
  class Provider {
    constructor(_, settings) {
      provider = this;
      this.settings = settings;
      this.state = { loading: false, snapshot: null, error: "" };
    }
    getState() {
      return this.state;
    }
    subscribe(fn) {
      listener = fn;
      fn(this.state);
      return () => {
        calls.push("unsubscribe");
        listener = undefined;
      };
    }
    update(next) {
      this.state = { ...this.state, ...next };
      listener?.(this.state);
    }
    async load(productID, deviceName, platform) {
      calls.push(["load", productID, deviceName, platform]);
      this.update({ loading: true, snapshot: null });
    }
    stop() {
      calls.push("stop");
    }
    clear() {
      calls.push("clear");
      this.update({ loading: false, snapshot: null });
    }
    createAdapter() {
      return {};
    }
  }
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => {
      if (name === "vue") return vue;
      if (name.includes("mini-panel-navigation.service")) return { openMiniPanelSettings: async () => false };
      if (name.includes("device-panel.provider"))
        return { DevicePanelProvider: Provider };
      if (name.includes("event-bus"))
        return {
          eventBus: {
            on: (key, fn) => events.set(key, fn),
            off: (key, fn) => {
              if (events.get(key) === fn) events.delete(key);
            },
          },
        };
      if (name.includes("/bridge"))
        return {
          attachPanelBridge: (frame, adapter, requirements, onError) => {
            const bridge = { frame, requirements, onError, disposed: false };
            bridges.push(bridge);
            return () => {
              bridge.disposed = true;
            };
          },
        };
      throw Error(`未替换边界 ${name}`);
    },
    module,
    module.exports,
  );
  const renderer = vue.createRenderer({
    createElement: () => ({}),
    insert() {},
    remove() {},
    patchProp() {},
    setElementText() {},
    createText: () => ({}),
    setText() {},
    createComment: () => ({}),
    parentNode() {},
    nextSibling() {},
  });
  const props = vue.reactive({
    productID: "6C",
    deviceName: "powercard",
    active: true,
  });
  const component = module.exports.default;
  component.render = () => vue.h("view");
  let vm;
  const app = renderer.createApp({
    render: () =>
      vue.h(component, {
        ...props,
        ref: (value) => {
          vm = value;
        },
        onAvailability: (value) => availability.push(value),
      }),
  });
  app.mount({});
  vm.$.setupState.frame = { src: "" };
  return { app, props, calls, bridges, events, availability, provider, vm };
}
/** settle 等待 post-flush watcher 和 iframe nextTick 完成。 */
async function settle() {
  await vue.nextTick();
  await vue.nextTick();
  await vue.nextTick();
}
/** snapshot 提供两个设备分别使用的资源入口，便于发现旧 iframe 被重新挂载。 */
const snapshot = (name = "powercard") => ({
  entryURL: `/panels/${name}/index.html`,
  resolution: { manifest: { requirements: [{ identifier: "power" }] } },
});

test("设备解析完成前只显示加载，未绑定时切回原生控制", async () => {
  const h = harness();
  assert.deepEqual(h.calls.find(Array.isArray), [
    "load",
    "6C",
    "powercard",
    "h5",
  ]);
  await settle();
  assert.equal(h.availability.at(-1), "loading");
  h.provider.update({ loading: false, snapshot: null });
  await settle();
  assert.equal(h.availability.at(-1), "native");
  assert.equal(h.bridges.length, 0);
  h.app.unmount();
});

test("隐藏立即释放桥，返回设置后仅恢复一个新桥，旧错误不污染新实例", async () => {
  const h = harness();
  h.provider.update({ loading: false, snapshot: snapshot() });
  await settle();
  assert.equal(h.availability.at(-1), "panel");
  assert.equal(h.bridges.length, 1);
  assert.equal(h.bridges[0].frame.src, "/panels/powercard/index.html");
  h.props.active = false;
  await settle();
  assert.equal(h.bridges[0].disposed, true);
  h.props.active = true;
  await settle();
  assert.equal(h.bridges.length, 2);
  h.bridges[0].onError("已失效错误");
  await settle();
  assert.equal(h.availability.at(-1), "panel");
  h.app.unmount();
  assert.equal(h.bridges[1].disposed, true);
  assert.equal(h.calls.filter((value) => value === "unsubscribe").length, 1);
  assert.equal(h.events.size, 0);
});

test("加载完成时页面已隐藏不创建窗口，握手失败回退且重试清除错误", async () => {
  const h = harness();
  h.props.active = false;
  await settle();
  h.provider.update({ loading: false, snapshot: snapshot() });
  await settle();
  assert.equal(h.bridges.length, 0);
  h.props.active = true;
  await settle();
  h.bridges[0].onError("握手失败");
  await settle();
  assert.equal(h.availability.at(-1), "native");
  assert.equal(h.bridges[0].disposed, true);
  await h.vm.$.setupState.reload();
  await settle();
  assert.equal(h.availability.at(-1), "loading");
  h.provider.update({ loading: false, snapshot: snapshot("new") });
  await settle();
  assert.equal(h.availability.at(-1), "panel");
  assert.equal(h.bridges.at(-1).frame.src, "/panels/new/index.html");
  h.events.get("auth:logout")();
  await settle();
  assert.equal(h.availability.at(-1), "native");
  assert.equal(h.bridges.at(-1).disposed, true);
  h.app.unmount();
});

// 返回已打开的页面时不能复用过期资源入口，即使浏览器曾缓存其代码。
test("网络资源到期时先重新解析，再挂载新授权，不重放旧入口", async () => {
  const h = harness();
  await settle();
  const before = h.calls.filter(x => Array.isArray(x) && x[0] === "load").length;
  const expired = snapshot();
  expired.resolution.assetExpiresAt = Date.now() - 1;
  h.provider.update({ loading: false, snapshot: expired });
  await settle();
  assert.equal(h.calls.filter(x => Array.isArray(x) && x[0] === "load").length, before + 1);
  assert.equal(h.bridges.length, 0);
  const current = snapshot();
  current.resolution.assetExpiresAt = Date.now() + 60000;
  h.provider.update({ loading: false, snapshot: current });
  await settle();
  assert.equal(h.bridges.length, 1);
  h.app.unmount();
});
