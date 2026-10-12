/**
 * LLSync 配网会话追踪运行时测试：验证 trace 贯穿业务阶段并只产生一个最终结果。
 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const TYPE_PROVISION_FAIL = -1;
const TYPE_PROVISION_SUCCESS = 0xe3;

function loadSessionModule(traceFactory) {
  const filename = path.join(root, 'src/services/provision-session.service.ts');
  const source = readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const initialState = () => ({
    stage: 'idle', credential: null, currentDevice: null, failure: null,
    bindToken: '', boundDevice: null, locationWarning: '', updatedAt: Date.now(),
  });
  const localRequire = (request) => {
    if (request === '../data/repositories/device-network.repository') return {
      DeviceNetworkRepository: class {},
    };
    if (request === './bluetooth-config.service') return {
      bluetoothConfigService: {},
      TYPE_BIND_TOKEN_WRITTEN: 0x1e3,
      TYPE_PROVISION_FAIL: -1,
      TYPE_PROVISION_SUCCESS: 0xe3,
      TYPE_SERVER_INFO: 0xe0,
      TYPE_WIFI_CONNECT_RESULT: 0xe2,
    };
    if (request === '../data/datasources/bluetooth.datasource') return {
      bleLogger: { debug() {}, info() {}, warn() {}, error() {} },
      getBleLogHistory: () => [],
      subscribeBleLogs: () => () => {},
    };
    if (request === './device.service') return { deviceService: {} };
    if (request === '../utils/request') return { isApiError: (error) => error?.name === 'ApiError' && typeof error.code === 'number' };
    if (request === '../domain/models/provision-failure.model') return {
      createProvisionFailure: (code, stage, developerMessage, retryFrom) => Object.assign(
        new Error(developerMessage),
        { code, stage, developerMessage, retryFrom, userMessage: developerMessage },
      ),
      isProvisionFailure: (value) => !!value && typeof value.code === 'string',
    };
    if (request === '../domain/models/provision-session-state.model') return {
      createInitialProvisionSessionState: initialState,
    };
    if (request === '../utils/llsync-provision-trace') return { llsyncProvisionTrace: traceFactory };
    throw new Error(`Unexpected require: ${request}`);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

function createTraceHarness() {
  const sessions = [];
  const factory = {
    start(context) {
      const stages = [];
      const finishes = [];
      const session = {
        traceId: `trace-${sessions.length + 1}`,
        context,
        stages,
        finishes,
        recordStage: (stage, summary) => stages.push({ stage, summary }),
        recordTx() {},
        recordRx() {},
        async finish(result, options = {}) {
          if (finishes.length > 0) return;
          finishes.push(result);
          await options.beforeClose?.();
        },
      };
      sessions.push(session);
      return session;
    },
  };
  return { factory, sessions };
}

function createTransport(options = {}) {
  let handler = null;
  const calls = { connect: [], send: [], logs: [], disconnect: [] };
  return {
    calls,
    emit(message) { handler?.(message); },
    async scanCandidates() { return []; },
    async connect(deviceId, trace) { calls.connect.push({ deviceId, trace }); },
    async sendProvision(params, trace) {
      calls.send.push({ params, trace });
      if (options.firstSendPromise && calls.send.length === 1) await options.firstSendPromise;
      if (options.sendError) throw options.sendError;
    },
    onMessage(next) { handler = next; return () => { handler = null; }; },
    async getModuleLog(trace) { calls.logs.push(trace); return 'device-log'; },
    async disconnect(deviceId) { calls.disconnect.push(deviceId); },
    stopScan() {},
    clearLogs() {},
  };
}

function createSessionOptions(transport, bindingGateway) {
  return {
    transport,
    bindingGateway,
    timeouts: { scanMs: 10, protocolMs: 50, bindingMs: 50, bindPollIntervalMs: 5 },
  };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// 模拟 BLE 成功后设备重启，绑定 HTTP 在 MQTT 恢复前返回明确离线码。
test('最终 BLE 回执后设备短暂离线，保留同一个 Token 等待上线再绑定', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const calls = [];
  const service = new ProvisionSessionService(createSessionOptions(createTransport(), {
    bind: async (...args) => {
      calls.push(args);
      if (calls.length < 3) throw Object.assign(new Error('设备离线'), { name: 'ApiError', code: 2000003 });
    },
  }));
  service.currentTrace = traces.factory.start({});
  service.state.bindToken = 'same-test-token';
  await service.finishBinding({ type: TYPE_PROVISION_SUCCESS, value: { productID: '8', deviceName: 'WATCHER' } });
  assert.equal(service.getState().stage, 'success');
  assert.deepEqual(calls, Array(3).fill(['8', 'WATCHER', 'same-test-token']));
});

test('等待设备上线期间取消，不再发送绑定请求', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  let calls = 0;
  const service = new ProvisionSessionService(createSessionOptions(createTransport(), {
    bind: async () => { calls++; throw Object.assign(new Error('设备离线'), { name: 'ApiError', code: 2000003 }); },
  }));
  service.currentTrace = traces.factory.start({});
  service.delay = async () => service.cancel();
  await service.finishBinding({ type: TYPE_PROVISION_SUCCESS, value: { productID: '8', deviceName: 'WATCHER' } });
  assert.equal(calls, 1);
  assert.equal(service.getState().stage, 'idle');
});

test('持续离线有界超时，非离线业务错误和网络错误不重试', async () => {
  for (const code of [2000003, 403, undefined]) {
    const traces = createTraceHarness();
    const { ProvisionSessionService } = loadSessionModule(traces.factory);
    let calls = 0;
    const service = new ProvisionSessionService(createSessionOptions(createTransport(), {
      bind: async () => { calls++; throw Object.assign(new Error('模拟绑定失败'), { name: 'ApiError', code }); },
    }));
    service.timeouts.bindingMs = 10;
    service.currentTrace = traces.factory.start({});
    await service.finishBinding({ type: TYPE_PROVISION_SUCCESS, value: { productID: '8', deviceName: 'WATCHER' } });
    assert.equal(service.getState().stage, 'failed');
    assert.equal(service.getState().failure.code, code === 2000003 ? 'BIND_TIMEOUT' : 'BIND_FAILED');
    if (code !== 2000003) assert.equal(calls, 1);
    assert(calls <= 3);
  }
});

test('添加失败先采集日志再释放连接，无需退出小程序', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport({ sendError: new Error('模拟添加失败') });
  const order = [];
  transport.getModuleLog = async () => { order.push('log'); return ''; };
  transport.disconnect = async () => { order.push('disconnect'); };
  const service = new ProvisionSessionService(createSessionOptions(transport, { createBindToken: async () => ({ token: 'test' }) }));
  service.selectCandidate({ deviceId: 'ble-1', productID: '8' });
  service.acceptWifi({ ssid: 'test', password: 'test-only' });
  await assert.rejects(service.start());
  await service.traceFinalization;
  assert.deepEqual(order.slice(-2), ['log', 'disconnect']);
});

/** changeHarness 所有绑定入口均主动失败，证明换网不会隐式解绑或创建 Token。 */
function changeHarness(readStatus) {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport();
  const requestId = '0123456789abcdef';
  const sent = [];
  transport.getNetworkChangeInfo = async () => ({ version: 2, mode: 1, phase: 2, error: 0, requestId });
  transport.sendNetworkChange = async (params) => { sent.push(params); };
  const forbidden = async () => { throw new Error('换网禁止调用绑定接口'); };
  const service = new ProvisionSessionService({
    ...createSessionOptions(transport, { bind: forbidden, unbind: forbidden, createBindToken: forbidden }),
    networkGateway: { readStatus, authorize: async () => ({ allowed: true }) },
    timeouts: { protocolMs: 300, bindPollIntervalMs: 1 },
  });
  service.configureNetworkChange({ productID: '8', deviceName: 'WATCHER', requestId });
  service.selectCandidate({ deviceId: 'ble-1', productID: '8' });
  service.acceptWifi({ ssid: 'candidate', password: 'test-only' });
  return { service, transport, traces, requestId, sent };
}

test('漏收结果后只重连原设备一次并查询，成功后释放恢复连接', async () => {
  const { service, transport, requestId } = changeHarness(async () => { throw new Error('禁止云端读取'); });
  let writes = 0, reads = 0;
  transport.sendNetworkChange = async () => { writes++; throw new Error('BLE 断开'); };
  transport.readNetworkChangeResult = async (params) => {
    reads++;
    assert.deepEqual(params, { productID: '8', deviceName: 'WATCHER', requestId, ssid: 'candidate' });
    assert.equal(Object.hasOwn(params, 'pwd'), false);
  };
  await service.start();
  assert.equal(service.getState().stage, 'success');
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  assert.deepEqual(transport.calls.connect.map((call) => call.deviceId), ['ble-1', 'ble-1']);
  assert.deepEqual(transport.calls.disconnect, ['ble-1', 'ble-1']);
});

test('恢复查询失败只保留原失败，不循环重连或重发凭据', async () => {
  const { service, transport } = changeHarness(async () => null);
  let writes = 0, reads = 0;
  transport.sendNetworkChange = async () => { writes++; throw new Error('原始发送失败'); };
  transport.readNetworkChangeResult = async () => { reads++; throw new Error('结果未确认'); };
  await assert.rejects(service.start(), /原始发送失败/);
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  assert.notEqual(service.getState().stage, 'success');
  assert.deepEqual(transport.calls.connect.map((call) => call.deviceId), ['ble-1', 'ble-1']);
});

test('恢复查询期间取消，迟到成功不能恢复页面成功状态', async () => {
  const { service, transport } = changeHarness(async () => null);
  let resolveResult;
  transport.sendNetworkChange = async () => { throw new Error('BLE 断开'); };
  transport.readNetworkChangeResult = () => new Promise((resolve) => { resolveResult = resolve; });
  const failed = assert.rejects(service.start());
  for (let i = 0; !resolveResult && i < 30; i++) await settle();
  assert.equal(typeof resolveResult, 'function');
  service.cancel();
  resolveResult();
  await failed;
  assert.equal(service.getState().stage, 'idle');
});

test('换网仅等待 BLE 保存结果，不查询任何云端状态或绑定接口', async () => {
  let reads = 0;
  const { service, transport, traces, sent } = changeHarness(async () => { reads++; throw new Error('平台离线'); });
  await service.start();
  assert.equal(reads, 0);
  assert.equal(service.getState().stage, 'success');
  assert.equal(service.getState().bindToken, '');
  assert.equal(transport.calls.send.length, 0);
  assert.equal(sent.length, 1);
  assert.equal(traces.sessions[0].finishes[0].result, 'success');
});

test('换网能力请求不匹配时不发送密码，且不回退首次绑定', async () => {
  const { service, transport, sent } = changeHarness(async () => null);
  transport.getNetworkChangeInfo = async () => ({ version: 2, mode: 1, phase: 2, error: 0, requestId: 'ffffffffffffffff' });
  await assert.rejects(service.start());
  assert.equal(sent.length, 0);
  assert.equal(transport.calls.send.length, 0);
  assert.equal(service.getState().failure.code, 'NETWORK_CHANGE_FAILED');
});

test('同产品多设备按 GATT 身份探测，只有正确目标收到候选密码', async () => {
  const { service, transport, sent, requestId } = changeHarness(async () => ({
    requestId: '0123456789abcdef', phase: 7, error: 0, capability: 1,
  }));
  service.selectedCandidate = null;
  transport.scanCandidates = async () => [
    { deviceId: 'other-product', productID: '9' },
    { deviceId: 'wrong', productID: '8' },
    { deviceId: 'target', productID: '8' },
  ];
  let current = '';
  transport.connect = async (deviceId) => { current = deviceId; transport.calls.connect.push(deviceId); };
  transport.getNetworkChangeInfo = async () => {
    if (current !== 'target') throw Object.assign(new Error('身份不匹配'), { code: 'DEVICE_IDENTITY_MISMATCH' });
    return { version: 2, mode: 1, phase: 2, error: 0, requestId };
  };
  transport.sendNetworkChange = async (params) => { assert.equal(current, 'target'); sent.push(params); };
  await service.start();
  assert.deepEqual(transport.calls.connect, ['wrong', 'target']);
  assert.deepEqual(transport.calls.disconnect, ['wrong', 'target']);
  assert.equal(sent.length, 1);
  assert.equal(transport.calls.send.length, 0);
  assert.equal(service.getState().stage, 'success');
});

test('自动探测期间取消后迟到身份错误不能再连接下一候选', async () => {
  const { service, transport, sent } = changeHarness(async () => null);
  service.selectedCandidate = null;
  transport.scanCandidates = async () => [{ deviceId: 'wrong', productID: '8' }, { deviceId: 'target', productID: '8' }];
  let rejectIdentity;
  transport.getNetworkChangeInfo = () => new Promise((_, reject) => { rejectIdentity = reject; });
  const rejected = assert.rejects(service.start());
  await settle();
  assert.ok(rejectIdentity);
  service.cancel();
  rejectIdentity(Object.assign(new Error('身份不匹配'), { code: 'DEVICE_IDENTITY_MISMATCH' }));
  await rejected;
  assert.equal(transport.calls.connect.length, 1);
  assert.equal(sent.length, 0);
  assert.equal(service.getState().stage, 'idle');
});

test('能力错误或断开错误设备失败时停止探测，不能跨连接发送密码', async () => {
  for (const failure of ['capability', 'disconnect', 'selected']) {
    const { service, transport, sent } = changeHarness(async () => null);
    if (failure !== 'selected') service.selectedCandidate = null;
    transport.scanCandidates = async () => [{ deviceId: 'wrong', productID: '8' }, { deviceId: 'target', productID: '8' }];
    transport.getNetworkChangeInfo = async () => {
      if (failure === 'capability') throw new Error('固件不支持，请升级固件');
      throw Object.assign(new Error('身份不匹配'), { code: 'DEVICE_IDENTITY_MISMATCH' });
    };
    if (failure === 'disconnect') transport.disconnect = async () => { throw new Error('断开失败'); };
    await assert.rejects(service.start());
    assert.equal(transport.calls.connect.length, 1);
    assert.equal(sent.length, 0);
    assert.equal(transport.calls.send.length, 0);
    assert.equal(service.getState().stage, 'failed');
  }
});

test('所有同产品候选均非目标时逐个断开，终态仍是身份错误而不是绑定失败', async () => {
  const { service, transport, sent } = changeHarness(async () => null);
  service.selectedCandidate = null;
  transport.scanCandidates = async () => [{ deviceId: 'wrong-1', productID: '8' }, { deviceId: 'wrong-2', productID: '8' }];
  transport.getNetworkChangeInfo = async () => {
    throw Object.assign(new Error('身份不匹配'), { code: 'DEVICE_IDENTITY_MISMATCH' });
  };
  await assert.rejects(service.start());
  assert.deepEqual(transport.calls.disconnect, ['wrong-1', 'wrong-2']);
  assert.equal(service.getState().failure.code, 'DEVICE_IDENTITY_MISMATCH');
  assert.equal(sent.length, 0);
});

/** holdBleResult 模拟等待设备回执；断开真实传输会拒绝等待器，不能继续挂起。 */
function holdBleResult(transport) {
  let resolve;
  let reject;
  let entered;
  const ready = new Promise((done) => { entered = done; });
  const pending = new Promise((done, fail) => { resolve = done; reject = fail; });
  transport.sendNetworkChange = async () => { entered(); return pending; };
  const disconnect = transport.disconnect;
  transport.disconnect = async (id) => { await disconnect(id); reject(new Error('BLE 已断开')); };
  return { ready, resolve, reject };
}

test('取消后 BLE 迟到成功不能改写已取消页面', async () => {
  const { service, transport } = changeHarness(async () => { throw new Error('禁止云端轮询'); });
  const held = holdBleResult(transport);
  const rejected = assert.rejects(service.start());
  await held.ready;
  service.cancel();
  held.resolve();
  await rejected;
  assert.equal(service.getState().stage, 'idle');
});

test('BLE 联网失败结束换网，不进入绑定阶段', async () => {
  const { service, transport } = changeHarness(async () => null);
  transport.sendNetworkChange = async () => { throw new Error('设备未确认目标 WiFi 连接成功'); };
  await assert.rejects(service.start());
  assert.equal(service.getState().failure.code, 'NETWORK_CHANGE_FAILED');
  assert.equal(transport.calls.send.length, 0);
});

test('未收到 BLE 成功时超时失败，旧绑定成功事件不能完成换网', async () => {
  const { service, transport } = changeHarness(async () => null);
  service.timeouts.protocolMs = 15;
  const held = holdBleResult(transport);
  const rejected = assert.rejects(service.start());
  await held.ready;
  transport.emit({ type: TYPE_PROVISION_SUCCESS, value: { productID:'8', deviceName:'WATCHER' } });
  await rejected;
  assert.equal(service.getState().stage, 'failed');
  assert.equal(service.getState().failure.code, 'PROTOCOL_TIMEOUT');
  assert.equal(transport.calls.send.length, 0);
});

test('BLE 等待超时或取消释放旧启动链，重试不依赖云端', async () => {
  for (const ending of ['timeout','cancel']) {
    const { service, transport, requestId } = changeHarness(async () => { throw new Error('禁止云端轮询'); });
    service.timeouts.protocolMs = ending === 'timeout' ? 15 : 300;
    const held = holdBleResult(transport);
    const rejected = assert.rejects(service.start());
    await held.ready;
    if (ending === 'cancel') service.cancel();
    await rejected;
    assert.equal(service.getState().stage, ending === 'cancel' ? 'idle' : 'failed');
    transport.sendNetworkChange = async () => {};
    service.timeouts.protocolMs = 300;
    service.configureNetworkChange({ productID:'8', deviceName:'WATCHER', requestId });
    service.selectCandidate({ deviceId:'ble-1', productID:'8' });
    service.acceptWifi({ ssid:'candidate', password:'test-only' });
    await service.start();
    held.resolve();
    await settle();
    assert.equal(service.getState().stage, 'success');
  }
});

test('旧固件缺少换网能力时不能发送候选或走首次绑定', async () => {
  const { service, transport, sent } = changeHarness(async () => null);
  delete transport.getNetworkChangeInfo;
  await assert.rejects(service.start());
  assert.equal(sent.length, 0);
  assert.equal(transport.calls.send.length, 0);
});

test('入口只检查项目权限，不伪造设备请求 ID，HTTP 许可不表示换网成功', async () => {
  const { service } = changeHarness(async () => ({ capability: 1 }));
  const requests = [];
  service.networkGateway.authorize = async (target) => { requests.push(target); return { allowed: true }; };
  await service.requestNetworkChange({ productID: '8', deviceName: 'WATCHER' });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], { productID: '8', deviceName: 'WATCHER' });
  assert.equal(service.getState().networkTarget.requestId, requests[0].requestId);
  assert.equal(service.getState().stage, 'preparing');
});

test('授权接口不可用时拒绝继续，不降级为未鉴权换网', async () => {
  const { service } = changeHarness(async () => undefined);
  delete service.networkGateway.authorize;
  await assert.rejects(service.requestNetworkChange({ productID:'8', deviceName:'WATCHER' }), /网络授权服务不可用/);
});

test('检查权限期间取消，迟到许可不能重新打开流程', async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const { service } = changeHarness(async () => { throw new Error('禁止云端能力查询'); });
  service.networkGateway.authorize = async () => pending;
  const rejected = assert.rejects(service.requestNetworkChange({ productID:'8', deviceName:'WATCHER' }));
  service.cancel();
  finish();
  await rejected;
  assert.equal(service.getState().stage, 'idle');
});

test('项目拒绝和权限查询故障均保持零凭据写入', async () => {
  for (const result of [{ allowed: false }, null]) {
    const { service, sent } = changeHarness(async () => undefined);
    service.networkGateway.authorize = async () => { if (!result) throw new Error('network'); return result; };
    await assert.rejects(service.start());
    assert.equal(sent.length, 0);
  }
});

test('权限查询期间取消，迟到结果不写 WiFi', async () => {
  const { service, sent } = changeHarness(async () => undefined);
  let finish, entered;
  const ready = new Promise((resolve)=>{ entered=resolve; });
  service.networkGateway.authorize = async () => { entered(); return new Promise((resolve)=>{ finish=resolve; }); };
  const result = service.start().catch(()=>{});
  await ready;
  service.cancel();
  finish({ allowed:true });
  await result;
  assert.equal(sent.length,0);
  assert.equal(service.getState().stage,'idle');
});

test('权限查询只传设备身份，BLE 凭据不附带云端签名', async () => {
  const { service, sent } = changeHarness(async () => undefined);
  service.networkGateway.authorize = async (target, proof) => {
    assert.deepEqual(target, { productID: '8', deviceName: 'WATCHER', requestId: '0123456789abcdef' });
    assert.equal(proof, undefined);
    return { allowed: true };
  };
  await service.start();
  assert.equal(sent[0].signature, undefined);
  assert.equal(sent[0].nonce, undefined);
});

test('successful session passes one trace through BLE and emits one success finish', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport();
  const binds = [];
  const service = new ProvisionSessionService(createSessionOptions(transport, {
      createBindToken: async () => ({ token: 'token-1', status: 1 }),
      bind: async (...args) => binds.push(args),
    }));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC', name: 'demo' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });

  await service.start();
  const trace = traces.sessions[0];
  assert.equal(transport.calls.connect[0].trace, trace);
  assert.equal(transport.calls.send[0].trace, trace);
  transport.emit({ type: TYPE_PROVISION_SUCCESS, value: { productID: 'AC', deviceName: 'AABB' } });
  await settle();

  assert.deepEqual(binds, [['AC', 'AABB', 'token-1']]);
  assert.equal(trace.finishes.length, 1);
  assert.equal(trace.finishes[0].result, 'success');
  assert.ok(trace.stages.some((item) => item.stage === 'connecting_ble'));
  assert.ok(trace.stages.some((item) => item.stage === 'binding_device'));
});

test('failure attempts E5 with the same trace before one failed finish', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport({ sendError: new Error('设备连接 WiFi 失败') });
  const service = new ProvisionSessionService(createSessionOptions(transport, {}));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });

  await assert.rejects(() => service.start());
  await settle();
  const trace = traces.sessions[0];

  assert.deepEqual(transport.calls.logs, [trace]);
  assert.equal(trace.finishes.length, 1);
  assert.equal(trace.finishes[0].result, 'failed');
  assert.equal(service.getState().stage, 'failed');
});

test('late success after failure cannot bind or overwrite the failed result', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport();
  const binds = [];
  const service = new ProvisionSessionService(createSessionOptions(
    transport,
    { bind: async (...args) => binds.push(args) },
  ));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });
  await service.start();

  transport.emit({ type: TYPE_PROVISION_FAIL, value: { code: 1 } });
  transport.emit({ type: TYPE_PROVISION_SUCCESS, value: { productID: 'AC', deviceName: 'AABB' } });
  await settle();

  assert.deepEqual(binds, []);
  assert.equal(service.getState().stage, 'failed');
  assert.equal(traces.sessions[0].finishes.length, 1);
  assert.equal(traces.sessions[0].finishes[0].result, 'failed');
});

test('late failure after success cannot overwrite the successful state', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport();
  const service = new ProvisionSessionService(createSessionOptions(transport, {
    bind: async () => {},
  }));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });
  await service.start();

  transport.emit({ type: TYPE_PROVISION_SUCCESS, value: { productID: 'AC', deviceName: 'AABB' } });
  await settle();
  service.handleBleMessage({ type: TYPE_PROVISION_FAIL, value: { code: 1 } });
  await settle();

  assert.equal(service.getState().stage, 'success');
  assert.equal(traces.sessions[0].finishes.length, 1);
  assert.deepEqual(transport.calls.disconnect, ['ble-1']);
});

test('cancel closes the active trace with the supplied reason', async () => {
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport();
  const service = new ProvisionSessionService(createSessionOptions(transport, {}));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });
  await service.start();

  service.cancel('PAGE_UNLOADED');
  await settle();

  assert.equal(traces.sessions[0].finishes.length, 1);
  assert.equal(traces.sessions[0].finishes[0].failureCode, 'PAGE_UNLOADED');
});

test('repeated start closes the old trace and stale async completion cannot close the new trace', async () => {
  let releaseFirstSend;
  const firstSendPromise = new Promise((resolve) => { releaseFirstSend = resolve; });
  const traces = createTraceHarness();
  const { ProvisionSessionService } = loadSessionModule(traces.factory);
  const transport = createTransport({ firstSendPromise });
  const service = new ProvisionSessionService(createSessionOptions(transport, {}));
  service.selectCandidate({ deviceId: 'ble-1', productID: 'AC' });
  service.acceptWifi({ ssid: 'AI', password: 'secret' });

  const firstStart = service.start();
  await settle();
  const secondStart = service.start();
  await settle();
  assert.equal(transport.calls.send.length, 1, 'new session must wait until the old command chain exits');
  releaseFirstSend();
  await assert.rejects(firstStart, /配网会话已被替换/);
  await secondStart;

  assert.equal(traces.sessions.length, 2);
  assert.equal(traces.sessions[0].finishes.length, 1);
  assert.equal(traces.sessions[0].finishes[0].failureCode, 'SESSION_REPLACED');
  assert.equal(traces.sessions[1].finishes.length, 0);
  service.cancel();
});
