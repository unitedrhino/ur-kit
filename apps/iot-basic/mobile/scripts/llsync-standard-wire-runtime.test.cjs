/** 标准配网通知回放：分片、截断和长度边界不得被误判为联网成功。 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
// load 执行本应用真实协议实现，不模拟解码结果。
const file = path.resolve(__dirname, '../src/utils/llsync-protocol.ts');
const loaded = { exports: {} };
new Function('module', 'exports', ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(loaded, loaded.exports);
const p = loaded.exports;
test('WiFi 配网广播使用完整版本字节，不能套用标准蓝牙绑定状态位', () => {
  // 真实 CONFIG_NET 厂商正文结构，替换 MAC/产品为确定性非现场标识。
  const bytes = Uint8Array.from([0xe7,0xfe,2,1,2,3,4,5,6,65,0,0,0,0,0,0,0,0,0]);
  assert.deepEqual(p.parseLLSyncAdvertisingData(bytes.buffer), {
    moduleVersion: 2, mac: '01:02:03:04:05:06', productID: 'A',
  });
});
// frame 使用设备 SDK 的通知封包：高两位分片，低十四位本片正文长度。
const frame = (type, flag, payload) => [type, (flag << 6) | (payload.length >> 8), payload.length & 255, ...payload];
test('截断/错长联网和成功回执不产生成功值', () => {
  for (const bytes of [[0xe2,0,4,1,0], [0xe2,0,5,1,0,0,2,65],
    [0xe0,0,2,0], [0xe3,0,1,0,1], [0xe2,0,4,2,0,0,0]]) {
    assert.equal(p.parseLLSyncEvent(bytes)?.value, undefined);
  }
});
test('长 SSID 的三片通知只在尾片完成后发布完整结果', () => {
  const d = new p.LLSyncEventDecoder();
  const ssid = Array.from(Buffer.from('中文网络-abcdefghijklmnop'));
  const payload = [1,0,0,ssid.length,...ssid];
  assert.equal(d.push(frame(0xe2,1,payload.slice(0,12)), 0), null);
  assert.equal(d.push(frame(0xe2,2,payload.slice(12,24)), 1), null);
  assert.deepEqual(d.push(frame(0xe2,3,payload.slice(24)), 2).value,
    { connected:true, stationState:0, ssid:Buffer.from(ssid).toString() });
});
test('直接解析分片不能提前产生成功', () => {
  assert.equal(p.parseLLSyncEvent(frame(0xe2,1,[1,0,0,10,65]))?.value, undefined);
});
test('缺首片、跨类型、断线清理、超时和超限均拒绝拼接', () => {
  const d = new p.LLSyncEventDecoder();
  assert.equal(d.push(frame(0xe2,3,[1])), null);
  d.push(frame(0xe2,1,[1,0]), 0);
  assert.equal(d.push(frame(0x08,3,[0,0]), 1), null);
  d.push(frame(0xe2,1,[1,0]), 0);
  d.reset();
  assert.equal(d.push(frame(0xe2,3,[0,0]), 1), null);
  d.push(frame(0xe2,1,[1,0]), 0);
  assert.equal(d.push(frame(0xe2,3,[0,0]), 10001), null);
  assert.equal(d.push(frame(0xe4,1,Array(4097).fill(65)), 0), null);
});
test('设备信息与日志长度按正文解码，MTU 位正确屏蔽', () => {
  assert.deepEqual(p.parseLLSyncEvent(frame(0x08,0,[2,0x80,20,3,65,66,67])).value,
    { version:2, mtu:20, needSetMtu:true, deviceName:'ABC' });
  assert.equal(p.parseLLSyncEvent(frame(0x08,0,[2,0,20,3,65]))?.value, undefined);
  assert.deepEqual(p.parseLLSyncEvent(frame(0xe4,0,[1,65,66])).value, {logStr:'AB'});
  assert.deepEqual(p.parseLLSyncEvent(frame(0xe4,0,[65,66])).value, {logStr:'AB'});
});
test('WiFi 与 Token 字节长度限制在构造时生效', () => {
  for (const [ssid,pwd] of [['',''],['a'.repeat(33),''],['a','b'.repeat(64)]]) {
    assert.throws(() => p.buildSetWifiInfoCommand(ssid,pwd));
  }
  assert.deepEqual(p.buildSetWifiInfoCommand('A',''),[0xe2,0,1,1,65,0]);
  assert.throws(() => p.buildSendTokenCommand(''));
  assert.throws(() => p.buildSendTokenCommand('a'.repeat(33)));
});
