/** 项目选择按账号和企业隔离，退出后保留历史供再次登录恢复。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('各账号项目历史独立且退出后可恢复', () => {
  const storage = {};
  const uni = { getStorageSync: key => storage[key], setStorageSync: (key, value) => { storage[key] = value; } };
  const source = fs.readFileSync(path.join(__dirname, '../src/providers/current-family.provider.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'require', 'uni', js)(exports, () => ({ setRequestProjectContext() {} }), uni);
  const p = exports.currentFamilyProvider;
  p.setUser('alice'); p.setCurrentTenant('org'); p.switchFamily('p1', '办公');
  p.clear(''); p.setUser(''); p.setUser('bob'); p.setCurrentTenant('org');
  assert.equal(p.getState().projectID, '');
  p.switchFamily('p2', '居家'); p.clear(''); p.setUser('');
  p.setUser('alice'); p.setCurrentTenant('org');
  assert.equal(p.getState().projectID, 'p1');
  p.setUser('bob');
  assert.equal(p.getState().projectID, 'p2');
});
