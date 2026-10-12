/** 换网通知运行时测试：执行真实协议解析器，拒绝旧协议和损坏能力包。 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** loadProtocol 编译纯协议模块；不以源码正则匹配代替行为断言。 */
function loadProtocol() {
  const filename = path.resolve(__dirname, '../src/utils/llsync-protocol.ts');
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  new Function('module', 'exports', output)(loaded, loaded.exports);
  return loaded.exports;
}

/** packet 与固件 network status 的十五字节格式一致，前导零必须保留。 */
const packet = [0xe5, 0, 12, 2, 1, 2, 0, 0, 1, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd];
const protocol = loadProtocol();

test('E5 换网通知解析全部阶段和错误码，连续运行十次', () => {
  for (let run = 0; run < 10; run += 1) {
    for (let phase = 0; phase <= 9; phase += 1) {
      for (let error = 0; error <= 6; error += 1) {
        const bytes = [...packet];
        bytes[5] = phase;
        bytes[6] = error;
        for (const input of [bytes, Uint8Array.from(bytes), Uint8Array.from(bytes).buffer]) {
          assert.deepEqual(protocol.parseLLSyncEvent(input).value, {
            version: 2, mode: 1, phase, error, requestId: '000123456789abcd',
          });
        }
      }
    }
  }
});

test('截断、尾随数据和非法字段不能产生换网能力', () => {
  for (let size = 1; size < packet.length; size += 1) {
    assert.equal(protocol.parseLLSyncEvent(packet.slice(0, size)).value, undefined);
  }
  assert.equal(protocol.parseLLSyncEvent([...packet, 0]).value, undefined);
  for (const [index, invalid] of [
    [1, 1], [2, 11], [2, 13], [3, 0], [3, 1], [3, 3], [4, 0], [4, 2],
    [5, 10], [6, 7], [7, -1], [8, 256], [9, NaN], [10, 1.5],
  ]) {
    const bytes = [...packet];
    bytes[index] = invalid;
    assert.equal(protocol.parseLLSyncEvent(bytes).value, undefined);
  }
});

test('旧绑定协议与反向 E5 日志查询保持原契约', () => {
  assert.deepEqual(protocol.buildGetLogCommand(), [0xe5]);
  assert.equal(protocol.parseLLSyncEvent(protocol.buildGetLogCommand()).value, undefined);
  assert.deepEqual(protocol.buildConnectWifiCommand(), [0xe3]);
  assert.deepEqual(protocol.parseLLSyncEvent([0xe3, 0, 1, 0]).value, { success: true, code: 0 });
  assert.deepEqual(protocol.parseLLSyncEvent([0xe3, 0, 1, 200]).value, { success: false, code: 200 });
  assert.equal(protocol.parseLLSyncEvent([0xef, 0, 12]).value, undefined);
  assert.equal(protocol.parseLLSyncEvent([]), null);
});
