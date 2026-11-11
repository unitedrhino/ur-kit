/** H5 蓝牙边界回归：缺少原生 API 时返回可展示的状态，不抛异常或触发权限。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** loadReadiness 注入运行端能力，导入依赖不得在能力检查之前调用。 */
function loadReadiness(api) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/ble-readiness.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'uni', code)(() => ({}), mod, mod.exports, api);
  return mod.exports;
}

test('H5 没有蓝牙 API 时静默与交互检查均返回 unsupported', async () => {
  const readiness = loadReadiness({});
  assert.equal(readiness.supportsBluetoothProvisioning(), false);
  for (const interactive of [false, true]) {
    const state = await readiness.ensureBluetoothReady({ interactive });
    assert.equal(state.ok, false);
    assert.equal(state.reason, 'unsupported');
    assert.match(state.errMsg, /微信小程序或 App/);
  }
});

test('原生端仍识别适配器 API，浏览器不支持提示不会尝试打开系统设置', async () => {
  assert.equal(loadReadiness({ openBluetoothAdapter() {} }).supportsBluetoothProvisioning(), true);
  let guide;
  const readiness = loadReadiness({ showModal(options) { guide = options; options.success({ confirm: true }); } });
  assert.equal(await readiness.showBluetoothNotReadyGuide('unsupported'), false);
  assert.match(guide.content, /微信小程序或 App/);
});
