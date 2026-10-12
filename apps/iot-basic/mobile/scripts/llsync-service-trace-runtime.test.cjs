/**
 * LLSync BLE 收发追踪运行时测试：验证真实服务只在底层 I/O 边界记录完整字节。
 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadServiceModule(harness) {
  const filename = path.join(root, 'src/services/bluetooth-config.service.ts');
  const source = readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === '../domain/models/provision-failure.model') {
      const model = { exports: {} };
      const code = ts.transpileModule(readFileSync(path.join(root, 'src/domain/models/provision-failure.model.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      }).outputText;
      new Function('module', 'exports', code)(model, model.exports);
      return model.exports;
    }
    if (request === '../data/datasources/bluetooth.datasource') return harness.bluetooth;
    if (request === '../utils/event-bus') return { eventBus: harness.eventBus ?? { on() {}, off() {} } };
    if (request === '../utils/ble-readiness') return { ensureBluetoothReadyWithGuide: async () => ({ ok: true }) };
    if (request === '../utils/llsync-protocol') return harness.protocol;
    throw new Error(`Unexpected require: ${request}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

function createHarness() {
  // 通知解码使用实际模块；只在 BLE I/O 边界替身，避免隐藏分片和半包缺陷。
  const actual = { exports: {} };
  new Function('module', 'exports', ts.transpileModule(readFileSync(path.join(root, 'src/utils/llsync-protocol.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(actual, actual.exports);
  const writes = [];
  const callbacks = [];
  const removedCallbacks = [];
  const listeners = new Map();
  const eventBus = {
    on(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    off(name, callback) { listeners.get(name)?.delete(callback); },
    emit(name, payload) { for (const callback of [...(listeners.get(name) ?? [])]) callback(payload); },
  };
  const bluetooth = {
    bleDataSource: {
      writeCharacteristic: async (...args) => writes.push(args),
      closeConnection: async () => {},
    },
    bleLogger: { debug() {}, info() {}, warn() {}, error() {} },
    clearBleLogs() {},
  };
  const protocol = {
    LLSyncEventDecoder: actual.exports.LLSyncEventDecoder,
    LLSYNC_ADVERTISING_SERVICE_UUID: 'FFF0',
    LLSYNC_DEVICE_INFO_WRITE_UUID: 'FFE1',
    LLSYNC_EVENT_DEVICE_INFO: 0xe0,
    LLSYNC_EVENT_GET_DEV_LOG_INFO: 0xe4,
    LLSYNC_EVENT_NETWORK_CHANGE: 0xe5,
    LLSYNC_EVENT_NOTIFY_UUID: 'FFE3',
    LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT: 0xe2,
    LLSYNC_EVENT_SET_WIFI_INFO_RESULT: 0xe1,
    LLSYNC_EVENT_SET_WIFI_MODE_RESULT: 0xe0,
    LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT: 0xe3,
    LLSYNC_SERVICE_UUID: 'FFF0',
    LLSYNC_SHORT_NOTIFY_UUID: 'ffe3',
    LLSYNC_SHORT_SERVICE_UUID: 'fff0',
    LLSYNC_SHORT_WRITE_UUID: 'ffe1',
    buildConnectWifiCommand: () => [0xe3],
    buildGetDeviceInfoCommand: () => [0xe0],
    buildGetLogCommand: () => [0xe5],
    buildSendTokenCommand: () => [0xe4],
    buildSetWifiInfoCommand: () => [0xe2],
    buildSetWifiModeCommand: () => [0xe1],
    buildWriteMtuResultCommand: () => [0x08],
    bytesToArrayBuffer: (bytes) => Uint8Array.from(bytes).buffer,
    hasLLSyncAdvertisingService: () => true,
    isLLSyncSuccessResult: () => true,
    parseLLSyncAdvertisingData: () => null,
    parseLLSyncEvent: (bytes) => ({ type: bytes[0], value: {}, raw: bytes }),
    uuidMatchesShort: (uuid, short) => uuid.toLowerCase().includes(short.toLowerCase()),
  };
  global.uni = {
    onBLECharacteristicValueChange(callback) { callbacks.push(callback); },
    offBLECharacteristicValueChange(callback) { removedCallbacks.push(callback); },
  };
  const exports = loadServiceModule({ bluetooth, protocol, eventBus });
  return { ...exports, writes, callbacks, removedCallbacks, protocol, eventBus, listeners, bluetooth };
}

test('命令写入失败必须取消其 ACK 等待，不能遗留计时器或未捕获拒绝', async () => {
  const h = createHarness();
  const service = new h.BluetoothConfigService();
  service.writeCommand = async () => { throw new Error('模拟蓝牙写入失败'); };
  await assert.rejects(service.writeAndWaitForEvent([0xe0], 0xe0, 1000, 'timeout'), /模拟蓝牙写入失败/);
  const remaining = service.pendingEvents.size;
  // 基线失败也及时清理测试计时器，防止影响下一用例。
  for (const pending of service.pendingEvents.values()) for (const item of pending) clearTimeout(item.timer);
  assert.equal(remaining, 0);
});

test('Token 写入失败也释放 ACK 等待', async () => {
  const h = createHarness();
  const service = new h.BluetoothConfigService();
  service.writeCommand = async () => { throw new Error('模拟 Token 写失败'); };
  await assert.rejects(service.sendToken('test-only'), /模拟 Token 写失败/);
  const remaining = service.pendingEvents.size;
  for (const pending of service.pendingEvents.values()) for (const item of pending) clearTimeout(item.timer);
  assert.equal(remaining, 0);
});

test('写入未完成时物理断连，ACK 提前拒绝不会成为未捕获异常', async () => {
  const h = createHarness();
  const service = new h.BluetoothConfigService();
  let finishWrite;
  service.writeCommand = () => new Promise((resolve) => { finishWrite = resolve; });
  const command = service.writeAndWaitForEvent([0xe0], 0xe0, 1000, 'timeout');
  const failed = assert.rejects(command, /蓝牙连接已断开/);
  service.rejectAllPendingEvents('蓝牙连接已断开');
  // 跨越事件循环；node:test 会直接将 unhandledRejection 判为失败。
  await new Promise(setImmediate);
  finishWrite();
  await failed;
  assert.equal(service.pendingEvents.size, 0);
});

/** networkHarness 建立已验证身份的候选网络连接，不模拟绑定接口。 */
function networkHarness() {
  const harness = createHarness();
  const service = new harness.BluetoothConfigService();
  service.activeDeviceId = 'ble-device';
  service.currentProductID = '8';
  service.currentDeviceInfo = { deviceName: 'WATCHER' };
  service.networkChange = { version: 2, mode: 1, phase: 2, error: 0, requestId: '000123456789abcd' };
  const params = { productID: '8', deviceName: 'WATCHER', requestId: '000123456789abcd', ssid: 'candidate' };
  const commands = [];
  service.setWiFiMode = async () => { commands.push('mode'); };
  service.setWiFiInfo = async () => { commands.push('info'); };
  service.writeCommand = async (bytes) => { commands.push(bytes); };
  service.sendToken = async () => { throw new Error('换网禁止绑定'); };
  service.connectWifi = async () => { commands.push([0xe3]); return { connected:true, ssid:'candidate' }; };
  return { ...harness, service, params, commands };
}

test('换网复用模式、候选和标准联网回执，不发送绑定 Token', async () => {
  const { service, params, commands } = networkHarness();
  await service.sendNetworkChange(params);
  assert.deepEqual(commands, ['mode', 'info', [0xe3]]);
});

test('换网拒绝失败回执或非目标 SSID，不能把其他网络成功当作本次结果', async () => {
  for (const result of [{ connected:false, ssid:'candidate' }, { connected:true, ssid:'other' }]) {
    const { service, params } = networkHarness();
    service.connectWifi = async () => result;
    await assert.rejects(service.sendNetworkChange(params), /未确认目标/);
  }
});

test('联网回执不能复活失败或被替换的请求，允许同一请求提交阶段乱序到达', async () => {
  for (const change of [{ phase: 8, error: 2 }, { requestId: 'ffffffffffffffff' }, { phase: 7 }]) {
    const { service, params } = networkHarness();
    service.connectWifi = async () => {
      Object.assign(service.networkChange, change);
      return { connected: true, ssid: params.ssid };
    };
    if (change.phase === 7) await service.sendNetworkChange(params);
    else await assert.rejects(service.sendNetworkChange(params), /结束或过期/);
  }
});

test('GATT 身份不符返回完整结构化错误，候选探测不依赖文案', async () => {
  const { service, params, commands } = networkHarness();
  await assert.rejects(service.getNetworkChangeInfo({ ...params, deviceName: 'OTHER' }), (error) => {
    assert.equal(error.code, 'DEVICE_IDENTITY_MISMATCH');
    assert.equal(error.stage, 'connecting_ble');
    assert.equal(error.retryFrom, 'wifi_ready');
    assert.ok(error.userMessage && error.developerMessage && error.message);
    return true;
  });
  assert.deepEqual(commands, []);
});

test('产品、设备名或请求标识不匹配时零凭据写入', async () => {
  for (const change of [{ productID: 'other' }, { deviceName: 'OTHER' }, { requestId: 'ffffffffffffffff' }]) {
    const { service, params, commands } = networkHarness();
    await assert.rejects(service.sendNetworkChange({ ...params, ...change }), /不一致|过期/);
    assert.deepEqual(commands, []);
  }
});

test('失败及不支持的设备不得进入换网写入', async () => {
  for (const change of [{ phase: 8 }, { error: 1 }, { version: 1 }, { mode: 0 }]) {
    const { service, params, commands } = networkHarness();
    Object.assign(service.networkChange, change);
    await assert.rejects(service.sendNetworkChange(params), /不接受换网/);
    assert.deepEqual(commands, []);
  }
});

test('同一已提交请求只发送结果查询，旧请求和未提交不能借查询写入凭据', async () => {
  const { service, params, commands } = networkHarness();
  service.networkChange.phase = 7;
  await service.sendNetworkChange(params);
  assert.deepEqual(commands, [[0xe3]]);
  for (const requestId of [undefined, 'ffffffffffffffff']) {
    await assert.rejects(service.getNetworkChangeInfo({ ...params, requestId }), /不接受换网/);
  }
  service.networkChange.phase = 3;
  await assert.rejects(service.readNetworkChangeResult(params), /尚未确认/);
  assert.deepEqual(commands, [[0xe3]]);
});

test('发送模式后收到超时或新请求通知，不再发送候选凭据', async () => {
  for (const change of [{ phase: 8, error: 2 }, { requestId: 'ffffffffffffffff' }]) {
    const { service, params, commands } = networkHarness();
    service.setWiFiMode = async () => {
      commands.push('mode');
      Object.assign(service.networkChange, change);
    };
    await assert.rejects(service.sendNetworkChange(params), /结束或过期/);
    assert.deepEqual(commands, ['mode']);
  }
});

test('协议主动释放失败必须拒绝，系统已确认断开的同一设备无需再次关闭', async () => {
  const { service, bluetooth, eventBus } = networkHarness();
  let calls = 0;
  bluetooth.bleDataSource.closeConnection = async (id, strict) => {
    assert.equal(id, 'ble-device');
    assert.equal(strict, true);
    calls++;
    throw new Error('关闭未确认');
  };
  await assert.rejects(service.disconnect('ble-device'), /关闭未确认/);
  assert.equal(calls, 1);
  await assert.rejects(service.connect('other-device'), /关闭未确认/);
  assert.equal(calls, 2);
  service.activeDeviceId = 'ble-device';
  service.bindConnectionState('ble-device', service.connectionGeneration);
  eventBus.emit('ble:connection-state', { deviceId: 'ble-device', connected: false });
  await service.disconnect('ble-device');
  assert.equal(calls, 2);
  assert.equal(service.pendingCloseDeviceId, '');
});

test('物理断线立即拒绝协议等待并清半包，非目标设备和旧监听不影响新连接', async () => {
  const { service, eventBus, listeners } = networkHarness();
  service.bindConnectionState('ble-device', service.connectionGeneration);
  const oldListener = [...listeners.get('ble:connection-state')][0];
  service.eventDecoder.push([0xe2, 0x40, 1, 1]);
  const waiting = assert.rejects(service.waitForEvent(0xe2, 100, '测试超时'), /蓝牙连接已断开/);
  eventBus.emit('ble:connection-state', { deviceId: 'other', connected: false });
  assert.equal(service.activeDeviceId, 'ble-device');
  eventBus.emit('ble:connection-state', { deviceId: 'ble-device', connected: false });
  await waiting;
  assert.equal(service.pendingEvents.size, 0);
  assert.equal(service.networkChange, null);
  assert.equal(service.activeDeviceId, '');
  assert.equal(listeners.get('ble:connection-state').size, 0);
  service.activeDeviceId = 'new-device';
  service.bindConnectionState('new-device', service.connectionGeneration);
  oldListener({ deviceId: 'ble-device', connected: false });
  assert.equal(service.activeDeviceId, 'new-device');
  assert.equal(service.eventDecoder.push([0xe2, 0xc0, 1, 0]), null);
  await service.disconnect('new-device');
  assert.equal(listeners.get('ble:connection-state').size, 0);
});

test('等待能力期间断线会拒绝，并清除旧连接能力', async () => {
  const { service, params } = networkHarness();
  service.networkChange = null;
  const waiting = assert.rejects(service.getNetworkChangeInfo(params), /断开/);
  await service.disconnect('ble-device');
  await waiting;
  assert.equal(service.networkChange, null);
  assert.equal(service.pendingEvents.size, 0);
});

test('损坏能力通知不唤醒等待者，有效通知按当前连接缓存且返回独立副本', async () => {
  const { service, params } = networkHarness();
  const expected = { ...service.networkChange };
  service.networkChange = null;
  const waiting = service.getNetworkChangeInfo(params);
  const notify = (bytes) => service.handleNotify({
    deviceId: 'ble-device', characteristicId: 'FFE3', serviceId: 'FFF0',
    value: Uint8Array.from(bytes).buffer,
  }, 'ble-device', null);
  notify([0xe5]);
  assert.equal(service.networkChange, null);
  assert.equal(service.pendingEvents.size, 1);
  notify([0xe5, 0, 12, 2, 1, 2, 0, 0, 1, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd]);
  const result = await waiting;
  assert.deepEqual(result, expected);
  result.requestId = 'changed';
  assert.equal(service.networkChange.requestId, params.requestId);
  assert.equal(service.pendingEvents.size, 0);
});

test('取消后旧流程不能向新连接继续发送候选或连接命令', async () => {
  for (const cancelAt of ['mode', 'info']) {
    const { service, params, commands } = networkHarness();
    const method = cancelAt === 'mode' ? 'setWiFiMode' : 'setWiFiInfo';
    service[method] = async () => {
      commands.push(cancelAt);
      await service.disconnect('ble-device');
      // 模拟用户立刻重新连接同一硬件，设备 ID 相同也必须用代次隔离。
      service.activeDeviceId = 'ble-device';
      service.currentProductID = '8';
      service.currentDeviceInfo = { deviceName: 'WATCHER' };
    };
    await assert.rejects(service.sendNetworkChange(params), /失效/);
    assert.deepEqual(commands, cancelAt === 'mode' ? ['mode'] : ['mode', 'info']);
  }
});

test('真实服务等到完整联网尾片才唤醒等待者，断线后不复用半包', async () => {
  const { BluetoothConfigService } = createHarness();
  const service = new BluetoothConfigService();
  service.activeDeviceId = 'device';
  const received = [];
  service.onMessage((event) => received.push(event));
  const notify = (bytes) => service.handleNotify({
    deviceId: 'device', serviceId: 'FFF0', characteristicId: 'FFE3',
    value: Uint8Array.from(bytes).buffer,
  }, 'device', null);
  const waiting = service.waitForEvent(0xe2, 1000, 'test timeout');
  notify([0xe2,0x40,5,1,0,0,3,65]);
  assert.equal(received.length, 0);
  assert.equal(service.pendingEvents.size, 1);
  notify([0xe2,0xc0,2,66,67]);
  assert.deepEqual((await waiting).value, { connected:true, stationState:0, ssid:'ABC' });
  assert.equal(received.length, 1);
  notify([0xe2,0x40,5,1,0,0,3,65]);
  await service.disconnect('device');
  service.activeDeviceId = 'device';
  notify([0xe2,0xc0,2,66,67]);
  assert.equal(received.length, 1);
});

test('writeCommand records one complete TX before datasource write', async () => {
  const { BluetoothConfigService, writes } = createHarness();
  const service = new BluetoothConfigService();
  service.activeDeviceId = 'device';
  service.activeServiceId = 'service';
  service.activeWriteCharId = 'write';
  const tx = [];
  const trace = { recordTx: (bytes) => tx.push([...bytes]), recordRx() {} };

  await service.writeCommand([0xe2, 0x00, 0x03, 0x41, 0x00, 0x70], trace);

  assert.deepEqual(tx, [[0xe2, 0x00, 0x03, 0x41, 0x00, 0x70]]);
  assert.equal(writes.length, 1);
});

test('notify records every complete RX before parsing and removes the same callback', () => {
  const { BluetoothConfigService, callbacks, removedCallbacks } = createHarness();
  const service = new BluetoothConfigService();
  service.activeDeviceId = 'device';
  service.activeNotifyCharId = 'FFE3';
  const rx = [];
  service.activeTrace = { recordTx() {}, recordRx: (bytes) => rx.push([...bytes]) };

  service.bindNotify();
  callbacks[0]({
    deviceId: 'device',
    serviceId: 'FFF0',
    characteristicId: 'FFE3',
    value: Uint8Array.from([0xe3, 0x00, 0x01, 0xc8]).buffer,
  });
  service.unbindNotify();

  assert.deepEqual(rx, [[0xe3, 0x00, 0x01, 0xc8]]);
  assert.equal(removedCallbacks[0], callbacks[0]);
});

test('disconnect stops attributing later notifications to the closed trace', async () => {
  const { BluetoothConfigService, callbacks } = createHarness();
  const service = new BluetoothConfigService();
  service.activeDeviceId = 'device';
  service.activeNotifyCharId = 'FFE3';
  const rx = [];
  service.activeTrace = { recordTx() {}, recordRx: (bytes) => rx.push([...bytes]) };
  service.bindNotify();

  await service.disconnect('device');
  callbacks[0]({
    deviceId: 'device',
    serviceId: 'FFF0',
    characteristicId: 'FFE3',
    value: Uint8Array.from([0xe3]).buffer,
  });

  assert.deepEqual(rx, []);
  assert.equal(service.activeTrace, null);
});

test('stale callback cannot write into a newer trace when runtime off is ineffective', () => {
  const { BluetoothConfigService, callbacks } = createHarness();
  const service = new BluetoothConfigService();
  service.activeDeviceId = 'device';
  service.activeNotifyCharId = 'FFE3';
  const firstRx = [];
  const secondRx = [];
  service.activeTrace = { recordTx() {}, recordRx: (bytes) => firstRx.push([...bytes]) };
  service.bindNotify();
  service.unbindNotify();
  service.activeTrace = { recordTx() {}, recordRx: (bytes) => secondRx.push([...bytes]) };
  service.bindNotify();

  const packet = {
    deviceId: 'device', serviceId: 'FFF0', characteristicId: 'FFE3',
    value: Uint8Array.from([0xe3, 0x00, 0x01, 0xc8]).buffer,
  };
  callbacks[0](packet);
  callbacks[1](packet);

  assert.deepEqual(firstRx, []);
  assert.deepEqual(secondRx, [[0xe3, 0x00, 0x01, 0xc8]]);
});
