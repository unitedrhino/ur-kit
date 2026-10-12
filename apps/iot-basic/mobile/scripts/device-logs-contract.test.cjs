/**
 * 设备日志契约测试：锁定 mobile-uniapp 三 tab 设备日志入口、时间范围与归一化行为。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

/**
 * read 读取 mobile-uniapp 内的源码文件。
 * @param {string} relPath 相对 apps/mobile-uniapp 的文件路径。
 * @returns {string} 文件文本内容。
 */
function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

/**
 * loadTsModule 将 TypeScript 文件转译为 CommonJS 后加载。
 * @param {string} relPath 相对 apps/mobile-uniapp 的文件路径。
 * @returns {Record<string, unknown>} 模块导出对象。
 */
function loadTsModule(relPath) {
  const filename = path.join(root, relPath);
  const source = read(relPath);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === './device-log.model') {
      return loadTsModule('src/domain/models/device-log.model.ts');
    }
    throw new Error(`Unexpected require from ${relPath}: ${request}`);
  };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

test('device logs page is registered in packageDevice and detail entry opens it', () => {
  const pages = JSON.parse(read('src/pages.json'));
  const packageDevice = pages.subPackages.find((item) => item.root === 'packageDevice');
  assert.ok(packageDevice, 'packageDevice subpackage should exist');
  assert.ok(
    packageDevice.pages.some((item) => item.path === 'pages/logs/index'),
    'packageDevice should register pages/logs/index',
  );

  const detailPage = read('src/packageDevice/pages/detail/index.vue');
  assert.match(detailPage, /handleNavToDeviceLogs/);
  assert.match(detailPage, /\/packageDevice\/pages\/logs\/index\?productID=/);
  assert.doesNotMatch(detailPage, /设备日志建设中/);
  assert.doesNotMatch(detailPage, /detail-entry-row__badge">\s*建设中\s*</);
});

test('device logs page exposes exactly three tabs: status operation debug', () => {
  const page = read('src/packageDevice/pages/logs/index.vue');

  assert.match(page, /label:\s*'上下线'/);
  assert.match(page, /label:\s*'操作'/);
  assert.match(page, /label:\s*'调试'/);
  assert.doesNotMatch(page, /物模型/);
});

test('device log time ranges avoid iOS-incompatible date string parsing', () => {
  const source = read('src/domain/models/device-log.model.ts');
  const { createDeviceLogTimeRangeFromDates, createDeviceLogTimeRangeFromPreset } = loadTsModule('src/domain/models/device-log.model.ts');

  assert.doesNotMatch(source, /new Date\(`\$\{date\} 00:00:00`\)/);
  assert.doesNotMatch(source, /new Date\(`\$\{date\} 23:59:59`\)/);

  const today = createDeviceLogTimeRangeFromPreset('today', new Date(2026, 5, 5, 12, 30, 0));
  assert.equal(today.timeStart, String(new Date(2026, 5, 5, 0, 0, 0, 0).getTime()));
  assert.equal(today.timeEnd, String(new Date(2026, 5, 5, 12, 30, 0, 0).getTime()));

  const custom = createDeviceLogTimeRangeFromDates('2026-06-01', '2026-06-02');
  assert.equal(custom.timeStart, String(new Date(2026, 5, 1, 0, 0, 0, 0).getTime()));
  assert.equal(custom.timeEnd, String(new Date(2026, 5, 2, 23, 59, 59, 999).getTime()));
});

test('device log normalizers map status operation debug and property records into timeline items', () => {
  const {
    groupDeviceLogTimelineItems,
    mergeAndSortDeviceLogItems,
    normalizeDeviceDebugLog,
    normalizeDeviceEventLog,
    normalizeDeviceOperationLog,
    normalizeDevicePropertyLog,
    normalizeDeviceSdkLog,
    normalizeDeviceStatusLog,
  } = loadTsModule('src/domain/models/device-log.model.ts');

  const status = normalizeDeviceStatusLog({
    deviceName: 'device-1',
    productID: 'product-1',
    status: 2,
    timestamp: '1779940800000',
  });
  assert.equal(status.tab, 'status');
  assert.equal(status.title, '设备离线');
  assert.equal(status.badgeLabel, '离线');
  assert.equal(status.resultTone, 'danger');

  const operation = normalizeDeviceOperationLog(
    {
      action: 'propertyControlSend',
      content: '{"value":1}',
      dataID: 'switch',
      resultCode: 200,
      timestamp: '1779940860000',
      traceID: 'trace-1',
      user: { nickName: '小王' },
    },
    { switch: '总开关' },
  );
  assert.equal(operation.tab, 'operation');
  assert.equal(operation.title, '属性控制：总开关');
  assert.equal(operation.actor, '小王');
  assert.equal(operation.badgeLabel, '成功');

  const debug = normalizeDeviceDebugLog({
    action: 'property',
    content: '{"switch":1}',
    requestID: 'req-1',
    respPayload: '{}',
    resultCode: '200',
    timestamp: '1779940920000',
    topic: '/sys/product-1/device-1/thing/event/property/post',
    traceID: 'trace-2',
  });
  const event = normalizeDeviceEventLog(
    { dataID: 'fault', params: '{"code":1}', timestamp: '1779940980000', type: 'alert' },
    { fault: '故障事件' },
  );
  const property = normalizeDevicePropertyLog(
    { dataID: 'temperature', dataName: '温度', timestamp: '1779941040000', value: '26.5' },
    { temperature: '温度' },
  );
  const sdk = normalizeDeviceSdkLog({ content: 'sdk warn', loglevel: 3, timestamp: '1779941100000' });

  assert.equal(debug.tab, 'debug');
  assert.equal(event.title, '事件上报：故障事件');
  assert.equal(property.title, '属性上报：温度');
  assert.equal(sdk.title, 'SDK日志：告警');

  const sorted = mergeAndSortDeviceLogItems([status, operation, debug, event, property, sdk]);
  assert.deepEqual(sorted.map((item) => item.id), [sdk.id, property.id, event.id, debug.id, operation.id, status.id]);

  const groups = groupDeviceLogTimelineItems(sorted, {});
  assert.equal(groups.length, 1);
  assert.equal(groups[0].visibleItems.length, 6);
  assert.equal(groups[0].hiddenCount, 0);

  const collapsedGroups = groupDeviceLogTimelineItems(sorted, { [groups[0].dateLabel]: false });
  assert.equal(collapsedGroups[0].visibleItems.length, 1);
  assert.equal(collapsedGroups[0].hiddenCount, 5);
});
