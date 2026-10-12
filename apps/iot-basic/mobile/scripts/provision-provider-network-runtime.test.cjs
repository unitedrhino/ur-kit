/** 换网页面状态映射测试：执行真实 Provider，验证模式、进度和成功文案不会混入绑定。 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** harness 以可推送会话替身驱动真实 Provider，不连接平台。 */
function harness(mode) {
  let state = { mode, stage: 'waiting_device_online', failure: null };
  const listeners = [];
  const calls = [];
  const session = {
    getState: () => state,
    subscribe: (listener) => listeners.push(listener),
    requestNetworkChange: async (target) => calls.push(['online', target]),
    configureNetworkChange: (target) => calls.push(['offline', target]),
  };
  const filename = path.resolve(__dirname, '../src/providers/provision.provider.ts');
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = { exports: {} };
  const deps = {
    '../services/provision-session.service': { provisionSessionService: session },
    '../services/wifi-credential.service': { wifiCredentialService: {} },
    './device-list.provider': { deviceListProvider: { loadFirst: async () => {} } },
  };
  new Function('require', 'module', 'exports', output)((name) => {
    if (!(name in deps)) throw new Error(name);
    return deps[name];
  }, loaded, loaded.exports);
  return {
    provider: loaded.exports.provisionProvider, calls,
    update: (value) => { state = { ...state, ...value }; listeners.forEach((fn) => fn(state)); },
  };
}

test('换网进度无绑定阶段，成功明确表示原绑定保留', () => {
  const { provider, update } = harness('changeNetwork');
  assert.equal(provider.getState().mode, 'changeNetwork');
  assert.equal(provider.getState().progressItems.some((item) => item.stage === 'binding_device'), false);
  assert.match(provider.getState().progressItems.at(-1).desc, /设备连接并保存/);
  update({ stage: 'success' });
  assert.equal(provider.getState().result.title, 'Wi-Fi 已更新');
  assert.match(provider.getState().result.message, /绑定保持不变/);
});

test('首次绑定进度与添加文案保持不变', () => {
  const { provider, update } = harness('bind');
  assert.equal(provider.getState().progressItems.at(-1).stage, 'binding_device');
  update({ stage: 'success' });
  assert.equal(provider.getState().result.title, '添加成功');
});

test('在线与离线入口分别调用确认请求和本地准备，不调用首次绑定重置', async () => {
  const { provider, calls } = harness('bind');
  const target = { productID: '8', deviceName: 'WATCHER' };
  await provider.startNetworkChange(target, true);
  await provider.startNetworkChange(target, false);
  assert.deepEqual(calls, [['online', target], ['online', target]]);
});
