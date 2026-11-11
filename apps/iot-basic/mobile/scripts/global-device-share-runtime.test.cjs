/** 执行生产仓储、全局 Provider 与应用守卫，验证共享身份和异步账号隔离。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** load 编译真实模块，仅替换外部边界。 */
function load(file, dependencies) {
  if (file === 'providers/app-context.provider.ts') {
    dependencies['../utils/event-bus'] ||= { eventBus: { on() {} } };
    dependencies['./current-family.provider'] ||= {};
    const familyModule = dependencies['./current-family.provider'];
    familyModule.currentFamilyProvider ||= {};
    const family = familyModule.currentFamilyProvider;
    if (!family.getState) family.getState = () => ({ currentTenantCode: 'a', projectID: '' });
  }
  const source = fs.readFileSync(path.resolve(__dirname, '../src', file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)((name) => {
    assert.ok(name in dependencies, '缺少依赖: ' + name);
    return dependencies[name];
  }, exports);
  return exports;
}
/** repo 在请求边界加载生产设备仓储，保留实际的分享识别逻辑。 */
function repo(request) {
  const mod = load('data/repositories/device.repository.impl.ts', {
    '../../utils/request': { request }, '../mappers/device.mapper': { DeviceMapper: { toEntity: x => x } },
    '../../utils/request-context': { getRequestContext: () => ({ projectID: '' }) },
  });
  return new mod.DeviceRepositoryImpl();
}

test('设备分享标识按实际关系识别，同项目共享也有标识，同名不同产品不串标识', async () => {
  const rows = [{ productID: 'p1', deviceName: 'same', projectID: '100' }, { productID: 'p2', deviceName: 'same', projectID: '100' }];
  const repository = repo(async o => {
    if (o.data.withShared === 0) return { total: 2, list: rows };
    assert.equal(o.omitProjectContext, true);
    assert.deepEqual(o.data.devices, rows.map(({ productID, deviceName }) => ({ productID, deviceName })));
    return { total: 1, list: [rows[1]] };
  });
  const result = await repository.getList({ page: 1, size: 20 });
  assert.deepEqual(result.list.map(d => d.isShared), [false, true]);
});

test('项目设备列表不合并其他项目的分享，明确项目头并保留服务端分页', async () => {
  const repository = repo(async o => {
    assert.equal(o.header['ithings-project-id'], 'project-b');
    assert.equal(o.data.withShared, 0);
    return { total: 0, list: [] };
  });
  assert.deepEqual(await repository.getList({ projectID: 'project-b', page: 1, size: 20 }), { list: [], total: 0 });
});

test('微信小程序负责人项目可显式请求共享设备，成员项目仍可关闭合并', async () => {
  const repository = repo(async o => {
    if (o.data.withShared === 1) {
      assert.equal(o.header['ithings-project-id'], 'owner-project');
      return { total: 1, list: [{ productID: 'p', deviceName: 'shared', projectID: 'source-project' }] };
    }
    assert.equal(o.omitProjectContext, true);
    return { total: 1, list: [{ productID: 'p', deviceName: 'shared' }] };
  });
  const result = await repository.getList({ projectID: 'owner-project', includeShared: true, page: 1, size: 20 });
  assert.equal(result.total, 1);
  assert.equal(result.list[0].deviceName, 'shared');
});

test('设备本来属于当前项目时不重复显示共享标识', async () => {
  const repository = repo(async o => {
    if (o.data.withShared === 0) return { total: 1, list: [{ productID: 'p', deviceName: 'local', projectID: 'owner-project' }] };
    return { total: 1, list: [{ productID: 'p', deviceName: 'local' }] };
  });
  const result = await repository.getList({ projectID: 'owner-project', page: 1, size: 20 });
  assert.equal(result.list[0].isShared, false);
});

test('项目 Provider 只把 adminUserID 匹配当前账号的正常项目作为负责人项目', async () => {
  const mod = load('providers/project.provider.ts', {
    '../services/project.service': { projectService: {
      getList: async () => ({ total: 2, list: [
        { projectID: 'owner', projectName: '我的设备', adminUserID: 'u1', status: 1 },
        { projectID: 'member', projectName: '成员项目', adminUserID: 'u2', status: 1 },
      ] }),
      getOne: async id => ({ projectID: id, projectName: id, adminUserID: id === 'owner' ? 'u1' : 'u2', status: 1 }),
    } },
    '../domain/models/page-state.model': { createPageState: () => ({ page: 1, size: 20, loading: false, total: 0, hasMore: true }) },
  });
  const provider = new mod.ProjectProvider();
  const owners = await provider.getOwnedProjects('u1');
  assert.deepEqual(owners.map(item => item.projectID), ['owner']);
  assert.equal(await provider.isOwnerProject('owner', 'u1'), true);
  assert.equal(await provider.isOwnerProject('member', 'u1'), false);
});

test('仅收到分享时不使用项目头，所有结果均标记为共享设备', async () => {
  const repository = repo(async o => {
    assert.equal(o.omitProjectContext, true);
    assert.equal(o.data.withShared, 2);
    return { total: 1, list: [{ productID: 'p', deviceName: 'd' }] };
  });
  assert.equal((await repository.getList({ page: 1, size: 20, sharedOnly: true })).list[0].isShared, true);
});

test('全局发出列表省略设备与旧项目上下文，保持服务端分页及字符串ID', async () => {
  const mod = load('data/repositories/user-device.repository.impl.ts', {
    '../../utils/request': { request: async o => {
      assert.equal(o.omitProjectContext, true);
      assert.equal(o.data.device, undefined);
      assert.deepEqual(o.data.page, { page: 2, size: 20 });
      return { total: 21, list: [{ id: '9007199254740993' }] };
    } },
    '../mappers/device.mapper': {}, '../mappers/device-share.mapper': { DeviceShareMapper: { toEntity: x => x } },
  });
  const result = await new mod.UserDeviceRepositoryImpl().getShareList({ page: 2, size: 20 });
  assert.equal(result.list[0].id, '9007199254740993');
  assert.equal(result.total, 21);
});

test('全局切换方向和账号后忽略旧响应，失败提供错误状态', async () => {
  let resolveSent;
  let userID = 'owner';
  const mod = load('providers/device-share-manage.provider.ts', {
    '../services/device-share.service': { deviceShareService: {} },
    '../services/device.service': { deviceService: {} },
    '../domain/models/page-state.model': { createPageState: () => ({ page: 1, size: 20, loading: false, total: 0, hasMore: true }) },
    './auth.provider': { authProvider: { getState: () => ({ user: { userID } }) } },
    './tenant.provider': { tenantProvider: { getState: () => ({ current: { code: 'a' } }) } },
  });
  const provider = new mod.DeviceShareManageProvider({ getList: () => new Promise(resolve => { resolveSent = resolve; }) }, {
    getList: async () => ({ total: 1, list: [{ deviceName: 'received' }] }),
  });
  const first = provider.loadFirst('sent');
  await provider.loadFirst('received');
  resolveSent({ total: 1, list: [{ id: 'stale' }] });
  await first;
  assert.equal(provider.getState().sent.length, 0);
  assert.equal(provider.getState().received[0].deviceName, 'received');
  const second = provider.loadFirst('sent');
  userID = 'other';
  resolveSent({ total: 1, list: [{ id: 'old-account' }] });
  await second;
  assert.equal(provider.getState().sent.length, 0);
  provider.reset();
});

test('全局查询失败显示可重试错误，不伪装为空列表成功', async () => {
  const mod = load('providers/device-share-manage.provider.ts', {
    '../services/device-share.service': { deviceShareService: {} }, '../services/device.service': { deviceService: {} },
    '../domain/models/page-state.model': { createPageState: () => ({ page: 1, size: 20, loading: false, total: 0, hasMore: true }) },
    './auth.provider': { authProvider: { getState: () => ({ user: { userID: '1' } }) } },
    './tenant.provider': { tenantProvider: { getState: () => ({ current: { code: 'a' } }) } },
  });
  const provider = new mod.DeviceShareManageProvider({ getList: async () => { throw new Error('服务不可用'); } });
  await provider.loadFirst();
  assert.equal(provider.getState().error, '服务不可用');
  assert.equal(provider.getState().pageState.loading, false);
});

test('无项目账号进入首页时展示创建或扫码加入项目入口，全局管理仍可访问', async () => {
  const redirects = [];
  const selections = [];
  const oldUni = global.uni;
  global.uni = { redirectTo: o => redirects.push(o.url) };
  const tenant = { code: 'a', id: 'a', name: '测试企业', status: 1 };
  const dependencies = {
    './auth.provider': { authProvider: { isLoggedIn: () => true, getState: () => ({ user: { nickName: '接收人' } }) } },
    './tenant.provider': { tenantProvider: { getState: () => ({ current: tenant }), getAvailableTenants: () => [tenant], loadTenants: async () => {} } },
    './project.provider': { projectProvider: { loadFirst: async () => {}, getState: () => ({ list: [] }) } },
    './current-family.provider': { currentFamilyProvider: { getSelection: () => ({ projectID: '' }), switchFamily: (...args) => selections.push(args) } },
    '../config': { config: { tenantMode: 'multi' } },
    '../services/device.service': { deviceService: { getList: async o => { assert.equal(o.sharedOnly, true); return { total: 1, list: [{}] }; } } },
    '../services/project.service': { projectService: { getList: async () => ({ total: 0, list: [] }) } },
    '../services/tenant.service': {},
    '../utils/family-name': { suggestFamilyName: () => '新项目' },
    '../utils/tenant-source': { getPendingInviteCode: () => '', getPendingLaunchTenantCode: () => '' },
    '../utils/request-context': {},
  };
  try {
    const { appContextProvider: guard } = load('providers/app-context.provider.ts', dependencies);
    assert.equal(await guard.ensureReady('/pages/home/index'), false);
    assert.ok(selections.every((item) => item[1] !== '共享设备'));
    assert.ok(redirects.some((url) => /project-entry\/index/.test(url)));
    assert.equal(await guard.ensureReady('/packageDevice/pages/share-manage/index'), true);
    const redirectsAfterGlobal = redirects.length;
    assert.equal(await guard.ensureReady('/pages/scene/index'), false);
    assert.ok(redirects.length > redirectsAfterGlobal);
  } finally { global.uni = oldUni; }
});

test('缓存登录态恢复完成前打开全局入口会等待鉴权，不误跳登录', async () => {
  let confirmed = false;
  let restored = 0;
  const auth = { getState: () => ({ loggedIn: true }), isLoggedIn: () => confirmed, restoreSession: async () => { restored++; confirmed = true; return true; } };
  const tenant = { id: 'a', code: 'a', name: '测试', status: 1 };
  const deps = {
    './auth.provider': { authProvider: auth },
    './tenant.provider': { tenantProvider: { loadTenants: async () => {}, getState: () => ({ current: tenant }), getAvailableTenants: () => [tenant] } },
    './project.provider': {}, './current-family.provider': {}, '../config': { config: { tenantMode: 'multi' } },
    '../services/device.service': {}, '../services/project.service': {}, '../services/tenant.service': {}, '../utils/family-name': {},
    '../utils/tenant-source': { getPendingInviteCode: () => '', getPendingLaunchTenantCode: () => '' }, '../utils/request-context': {},
  };
  const oldUni = global.uni;
  global.uni = { redirectTo: () => assert.fail('缓存鉴权尚未完成时不能误跳登录') };
  try {
    const { appContextProvider } = load('providers/app-context.provider.ts', deps);
    assert.equal(await appContextProvider.ensureReady('/packageDevice/pages/share-manage/index'), true);
    assert.equal(restored, 1);
  } finally { global.uni = oldUni; }
});

test('应用启动与页面守卫共用同一个缓存鉴权请求', async () => {
  let resolveUser;
  let requests = 0;
  const user = { userID: 'u1', token: 'cached-test-token' };
  const mod = load('providers/auth.provider.ts', {
    '../services/auth.service': { authService: {
      isLoggedIn: () => true, getCachedUser: () => user, resolvePostLoginStep: () => 'home',
      restorePanelUser: () => { requests++; return new Promise(resolve => { resolveUser = resolve; }); },
    } },
    '../utils/event-bus': { eventBus: { on: () => {} } },
    './tenant.provider': {}, './current-family.provider': { currentFamilyProvider: { setUser() {} } }, './websocket.provider': {}, '../utils/request': {},
  });
  mod.authProvider.init();
  const startup = mod.authProvider.restoreSession();
  const guard = mod.authProvider.restoreSession();
  assert.equal(startup, guard);
  assert.equal(requests, 1);
  assert.equal(mod.authProvider.isLoggedIn(), false);
  resolveUser(user);
  assert.equal(await startup, true);
  assert.equal(mod.authProvider.isLoggedIn(), true);
});

test('独立打开详情也识别收到的分享，不能依赖先进入设备列表', async () => {
  const repository = repo(async o => {
    if (o.url.endsWith('get-one')) return { productID: 'p', deviceName: 'd' };
    assert.equal(o.omitProjectContext, true);
    assert.equal(o.data.withShared, 2);
    assert.deepEqual(o.data.devices, [{ productID: 'p', deviceName: 'd' }]);
    return { list: [{ productID: 'p', deviceName: 'd' }] };
  });
  assert.equal((await repository.getOne('p', 'd')).isShared, true);
});

test('拥有者详情没有收到的分享标识，其他设备关系不会误匹配；查询失败不默认放行', async () => {
  const repository = repo(async o => o.url.endsWith('get-one')
    ? { productID: 'p', deviceName: 'd' } : { list: [{ productID: 'other', deviceName: 'd' }] });
  assert.equal((await repository.getOne('p', 'd')).isShared, false);
  const failed = repo(async o => { if (o.url.endsWith('get-one')) return {}; throw new Error('权限确认失败'); });
  await assert.rejects(failed.getOne('p', 'd'), /权限确认失败/);
});

test('项目入口查找完整分页中的历史项目，失效时选择第一个正常项目', async () => {
  const chosen = [];
  let selected = 'saved';
  const tenant = { code: 'a', id: 'a', name: '测试企业', status: 1 };
  const first = Array.from({ length: 100 }, (_, i) => ({ projectID: `p${i}`, projectName: `项目${i}` }));
  const deps = {
    './auth.provider': { authProvider: { isLoggedIn: () => true, getState: () => ({ user: { nickName: '用户' } }) } },
    './tenant.provider': { tenantProvider: { getState: () => ({ current: tenant }), getAvailableTenants: () => [tenant], loadTenants: async () => {} } },
    './current-family.provider': { currentFamilyProvider: { getState: () => ({ currentTenantCode: 'a', projectID: selected }), getSelection: () => ({ projectID: selected }), switchFamily: (...args) => chosen.push(args) } },
    '../config': { config: { tenantMode: 'multi' } },
    '../services/device.service': {},
    '../services/project.service': { projectService: { getList: async (page, size, name, status) => {
      assert.equal(status, 1);
      return page === 1 ? { total: 101, list: first } : { total: 101, list: [{ projectID: 'saved', projectName: '上次项目' }] };
    } } },
    '../services/tenant.service': {}, '../utils/family-name': {},
    '../utils/tenant-source': { getPendingInviteCode: () => '', getPendingLaunchTenantCode: () => '' }, '../utils/request-context': {},
  };
  const { appContextProvider } = load('providers/app-context.provider.ts', deps);
  assert.equal(await appContextProvider.ensureReady('/pages/home/index'), true);
  assert.deepEqual(chosen.pop(), ['saved', '上次项目', 'a']);
  selected = 'removed';
  assert.equal(await appContextProvider.ensureReady('/pages/home/index'), true);
  assert.deepEqual(chosen.pop(), ['p0', '项目0', 'a']);
});

test('组织加载期间鉴权失效不覆盖登录跳转', async () => {
  let logged = true;
  const nav = [];
  const auth = { isLoggedIn: () => logged, getState: () => ({ loggedIn: logged }) };
  const deps = {
    './auth.provider': { authProvider: auth },
    './tenant.provider': { tenantProvider: { loadTenants: async () => { logged = false; }, getState: () => ({ current: null }), getAvailableTenants: () => [] } },
    './current-family.provider': {}, '../config': { config: { tenantMode: 'multi' } },
    '../services/device.service': {}, '../services/project.service': {}, '../services/tenant.service': {}, '../utils/family-name': {},
    '../utils/tenant-source': { getPendingInviteCode: () => '', getPendingLaunchTenantCode: () => '' }, '../utils/request-context': {},
  };
  const oldUni = global.uni; global.uni = { reLaunch: o => nav.push(o.url), redirectTo: o => nav.push(o.url) };
  try {
    const { appContextProvider } = load('providers/app-context.provider.ts', deps);
    assert.equal(await appContextProvider.ensureReady('/pages/home/index'), false);
    assert.deepEqual(nav, []);
  } finally { global.uni = oldUni; }
});
