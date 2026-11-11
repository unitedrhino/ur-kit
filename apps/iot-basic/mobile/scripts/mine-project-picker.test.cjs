/** 项目选择器按页加载，组织切换后的旧结果不可展示。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function makePicker(app, service, tenant) {
  const file = path.join(__dirname, `../../mobile/src/pages/mine/index.vue`);
  const source = fs.readFileSync(file, 'utf8');
  const section = source.slice(source.indexOf('async function handleSwitchFamily()'), source.indexOf('/** 同名项目'));
  const code = ts.transpileModule(section, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const choices = { value: [] }, visible = { value: false }, messages = [];
  const uni = { showLoading() {}, hideLoading() {}, showToast(item) { messages.push(item.title); }, navigateTo() {} };
  const run = new Function('loggedIn','tenantProvider','projectService','projectChoices','projectPickerVisible','uni','TERM', `let projectPickerRevision=0; ${code}; return handleSwitchFamily;`)(
    { value: true }, { getState: () => ({ current: { code: tenant.code } }) }, service, choices, visible, uni, { project: '项目' });
  return { run, choices, visible, messages };
}
for (const app of ['mobile-uniapp']) {
  test(`${app} 完整加载多页项目并保持大整数 ID`, async () => {
    const items = Array.from({ length: 101 }, (_, i) => ({ projectID: `92233720368547${String(i).padStart(4, '0')}` }));
    const picker = makePicker(app, { getList: async (page, size) => ({ list: items.slice((page - 1) * size, page * size), total: items.length }) }, { code: 'a' });
    await picker.run(); assert.deepEqual(picker.choices.value, items); assert.equal(picker.visible.value, true);
  });
  test(`${app} 组织切换时放弃旧项目列表`, async () => {
    const tenant = { code: 'a' }; let resolve;
    const picker = makePicker(app, { getList: () => new Promise(r => { resolve = r; }) }, tenant);
    const running = picker.run(); tenant.code = 'b'; resolve({ list: [{ projectID: '1' }], total: 1 }); await running;
    assert.equal(picker.visible.value, false); assert.deepEqual(picker.choices.value, []);
  });
  test(`${app} 分页不完整时明确提示`, async () => {
    const picker = makePicker(app, { getList: async page => ({ list: page === 1 ? [{ projectID: '1' }] : [], total: 2 }) }, { code: 'a' });
    await picker.run(); assert.equal(picker.visible.value, false); assert.match(picker.messages[0], /未完整加载/);
  });
}

/** 使用隔离的存储与接口替身，核对两组织切换时项目上下文不会串用。 */
for (const app of ['mobile-uniapp']) {
  test(`${app} 多组织切换恢复各自项目上下文（模拟数据）`, async () => {
    const storage = {};
    const uni = { getStorageSync: key => storage[key], setStorageSync: (key, value) => { storage[key] = value; }, removeStorageSync: key => { delete storage[key]; } };
    let requestTenant = '', requestProject = '';
    const context = { setRequestTenantCode: code => { requestTenant = code; }, setRequestProjectContext: (code, id) => { requestProject = `${code}:${id}`; } };
    function load(relative, deps) {
      const source = fs.readFileSync(path.join(__dirname, `../../mobile/src/${relative}`), 'utf8');
      const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const exports = {}; new Function('exports', 'require', 'uni', js)(exports, key => { if (!(key in deps)) throw Error(key); return deps[key]; }, uni); return exports;
    }
    const family = load('providers/current-family.provider.ts', { '../utils/request-context': context }).currentFamilyProvider;
    family.setUser('test-user');
    const list = [{ code: 'a', name: '组织 A' }, { code: 'b', name: '组织 B' }];
    const tenants = load('providers/tenant.provider.ts', { '../services/tenant.service': { tenantService: { getMyTenants: async () => list } }, './current-family.provider': { currentFamilyProvider: family }, '../utils/request-context': context }).tenantProvider;
    await tenants.loadTenants();
    assert.equal(tenants.switchTenant('a'), true); family.switchFamily('pa', '项目 A');
    assert.equal(tenants.switchTenant('b'), true); assert.equal(family.getState().projectID, ''); family.switchFamily('pb', '项目 B');
    assert.equal(tenants.switchTenant('a'), true); assert.equal(family.getState().projectID, 'pa');
    assert.equal(requestTenant, 'a'); assert.equal(requestProject, 'a:pa');
    assert.equal(tenants.switchTenant('missing'), false); assert.equal(requestTenant, 'a');
  });
}
