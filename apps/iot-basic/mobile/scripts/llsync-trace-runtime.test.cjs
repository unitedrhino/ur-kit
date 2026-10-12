/**
 * LLSync 配网追踪运行时测试：转译并执行真实 TypeScript 模块，验证分片与终态行为。
 */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadTraceModule() {
  const filename = path.join(root, 'src/utils/llsync-provision-trace.ts');
  const source = readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === './logger') {
      return { logger: { addBreadcrumb() {}, captureMessage() {} } };
    }
    throw new Error(`Unexpected require: ${request}`);
  };
  const run = new Function('require', 'module', 'exports', output);
  run(localRequire, module, module.exports);
  return module.exports;
}

function createHarness() {
  const breadcrumbs = [];
  const events = [];
  const { LLSyncProvisionTrace } = loadTraceModule();
  const trace = new LLSyncProvisionTrace((message, context) => {
    events.push({ message, context });
  }, (breadcrumb) => {
    breadcrumbs.push(breadcrumb);
  });
  return { breadcrumbs, events, trace };
}

function eventPayload(event) {
  return event.context.extra;
}

function allEntries(events) {
  return events.flatMap((event) => eventPayload(event).entries || []);
}

for (const packetCount of [0, 19, 20, 21, 40]) {
  test(`trace keeps ${packetCount} packets without gaps or duplicates`, async () => {
    const { events, trace } = createHarness();
    const session = trace.start({ stage: 'scanning_ble', productID: 'AC' });
    for (let index = 0; index < packetCount; index += 1) {
      session.recordRx([0xe0, index & 0xff]);
    }
    await session.finish({ result: 'success', stage: 'success', productID: 'AC', deviceName: 'AABB' });

    const chunks = events.filter((event) => eventPayload(event).eventType === 'chunk');
    assert.equal(chunks.length, Math.floor(packetCount / 20));
    assert.deepEqual(chunks.map((event) => eventPayload(event).chunkIndex),
      Array.from({ length: Math.floor(packetCount / 20) }, (_, index) => index + 1));
    const entries = allEntries(events);
    assert.equal(entries.length, packetCount + 1);
    assert.deepEqual(entries.map((entry) => entry.seq),
      Array.from({ length: packetCount + 1 }, (_, index) => index + 1));
    assert.equal(entries.at(-1).kind, 'result');
    assert.equal(events.filter((event) => eventPayload(event).eventType === 'finish').length, 1);
  });
}

test('trace keeps complete E2 and E4 raw hex', async () => {
  const { events, trace } = createHarness();
  const session = trace.start({ stage: 'sending_credentials' });
  session.recordTx([0xe2, 0x00, 0x04, 0x01, 0x41, 0x01, 0x70]);
  session.recordTx([0xe4, 0x00, 0x04, 0x31, 0x65, 0x36, 0x66]);
  await session.finish({ result: 'success', stage: 'success' });

  const txEntries = allEntries(events).filter((entry) => entry.kind === 'tx');
  assert.deepEqual(txEntries.map((entry) => entry.hex), [
    '[redacted]',
    '[redacted]',
  ]);
  assert.ok(txEntries.every((entry) => !entry.hex.includes('[Filtered]')));
});

test('trace exposes stages and complete packets as directly readable breadcrumbs', async () => {
  const { breadcrumbs, trace } = createHarness();
  const session = trace.start({ stage: 'scanning_ble', productID: 'AC', deviceName: 'AABB' });
  session.recordStage('sending_credentials', '下发网络信息');
  session.recordTx([0xe2, 0x00, 0x04, 0x01, 0x41, 0x01, 0x70]);
  session.recordRx([0xe3, 0x00, 0x01, 0xc8]);
  await session.finish({ result: 'success', stage: 'success', productID: 'AC', deviceName: 'AABB' });

  assert.deepEqual(breadcrumbs.map((breadcrumb) => breadcrumb.category), [
    'llsync.stage',
    'llsync.stage',
    'llsync.tx',
    'llsync.rx',
    'llsync.result',
  ]);
  assert.ok(breadcrumbs.every((breadcrumb) => breadcrumb.message.includes(`trace=${session.traceId}`)));
  assert.match(breadcrumbs[0].message, /#0 \+0ms 阶段 scanning_ble \| 配网会话开始/);
  assert.match(breadcrumbs[1].message, /#1 \+\d+ms 阶段 sending_credentials \| 下发网络信息/);
  assert.match(breadcrumbs[2].message, /#2 \+\d+ms TX E2 7B \| \[redacted\]/);
  assert.match(breadcrumbs[3].message, /#3 \+\d+ms RX E3 4B \| e3 00 01 c8/);
  assert.match(breadcrumbs[4].message, /#4 \+\d+ms 结果 success/);
  assert.equal(breadcrumbs[2].data.traceId, session.traceId);
  assert.equal(breadcrumbs[2].data.hex, '[redacted]');
});

test('trace flushes a chunk when UTF-8 entries reach 32 KiB', async () => {
  const { events, trace } = createHarness();
  const session = trace.start({ stage: 'waiting_device_online' });
  session.recordRx(new Array(12000).fill(0xab));
  await session.finish({ result: 'failed', stage: 'failed', failureCode: 'UNKNOWN' });

  assert.equal(events.filter((event) => eventPayload(event).eventType === 'chunk').length, 1);
});

test('trace emits stable schema, tags and one traceId per session', async () => {
  const { events, trace } = createHarness();
  const first = trace.start({ stage: 'scanning_ble', productID: 'AC' });
  first.recordRx([0xe0]);
  await first.finish({ result: 'success', stage: 'success', deviceName: 'AABB' });
  const second = trace.start({ stage: 'scanning_ble' });
  await second.finish({ result: 'failed', stage: 'failed', failureCode: 'SCAN_TIMEOUT' });

  assert.match(first.traceId, /^llsync-[0-9a-z]+-[0-9a-z]+$/);
  assert.match(second.traceId, /^llsync-[0-9a-z]+-[0-9a-z]+$/);
  assert.notEqual(first.traceId, second.traceId);
  const firstEvents = events.filter((event) => event.context.tags.traceId === first.traceId);
  assert.ok(firstEvents.length >= 2);
  assert.ok(firstEvents.every((event) => eventPayload(event).schemaVersion === 1));
  assert.ok(firstEvents.every((event) => eventPayload(event).traceId === first.traceId));
  assert.ok(firstEvents.every((event) => event.context.tags.feature === 'llsync-provision'));
  assert.equal(firstEvents[0].message, 'LLSync 配网开始');
  assert.equal(firstEvents.at(-1).message, 'LLSync 配网成功');
  const finish = eventPayload(firstEvents.at(-1));
  assert.equal(finish.totalEntries, 2);
  assert.equal(typeof finish.durationMs, 'number');
});

test('trace records E5 diagnostics before result even when diagnostics reject', async () => {
  const { events, trace } = createHarness();
  const session = trace.start({ stage: 'waiting_device_online' });
  await session.finish(
    { result: 'failed', stage: 'failed', failureCode: 'PROVISION_REJECTED' },
    {
      beforeClose: async () => {
        session.recordTx([0xe5]);
        session.recordRx([0xe4, 0xc0, 0x01, 0x0a]);
        throw new Error('diagnostic failed');
      },
    },
  );

  const entries = allEntries(events);
  assert.deepEqual(entries.map((entry) => entry.kind), ['tx', 'rx', 'result']);
  assert.equal(events.filter((event) => eventPayload(event).eventType === 'finish').length, 1);
});

test('trace accepts only the first finish and ignores records after close', async () => {
  const { events, trace } = createHarness();
  const session = trace.start({ stage: 'binding_device' });
  await session.finish({ result: 'success', stage: 'success' });
  await session.finish({ result: 'failed', stage: 'failed', failureCode: 'LATE_FAILURE' });
  session.recordTx([0xe5]);
  session.recordRx([0xe4]);
  session.recordStage('failed', 'late');

  assert.equal(events.filter((event) => eventPayload(event).eventType === 'finish').length, 1);
  assert.deepEqual(allEntries(events).map((entry) => entry.kind), ['result']);
});

test('trace drops failed chunks and keeps chunk indexes moving', async () => {
  const attempts = [];
  const captured = [];
  const { LLSyncProvisionTrace } = loadTraceModule();
  const trace = new LLSyncProvisionTrace((message, context) => {
    const payload = context.extra;
    if (payload.eventType === 'chunk') attempts.push(payload.chunkIndex);
    if (payload.eventType === 'chunk' && payload.chunkIndex === 1) throw new Error('sink down');
    captured.push({ message, context });
  });
  const session = trace.start({ stage: 'waiting_device_online' });
  for (let index = 0; index < 40; index += 1) session.recordRx([0xe0, index]);
  await session.finish({ result: 'failed', stage: 'failed', failureCode: 'UNKNOWN' });

  assert.deepEqual(attempts, [1, 2]);
  assert.equal(captured.filter((event) => eventPayload(event).eventType === 'chunk').length, 1);
  assert.equal(eventPayload(captured.find((event) => eventPayload(event).eventType === 'chunk')).chunkIndex, 2);
});
