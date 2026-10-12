/** 页面业务处理测试：执行真实 Vue 脚本函数，浏览器/微信视觉验收另行进行。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** loadHandler 提取真实顶层函数并注入页面依赖，不复制业务实现。 */
function loadHandler(page, name, deps) {
  const source = fs.readFileSync(path.resolve(__dirname, '../src', page), 'utf8').split('<script setup lang="ts">')[1].split('</script>')[0];
  const ast = ts.createSourceFile('page.ts', source, ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name.text === name);
  assert.ok(fn, name);
  const js = ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function(...Object.keys(deps), js + '; return ' + name)(...Object.values(deps));
}

/** loadHook 执行真实生命周期回调，保留 await 顺序以复现页面退出竞态。 */
function loadHook(name, deps, page = 'wifi') {
  const source = fs.readFileSync(path.resolve(__dirname, `../src/packageBluetooth/pages/${page}/index.vue`), 'utf8')
    .split('<script setup lang="ts">')[1].split('</script>')[0];
  const ast = ts.createSourceFile('page.ts', source, ts.ScriptTarget.Latest, true);
  const statement = ast.statements.find((node) => ts.isExpressionStatement(node)
    && ts.isCallExpression(node.expression) && node.expression.expression.getText(ast) === name);
  assert.ok(statement, name);
  const callback = statement.expression.arguments[0].getText(ast);
  const js = ts.transpileModule('const callback = ' + callback, {
    compilerOptions: { target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return new Function(...Object.keys(deps), js + '; return callback')(...Object.values(deps));
}

test('Wi-Fi 页在每个初始化 await 期间退出，迟到结果不再订阅或启动下一项工作', async () => {
  for (const waiting of ['ready', 'wifi', 'bluetooth']) {
    let resume;
    const pending = new Promise((resolve) => { resume = resolve; });
    const calls = [];
    const networkPage = { closed: false, handedOff: false };
    const deps = {
      networkPage, unsubscribes: [],
      ensurePageReady: async () => { calls.push('ready'); return waiting === 'ready' ? pending : true; },
      applyLocalWifiCredential: () => calls.push('cache'),
      syncState: () => {},
      provisionProvider: { subscribe: () => { calls.push('subscribe'); return () => {}; } },
      prepareWifiWithLoading: async () => { calls.push('wifi'); if (waiting === 'wifi') await pending; },
      refreshBluetoothStatus: async () => { calls.push('bluetooth'); if (waiting === 'bluetooth') await pending; },
      eventBus: { on: () => calls.push('listener'), off: () => {} },
    };
    const running = loadHook('onLoad', deps)({});
    // 让初始化推进到选定挂起点，而不是用任意定时延迟猜测状态。
    for (let i = 0; i < 8; ++i) await Promise.resolve();
    const previous = [...calls];
    networkPage.closed = true;
    resume(true);
    await running;
    assert.deepEqual(calls, previous, waiting + ' 退出后仍有初始化副作用');
    assert.ok(!calls.includes('listener'));
  }
});

test('在线与离线设备均进入换网准备页，而非首次绑定', async () => {
  for (const status of [2, 3]) {
    const calls = [];
    const deps = {
      device: { value: { productID: '8', deviceName: 'WATCHER', status } },
      networkRequesting: { value: false },
      networkPage: { closed: false },
      provisionProvider: {
        startNetworkChange: async (...args) => calls.push(args),
        cancel: () => assert.fail('不应取消成功入口'),
      },
      uni: {
        showModal: (options) => options.success({ confirm: true }),
        navigateTo: (options) => calls.push(options.url),
      },
    };
    await loadHandler('packageDevice/pages/settings/index.vue', 'handleChangeNetwork', deps)();
    assert.deepEqual(calls, [[{ productID: '8', deviceName: 'WATCHER' }], '/packageBluetooth/pages/prepare/index?changeNetwork=1']);
    assert.equal(deps.networkRequesting.value, false);
  }
});

test('换网准备页保留已授权会话，不创建首次绑定会话', async () => {
  const calls = [];
  const deps = {
    ensurePageReady: async () => true,
    changingNetwork: { value: false }, unsubscribes: [],
    provisionProvider: {
      getState: () => ({ mode: 'changeNetwork' }),
      startSession: () => assert.fail('换网不能变成首次绑定'),
      subscribe: () => { calls.push('subscribe'); return () => {}; },
    },
    uni: { showToast: () => assert.fail('有效会话不应报错'), navigateBack: () => assert.fail('有效会话不应返回') },
  };
  await loadHook('onLoad', deps, 'prepare')({ changeNetwork: '1' });
  assert.equal(deps.changingNetwork.value, true);
  assert.deepEqual(calls, ['subscribe']);
  loadHandler('packageBluetooth/pages/prepare/index.vue', 'handleNext', {
    checked: { value: true }, changingNetwork: deps.changingNetwork,
    provisionProvider: { confirmPrepared: () => calls.push('prepared') },
    uni: { navigateTo: ({ url }) => calls.push(url) },
  })();
  assert.deepEqual(calls.slice(1), ['prepared', '/packageBluetooth/pages/wifi/index?changeNetwork=1']);
});

test('过期换网准备页不降级成绑定，也不订阅会话', async () => {
  const calls = [];
  await loadHook('onLoad', {
    ensurePageReady: async () => true, changingNetwork: { value: false }, unsubscribes: [],
    provisionProvider: {
      getState: () => ({ mode: 'bind' }),
      startSession: () => assert.fail('不得创建绑定会话'),
      subscribe: () => assert.fail('不得继续订阅'),
    },
    uni: { showToast: () => calls.push('toast'), navigateBack: () => calls.push('back') },
  }, 'prepare')({ changeNetwork: '1' });
  assert.deepEqual(calls, ['toast', 'back']);
});

test('设置页已退出时不再开启换网或跳转', async () => {
  const deps = {
    device: { value: { status: 2 } }, networkRequesting: { value: false },
    networkPage: { closed: true },
    provisionProvider: { startNetworkChange: () => assert.fail('取消后不得请求') },
    uni: { showModal: (options) => options.success({ confirm: false }), navigateTo: () => assert.fail('取消后不得跳转') },
  };
  await loadHandler('packageDevice/pages/settings/index.vue', 'handleChangeNetwork', deps)();
  assert.equal(deps.networkRequesting.value, false);
});

test('换网成功不获取定位、不修改设备资料', async () => {
  await loadHandler('packageBluetooth/pages/result/index.vue', 'handleSaveDeviceLocation', {
    changingNetwork: { value: true },
    locationService: { getCurrentLocation: () => assert.fail('换网不得获取定位') },
    deviceService: { update: () => assert.fail('换网不得更新设备位置') },
  })();
});

test('换网失败重试返回原设备设置，不复用失败请求或首次绑定页', () => {
  const calls = [];
  loadHandler('packageBluetooth/pages/result/index.vue', 'handleBackWifi', {
    changingNetwork: { value: true },
    provisionProvider: {
      getState: () => ({ networkTarget: { productID: '8', deviceName: 'WATCHER' } }),
      cancel: (reason) => calls.push(reason),
    },
    uni: { redirectTo: (options) => calls.push(options.url) },
  })();
  assert.deepEqual(calls, ['RESTART_NETWORK_CHANGE', '/packageDevice/pages/settings/index?productID=8&deviceName=WATCHER']);
});

test('设置页关闭后权限查询迟到完成不得打开换网引导', async () => {
  let confirm;
  const networkPage = { closed: false };
  const handler = loadHandler('packageDevice/pages/settings/index.vue', 'handleChangeNetwork', {
    device: { value: { status: 2 } }, networkRequesting: { value: false }, networkPage,
    provisionProvider: { startNetworkChange: () => new Promise((resolve) => { confirm = resolve; }) },
    uni: { navigateTo: () => assert.fail('页面退出后不得导航') },
  });
  const pending = handler();
  networkPage.closed = true;
  confirm();
  await pending;
});

test('Wi-Fi 页面主动交接与路由失败分别保留和取消本地会话', () => {
  const networkPage = { closed: false, handedOff: false };
  const calls = [];
  let navigation;
  const handler = loadHandler('packageBluetooth/pages/wifi/index.vue', 'navigateProvisionPage', {
    networkPage,
    provisionProvider: { cancel: (reason) => calls.push(reason) },
    uni: { redirectTo: (options) => { navigation = options; }, showToast: () => {} },
  });
  handler('/packageBluetooth/pages/progress/index');
  assert.equal(networkPage.handedOff, true);
  assert.deepEqual(calls, []);
  navigation.fail();
  assert.equal(networkPage.handedOff, false);
  assert.deepEqual(calls, ['NAVIGATION_FAILED']);
  networkPage.closed = true;
  navigation = null;
  handler('/packageBluetooth/pages/progress/index');
  assert.equal(navigation, null);
});

test('首次绑定重试仍回可编辑 Wi-Fi 表单，不重新发送缓存密码', () => {
  const calls = [];
  loadHandler('packageBluetooth/pages/result/index.vue', 'handleBackWifi', {
    changingNetwork: { value: false },
    uni: { redirectTo: (options) => calls.push(options.url) },
    provisionProvider: { cancel: () => assert.fail('首次绑定不走换网取消分支') },
  })();
  assert.deepEqual(calls, ['/packageBluetooth/pages/wifi/index']);
});

test('Wi-Fi 页面销毁只清理一次，主动交接不会取消已进入的进度会话', () => {
  for (const changing of [false, true]) {
    for (const handedOff of [false, true]) {
      const calls = [];
      const deps = {
        networkPage: { closed: false, handedOff },
        unsubscribes: [() => calls.push('unsubscribe')],
        changingNetwork: { value: changing },
        provisionProvider: { cancel: (reason) => calls.push(reason) },
      };
      const dispose = loadHandler('packageBluetooth/pages/wifi/index.vue', 'disposePage', deps);
      dispose();
      dispose();
      assert.equal(deps.networkPage.closed, true);
      assert.equal(deps.unsubscribes.length, 0);
      assert.deepEqual(calls, changing && !handedOff ? ['unsubscribe', 'PAGE_UNLOADED'] : ['unsubscribe']);
    }
  }
});

test('关闭后的蓝牙检查不回写状态，也不再发起权限检查', async () => {
  let finish;
  let called = 0;
  const deps = {
    networkPage: { closed: false },
    bluetoothReady: { value: false }, bluetoothReason: { value: '原状态' },
    reasonToText: () => assert.fail('关闭页面不能转换迟到结果'),
    ensureBluetoothReady: () => { ++called; return new Promise((resolve) => { finish = resolve; }); },
  };
  const refresh = loadHandler('packageBluetooth/pages/wifi/index.vue', 'refreshBluetoothStatus', deps);
  const pending = refresh();
  deps.networkPage.closed = true;
  finish({ ok: true });
  await pending;
  await refresh();
  assert.equal(called, 1);
  assert.equal(deps.bluetoothReady.value, false);
  assert.equal(deps.bluetoothReason.value, '原状态');
});
