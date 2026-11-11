/** 文件说明：面板缓存使用真实压缩包、原始字节摘要及损坏/跨账号/撤销分支验证，不依赖手机蓝牙。 */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  test = require("node:test"),
  crypto = require("node:crypto"),
  ts = require("typescript"),
  fflate = require("fflate");
const root = path.resolve(__dirname, "..");
/** load 编译实际 TypeScript 模块，仅替换平台边界，不复制被测实现。 */
function load(file, mocks = {}) {
  const output = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => {
      if (name in mocks) return mocks[name];
      throw new Error(`缺少依赖替身 ${name}`);
    },
    module,
    module.exports,
  );
  return module.exports;
}
const sha = load("src/utils/panel-sha256.ts");
const archive = load("src/data/datasources/panel-package.ts", {
  fflate: fflate,
  "../../utils/panel-sha256": sha,
});

test("面板认证只读取实时凭据，接口参数不变，账号变化后失效", async () => {
  const previousUni = global.uni;
  let token = "current";
  const calls = [];
  global.uni = { getStorageSync: () => token };
  try {
    const { DevicePanelRepositoryImpl } = load("src/data/repositories/device-panel.repository.impl.ts", {
      fflate,
      "../../utils/request": { request: async (options) => { calls.push(options); return { msgToken: "accepted" }; } },
      "../../config": { config: { apiBaseUrl: "https://platform.invalid", appId: "app" } },
      "../../utils/request-context": { getRequestContext: () => ({ tenantCode: "org", projectID: "project" }) },
      "../../utils/panel-sha256": sha,
      "../datasources/local-storage.datasource": { localStorage: {} },
      "../datasources/panel-cache.datasource": { PanelCacheDataSource: class {} },
    });
    const repo = new DevicePanelRepositoryImpl();
    assert.deepEqual(await repo.auth(), { baseURL: "https://platform.invalid", headers: {
      "Content-Type": "application/json", "app-id": "app", token: "current",
      "ithings-tenant-code": "org", "ithings-project-id": "project",
    } });
    token = "refreshed";
    assert.equal((await repo.auth()).headers.token, token);
    let account = "original";
    repo.accountScope = () => account;
    const service = new DevicePanelService(repo), snapshot = { accountScope: account };
    const data = { data: '{"rf_btn1.2":"3"}', shadowControl: 3, withProfile: { code: "models", params: "{}" } };
    assert.deepEqual(await service.requestApiCloud(snapshot, "/api/v1/things/device/interact/property-control-send", data), { msgToken: "accepted" });
    assert.deepEqual(calls, [{ url: "/api/v1/things/device/interact/property-control-send", data, timeout: 8000 }]);
    await service.executeCloud({ ...snapshot, productID: "p", deviceName: "d" }, "writeProperties", { values: { clear_event: true }, completion: "receipt" });
    assert.equal(calls[1].data.reportedStateOnly, true);
    await service.executeCloud({ ...snapshot, productID: "p", deviceName: "d" }, "writeProperties", { values: { power: true } });
    assert.equal(calls[2].data.reportedStateOnly, true);
    await service.executeCloud({ ...snapshot, productID: "p", deviceName: "d" }, "writeProperties", { values: { privacyMode: true } });
    assert.equal("reportedStateOnly" in calls[3].data, false);
    account = "another";
    assert.throws(() => service.authCloud(snapshot), /账号已切换/);
    assert.throws(() => service.requestApiCloud(snapshot, "/api/v1/test", {}), /账号已切换/);
    token = "";
    await assert.rejects(repo.auth(), { code: "SESSION_CLOSED" });
  } finally { global.uni = previousUni; }
});

test("离线面板不发认证与接口调用，关闭后的旧宿主失效", async () => {
  const bridge = load("src/utils/device-panel/bridge.ts");
  const service = {
    accountScope: () => "owner",
    authCloud: async () => { throw new Error("不应调用真实认证"); },
    requestApiCloud: async () => { throw new Error("不应调用真实接口"); },
  };
  const { DevicePanelProvider } = load("src/providers/device-panel.provider.ts", {
    "./device-detail.provider": { deviceDetailProvider: {} },
    "../services/device-panel.service": { devicePanelService: service },
    "../services/panel-runtime.service": { panelRuntimeService: {} },
    "../utils/device-panel/bridge": bridge,
  });
  const provider = new DevicePanelProvider(service);
  provider.state = { transport: "cache", offline: true, snapshot: {
    accountScope: "owner", productID: "p", deviceName: "d", resolution: { manifest: { requirements: [] } },
    controlModel: { device: { id: "d" }, thingModel: { properties: [], actions: [] }, properties: [] },
  } };
  const adapter = provider.createAdapter();
  await assert.rejects(adapter.getAuth(), { code: "UNSUPPORTED_CAPABILITY" });
  await assert.rejects(adapter.request({ path: "/api/v1/test" }), { code: "UNSUPPORTED_CAPABILITY" });
  provider.stop();
  await assert.rejects(adapter.getAuth(), /面板会话已关闭/);
});
test("设置导航只使用当前快照，账号切换、旧会话及离线不开放跳转", async () => {
  const bridge = load("src/utils/device-panel/bridge.ts");
  let account = "owner";
  const service = { accountScope: () => account };
  const { DevicePanelProvider } = load("src/providers/device-panel.provider.ts", {
    "./device-detail.provider": { deviceDetailProvider: {} },
    "../services/device-panel.service": { devicePanelService: service },
    "../services/panel-runtime.service": { panelRuntimeService: {} },
    "../utils/device-panel/bridge": bridge,
  });
  const destinations = [];
  const provider = new DevicePanelProvider(service, async (identity) => { destinations.push(identity); });
  provider.state = { transport: "cloud", offline: false, snapshot: {
    accountScope: "owner", productID: "fixed-product", deviceName: "fixed-device", resolution: { manifest: { requirements: [] } },
    controlModel: { device: { id: "42" }, thingModel: { properties: [], actions: [] }, properties: [] },
  } };
  const adapter = provider.createAdapter();
  await adapter.openSettings();
  assert.deepEqual(destinations, [{ productID: "fixed-product", deviceName: "fixed-device" }]);
  account = "other";
  await assert.rejects(adapter.openSettings(), /面板会话已关闭/);
  account = "owner"; provider.stop();
  await assert.rejects(adapter.openSettings(), /面板会话已关闭/);
  provider.state = { ...provider.state, transport: "cache", offline: true };
  assert.equal(provider.createAdapter().openSettings, undefined);
  assert.equal(destinations.length, 1);
});

/** fixture 建立与后端相同的文件清单摘要，压缩元数据不参与内容比较。 */
function fixture() {
  const files = {
    "index.html": fflate.strToU8(
      '<html><head><meta id="ur-panel-csp"></head><body>panel</body></html>',
    ),
    "manifest.json": fflate.strToU8('{"name":"panel"}'),
  };
  const inventory = Object.keys(files)
    .sort()
    .map((name) => ({
      path: name,
      bytes: files[name].length,
      sha256: crypto.createHash("sha256").update(files[name]).digest("hex"),
    }));
  const hash = crypto
    .createHash("sha256")
    .update(
      inventory
        .map(
          (item) =>
            `${Buffer.byteLength(item.path)}:${item.path}:${item.bytes}:${item.sha256}\n`,
        )
        .join(""),
    )
    .digest("hex");
  return { files, inventory, hash };
}
test("SHA-256 与标准向量及较大字节一致", () => {
  for (const bytes of [
    Buffer.alloc(0),
    Buffer.from("abc"),
    Buffer.from("面板资源"),
    Buffer.alloc(1_000_003, 17),
  ])
    assert.equal(
      sha.panelSHA256(bytes),
      crypto.createHash("sha256").update(bytes).digest("hex"),
    );
});
test("STORE/DEFLATE 回导、损坏字节及摘要不匹配", () => {
  const f = fixture();
  for (const level of [0, 9]) {
    const decoded = archive.decodePanelPackage(
      fflate.zipSync(f.files, { level }),
      f.inventory,
      f.hash,
    );
    assert.deepEqual(
      Buffer.from(decoded["index.html"]),
      Buffer.from(f.files["index.html"]),
    );
  }
  const changed = { ...f.files, "index.html": fflate.strToU8("modified") };
  assert.throws(() =>
    archive.decodePanelPackage(fflate.zipSync(changed), f.inventory, f.hash),
  );
  assert.throws(() =>
    archive.decodePanelPackage(
      fflate.zipSync(f.files),
      f.inventory,
      "0".repeat(64),
    ),
  );
});
test("拒绝目录穿越、中央目录与本地名称不一致、展开超限", () => {
  const f = fixture();
  for (const name of ["../escape.js", "/root.js", "a\\b.js", "a/%2e.js"])
    assert.equal(archive.safePanelPath(name), false);
  const bytes = fflate.zipSync(f.files, { level: 0 });
  const changed = Uint8Array.from(bytes);
  changed[30] = "x".charCodeAt(0);
  assert.throws(() => archive.decodePanelPackage(changed, f.inventory, f.hash));
  const bomb = Uint8Array.from(bytes),
    view = new DataView(bomb.buffer);
  for (let i = 0; i < bomb.length - 46; i++) {
    if (view.getUint32(i, true) === 0x02014b50) {
      view.setUint32(i + 24, 31 * 1024 * 1024, true);
      break;
    }
  }
  assert.throws(() => archive.decodePanelPackage(bomb, f.inventory, f.hash));
});
const { DevicePanelService } = load("src/services/device-panel.service.ts", {
  "../data/repositories/device-panel.repository.impl": {
    DevicePanelRepositoryImpl: class {},
  },
});
test("只有断网恢复本账号缓存，明确默认撤销旧缓存，业务拒绝不能回旧面板", async () => {
  let scope = "account-one",
    cleared = 0;
  const snapshot = {
    accountScope: scope,
    productID: "p",
    deviceName: "d",
    resolution: { packageHash: "hash" },
    entryURL: "local-file",
  };
  const repo = {
    accountScope: () => scope,
    resolve: async () => {
      throw new Error("network unavailable");
    },
    cached: async () => snapshot,
    invalidate: async () => {
      cleared++;
    },
  };
  const service = new DevicePanelService(repo);
  assert.equal(
    (await service.load("p", "d", "appAndroid", null)).offline,
    true,
  );
  repo.resolve = async () => ({ mode: "builtin", message: "面板已撤销" });
  assert.equal((await service.load("p", "d", "appIos", null)).snapshot, null);
  assert.equal(cleared, 1);
  repo.resolve = async () => {
    throw Object.assign(new Error("无权限"), { code: 100005 });
  };
  await assert.rejects(
    () => service.load("p", "d", "appAndroid", null),
    /无权限/,
  );
  scope = "account-two";
  await assert.rejects(
    () => service.readCloud(snapshot, ["power"]),
    /账号已切换/,
  );
});
test("相同摘要复验后复用缓存目录，下载失败不覆盖旧解析指针", async () => {
  const previousPlus = global.plus,
    previousUni = global.uni;
  let pointer = null,
    downloads = 0;
  global.plus = { io: {}, zip: {} };
  global.uni = {
    downloadFile(options) {
      downloads++;
      options.fail(new Error("download failed"));
    },
  };
  try {
    const { PanelCacheDataSource } = load(
      "src/data/datasources/panel-cache.datasource.ts",
      {
        fflate: fflate,
        "./panel-package": archive,
        "../../utils/panel-sha256": sha,
        "./local-storage.datasource": {
          localStorage: {
            set(_key, value) {
              pointer = value;
            },
          },
        },
      },
    );
    const source = new PanelCacheDataSource(),
      old = {
        accountScope: "account",
        productID: "p",
        deviceName: "d",
        entryURL: "private/old/index.html",
        installedAt: 123,
        resolution: { packageHash: "same", download: { files: [], url: "" } },
        controlModel: { properties: [] },
      };
    source.cached = async () => old;
    const fresh = {
      ...old,
      entryURL: "remote/index.html",
      resolution: {
        ...old.resolution,
        entryURL: "remote/index.html",
        download: {
          url: "https://invalid.test/panel.zip",
          compressedBytes: 1,
          totalBytes: 1,
        },
      },
      controlModel: { properties: [{ value: true }] },
    };
    const installed = await source.install(fresh);
    assert.equal(installed.entryURL, old.entryURL);
    assert.equal(installed.controlModel.properties[0].value, true);
    assert.equal(downloads, 0);
    assert.equal(pointer, installed);
    const preserved = pointer;
    await assert.rejects(
      () =>
        source.install({
          ...fresh,
          resolution: { ...fresh.resolution, packageHash: "different" },
        }),
      /download failed/,
    );
    assert.equal(downloads, 1);
    assert.equal(pointer, preserved);
  } finally {
    global.plus = previousPlus;
    global.uni = previousUni;
  }
});

test("平台设备成功码为200，行为输出还原JSON类型", async () => {
  let reply = { code: 200, msg: "success", outputParams: '{"power":true}' };
  const { DevicePanelRepositoryImpl } = load(
    "src/data/repositories/device-panel.repository.impl.ts",
    {
      fflate: fflate,
      "../../utils/request": { request: async () => reply },
      "../../config": { config: {} },
      "../../utils/request-context": { getRequestContext: () => ({}) },
      "../../utils/panel-sha256": sha,
      "../datasources/local-storage.datasource": { localStorage: {} },
      "../datasources/panel-cache.datasource": {
        PanelCacheDataSource: class {},
      },
    },
  );
  const repo = new DevicePanelRepositoryImpl();
  assert.deepEqual(await repo.command("p", "d", "cmd-1", true), {
    commandID: "cmd-1",
    status: "succeeded",
    code: 200,
    message: "success",
    output: { power: true },
  });
  reply = { code: 500, msg: "device failed", outputParams: "null" };
  assert.equal((await repo.command("p", "d", "cmd-2", true)).status, "failed");
});

test("联机快照必须匹配当前设备，不能使用加载失败后遗留的上一设备模型", async () => {
  const repository = {
    accountScope: () => "account",
    resolve: async () => ({
      mode: "panel",
      panelID: "panel",
      packageHash: "hash",
      entryURL: "asset",
    }),
  };
  const service = new DevicePanelService(repository);
  await assert.rejects(
    () =>
      service.load("current-product", "current-device", "h5", {
        device: {
          productID: "previous-product",
          deviceName: "previous-device",
        },
      }),
    /物模型/,
  );
  const model = {
    device: { productID: "current-product", deviceName: "current-device" },
  };
  const loaded = await service.load(
    "current-product",
    "current-device",
    "h5",
    model,
  );
  assert.equal(loaded.snapshot.controlModel, model);
});

test("App固定壳允许无参数设备设置，拒绝夹带路由及错误nonce，重复请求只导航一次", async () => {
  const previous = { uni: global.uni, plus: global.plus, pages: global.getCurrentPages };
  let intercept;
  const calls = [];
  const replies = [];
  const view = { overrideUrlLoading: (_options, callback) => { intercept = callback; }, evalJS: (text) => replies.push(text), close: () => {} };
  global.plus = { webview: { create: () => view } };
  global.uni = { getSystemInfoSync: () => ({ statusBarHeight: 0 }) };
  global.getCurrentPages = () => [{ $getAppWebview: () => ({ append: () => {} }) }];
  const { openNativePanel } = load("src/data/datasources/panel-runtime.datasource.ts");
  const handle = openNativePanel({ entryURL: 'test', requirements: [], context: {}, model: {} }, async (method, params) => { calls.push({ method, params }); });
  try {
    const nonce = 'a'.repeat(32);
    await intercept({ url: 'urpanel://ready?nonce=' + nonce });
    const message = { protocol: 'ur-panel-native/v1', nonce, id: 'settings', method: 'openSettings', params: {} };
    const send = (data) => intercept({ url: 'urpanel://call?data=' + encodeURIComponent(JSON.stringify(data)) });
    await send({ ...message, nonce: 'b'.repeat(32) });
    await send({ ...message, params: { url: '/other', deviceName: 'wrong' } });
    assert.equal(calls.length, 0);
    await send(message); await send(message);
    assert.deepEqual(calls, [{ method: 'openSettings', params: {} }]);
    assert.ok(replies.some((text) => text.includes('__urPanelReply') && text.includes('"ok":true')));
    handle.dispose(); await send({ ...message, id: 'closed' });
    assert.equal(calls.length, 1);
  } finally {
    handle.dispose(); global.uni = previous.uni; global.plus = previous.plus; global.getCurrentPages = previous.pages;
  }
});


test("原生string保持数字HEX及JSON文字，服务按当前模型传递字段类型", async () => {
  const raw={scene_data:"1000000000000000000000000000",text:"true",quoted:'"原文"',number:"24.5"};
  const {DevicePanelRepositoryImpl}=load("src/data/repositories/device-panel.repository.impl.ts",{
    fflate,"../../utils/request":{request:async()=>({withProperties:Object.fromEntries(Object.entries(raw).map(([id,value])=>[id,{value,quality:"GOOD"}]))})},
    "../../config":{config:{}},"../../utils/request-context":{getRequestContext:()=>({})},"../../utils/panel-sha256":sha,
    "../datasources/local-storage.datasource":{localStorage:{}},"../datasources/panel-cache.datasource":{PanelCacheDataSource:class{}},
  });
  const repo=new DevicePanelRepositoryImpl(),types={scene_data:"string",text:"string",quoted:"string",number:"float"},actual=await repo.read("p","d",Object.keys(raw),types);
  for(const id of ["scene_data","text","quoted"])assert.equal(actual[id].value,raw[id]);assert.equal(actual.number.value,24.5);
  let received;const service=new DevicePanelService({accountScope:()=>"scope",read:async(...args)=>{received=args;return actual;}});
  const snapshot={accountScope:"scope",productID:"p",deviceName:"d",controlModel:{thingModel:{properties:Object.entries(types).map(([identifier,type])=>({identifier,define:{type}}))}}};
  await service.readCloud(snapshot,Object.keys(raw));assert.deepEqual(received,["p","d",Object.keys(raw),types]);
});

test("真实候选包可通过原生缓存解包校验", { skip: !process.env.PANEL_LIBRARY_REPORT }, () => {
  const report = JSON.parse(fs.readFileSync(process.env.PANEL_LIBRARY_REPORT, "utf8"));
  assert.equal(report.length, 6);
  for (const item of report) {
    const bytes = fs.readFileSync(item.path);
    assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), item.packageHash);
    const files = fflate.unzipSync(bytes);
    const inventory = Object.keys(files).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b))).map((name) => ({
      path: name, bytes: files[name].length, sha256: crypto.createHash("sha256").update(files[name]).digest("hex"),
    }));
    const contentHash = crypto.createHash("sha256").update(inventory.map((entry) => `${Buffer.byteLength(entry.path)}:${entry.path}:${entry.bytes}:${entry.sha256}\n`).join("")).digest("hex");
    const decoded = archive.decodePanelPackage(bytes, inventory, contentHash);
    assert.deepEqual(Buffer.from(decoded["index.html"]), Buffer.from(files["index.html"]));
    assert.deepEqual(Buffer.from(decoded[".data/thing-model.json"]), Buffer.from(files[".data/thing-model.json"]));
    const meta = JSON.parse(Buffer.from(decoded["meta.json"]).toString("utf8"));
    assert.ok(meta.platforms.includes("h5"));
    // 解包通过只证明资源完整，终端声明和真机能力另行验证。
  }
});

test("真实候选清单通过原生固定壳枚举消息桥", { skip: !process.env.PANEL_LIBRARY_REPORT }, async () => {
  const vm = require("node:vm"), { MessageChannel } = require("node:worker_threads");
  const report = JSON.parse(fs.readFileSync(process.env.PANEL_LIBRARY_REPORT, "utf8"));
  assert.equal(report.length, 6);
  for (const item of report) {
    const files = fflate.unzipSync(fs.readFileSync(item.path));
    const meta = JSON.parse(Buffer.from(files["meta.json"]).toString("utf8"));
    const model = JSON.parse(Buffer.from(files[".data/thing-model.json"]).toString("utf8"));
    const declared = JSON.parse(Buffer.from(files[".data/declared-controls.json"]).toString("utf8"));
    const control = declared.find((entry) => entry.identifier === "online_state"); assert.ok(control);
    const listeners = {}, calls = []; let port, sessionID, readyURL;
    const frameWindow = {postMessage: (message, _origin, ports) => {sessionID = message.sessionID;port = ports[0];}};
    const frame = {contentWindow: frameWindow, src:""};
    const location = {};
    const scope = {crypto: crypto.webcrypto, MessageChannel, setTimeout, clearTimeout, Promise, URL, encodeURIComponent,
      document: {querySelector: () => frame}, location,
      addEventListener: (name, fn) => {listeners[name] = fn;}, removeEventListener: (name) => {delete listeners[name];},
    };
    scope.window = scope;
    Object.defineProperty(location, "href", {set(value) {
      if (value.startsWith("urpanel://ready?nonce=")) {readyURL = value;return;}
      if (!value.startsWith("urpanel://call?data=")) return;
      const message = JSON.parse(decodeURIComponent(value.split("?data=")[1]));calls.push(message);
      queueMicrotask(() => scope.__urPanelReply({id:message.id,nonce:message.nonce,ok:true,result:{commandID:"accepted"}}));
    }});
    vm.runInNewContext(fs.readFileSync(path.join(root,"static/device-panel/runtime.js"),"utf8"), scope);
    const nonce = readyURL.split("nonce=")[1]; assert.match(nonce,/^[a-f0-9]{32}$/);
    const props = model.properties.map((field) => ({identifier:field.identifier,mode:field.mode,...field.define}));
    scope.__urPanelStart({nonce,entryURL:"local-panel",requirements:meta.requirements,context:{capabilities:{}},model:{properties:props,actions:[]}});
    listeners.message({source:frameWindow,data:{protocol:"ur-panel/v1",type:"ready"}});assert.ok(port && sessionID);
    const request = (id,value,completion) => new Promise((resolve) => {
      const handler = (response) => {if (response.id!==id) return;port.off("message",handler);resolve(response);};
      port.on("message",handler);port.postMessage({protocol:"ur-panel/v1",sessionID,type:"request",id,method:"writeProperties",params:{values:{online_state:value},...(completion ? {completion} : {})}});
    });
    try {
      const first=await request("one",control.trigger.value), repeated=await request("two",control.trigger.value), invalid=await request("invalid",2);
      const receipt=await request("receipt",control.trigger.value,"receipt");
      assert.equal(first.ok,true);assert.equal(repeated.ok,true);assert.equal(invalid.ok,false);
      assert.equal(receipt.ok,true);assert.equal(calls.length,3);assert.equal(calls[2].params.completion,"receipt");assert.deepEqual(calls.map((x)=>x.params.values.online_state),[control.trigger.value,control.trigger.value,control.trigger.value]);
    } finally {listeners.pagehide?.();port.close();}
  }
});

test("原生实验包经服务安装并在断网时恢复同设备缓存", { skip: !process.env.PANEL_NATIVE_EXPERIMENT_REPORT }, async () => {
  const report = JSON.parse(fs.readFileSync(process.env.PANEL_NATIVE_EXPERIMENT_REPORT, "utf8"));
  assert.equal(report.length, 6);
  for (const item of report) {
    const bytes = fs.readFileSync(item.path), rawFiles = fflate.unzipSync(bytes);
    const manifest = JSON.parse(Buffer.from(rawFiles["meta.json"]).toString("utf8"));
    const inventory = Object.keys(rawFiles).sort((a,b) => Buffer.compare(Buffer.from(a),Buffer.from(b))).map((name) => ({
      path:name,bytes:rawFiles[name].length,sha256:crypto.createHash("sha256").update(rawFiles[name]).digest("hex"),
    }));
    const hash = crypto.createHash("sha256").update(inventory.map((entry) => `${Buffer.byteLength(entry.path)}:${entry.path}:${entry.bytes}:${entry.sha256}\n`).join("")).digest("hex");
    let online = true, cached = null, installs = 0;
    const repo = {
      accountScope: () => "fixture-account",
      resolve: async (_product, _device, platform) => {
        if (!online) throw new Error("模拟网络不可用");
        assert.ok(manifest.platforms.includes(platform));
        return {mode:"panel",panelID:"fixture-panel",packageHash:hash,entryURL:"https://fixture.invalid/entry",manifest};
      },
      install: async (snapshot) => {
        const decoded = archive.decodePanelPackage(bytes,inventory,snapshot.resolution.packageHash);
        assert.deepEqual(Buffer.from(decoded["index.html"]),Buffer.from(rawFiles["index.html"]));
        installs++;cached = {...snapshot,entryURL:"fixture-local-file"};return cached;
      },
      cached: async () => cached,
      invalidate: async () => {cached = null;},
    };
    const service = new DevicePanelService(repo), model = {device:{productID:"fixture-product",deviceName:"fixture-device"}};
    for (const platform of ["appAndroid","appIos"]) {
      online=true;const loaded = await service.load("fixture-product","fixture-device",platform,model);
      assert.equal(loaded.offline,false);assert.equal(loaded.snapshot.entryURL,"fixture-local-file");
      online=false;const restored = await service.load("fixture-product","fixture-device",platform,model);
      assert.equal(restored.offline,true);assert.equal(restored.snapshot.productID,"fixture-product");assert.equal(restored.snapshot.deviceName,"fixture-device");
    }
    assert.equal(installs,2);
  }
});

test("原始候选ZIP不能冒充后台规范化安装包", { skip: !process.env.PANEL_LIBRARY_REPORT || !process.env.PANEL_VALIDATE_CLI }, () => {
  const {execFileSync} = require("node:child_process");
  const report = JSON.parse(fs.readFileSync(process.env.PANEL_LIBRARY_REPORT,"utf8"));
  assert.equal(report.length,6);
  for (const item of report) {
    const raw = fs.readFileSync(item.path);
    const normalized = JSON.parse(execFileSync(process.env.PANEL_VALIDATE_CLI,["things","panel","validate",item.path],{encoding:"utf8"}));
    const rawFiles = fflate.unzipSync(raw), rawHTML = Buffer.from(rawFiles["index.html"]);
    const index = normalized.files.find((entry) => entry.path === "index.html");assert.ok(index);
    assert.notEqual(crypto.createHash("sha256").update(rawHTML).digest("hex"), index.sha256);
    // 服务端清单与规范化摘要不得直接用于未注入资源限制的原始ZIP。
    assert.throws(() => archive.decodePanelPackage(raw,normalized.files,normalized.packageHash));
  }
});

test("规范化后台导出包经过原生安装与缓存复验", { skip: !process.env.PANEL_NORMALIZED_PACKAGE || !process.env.PANEL_VALIDATE_CLI }, async () => {
  const {execFileSync} = require("node:child_process"), packagePath = process.env.PANEL_NORMALIZED_PACKAGE;
  const bytes = fs.readFileSync(packagePath), validated = JSON.parse(execFileSync(process.env.PANEL_VALIDATE_CLI,["things","panel","validate",packagePath],{encoding:"utf8"}));
  const raw = fflate.unzipSync(bytes);assert.ok(Buffer.from(raw["index.html"]).includes('id="ur-panel-csp"'));
  const storage = new Map(), files = new Map([["temp://panel.zip",bytes]]);let downloads=0;
  const directory = (base) => ({
    getDirectory(name,_options,success) {success(directory(base+name+"/"));},
    toLocalURL() {return base;},removeRecursively(success) {success();},
  });
  const previous = {uni:global.uni,plus:global.plus};
  global.uni = {
    downloadFile(options) {downloads++;options.success({statusCode:200,tempFilePath:"temp://panel.zip"});},
    base64ToArrayBuffer(value) {const buffer=Buffer.from(value,"base64");return buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);},
  };
  class FileReader {
    readAsDataURL(file) {this.result="data:application/octet-stream;base64,"+Buffer.from(file.bytes).toString("base64");this.onload();}
  }
  global.plus = {
    io: {
      PRIVATE_DOC:1,FileReader,
      resolveLocalFileSystemURL(url,success,reject) {
        if (!files.has(url)) return reject(new Error("missing mock file"));
        success({file(callback){callback({bytes:files.get(url)});},copyTo(dir,name,callback){files.set(dir.toLocalURL()+name,files.get(url));callback({});}});
      },
      requestFileSystem(_kind,success) {success({root:directory("/private/")});},
    },
    zip: {decompress(_src,dest,success) {for(const [name,content] of Object.entries(raw))files.set(dest+name,Buffer.from(content));success();}},
  };
  try {
    const {PanelCacheDataSource} = load("src/data/datasources/panel-cache.datasource.ts",{
      fflate,"./panel-package":archive,"../../utils/panel-sha256":sha,
      "./local-storage.datasource":{localStorage:{get:(key)=>storage.get(key),set:(key,value)=>storage.set(key,value),remove:(key)=>storage.delete(key)}},
    });
    const source = new PanelCacheDataSource(), snapshot = {
      accountScope:"fixture-account",productID:"p",deviceName:"d",entryURL:"remote-entry",installedAt:0,
      controlModel:{properties:[]},resolution:{packageHash:validated.packageHash,entryURL:"remote-entry",download:{url:"https://fixture.invalid/asset",files:validated.files,compressedBytes:bytes.length,totalBytes:validated.files.reduce((sum,f)=>sum+f.bytes,0)}},
    };
    const installed = await source.install(snapshot);assert.ok(installed.entryURL.includes("/device-panels/fixture-account/"));
    assert.equal(installed.resolution.download.url,"");assert.equal(downloads,1);
    const cached = await source.cached("fixture-account","p","d");assert.equal(cached.entryURL,installed.entryURL);
    const reused = await source.install({...snapshot,controlModel:{properties:[{value:42}]}});assert.equal(downloads,1);assert.equal(reused.controlModel.properties[0].value,42);
    assert.equal(await source.cached("other-account","p","d"),null);
    assert.equal(await source.cached("fixture-account","p","other-device"),null);
    files.set(installed.entryURL,Buffer.from("damaged"));await assert.rejects(() => source.cached("fixture-account","p","d"),/损坏/);
    // 相同摘要的本地文件损坏后不能继续复用；重新下载并完成验证后才能更新指针。
    const repaired = await source.install(snapshot);assert.equal(downloads,2);assert.notEqual(repaired.entryURL,installed.entryURL);
    assert.equal((await source.cached("fixture-account","p","d")).entryURL,repaired.entryURL);
    // 新包校验失败时保留已验证的旧指针，不能用失败结果替换可用缓存。
    const wrong = {...snapshot,resolution:{...snapshot.resolution,packageHash:"0".repeat(64)}};
    await assert.rejects(() => source.install(wrong),/摘要|不匹配/);assert.equal(downloads,3);
    assert.equal((await source.cached("fixture-account","p","d")).entryURL,repaired.entryURL);
    const zipPath=repaired.entryURL.slice(0,-"index.html".length)+"package.zip", saved=files.get(zipPath), damaged=Buffer.from(saved);
    damaged[Math.floor(damaged.length/2)] ^= 1;files.set(zipPath,damaged);
    await assert.rejects(() => source.cached("fixture-account","p","d"));files.set(zipPath,saved);
    assert.equal((await source.cached("fixture-account","p","d")).entryURL,repaired.entryURL);
  } finally {global.uni=previous.uni;global.plus=previous.plus;}
});

test("面板连接事件区分云端与设备上下线并隔离设备", async () => {
  const bridge = load("src/utils/device-panel/bridge.ts");
  let detail = {device:{productID:"p",deviceName:"d",status:3}}, subscriber = null;
  const detailProvider = {getState:()=>detail,subscribe:(callback)=>{subscriber=callback;return ()=>{subscriber=null;};}};
  const sent=[];const service = {accountScope:()=>"owner",readCloud:async()=>({}),executeCloud:async(_snapshot,method,params)=>{sent.push({method,params});return "command";}};
  const {DevicePanelProvider} = load("src/providers/device-panel.provider.ts",{
    "./device-detail.provider":{deviceDetailProvider:detailProvider},"../services/device-panel.service":{devicePanelService:service},
    "../services/panel-runtime.service":{panelRuntimeService:{}},"../utils/device-panel/bridge":bridge,
  });
  const provider = new DevicePanelProvider(service);
  provider.state = {transport:"cloud",offline:false,snapshot:{accountScope:"owner",productID:"p",deviceName:"d",resolution:{manifest:{requirements:[]}},controlModel:{device:{id:"d",productID:"p",deviceName:"d",status:3},thingModel:{properties:[],actions:[]},properties:[]}}};
  const adapter = provider.createAdapter(),events=[];
  const stop=adapter.subscribe(["connection"],(event)=>events.push(event));
  try {
    await new Promise((resolve)=>setTimeout(resolve,30));
    assert.ok(events.some((event)=>event.data.deviceOnline===false));
    assert.ok(events.some((event)=>event.data.cloud?.connected===true && event.data.deviceOnline===false));
    await assert.rejects(adapter.writeProperties({power:true}),/设备离线/);
    await assert.rejects(adapter.invokeAction("move",{}),/设备离线/);
    assert.equal(sent.length,0);
    detail={device:{productID:"p",deviceName:"d",status:2}};subscriber(detail);
    assert.equal(events.at(-1).data.deviceOnline,true);
    await adapter.writeProperties({power:true});assert.equal(sent.length,1);
    await adapter.writeProperties({power:true},{completion:"receipt"});assert.equal(sent[1].params.completion,"receipt");
    const before=events.length;detail={device:{productID:"other",deviceName:"other",status:3}};subscriber(detail);assert.equal(events.length,before);
  } finally {stop();adapter.dispose();provider.stop();}
  assert.equal(subscriber,null);
});

test("离线缓存不会复用设备旧在线状态", () => {
  const bridge=load("src/utils/device-panel/bridge.ts");let subscriber;
  const detailProvider={getState:()=>({device:{productID:"p",deviceName:"d",status:2}}),subscribe:(callback)=>{subscriber=callback;return()=>{subscriber=null;};}};
  const service={accountScope:()=>"owner",readCloud:async()=>{throw new Error("离线不能读取云端");}};
  const {DevicePanelProvider}=load("src/providers/device-panel.provider.ts",{"./device-detail.provider":{deviceDetailProvider:detailProvider},"../services/device-panel.service":{devicePanelService:service},"../services/panel-runtime.service":{panelRuntimeService:{}},"../utils/device-panel/bridge":bridge});
  const provider=new DevicePanelProvider(service);provider.state={transport:"cache",offline:true,snapshot:{accountScope:"owner",productID:"p",deviceName:"d",resolution:{manifest:{requirements:[]}},controlModel:{device:{id:"d",productID:"p",deviceName:"d",status:2},thingModel:{properties:[],actions:[]},properties:[]}}};
  const adapter=provider.createAdapter(),events=[];const stop=adapter.subscribe(["connection"],(event)=>events.push(event));
  try {assert.equal(events.at(-1).data.deviceOnline,false);subscriber({device:{productID:"p",deviceName:"d",status:2}});assert.equal(events.at(-1).data.deviceOnline,false);}
  finally {stop();adapter.dispose();provider.stop();}
  assert.equal(subscriber,null);
});

test("原生窗口握手前保留最新设备连接状态", async () => {
  const previous={uni:global.uni,plus:global.plus,pages:global.getCurrentPages};let intercept;const replies=[];
  const view={overrideUrlLoading:(_options,callback)=>{intercept=callback;},evalJS:(text)=>replies.push(text),close:()=>{}};
  global.plus={webview:{create:()=>view}};global.uni={getSystemInfoSync:()=>({statusBarHeight:0})};global.getCurrentPages=()=>[{$getAppWebview:()=>({append:()=>{}})}];
  const {openNativePanel}=load("src/data/datasources/panel-runtime.datasource.ts");const handle=openNativePanel({entryURL:"test",requirements:[],context:{},model:{}},async()=>({}));
  try {
    handle.publish({topic:"connection",data:{deviceOnline:false}});
    handle.publish({topic:"connection",data:{cloud:{connected:true}}});
    const nonce="a".repeat(32);await intercept({url:"urpanel://ready?nonce="+nonce});
    assert.equal(replies.length,2);assert.match(replies[0],/__urPanelStart/);assert.match(replies[1],/__urPanelEvent/);
    assert.match(replies[1],/"deviceOnline":false/);assert.match(replies[1],/"connected":true/);
  } finally {handle.dispose();global.uni=previous.uni;global.plus=previous.plus;global.getCurrentPages=previous.pages;}
});

test("原生壳向迟到的连接订阅重放最新设备状态", async () => {
  const vm=require("node:vm"),{MessageChannel}=require("node:worker_threads"),listeners={};let port,sessionID,readyURL;
  const frameWindow={postMessage:(message,_origin,ports)=>{sessionID=message.sessionID;port=ports[0];}},frame={contentWindow:frameWindow,src:""},location={};
  const scope={crypto:crypto.webcrypto,MessageChannel,setTimeout,clearTimeout,Promise,URL,encodeURIComponent,document:{querySelector:()=>frame},location,
    addEventListener:(name,fn)=>{listeners[name]=fn;},removeEventListener:(name)=>{delete listeners[name];}};scope.window=scope;
  Object.defineProperty(location,"href",{set(value){if(value.startsWith("urpanel://ready?nonce="))readyURL=value;}});
  vm.runInNewContext(fs.readFileSync(path.join(root,"static/device-panel/runtime.js"),"utf8"),scope);
  const nonce=readyURL.split("nonce=")[1];scope.__urPanelStart({nonce,entryURL:"local",requirements:[],context:{capabilities:{}},model:{properties:[],actions:[]}});
  scope.__urPanelEvent({nonce,event:{topic:"connection",data:{deviceOnline:false}}});
  scope.__urPanelEvent({nonce,event:{topic:"connection",data:{cloud:{connected:true}}}});
  listeners.message({source:frameWindow,data:{protocol:"ur-panel/v1",type:"ready"}});assert.ok(port);
  const received=[];port.on("message",(message)=>received.push(message));
  try {
    port.postMessage({protocol:"ur-panel/v1",sessionID,type:"request",id:"subscribe",method:"subscribe",params:{topics:["connection"]}});
    await new Promise((resolve)=>setTimeout(resolve,30));
    const event=received.find((item)=>item.type==="event"&&item.topic==="connection");assert.ok(event);assert.equal(event.data.deviceOnline,false);assert.equal(event.data.cloud.connected,true);
    // 切换固定设备后不复用旧连接状态，也不接受旧nonce的迟到事件。
    const oldPort=port;scope.__urPanelStart({nonce:"b".repeat(32),entryURL:"other",requirements:[],context:{capabilities:{}},model:{properties:[],actions:[]}});oldPort.close();
    scope.__urPanelEvent({nonce,event:{topic:"connection",data:{deviceOnline:true}}});
    listeners.message({source:frameWindow,data:{protocol:"ur-panel/v1",type:"ready"}});const next=[];port.on("message",(message)=>next.push(message));
    port.postMessage({protocol:"ur-panel/v1",sessionID,type:"request",id:"next-subscribe",method:"subscribe",params:{topics:["connection"]}});
    await new Promise((resolve)=>setTimeout(resolve,30));assert.ok(next.some((item)=>item.id==="next-subscribe" && item.ok));assert.equal(next.some((item)=>item.type==="event"),false);
  } finally {listeners.pagehide?.();port.close();}
});

test("轮询刷新设备状态且迟到快照不覆盖较新的上下线推送", async () => {
  const bridge=load("src/utils/device-panel/bridge.ts");let subscriber,deliver;
  const detailProvider={getState:()=>({device:{productID:"p",deviceName:"d",status:2}}),subscribe:(callback)=>{subscriber=callback;return()=>{subscriber=null;};}};
  const service={accountScope:()=>"owner",readCloud:async(_snapshot,_ids,onStatus)=>{await new Promise(resolve=>{deliver=()=>{onStatus(2);resolve();};});return {};},executeCloud:async()=>"command"};
  const {DevicePanelProvider}=load("src/providers/device-panel.provider.ts",{"./device-detail.provider":{deviceDetailProvider:detailProvider},"../services/device-panel.service":{devicePanelService:service},"../services/panel-runtime.service":{panelRuntimeService:{}},"../utils/device-panel/bridge":bridge});
  const provider=new DevicePanelProvider(service);provider.state={transport:"cloud",offline:false,snapshot:{accountScope:"owner",productID:"p",deviceName:"d",resolution:{manifest:{requirements:[]}},controlModel:{device:{id:"d",productID:"p",deviceName:"d",status:2},thingModel:{properties:[],actions:[]},properties:[]}}};
  const adapter=provider.createAdapter(),events=[],stop=adapter.subscribe(["connection"],event=>events.push(event));
  try {
    subscriber({device:{productID:"p",deviceName:"d",status:3}});deliver();await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(events.at(-1).data.deviceOnline,false);await assert.rejects(adapter.writeProperties({power:true}),/设备离线/);
    service.readCloud=async(_snapshot,_ids,onStatus)=>{onStatus(2);return {};};await adapter.readProperties([]);
    assert.equal(events.at(-1).data.deviceOnline,true);await adapter.writeProperties({power:true});
  } finally {stop();adapter.dispose();provider.stop();}
});

test("同次设备查询只转发有效状态，并保持属性读取合同", async () => {
  let status=2;const {DevicePanelRepositoryImpl}=load("src/data/repositories/device-panel.repository.impl.ts",{
    fflate,"../../utils/request":{request:async()=>({status,withProperties:{power:{value:"1",quality:"GOOD"}}})},
    "../../config":{config:{}},"../../utils/request-context":{getRequestContext:()=>({})},"../../utils/panel-sha256":sha,
    "../datasources/local-storage.datasource":{localStorage:{}},"../datasources/panel-cache.datasource":{PanelCacheDataSource:class{}},
  });
  const repo=new DevicePanelRepositoryImpl(),seen=[];
  const result=await repo.read("p","d",["power"],{power:"bool"},value=>seen.push(value));
  assert.equal(result.power.value,1);assert.deepEqual(seen,[2]);
  for(const value of [undefined,0,5,"2"]) {status=value;await repo.read("p","d",[],{},value=>seen.push(value));}
  assert.deepEqual(seen,[2]);status=3;await repo.read("p","d",[],{},value=>seen.push(value));assert.deepEqual(seen,[2,3]);
});
