/** 蓝牙扫描回归：重复扫描、首包监听与异步停止不能依赖重启小程序。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// 模拟系统跨轮发现缓存，以及延迟结束的扫描停止操作。
function harness() {
  const handlers = new Set();
  const events = [];
  const starts = [];
  const stops = [];
  let seen = false;
  const api = {
    onBluetoothDeviceFound: (fn) => handlers.add(fn),
    offBluetoothDeviceFound: (fn) => fn ? handlers.delete(fn) : handlers.clear(),
    startBluetoothDevicesDiscovery(options) {
      starts.push(options);
      if (!seen || options.allowDuplicatesKey) {
        handlers.forEach((fn) => fn({ devices: [{ deviceId: 'watcher', RSSI: -40 }] }));
      }
      seen = true;
      options.success({});
    },
    stopBluetoothDevicesDiscovery: (options) => stops.push(options),
  };
  const file = path.join(__dirname, '../src/data/datasources/bluetooth.datasource.ts');
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', 'uni', output)((name) => {
    if (name.endsWith('event-bus')) return { eventBus: { emit: (...args) => events.push(args) } };
    if (name.endsWith('ble-logger')) return { bleLogger: { info() {}, debug() {}, warn() {}, error() {} } };
    throw new Error(name);
  }, mod, mod.exports, api);
  return { source: new mod.exports.BluetoothDataSource(), handlers, events, starts, stops };
}

test('启动扫描前已监听首包，重复扫描仍能发现同一设备', async () => {
  const h = harness();
  for (let round = 0; round < 10; round++) {
    await h.source.startScan();
    assert.equal(h.events.length, round + 1);
    const stop = h.source.stopScan();
    await new Promise(setImmediate);
    h.stops.at(-1).success({});
    await stop;
    assert.equal(h.handlers.size, 0);
  }
});

test('上一轮停止未完成时，新扫描不得启动，也不删除外部监听', async () => {
  const h = harness();
  const external = () => {};
  h.handlers.add(external);
  await h.source.startScan();
  const stop = h.source.stopScan();
  const restart = h.source.startScan();
  await new Promise(setImmediate);
  assert.equal(h.starts.length, 1);
  assert(h.handlers.has(external));
  h.stops[0].success({});
  await stop;
  await restart;
  assert.equal(h.starts.length, 2);
});

test('停止失败后先重新释放，再启动扫描', async () => {
  const h = harness();
  await h.source.startScan();
  const stopping = h.source.stopScan();
  const rejected = assert.rejects(stopping, /stop failed/);
  await new Promise(setImmediate);
  h.stops[0].fail({ errMsg: 'stop failed' });
  await rejected;
  const restart = h.source.startScan();
  await new Promise(setImmediate);
  assert.equal(h.starts.length, 1);
  h.stops[1].success({});
  await restart;
  assert.equal(h.starts.length, 2);
});

test('旧轮迟到发现事件不能污染新轮', async () => {
  const h = harness();
  await h.source.startScan();
  const stale = [...h.handlers][0];
  const stopping = h.source.stopScan();
  await new Promise(setImmediate);
  h.stops[0].success({});
  await stopping;
  await h.source.startScan();
  stale({ devices: [{ deviceId: 'stale' }] });
  assert.equal(h.events.length, 2);
});
