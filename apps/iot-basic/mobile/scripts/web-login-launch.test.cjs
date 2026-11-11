// 验证真实启动 Provider 只接受合法票据，支持冷启动与重新扫码且不跳任意页面。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

/** loadProvider 在隔离运行时加载真实 Provider，记录页面导航而不请求网络。 */
function loadProvider(pages = []) {
  const calls = [];
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src/providers/app-context.provider.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: (name) => name.endsWith('event-bus') ? { eventBus: { on() {} } } : ({}), console,
    getCurrentPages: () => pages,
    uni: { reLaunch: (args) => calls.push(args.url) },
  });
  return { provider: module.exports.appContextProvider, calls };
}

/** ticket 是无权限的合成测试票据，不代表任何真实登录请求。 */
const ticket = 'a'.repeat(64);
test('冷启动从首页转入固定确认页，不接受请求指定重定向', () => {
  const { provider, calls } = loadProvider();
  assert.equal(provider.openWebLoginFromLaunch({ ticket, redirect: 'https://example.invalid' }, 'pages/home/index'), true);
  assert.deepEqual(calls, [`/packageUser/pages/web-login/index?ticket=${ticket}`]);
});
test('后台重新扫码时新票据替换旧确认页', () => {
  const { provider, calls } = loadProvider([{ route: 'packageUser/pages/web-login/index', options: { ticket: 'b'.repeat(64) } }]);
  assert.equal(provider.openWebLoginFromLaunch({ ticket }, 'pages/home/index'), true);
  assert.equal(calls.length, 1);
});
test('直接打开相同确认页时不重启页面栈', () => {
  const { provider, calls } = loadProvider([{ route: 'packageUser/pages/web-login/index', options: { ticket } }]);
  assert.equal(provider.openWebLoginFromLaunch({ ticket }, 'pages/home/index'), true);
  assert.deepEqual(calls, []);
});
test('普通启动和畸形票据不会触发电脑登录导航', () => {
  const { provider, calls } = loadProvider();
  for (const options of [undefined, {}, { ticket: 12 }, { ticket: 'a'.repeat(63) }, { ticket: '../login' }, { ticket: 'A'.repeat(64) }]) {
    assert.equal(provider.openWebLoginFromLaunch(options, 'pages/home/index'), false);
  }
  assert.deepEqual(calls, []);
});
test('微信绑定票据进入独立授权模式，不混入电脑登录票据', () => {
  const { provider, calls } = loadProvider();
  assert.equal(provider.openWebLoginFromLaunch({ bindTicket: ticket }, 'pages/home/index'), true);
  assert.deepEqual(calls, [`/packageUser/pages/web-login/index?bindTicket=${ticket}`]);
});
test('相同绑定票据不会重启已展示的授权确认页', () => {
  const { provider, calls } = loadProvider([{ route: 'packageUser/pages/web-login/index', options: { bindTicket: ticket } }]);
  assert.equal(provider.openWebLoginFromLaunch({ bindTicket: ticket }, 'pages/home/index'), true);
  assert.deepEqual(calls, []);
});

/** loadBindingService 加载真实编排服务，以仓库替身记录请求，避免真实登录和网络调用。 */
function loadBindingService(root, login) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'src/services/web-login.service.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require: () => ({ WebLoginRepository: class {} }),
    uni: { login },
  });
  const calls = [];
  const service = new module.exports.WebLoginService({
    approveBinding: async (...args) => { calls.push(args); return { status: 'consumed' }; },
    approve: () => { throw new Error('绑定不能调用电脑登录'); },
  });
  return { service, calls };
}
for (const name of ['mobile-uniapp']) {
  const root = path.resolve(__dirname, '..');
  test(`${name} 确认当前微信仅取临时授权码并调用绑定接口`, async () => {
    let count = 0;
    const { service, calls } = loadBindingService(root, args => {
      count++;
      assert.equal(args.provider, 'weixin');
      args.success({ code: 'verified-test-code' });
    });
    await service.approveBinding(ticket, 'confirm');
    assert.equal(count, 1);
    assert.equal(JSON.stringify(calls), JSON.stringify([[ticket, 'confirm', 'verified-test-code']]));
  });
  test(`${name} 拒绝授权不调用微信登录，失败不提交绑定`, async () => {
    const { service, calls } = loadBindingService(root, () => { throw new Error('拒绝不能拉起微信登录'); });
    await service.approveBinding(ticket, 'reject');
    assert.equal(JSON.stringify(calls), JSON.stringify([[ticket, 'reject', null]]));
    const failed = loadBindingService(root, args => args.fail());
    await assert.rejects(failed.service.approveBinding(ticket, 'confirm'), /微信授权失败/);
    assert.equal(failed.calls.length, 0);
    await assert.rejects(service.approveBinding('invalid', 'confirm'), /授权链接无效/);
    assert.equal(calls.length, 1);
  });
}

/** loadAppHooks 执行真实 App 生命周期，以过期缓存账号场景检查是否发起后台登录恢复。 */
function loadAppHooks(root, hash = "", platform = "H5") {
  const module = { exports: {} };
  let restores = 0;
  let webLoginLaunches = 0;
  const source = fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8').match(/<script lang="ts">([\s\S]*?)<\/script>/)[1];
  const active = [];
  const platformSource = source.split('\n').filter(line => {
    const branch = line.match(/\/\/ #if(n?)def (H5|MP-WEIXIN)/);
    if (branch) { active.push(branch[1] ? platform !== branch[2] : platform === branch[2]); return false; }
    if (line.includes('// #endif')) { active.pop(); return false; }
    return active.every(Boolean);
  }).join('\n');
  const compiled = ts.transpileModule(platformSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const empty = { init() {}, restore() {} };
  const dependencies = {
    authProvider: { init() {}, getState: () => ({ loggedIn: true }), restoreSession: async () => { restores++; return false; } },
    appProvider: empty, webSocketProvider: empty, tenantProvider: empty,
    appContextProvider: { captureLaunchOptions: () => false, openWebLoginFromLaunch: () => { webLoginLaunches++; return true; } },
    privacyConsentService: empty, logger: { info() {} },
  };
  /** location 保留同次启动对象，允许交接后切换到设备详情再触发前台恢复。 */
  const location = { hash };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: () => dependencies, location, getCurrentPages: () => [] });
  return { location, hooks: module.exports.default, restoreCount: () => restores, webLoginCount: () => webLoginLaunches };
}
for (const name of ['mobile-uniapp']) {
  test(`${name} 冷启动绑定跳过平台令牌恢复，普通电脑登录仍恢复缓存会话`, async () => {
    const app = loadAppHooks(path.resolve(__dirname, '..'), '', 'MP-WEIXIN');
    app.hooks.onLaunch({ query: { bindTicket: ticket } });
    assert.equal(app.restoreCount(), 0);
    app.hooks.onLaunch({ query: { ticket } });
    assert.equal(app.restoreCount(), 1);
  });
}

for (const name of ['mobile-uniapp']) {
  test(`${name} H5面板交接票据不进入电脑登录流程，前后台显示也不触发旧身份恢复`, () => {
    const app = loadAppHooks(path.resolve(__dirname, '..'), '#/packageDevice/pages/panel-entry/index?ticket=' + ticket);
    app.hooks.onLaunch({ query: { ticket } });
    app.hooks.onShow({ query: { ticket } });
    assert.equal(app.restoreCount(), 0);
    assert.equal(app.webLoginCount(), 0);
  });
}

for (const name of ['mobile-uniapp']) {
  test(`${name} 微信设置返回复用面板交接上下文，不重放票据进入电脑登录`, () => {
    const app = loadAppHooks(path.resolve(__dirname, '..'), '#/packageDevice/pages/panel-entry/index?ticket=' + ticket);
    app.hooks.onLaunch({ query: { ticket } });
    app.location.hash = '#/packageDevice/pages/detail/index?productID=p&deviceName=d';
    app.hooks.onShow({ query: { ticket } });
    app.hooks.onShow({ query: { ticket } });
    assert.equal(app.webLoginCount(), 0);
    assert.equal(app.restoreCount(), 0);
  });
  test(`${name} 普通H5恢复不把通用ticket当成电脑扫码入口`, () => {
    const app = loadAppHooks(path.resolve(__dirname, '..'), '#/packageDevice/pages/detail/index?productID=p&deviceName=d');
    app.hooks.onShow({ query: { ticket } });
    assert.equal(app.webLoginCount(), 0);
  });
}

test('面板与设置恢复参数不是电脑扫码入口，缺失path同样拒绝', () => {
  const { provider, calls } = loadProvider();
  for (const launchPath of [undefined, 'packageDevice/pages/panel-entry/index', 'packageDevice/pages/settings/index']) {
    assert.equal(provider.openWebLoginFromLaunch({ ticket }, launchPath), false);
  }
  assert.deepEqual(calls, []);
});

for (const name of ['mobile-uniapp']) {
  test(`${name} 小程序有效扫码入口仍进入电脑登录`, () => {
    const app = loadAppHooks(path.resolve(__dirname, '..'), '', 'MP-WEIXIN');
    app.hooks.onShow({ path: 'pages/home/index', query: { ticket } });
    assert.equal(app.webLoginCount(), 1);
  });
}
