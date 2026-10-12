// 文件说明：执行真实控件注册器，验证远程点击、输入、页面、授权与并发隔离。
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
/** loadControls 编译生产实现，避免字符串检查替代实际行为验证。 */
function loadControls(app) {
  const mod = { exports: {} };
  const source = ts.transpileModule(readFileSync(path.resolve(__dirname, '..', 'src/utils/client-debug-controls.ts'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  Function('module', 'exports', source)(mod, mod.exports);
  return new mod.exports.ClientDebugControls();
}
for (const app of ['mobile']) {
  test(app + '：真实页面钩子隐藏后拒绝操作，再显示恢复控件且旧票据失效', async () => {
    const registry = loadControls(app);
    const hooks = { show: [], hide: [], unload: [], unmount: [] };
    const mocks = {
      '@dcloudio/uni-app': { onShow: (fn) => hooks.show.push(fn), onHide: (fn) => hooks.hide.push(fn),
        onUnload: (fn) => hooks.unload.push(fn) },
      vue: { onUnmounted: (fn) => hooks.unmount.push(fn) },
      './client-debug-controls': { clientDebugControls: registry },
    };
    const mod = { exports: {} };
    const source = ts.transpileModule(readFileSync(path.resolve(__dirname, '..', 'src/utils/use-client-debug-page.ts'), 'utf8'),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    Function('module', 'exports', 'require', source)(mod, mod.exports, (name) => {
      assert.ok(mocks[name], name); return mocks[name];
    });
    let clicks = 0;
    mod.exports.useClientDebugPage('wifi', () => [
      { id: 'submit', label: '连接网络', role: 'button', enabled: true, tap: () => { clicks++; } },
    ]);
    hooks.show[0]();
    const first = registry.inspect('wifi');
    hooks.hide[0]();
    assert.deepEqual(registry.status('wifi'), { registered: false, routeMatches: false });
    await assert.rejects(registry.execute('ui.tap', { ticket: first.ticket, targetID: 'submit' }, 'wifi', () => true));
    hooks.show[0]();
    assert.deepEqual(registry.status('wifi'), { registered: true, routeMatches: true });
    await assert.rejects(registry.execute('ui.tap', { ticket: first.ticket, targetID: 'submit' }, 'wifi', () => true));
    await registry.execute('ui.tap', { ticket: registry.inspect('wifi').ticket, targetID: 'submit' }, 'wifi', () => true);
    assert.equal(clicks, 1);
    hooks.unload[0]();
    hooks.unmount[0]();
    assert.deepEqual(registry.status('wifi'), { registered: false, routeMatches: false });
  });
  test(app + '：生命周期诊断不调用控件工厂、不包含表单或异常正文', () => {
    const r = loadControls(app);
    assert.deepEqual(r.status('wifi'), { registered: false, routeMatches: false });
    const release = r.activate('wifi', () => { throw new Error('fixture-private'); });
    assert.deepEqual(r.status('wifi'), { registered: true, routeMatches: true });
    assert.deepEqual(r.status('other'), { registered: true, routeMatches: false });
    release();
    assert.deepEqual(r.status('wifi'), { registered: false, routeMatches: false });
  });
  test(app + '：生产 Wi-Fi 控件真实更新表单，禁用状态与本地事件一致', async () => {
    const source = readFileSync(path.resolve(__dirname, '..', 'src/packageBluetooth/pages/wifi/index.vue'), 'utf8')
      .split('<script setup lang="ts">')[1].split('</script>')[0];
    const ast = ts.createSourceFile('wifi.ts', source, ts.ScriptTarget.Latest, true);
    const deps = {
      guideVisible: { value: false }, loading: { value: false }, ssid: { value: '' }, password: { value: '' },
      ssidDirty: { value: false }, ssidFromLocalCache: { value: false }, wifiInputFilterActive: { value: false },
      ssidInputKeyword: { value: '' }, wifiMode: { value: 'manual' }, wifiList: { value: [] },
      bluetoothReady: { value: true }, wifiPickerVisible: { value: false }, filteredWifiList: { value: [] },
      handleWifiInputAction: () => {}, handleRetryBluetooth: () => {}, handleSelectWifi: () => {},
      handleSubmit: () => {}, handleBack: () => {}, handleGuideClose: () => {},
    };
    const names = app === 'mobile' ? ['handleSsidInput', 'handleSsidBlur', 'handlePasswordBlur'] : ['handleSsidInput', 'handlePasswordInput'];
    for (const name of names) {
      const node = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
      assert.ok(node, name);
      const js = ts.transpileModule(node.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
      deps[name] = Function(...Object.keys(deps), js + '; return ' + name)(...Object.values(deps));
    }
    const call = ast.statements.find((node) => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)
      && node.expression.expression.getText(ast) === 'useClientDebugPage').expression;
    const js = ts.transpileModule('const factory = ' + call.arguments[1].getText(ast), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const factory = Function(...Object.keys(deps), js + '; return factory')(...Object.values(deps));
    const r = loadControls(app);
    r.activate('wifi', factory);
    assert.equal(r.inspect('wifi').controls.find((c) => c.id === 'submit').enabled, false);
    for (const [targetID, value] of [['ssid', 'test-network'], ['password', 'fixture-private']]) {
      await r.execute('ui.input', { ticket: r.inspect('wifi').ticket, targetID, value }, 'wifi', () => true);
    }
    assert.equal(deps.ssid.value, 'test-network', '小程序失焦必须提交最终 SSID');
    assert.equal(deps.password.value, 'fixture-private');
    assert.equal(r.inspect('wifi').controls.find((c) => c.id === 'submit').enabled, true);
    deps.loading.value = true;
    assert.equal(r.inspect('wifi').controls.find((c) => c.id === 'password').enabled, false);
    deps.guideVisible.value = true;
    assert.deepEqual(r.inspect('wifi').controls.map((c) => c.id), ['close-guide']);
  });
  test(app + '：点击和输入复用处理器，密码不进入快照', async () => {
    const r = loadControls(app);
    let clicks = 0, password = '';
    r.activate('wifi', () => [
      { id: 'password', label: '密码', role: 'input', enabled: true, input: (v) => { password = v; } },
      { id: 'submit', label: '连接', role: 'button', enabled: !!password, tap: () => { clicks++; } },
    ]);
    let snapshot = r.inspect('wifi');
    await r.execute('ui.input', { ticket: snapshot.ticket, targetID: 'password', value: 'fixture-private' }, 'wifi', () => true);
    snapshot = r.inspect('wifi');
    assert.ok(!JSON.stringify(snapshot).includes(password));
    await r.execute('ui.tap', { ticket: snapshot.ticket, targetID: 'submit' }, 'wifi', () => true);
    assert.equal(clicks, 1);
    await assert.rejects(r.execute('ui.tap', { ticket: snapshot.ticket, targetID: 'submit' }, 'wifi', () => true));
  });
  test(app + '：隐藏、跳页、旧页释放和列表重排隔离', async () => {
    const r = loadControls(app);
    let label = '设备 A', clicks = 0;
    const factory = () => [{ id: 'item-0', label, role: 'button', enabled: true, tap: () => { clicks++; } }];
    const releaseOld = r.activate('home', factory);
    const old = r.inspect('home');
    label = '设备 B';
    await assert.rejects(r.execute('ui.tap', { ticket: old.ticket, targetID: 'item-0' }, 'home', () => true));
    r.activate('settings', factory);
    releaseOld();
    assert.equal(r.inspect('settings').page, 'settings');
    await assert.rejects(r.execute('ui.tap', { ticket: old.ticket, targetID: 'item-0' }, 'settings', () => true));
    const release = r.activate('home', factory);
    const next = r.inspect('home');
    release();
    await assert.rejects(r.execute('ui.tap', { ticket: next.ticket, targetID: 'item-0' }, 'home', () => true));
    assert.equal(clicks, 0);
  });
  test(app + '：撤销、禁用、未知和超长输入不调用业务', async () => {
    const r = loadControls(app);
    let calls = 0;
    r.activate('form', () => [
      { id: 'input', label: '输入', role: 'input', enabled: true, input: () => { calls++; } },
      { id: 'disabled', label: '禁用', role: 'button', enabled: false, tap: () => { calls++; } },
    ]);
    for (const args of [{ targetID: 'unknown', value: '' }, { targetID: 'disabled', value: '' },
      { targetID: 'input', value: 'x'.repeat(1025) }]) {
      await assert.rejects(r.execute('ui.input', { ticket: r.inspect('form').ticket, ...args }, 'form', () => true));
    }
    await assert.rejects(r.execute('ui.input', { ticket: r.inspect('form').ticket, targetID: 'input', value: '' }, 'form', () => false));
    assert.equal(calls, 0);
  });
  test(app + '：拒绝并发，失败消息不透传输入', async () => {
    const r = loadControls(app);
    let release, calls = 0;
    r.activate('form', () => [{ id: 'input', label: '输入', role: 'input', enabled: true,
      input: () => { calls++; return new Promise((resolve, reject) => { release = () => reject(new Error('fixture-private')); }); } }]);
    const pending = r.execute('ui.input', { ticket: r.inspect('form').ticket, targetID: 'input', value: 'fixture-private' }, 'form', () => true);
    await assert.rejects(r.execute('ui.input', { ticket: r.inspect('form').ticket, targetID: 'input', value: '' }, 'form', () => true));
    release();
    await assert.rejects(pending, (error) => !error.message.includes('fixture-private'));
    assert.equal(calls, 1);
  });
}
