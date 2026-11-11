/** 文件说明：执行双端实际设置页与服务，验证慢请求不阻塞基础信息以及迟到响应隔离。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileScript } = require('vue/compiler-sfc');
/** deferred 通过显式释放模拟慢网络，不依赖运行速度或任意等待。 */
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
/** evaluate 执行真实 TypeScript 模块，仅替换外部依赖。 */
function evaluate(source, requireMock) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  new Function('require', 'module', 'exports', compiled)(requireMock, module, module.exports);
  return module.exports;
}
/** settingsHarness 挂载真实页面 setup，捕获真实 uni 生命周期和异步状态。 */
function settingsHarness(app) {
  const root = path.resolve(__dirname, '../../', 'mobile', 'src');
  const hooks = {}, details = [], areas = [], models = [], permissions = [], toasts = [];
  const auth = { loggedIn: true, user: { userID: 'user-a' } };
  const context = { tenantCode: 'org-a', projectID: 'project-a' };
  const queue = (list) => { const item = deferred(); list.push(item); return item.promise; };
  const mocks = {
    'device.service': { deviceService: { getDetail: () => queue(details), canManageNetwork: () => queue(permissions) } },
    'device-control.service': { deviceControlService: { loadControlModel: () => queue(models) } },
    'area.service': { areaService: { getOne: () => queue(areas) } },
    'auth.provider': { authProvider: { getState: () => auth } },
    'request-context': { getRequestContext: () => ({ ...context }) },
    'use-client-debug-page': { useClientDebugPage() {} },
    'device-control-card-ui.service': { buildDeviceControlCardUi: () => ({ systemPropertyCard: { items: [] } }) },
    'location.model': { formatGeoPoint: () => '实际位置' },
    'page-guard': { ensurePageReady: async () => true },
  };
  const source = fs.readFileSync(path.join(root, 'packageDevice/pages/settings/index.vue'), 'utf8');
  const script = compileScript(parse(source).descriptor, { id: 'settings-test' }).content;
  const component = evaluate(script, (name) => {
    if (name === 'vue') return vue;
    if (name === '@dcloudio/uni-app') return {
      onLoad: (fn) => { hooks.load = fn; }, onShow: (fn) => { hooks.show = fn; }, onUnload: (fn) => { hooks.unload = fn; },
    };
    if (name.endsWith('.vue')) return {};
    for (const [key, value] of Object.entries(mocks)) if (name.endsWith(key)) return value;
    if (name.endsWith('/config')) return { config: {} };
    if (name.endsWith('terminology')) return { TERM: { area: '房间' } };
    if (name.endsWith('provision.provider')) return { provisionProvider: { cancel() {} } };
    if (name.endsWith('ota.service')) return { otaService: {} };
    throw Error('未替换外部边界 ' + name);
  }).default;
  const renderer = vue.createRenderer({ createElement: () => ({}), insert() {}, remove() {}, patchProp() {},
    setElementText() {}, createText: () => ({}), setText() {}, createComment: () => ({}), parentNode() {}, nextSibling() {} });
  component.render = () => vue.h('view');
  global.uni = { showToast: (args) => toasts.push(args.title) };
  let vm;
  const mounted = renderer.createApp({ render: () => vue.h(component, { ref: (value) => { vm = value; } }) });
  mounted.mount({});
  return { hooks, details, areas, models, permissions, toasts, auth, context, state: vm.$.setupState,
    close() { hooks.unload(); mounted.unmount(); } };
}
/** settle 等待 Promise 分支及 Vue 状态通知完成。 */
async function settle() { for (let i = 0; i < 10; i++) await Promise.resolve(); await vue.nextTick(); }
/** device 返回带房间的真实形状测试设备。 */
const device = (name = 'a') => ({ productID: 'p', deviceName: name, deviceAlias: name, areaID: 'room', version: '1', netType: 1 });
for (const app of ['mobile-uniapp']) {
  test(`${app} 基础设置先显示，三个补充请求并行且失败独立降级`, async () => {
    const h = settingsHarness(app);
    const running = h.hooks.load({ productID: 'p', deviceName: 'a' });
    await settle();
    h.details[0].resolve(device());
    await running;
    assert.equal(h.state.loading, false);
    assert.equal(h.state.device.deviceName, 'a');
    assert.equal(h.state.areaLoading, true);
    assert.equal(h.areas.length, 1); assert.equal(h.models.length, 1); assert.equal(h.permissions.length, 1);
    assert.equal(h.state.canChangeNetwork, false);
    h.areas[0].reject(Error('slow area failed')); h.permissions[0].reject(Error('denied'));
    h.models[0].resolve({ properties: [{ identifier: 'system', value: 2 }] });
    await settle();
    assert.equal(h.state.device.deviceName, 'a'); assert.equal(h.state.loading, false);
    assert.equal(h.state.areaName, '暂时无法获取'); assert.equal(h.state.areaLoading, false);
    assert.equal(h.state.controlModel.properties[0].value, 2); assert.equal(h.state.canChangeNetwork, false);
    assert.deepEqual(h.toasts, []);
    h.close();
  });
  test(`${app} 返回刷新后旧房间、权限、系统属性不能覆盖新结果`, async () => {
    const h = settingsHarness(app);
    const first = h.hooks.load({ productID: 'p', deviceName: 'a' }); await settle();
    h.details[0].resolve(device()); await first;
    h.hooks.show(); await settle();
    h.details[1].resolve({ ...device(), deviceAlias: '更新后的名称' }); await settle();
    h.areas[1].resolve({ areaName: '新房间' }); h.permissions[1].resolve(false); h.models[1].resolve({ properties: ['new'] });
    await settle();
    h.areas[0].resolve({ areaName: '旧房间' }); h.permissions[0].resolve(true); h.models[0].resolve({ properties: ['old'] });
    await settle();
    assert.equal(h.state.areaName, '新房间'); assert.equal(h.state.canChangeNetwork, false);
    assert.deepEqual(h.state.controlModel.properties, ['new']); assert.equal(h.state.device.deviceAlias, '更新后的名称');
    h.close();
  });
  test(`${app} 页面退出、账号或企业变化后不接收旧请求`, async () => {
    for (const change of ['unload', 'account', 'tenant']) {
      const h = settingsHarness(app);
      const running = h.hooks.load({ productID: 'p', deviceName: 'a' }); await settle();
      if (change === 'unload') h.hooks.unload();
      if (change === 'account') h.auth.user.userID = 'user-b';
      if (change === 'tenant') h.context.tenantCode = 'org-b';
      h.details[0].resolve(device()); await running;
      assert.equal(h.state.device, null, change); assert.equal(h.areas.length, 0, change);
      assert.equal(h.models.length, 0, change); assert.equal(h.permissions.length, 0, change);
      h.close();
    }
  });
  test(`${app} 退出后不应用已开始的可选请求`, async () => {
    const h = settingsHarness(app);
    const running = h.hooks.load({ productID: 'p', deviceName: 'a' }); await settle();
    h.details[0].resolve(device()); await running; h.hooks.unload();
    h.areas[0].resolve({ areaName: '迟到房间' }); h.models[0].resolve({ properties: ['late'] }); h.permissions[0].resolve(true);
    await settle();
    assert.equal(h.state.areaName, ''); assert.equal(h.state.controlModel, null); assert.equal(h.state.canChangeNetwork, false);
    h.close();
  });
  test(`${app} 非 Wi-Fi 不查权限，Wi-Fi 按平台结果开放且失败不放行`, async () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../', 'mobile', 'src/services/device.service.ts'), 'utf8');
    const { DeviceService } = evaluate(source, (name) => {
      if (name.includes('device-network.repository')) return { DeviceNetworkRepository: class {} };
      if (name.includes('device.repository.impl')) return { DeviceRepositoryImpl: class {} };
      if (name.includes('product.repository.impl')) return { ProductRepositoryImpl: class {} };
      if (name.endsWith('request')) return {};
      throw Error(name);
    });
    const calls = [];
    let allowed = false, failure = false;
    const service = new DeviceService({}, {}, { authorize: async (target) => {
      calls.push(target); if (failure) throw Error('offline'); return { allowed };
    } });
    for (const netType of [undefined, 1, 3, 4, 5, 6]) assert.equal(await service.canManageNetwork({ ...device(), netType }), false);
    assert.equal(calls.length, 0);
    assert.equal(await service.canManageNetwork({ ...device(), netType: 2 }), false);
    allowed = true; assert.equal(await service.canManageNetwork({ ...device(), netType: 7 }), true);
    failure = true; await assert.rejects(service.canManageNetwork({ ...device(), netType: 2 }), /offline/);
    assert.equal(calls.length, 3);
  });
}
