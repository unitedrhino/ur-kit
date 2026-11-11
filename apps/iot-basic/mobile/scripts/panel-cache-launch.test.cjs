/** 文件说明：执行双端真实导航缓存、模型仓储与整页入口服务，验证身份隔离和实时状态不缓存。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
/** load 只替换外部依赖，运行实际模块，不重写缓存或票据算法。 */
function load(app, file, mocks) {
  const source = fs.readFileSync(path.resolve(__dirname, '../../', 'mobile', 'src', file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => {
    for (const [key, value] of Object.entries(mocks)) if (name.endsWith(key)) return value;
    throw Error('未替换外部依赖 ' + name);
  }, module, module.exports);
  return module.exports;
}
/** tick 推进显式挂起的Promise，不依赖计时猜测。 */
async function tick() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
for (const app of ['mobile-uniapp']) {
  test(`${app} 导航短期缓存省略重复上下文查询，到期、身份切换及注销重新核验`, async (t) => {
    const now = Date.now; let time = 1000;
    Date.now = () => time; t.after(() => { Date.now = now; });
    const events = new Map(); let tenantCalls = 0, projectCalls = 0;
    const user = { userID: 'a', token: 'synthetic-token-a' };
    const org = { code: 'a', name: '企业A', id: '1', status: 1 };
    const family = { projectID: 'p', currentTenantCode: 'a' };
    const provider = load(app, 'providers/app-context.provider.ts', {
      'auth.provider': { authProvider: { isLoggedIn: () => true, getState: () => ({ user }) } },
      'tenant.provider': { tenantProvider: { loadTenants: async () => { tenantCalls++; }, getState: () => ({ current: org }), getAvailableTenants: () => [org] } },
      'project.provider': { projectProvider: { loadFirst: async () => { projectCalls++; }, getState: () => ({ list: [{ projectID: family.projectID, projectName: '项目' }] }) } },
      'current-family.provider': { currentFamilyProvider: { getState: () => family, switchFamily() {}, getSelection: () => family } },
      '/config': { config: { tenantMode: 'multi' } },
      'project.service': { projectService: { getList: async () => { projectCalls++; return { total: 1, list: [{ projectID: family.projectID, projectName: '项目' }] }; } } }, 'device.service': { deviceService: {} }, 'tenant.service': { tenantService: {} },
      'family-name': {}, 'request-context': { setRequestTenantCode() {} },
      'tenant-source': { getPendingInviteCode: () => '', getPendingLaunchTenantCode: () => '' },
      'event-bus': { eventBus: { on: (name, fn) => events.set(name, fn) } },
    }).appContextProvider;
    assert.equal(await provider.ensureReady('/pages/home/index'), true);
    assert.equal(await provider.ensureReady('/packageDevice/pages/detail/index'), true);
    assert.equal(await provider.ensureReady('/packageDevice/pages/settings/index'), true);
    assert.equal(await provider.ensureReady('/pages/home/index'), true);
    assert.equal(await provider.ensureReady('/packageDevice/pages/detail/index'), true);
    assert.equal(tenantCalls, 1); assert.equal(projectCalls, 1);
    time += 60001; await provider.ensureReady('/packageDevice/pages/detail/index'); assert.equal(tenantCalls, 2);
    user.token = 'synthetic-token-b'; await provider.ensureReady('/packageDevice/pages/settings/index'); assert.equal(tenantCalls, 3);
    org.code = 'b'; await provider.ensureReady('/packageDevice/pages/settings/index'); assert.equal(tenantCalls, 4);
    family.projectID = 'other'; await provider.ensureReady('/packageDevice/pages/detail/index'); assert.equal(tenantCalls, 5);
    events.get('auth:logout')(); await provider.ensureReady('/packageDevice/pages/detail/index'); assert.equal(tenantCalls, 6);
    await provider.ensureReady('/packageUser/pages/family-manage/index'); assert.equal(tenantCalls, 7, '管理页面不能使用设备导航缓存');
    events.get('auth:logout')();
    const previousProjects = projectCalls;
    await provider.ensureReady('/packageDevice/pages/detail/index', true);
    assert.equal(tenantCalls, 7, '同次交接已加载的企业列表不能再次请求');
    assert.equal(projectCalls, previousProjects + 1, '省略重复企业列表不能省略项目核验');
  });
  test(`${app} 模型查询合并并发，缓存隔离且实时属性逐次读取`, async (t) => {
    const oldUni = global.uni, now = Date.now; let time = 1000, token = 'a', scope = { tenantCode: 'a', projectID: 'p' };
    global.uni = { getStorageSync: () => token }; Date.now = () => time;
    t.after(() => { global.uni = oldUni; Date.now = now; });
    let count = 0, values = 0, release; const events = new Map();
    const pending = new Promise((resolve) => { release = resolve; });
    const repo = new (load(app, 'data/repositories/device-interact.repository.impl.ts', {
      '/request': { request: async (o) => {
        if (o.url.includes('property-latest')) { values++; return { list: [] }; }
        count++; if (count === 1) return pending; return { list: [] };
      } },
      'request-context': { getRequestContext: () => ({ ...scope }) },
      'event-bus': { eventBus: { on: (name, fn) => events.set(name, fn) } },
    }).DeviceInteractRepositoryImpl)();
    const a = repo.getThingModel('p', 'd'), b = repo.getThingModel('p', 'd'); await tick(); assert.equal(count, 1);
    release({ list: [{ type: 1, identifier: 'power', affordance: '{"mode":"rw","define":{"type":"bool"}}' }] });
    const [one, two] = await Promise.all([a, b]); one.properties[0].name = 'changed'; assert.notEqual(two.properties[0].name, 'changed');
    await repo.getThingModel('p', 'd'); assert.equal(count, 1);
    await repo.getLatestProperties('p', 'd'); await repo.getLatestProperties('p', 'd'); assert.equal(values, 2);
    scope.tenantCode = 'b'; await repo.getThingModel('p', 'd'); assert.equal(count, 2);
    token = 'b'; await repo.getThingModel('p', 'd'); assert.equal(count, 3);
    time += 60001; await repo.getThingModel('p', 'd'); assert.equal(count, 4);
    events.get('auth:logout')(); await repo.getThingModel('p', 'd'); assert.equal(count, 5);
  });
  test(`${app} 整页URL仅携一次性票据，无绑定保留原生，过期和伪造均拒绝`, async () => {
    let launch = { mode: 'builtin' };
    const { PanelLaunchService } = load(app, 'services/panel-launch.service.ts', {
      'panel-launch.repository': { PanelLaunchRepository: class {} }, '/config': { config: { apiBaseUrl: 'https://example.test', appId: '700' } },
    });
    const calls = [];
    const service = new PanelLaunchService({ create: async () => launch, exchange: async (...args) => { calls.push(args); return {}; } });
    assert.equal(await service.create('p', 'd'), '');
    launch = { mode: 'panel', ticket: 'a'.repeat(64), expiresAt: Date.now() + 45000 };
    const url = await service.create('p', 'd'); assert.match(url, /\/api\/v1\/things\/panel\/host\/index\.html#panelTicket=a{64}&appID=700&nativeNav=1$/); assert.ok(!url.includes('token='));
    launch.expiresAt = Date.now() - 1; await assert.rejects(service.create('p', 'd'), /入口无效/);
    await assert.rejects(service.exchange('bad'), /入口已失效/); assert.equal(calls.length, 0);
    await service.exchange('a'.repeat(64)); assert.equal(calls.length, 1);
  });
  test(`${app} 微信桥只导航交接设备的固定原生设置，普通H5不跳原生`, async (t) => {
    const oldWindow = global.window, descriptor = Object.getOwnPropertyDescriptor(global, 'navigator');
    t.after(() => { global.window = oldWindow; if (descriptor) Object.defineProperty(global, 'navigator', descriptor); else delete global.navigator; });
    const calls = [];
    global.window = { wx: { miniProgram: { getEnv: (fn) => fn({ miniprogram: true }), navigateTo: (o) => { calls.push(o.url); o.success(); } } } };
    Object.defineProperty(global, 'navigator', { value: { userAgent: 'MicroMessenger' }, configurable: true });
    const service = load(app, 'services/mini-panel-navigation.service.ts', {});
    assert.equal(await service.openMiniPanelSettings({ productID: 'p', deviceName: 'd' }), false);
    await service.prepareMiniPanelNavigation({ productID: 'p', deviceName: 'd' }); assert.equal(service.isMiniPanelWebHost(), true);
    assert.equal(await service.openMiniPanelSettings({ productID: 'p', deviceName: 'd' }), true);
    assert.deepEqual(calls, ['/packageDevice/pages/settings/index?productID=p&deviceName=d']);
    await assert.rejects(service.openMiniPanelSettings({ productID: 'p', deviceName: 'foreign' }), /上下文已变化/); assert.equal(calls.length, 1);
  });
}

for (const app of ['mobile-uniapp']) {
  test(`${app} 交接页面退出或账号变化后，迟到票据不安装身份、不导航`, async () => {
    for (const invalid of ['closed', 'account']) {
      let release, active = true, user = { userID: 'a', token: 'a' };
      const pending = new Promise((resolve) => { release = resolve; });
      const calls = [];
      const provider = load(app, 'providers/panel-launch.provider.ts', {
        'panel-launch.service': { panelLaunchService: { exchange: () => pending, installSession: () => calls.push('install') } },
        'mini-panel-navigation.service': { prepareMiniPanelNavigation: () => calls.push('bridge') },
        'auth.provider': { authProvider: { getState: () => ({ user }), restorePanelSession: () => calls.push('restore') } },
        'tenant.provider': { tenantProvider: {} }, 'current-family.provider': { currentFamilyProvider: {} }, 'app-context.provider': { appContextProvider: {} },
      });
      const running = provider.openPanelHandoff('a'.repeat(64), () => active);
      if (invalid === 'closed') active = false; else user = { userID: 'b', token: 'b' };
      release({ token: 'synthetic-token', productID: 'p', deviceName: 'd' });
      await assert.rejects(running, /已关闭|登录状态已变化/);
      assert.deepEqual(calls, []);
    }
  });
  test(`${app} 新登录替换交接后，旧用户查询不能覆盖或注销新账号`, async () => {
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    const persisted = [], connections = [];
    const repo = {
      getUserInfo: () => pending,
      async loginByPassword() {
        return { userID: 'b', token: 'b' };
      },
    };
    const { AuthService } = load(app, 'services/auth.service.ts', {
      'auth.repository.impl': { AuthRepositoryImpl: class {} },
      'local-storage.datasource': { localStorage: { set: (key, value) => persisted.push({ key, value }) } }, '/crypto': {},
    });
    const service = new AuthService(repo);
    const provider = load(app, 'providers/auth.provider.ts', {
      'auth.service': { authService: service }, 'event-bus': { eventBus: { emit() {} } },
      'tenant.provider': { tenantProvider: { clear() {} } }, 'current-family.provider': { currentFamilyProvider: { clear() {}, setUser() {} } },
      'websocket.provider': { webSocketProvider: { disconnect() {}, connect: (value) => connections.push(value) } }, '/request': {},
    }).authProvider;
    const running = provider.restorePanelSession();
    await provider.loginByPassword('b', 'unused');
    release({ userID: 'a', token: 'a' });
    await assert.rejects(running, /登录状态已变化/);
    assert.equal(provider.getState().user.userID, 'b');
    assert.equal(persisted.at(-1).value.userID, 'b');
    assert.deepEqual(connections, []);
  });
}

for (const app of ['mobile-uniapp']) {
  test(`${app} 旧缓存鉴权迟到不能覆盖新登录的身份与本地缓存`, async (t) => {
    const oldUni = global.uni; global.uni = { getStorageSync: () => 'old-token' }; t.after(() => { global.uni = oldUni; });
    let release; const pending = new Promise(resolve => { release = resolve; });
    const writes = []; const storage = { get: () => ({ userID: 'old', token: 'old-token' }), set: (key, value) => writes.push({ key, value }), remove() {} };
    const { AuthService } = load(app, 'services/auth.service.ts', { 'auth.repository.impl': { AuthRepositoryImpl: class {} }, 'local-storage.datasource': { localStorage: storage }, '/crypto': {} });
    const service = new AuthService({ getUserInfo: () => pending, loginByPassword: async () => ({ userID: 'new', token: 'new-token' }) });
    const provider = load(app, 'providers/auth.provider.ts', {
      'auth.service': { authService: service }, 'event-bus': { eventBus: { on() {}, emit() {} } },
      'tenant.provider': { tenantProvider: { clear() {} } }, 'current-family.provider': { currentFamilyProvider: { clear() {}, setUser() {} } },
      'websocket.provider': { webSocketProvider: { disconnect() {}, connect() {} } }, '/request': {},
    }).authProvider;
    provider.init(); const restoring = provider.restoreSession(); await provider.loginByPassword('new', 'unused');
    release({ userID: 'old', token: 'old-token' });
    assert.equal(await restoring, false); assert.equal(provider.getState().user.userID, 'new');
    assert.equal(writes.at(-1).value.userID, 'new'); assert.equal(writes.length, 1);
  });
}
