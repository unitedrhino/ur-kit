/**
 * 设备控制卡片测试：覆盖物模型到卡片 UI 的本地映射、行为参数记忆和页面接入约定。
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

test('网络管理不出现在普通物模型行为列表，其他行为保持不变', () => {
  const source = read('src/services/device-control.service.ts');
  const ast = ts.createSourceFile('control.ts', source, ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name.text === 'buildActions');
  const code = ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const build = new Function('isSupported', code + ';return buildActions;')(() => true);
  const actions = ['configureNetwork', 'Reboot', 'takePhoto'].map((identifier) => ({ identifier, name: identifier, dir: 'down', input: [] }));
  assert.deepEqual(build({ actions }).map((item) => item.identifier), ['Reboot', 'takePhoto']);
});

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function loadTsModule(relPath, mocks = {}) {
  const filename = path.join(root, relPath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => {
    if (mocks[request]) return mocks[request];
    throw new Error(`Unexpected require from ${relPath}: ${request}`);
  };
  // eslint-disable-next-line no-new-func
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

test('device control card ui maps readable properties, writable controls, and actions in card order', () => {
  const { buildDeviceControlCardUi } = loadTsModule('src/services/device-control-card-ui.service.ts');
  const model = {
    actions: [
      {
        identifier: 'reboot',
        input: [],
        name: '重启',
      },
    ],
    device: { deviceName: 'device-1', productID: 'product-1' },
    pendingCommands: [],
    properties: [
      {
        define: { type: 'int', min: '0', max: '100', step: '5', unit: '%' },
        identifier: 'volume',
        mode: 'rw',
        name: '音量',
        timestamp: 0,
        value: 20,
      },
      {
        define: { type: 'bool' },
        identifier: 'onlineState',
        mode: 'r',
        name: '在线状态',
        timestamp: 0,
        value: '1',
      },
      {
        define: { mapping: { auto: '自动', sleep: '睡眠' }, type: 'enum' },
        identifier: 'mode',
        mode: 'rw',
        name: '模式',
        timestamp: 0,
        value: 'auto',
      },
    ],
    thingModel: { actions: [], events: [], properties: [] },
  };

  const ui = buildDeviceControlCardUi(model);

  assert.deepEqual(
    ui.readonlyCard.items.map((item) => `${item.kind}:${item.identifier}:${item.controlType}`),
    ['property:onlineState:readonly'],
  );
  assert.deepEqual(
    ui.controlCard.items.map((item) => `${item.kind}:${item.identifier}:${item.controlType}`),
    ['property:volume:slider', 'property:mode:enum', 'action:reboot:button'],
  );
});

test('device control card ui moves system properties out of detail cards', () => {
  const { buildDeviceControlCardUi } = loadTsModule('src/services/device-control-card-ui.service.ts');
  const model = {
    actions: [],
    device: { deviceName: 'device-1', productID: 'product-1' },
    pendingCommands: [],
    properties: [
      {
        define: { type: 'int', min: '0', max: '100', step: '5' },
        funcGroup: 0,
        identifier: 'normalWritableZero',
        mode: 'rw',
        name: '普通可写零值',
        timestamp: 0,
        value: 20,
      },
      {
        define: { type: 'bool' },
        identifier: 'normalReadonlyMissing',
        mode: 'r',
        name: '普通只读缺省',
        timestamp: 0,
        value: '1',
      },
      {
        define: { type: 'float', min: '0', max: '100', step: '0.1' },
        funcGroup: 2,
        identifier: 'systemReadonly',
        mode: 'r',
        name: '系统只读',
        timestamp: 0,
        value: 12.3,
      },
      {
        define: { mapping: { off: '关闭', on: '开启' }, type: 'enum' },
        funcGroup: 2,
        identifier: 'systemWritable',
        mode: 'rw',
        name: '系统可写',
        timestamp: 0,
        value: 'off',
      },
    ],
    thingModel: { actions: [], events: [], properties: [] },
  };

  const ui = buildDeviceControlCardUi(model);

  assert.deepEqual(
    ui.readonlyCard.items.map((item) => item.identifier),
    ['normalReadonlyMissing'],
  );
  assert.deepEqual(
    ui.controlCard.items.map((item) => item.identifier),
    ['normalWritableZero'],
  );
  assert.deepEqual(
    ui.systemPropertyCard.items.map((item) => `${item.identifier}:${item.controlType}`),
    ['systemReadonly:readonly', 'systemWritable:enum'],
  );
});

test('action parameter memory is reused only while the action input signature matches', () => {
  const store = new Map();
  const fakeStorage = {
    get(name) {
      return store.get(name) || null;
    },
    remove(name) {
      store.delete(name);
    },
    set(name, value) {
      store.set(name, value);
    },
  };
  const {
    buildActionParamDefaults,
    getActionParamMemory,
    saveActionParamMemory,
  } = loadTsModule('src/services/action-param-memory.service.ts', {
    '../data/datasources/local-storage.datasource': { localStorage: fakeStorage },
  });
  const device = { deviceName: 'device-1', productID: 'product-1' };
  const action = {
    identifier: 'setMode',
    input: [
      {
        define: { mapping: { auto: '自动', sleep: '睡眠' }, type: 'enum' },
        identifier: 'mode',
        name: '模式',
      },
    ],
    name: '设置模式',
  };

  assert.deepEqual(buildActionParamDefaults(action), { mode: 'auto' });
  saveActionParamMemory(device, action, { mode: 'sleep', ignored: 'value' });
  assert.deepEqual(getActionParamMemory(device, action)?.params, { mode: 'sleep' });

  const changedAction = {
    ...action,
    input: [
      ...action.input,
      { define: { type: 'int' }, identifier: 'level', name: '档位' },
    ],
  };
  assert.equal(getActionParamMemory(device, changedAction), null);
});

test('device detail page consumes the local card ui adapter and exposes the planned cards', () => {
  const page = read('src/packageDevice/pages/detail/index.vue');

  assert.match(page, /buildDeviceControlCardUi/);
  assert.match(page, /readonlyCard/);
  assert.match(page, /controlCard/);
  assert.match(page, /isSystemProperty/);
  assert.match(page, /只读属性/);
  assert.match(page, /设备日志/);
  // 日志页已实际接入，卡片必须保留导航，不能回退成建设中占位。
  assert.match(page, /handleNavToDeviceLogs/);
  assert.match(page, /\/packageDevice\/pages\/logs\/index\?productID=/);
  assert.doesNotMatch(page, /设备日志建设中/);
  // 分享已通过专用页面提供，验证真实入口，避免恢复为不存在的旧约定。
  assert.match(page, /@tap="handleShare"/);
  assert.match(page, /\/packageDevice\/pages\/share\/index\?productID=/);
});

test('device detail page renders readonly properties as a nine-cell name value grid', () => {
  const page = read('src/packageDevice/pages/detail/index.vue');

  assert.match(page, /readonlyGridItems/);
  assert.match(page, /detail-readonly-grid/);
  assert.match(page, /detail-readonly-tile--more/);
  assert.match(page, /handleReadonlyMore/);
  assert.doesNotMatch(page, /detail-readonly-row__id/);
  assert.doesNotMatch(page, /readonlyCard\.items\.length}}\s*项/);
});

test('device settings page renders and controls system properties', () => {
  const page = read('src/packageDevice/pages/settings/index.vue');

  assert.match(page, /系统功能/);
  assert.match(page, /systemPropertyItems/);
  assert.match(page, /property-control/);
  assert.match(page, /deviceControlService\.sendProperty/);
  assert.match(page, /notifySystemPropertyCommitResult/);
});

test('property control renders numeric device controls with a native slider', () => {
  const component = read('src/components/property-control/property-control.vue');

  assert.match(component, /<slider/);
  assert.match(component, /handleSliderChange/);
  assert.match(component, /sliderMin/);
  assert.match(component, /sliderMax/);
});

test('action invoke page seeds and saves action parameter memory', () => {
  const page = read('src/packageDevice/pages/action-invoke/index.vue');

  assert.match(page, /getActionParamMemory/);
  assert.match(page, /buildActionParamDefaults/);
  assert.match(page, /saveActionParamMemory/);
});
