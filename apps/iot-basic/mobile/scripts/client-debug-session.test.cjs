// 文件说明：运行两端真实调试桥，验证一次授权、立即取消、租约和跨会话隔离。
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** loadBridge 隔离原生弹窗与请求，保留生产会话处理代码供时序回放。 */
function loadBridge(app, options = {}) {
  const file = path.resolve(__dirname, '..', 'src/services/client-debug.service.ts');
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  // 使用真实注册器验证桥接命令确实调用页面控件，而非只发送成功回执。
  const controlsMod = { exports: {} };
  const controlsSource = ts.transpileModule(readFileSync(path.resolve(__dirname, '..', 'src/utils/client-debug-controls.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  Function('module', 'exports', controlsSource)(controlsMod, controlsMod.exports);
  const controls = controlsMod.exports.clientDebugControls;
  const handlers = new Map();
  const modals = [];
  const posts = [];
  /** pendingLogs 保存延迟上传回调，用于复现跨会话网络竞态。 */
  const pendingLogs = [];
  // 统计真实 performAction 对业务 Provider 的调用，防止只验证回执而漏掉误执行。
  let refreshes = 0;
  const mocks = {
    '../config': { config: { appId: 'test', apiBaseUrl: '' } },
    '../utils/client-debug-controls': { clientDebugControls: controls },
    '../providers/auth.provider': { authProvider: { getState: () => ({ user: { token: 'test-only' } }) } },
    '../providers/device-list.provider': { deviceListProvider: {
      loadFirst: async () => { refreshes += 1; }, getState: () => ({ list: [] }),
    } },
    '../utils/event-bus': { eventBus: { on: (name, fn) => handlers.set(name, fn) } },
    '../utils/request-context': { getRequestContext: () => ({}) },
    '../utils/logger': { logger: {}, setLogListener: () => {} },
  };
  const uni = {
    switchTab: () => {},
    navigateTo: () => {},
    getStorageSync: () => 'test-instance-123456',
    showModal: (options) => modals.push(options),
    request: (request) => {
      posts.push(request.data);
      if (options.deferLogs && request.data.kind === 'logs') pendingLogs.push(request);
      else request.success({ statusCode: 200, data: { code: 200 } });
    },
  };
  const timers = [];
  Function('module', 'exports', 'require', 'uni', 'setInterval', 'getCurrentPages', 'setTimeout', 'clearTimeout', source)(
    mod, mod.exports, (name) => { assert.ok(mocks[name], name); return mocks[name]; }, uni, () => 1,
    () => [{ route: 'test-page' }], (fn) => { timers.push(fn); return timers.length; }, () => {});
  const bridge = mod.exports.clientDebugService;
  bridge.init();
  return { bridge, controls, modals, posts, pendingLogs, timers, disconnect: () => handlers.get('ws:disconnected')(), refreshes: () => refreshes, send: (kind, sessionID, extra = {}) => handlers.get('ws:user.notify')({
    type: 'client-debug', kind, sessionID, clientInstanceID: bridge.getInstanceID(), ...extra,
  }) };
}

for (const app of ['mobile']) {
  test(app + '：原生导航无回调时返回超时，快照能诊断页面注册状态', async () => {
    const h = loadBridge(app);
    h.send('start', 'navigation');
    h.send('control-request', 'navigation');
    h.modals[0].success({ confirm: true });
    h.send('command', 'navigation', { commandID: 'navigate', action: 'app.navigate', args: { path: '/pages/home/index' } });
    h.timers.at(-1)();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.posts.find((p) => p.commandID === 'navigate').status, 'error');
    assert.match(h.posts.find((p) => p.commandID === 'navigate').data.message, /导航超时/);
    h.send('command', 'navigation', { commandID: 'snapshot', action: 'app.snapshot' });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(h.posts.find((p) => p.commandID === 'snapshot').data.controls,
      { registered: false, routeMatches: false });
  });
  test(app + '：一次授权后经真实桥点击与输入，取消使票据失效', async () => {
    const h = loadBridge(app);
    let value = '', calls = 0;
    h.controls.activate('test-page', () => [
      { id: 'input', label: '输入', role: 'input', enabled: true, input: (v) => { value = v; } },
      { id: 'tap', label: '点击', role: 'button', enabled: true, tap: () => { calls++; } },
    ]);
    h.send('start', 'ui');
    h.send('control-request', 'ui');
    h.modals[0].success({ confirm: true });
    const flush = () => new Promise((resolve) => setImmediate(resolve));
    h.send('command', 'ui', { commandID: 'inspect', action: 'ui.inspect' });
    await flush();
    const first = h.posts.find((p) => p.commandID === 'inspect').data;
    h.send('command', 'ui', { commandID: 'input', action: 'ui.input', args: { ticket: first.ticket, targetID: 'input', value: 'fixture-private' } });
    await flush();
    assert.equal(value, 'fixture-private');
    assert.ok(!JSON.stringify(h.posts).includes(value));
    h.send('command', 'ui', { commandID: 'inspect2', action: 'ui.inspect' });
    await flush();
    const next = h.posts.find((p) => p.commandID === 'inspect2').data;
    h.send('command', 'ui', { commandID: 'tap', action: 'ui.tap', args: { ticket: next.ticket, targetID: 'tap' } });
    await flush();
    assert.equal(calls, 1);
    assert.equal(h.modals.length, 1);
    h.bridge.stop();
    h.send('command', 'ui', { commandID: 'late', action: 'ui.tap', args: { ticket: next.ticket, targetID: 'tap' } });
    await flush();
    assert.equal(calls, 1);
  });
  test(`${app}：真实导航组件随授权显示并点击撤销`, () => {
    const h = loadBridge(app);
    const file = path.resolve(__dirname, '..', 'src/components/app-navigation-bar/app-navigation-bar.vue');
    const script = readFileSync(file, 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
    const source = ts.transpileModule(script, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    } }).outputText;
    const mounted = [], unmounted = [];
    const mocks = {
      vue: { ref: (value) => ({ value }), computed: (fn) => ({ get value() { return fn(); } }),
        onMounted: (fn) => mounted.push(fn), onUnmounted: (fn) => unmounted.push(fn) },
      '../../providers/tenant.provider': { tenantProvider: { subscribe: () => () => {} } },
      '../../utils/tenant-brand': { getNavigationBrandName: () => 'test', getSingleTenantBrandLogoPath: () => '',
        loadSingleTenantBrand: async () => {} },
      '../../utils/navigation': { safeNavigateBack: () => {} },
      '../../utils/platform': { getSystemInfo: () => ({ statusBarHeight: 24, navBarHeight: 44, screenWidth: 360 }) },
      '../../services/client-debug.service': { clientDebugService: h.bridge },
    };
    const view = Function('exports', 'require', 'defineProps', 'withDefaults', 'defineEmits',
      source + ';return { controlling, stopControl };')({}, (name) => {
        assert.ok(mocks[name], name); return mocks[name];
      }, () => ({}), (_, defaults) => defaults, () => () => {});
    mounted.forEach((fn) => fn());
    assert.equal(view.controlling.value, false);
    h.send('start', 'view');
    h.send('control-request', 'view');
    h.modals[0].success({ confirm: true });
    assert.equal(view.controlling.value, true);
    view.stopControl();
    assert.equal(view.controlling.value, false);
    assert.equal(h.bridge.isActive(), false);
    assert.equal(h.modals.length, 1, '取消无需二次弹窗');
    unmounted.forEach((fn) => fn());
  });
  test(`${app}：旧日志上传失败不能撤销新会话`, async () => {
    const h = loadBridge(app, { deferLogs: true });
    h.send('start', 'old');
    for (let index = 0; index < 10; index++) h.bridge.onLog({
      name: 'app.error', level: 'error', time: 'test', message: 'safe fixture',
    });
    assert.equal(h.pendingLogs.length, 1);
    h.bridge.stop();
    h.send('start', 'new');
    h.send('control-request', 'new');
    h.modals[0].success({ confirm: true });
    h.pendingLogs[0].fail();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.bridge.isControlling(), true, '旧上传失败只影响旧会话');
    h.send('command', 'new', { commandID: 'new-refresh', action: 'device-list.refresh' });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.refreshes(), 1);
  });
  test(`${app}：所有注册页面保留可取消控制的统一导航`, () => {
    const root = path.resolve(__dirname, '..', 'src');
    const config = JSON.parse(readFileSync(path.join(root, 'pages.json'), 'utf8'));
    const pages = [...config.pages.map((page) => page.path),
      ...config.subPackages.flatMap((pack) => pack.pages.map((page) => pack.root + '/' + page.path))];
    for (const page of pages) assert.match(readFileSync(path.join(root, page + '.vue'), 'utf8'), /<app-navigation-bar/, page);
    const nav = readFileSync(path.join(root, 'components/app-navigation-bar/app-navigation-bar.vue'), 'utf8');
    assert.match(nav, /v-if="controlling"/);
    assert.match(nav, /@tap\.stop="stopControl"/);
    assert.match(nav, /function stopControl\(\): void \{ clientDebugService\.stop\(\); \}/);
  });
  test(`${app}：取消不回传在途操作的迟到成功`, async () => {
    const h = loadBridge(app);
    h.send('start', 'current');
    h.send('control-request', 'current');
    h.modals[0].success({ confirm: true });
    h.send('command', 'current', { commandID: 'inflight', action: 'device-list.refresh' });
    h.bridge.stop();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.refreshes(), 1, '已经发出的请求不能撤回');
    assert.equal(h.posts.some((item) => item.kind === 'result' && item.status === 'ok'), false);
  });
  test(`${app}：新指令不能越过停止、替换、断线或过期`, async () => {
    for (const change of ['stop', 'replace', 'expiresAt', 'lastLease', 'disconnect']) {
      const h = loadBridge(app);
      h.send('start', 'current');
      h.send('control-request', 'current');
      h.modals[0].success({ confirm: true });
      if (change === 'stop') h.bridge.stop();
      else if (change === 'replace') h.send('start', 'current');
      else if (change === 'disconnect') h.disconnect();
      else h.bridge.session[change] = Date.now() - 30001;
      h.send('command', 'current', { commandID: 'refresh-1', action: 'device-list.refresh' });
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(h.refreshes(), 0, change);
      assert.equal(h.posts.some((item) => item.kind === 'result' && item.status === 'ok'), false, change);
    }
  });
  test(`${app}：一次授权执行多条指令且重复请求不弹窗不重放`, async () => {
    const h = loadBridge(app);
    h.send('start', 'current');
    h.send('control-request', 'current');
    h.modals[0].success({ confirm: true });
    h.send('command', 'current', { commandID: 'refresh-1', action: 'device-list.refresh' });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.refreshes(), 1);
    assert.deepEqual(h.posts.at(-1), { sessionID: 'current', kind: 'result', commandID: 'refresh-1', status: 'ok', data: { deviceCount: 0 } });
    h.send('control-request', 'current');
    h.send('command', 'current', { commandID: 'refresh-1', action: 'device-list.refresh' });
    h.send('command', 'current', { commandID: 'refresh-2', action: 'device-list.refresh' });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.refreshes(), 2);
    assert.equal(h.modals.length, 1);
    assert.equal(h.bridge.isControlling(), true);
    h.bridge.stop();
    assert.equal(h.bridge.isControlling(), false);
  });
  test(`${app}：未授权与非白名单指令不能执行，状态监听及时撤销`, async () => {
    const h = loadBridge(app);
    const states = [];
    h.bridge.subscribe(() => states.push(h.bridge.isControlling()));
    h.send('start', 'current');
    h.send('command', 'current', { commandID: 'before', action: 'device-list.refresh' });
    h.send('control-request', 'current');
    h.send('control-request', 'current');
    assert.equal(h.modals.length, 1);
    h.modals[0].success({ confirm: true });
    h.send('command', 'current', { commandID: 'invalid', action: 'device.delete' });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.refreshes(), 0);
    assert.equal(h.posts.at(-1).status, 'unsupported');
    h.disconnect();
    assert.deepEqual(states, [false, true, false]);
  });
  test(`${app}：旧会话授权弹窗不能授权新会话`, () => {
    const h = loadBridge(app);
    h.send('start', 'old');
    h.send('control-request', 'old');
    h.send('start', 'new');
    h.modals[0].success({ confirm: true });
    assert.equal(h.posts.some((item) => item.kind === 'control.grant'), false);
    h.send('control-request', 'new');
    h.modals[1].success({ confirm: true });
    assert.deepEqual(h.posts.filter((item) => item.kind === 'control.grant'), [{ sessionID: 'new', kind: 'control.grant' }]);
  });
  test(`${app}：停止后迟到授权不回传，正常拒绝仍回传`, () => {
    const h = loadBridge(app);
    h.send('start', 'old');
    h.send('control-request', 'old');
    h.bridge.stop();
    h.modals[0].success({ confirm: true });
    assert.equal(h.posts.some((item) => item.kind === 'control.grant'), false);
    h.send('start', 'new');
    h.send('control-request', 'new');
    h.modals[1].success({ confirm: false });
    assert.deepEqual(h.posts.at(-1), { sessionID: 'new', kind: 'control.deny' });
  });
  test(`${app}：相同 ID 重建也不继承旧弹窗授权`, () => {
    const h = loadBridge(app);
    h.send('start', 'same');
    h.send('control-request', 'same');
    h.send('start', 'same');
    h.modals[0].success({ confirm: true });
    assert.equal(h.posts.some((item) => item.kind === 'control.grant'), false);
  });
  test(`${app}：定时清理尚未运行时也拒绝已过期授权`, () => {
    for (const field of ['expiresAt', 'lastLease']) {
      const h = loadBridge(app);
      h.send('start', 'expired');
      h.send('control-request', 'expired');
      // 直接推进生产会话的时间字段，模拟小程序后台暂停清理计时器。
      h.bridge.session[field] = Date.now() - 30001;
      h.modals[0].success({ confirm: true });
      assert.equal(h.posts.some((item) => item.kind === 'control.grant'), false, field);
    }
  });
}
