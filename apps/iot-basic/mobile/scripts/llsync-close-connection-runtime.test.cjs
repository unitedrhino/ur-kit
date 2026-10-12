/** 蓝牙释放确认测试：运行真实 datasource，不把底层关闭失败当作连接已释放。 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** loadDataSource 只替换系统 BLE API 和日志，保留生产 Promise 成功/失败逻辑。 */
function loadDataSource(closeBLEConnection) {
  const filename = path.resolve(__dirname, '../src/data/datasources/bluetooth.datasource.ts');
  const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const requireMock = (name) => {
    if (name.endsWith('/event-bus')) return { eventBus: { emit() {} } };
    if (name.endsWith('/ble-logger')) return { bleLogger: { info() {}, warn() {}, debug() {}, error() {} } };
    throw new Error('未声明依赖: ' + name);
  };
  new Function('require', 'module', 'exports', 'uni', code)(requireMock, module, module.exports, { closeBLEConnection });
  return new module.exports.BluetoothDataSource();
}

test('协议严格释放要求系统成功回执，失败原样返回；其他调用保持兼容', async () => {
  const error = { errCode: 12345, errMsg: '测试关闭失败' };
  let successful = false, calls = 0;
  const source = loadDataSource((options) => {
    assert.equal(options.deviceId, 'fixture-device');
    calls++;
    if (successful) options.success({});
    else options.fail(error);
  });
  await assert.rejects(source.closeConnection('fixture-device', true), (actual) => actual === error);
  await source.closeConnection('fixture-device');
  successful = true;
  await source.closeConnection('fixture-device', true);
  assert.equal(calls, 3);
});
