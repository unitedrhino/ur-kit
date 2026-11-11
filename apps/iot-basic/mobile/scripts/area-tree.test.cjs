/** 区域树按父子关系展示，折叠不遗漏其他分支，异常数据不重复或死循环。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
function load(app) {
  const source = fs.readFileSync(path.join(__dirname, `../../mobile/src/utils/area-tree.ts`), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('exports', 'require', js)(exports, require); return exports;
}
const area = (areaID, parentAreaID) => ({ areaID, parentAreaID, areaName: areaID });
for (const app of ['mobile-uniapp']) {
  test(`${app} 区域树按父子顺序展示并支持折叠`, () => {
    const { flattenAreaTree: flatten } = load(app); const areas = [area('child', 'parent'), area('other', '1'), area('grandchild', 'child'), area('parent', '1'), area('2', '1')];
    assert.deepEqual(flatten(areas).map(x => [x.area.areaID, x.depth, x.hasChildren]), [['other', 0, false], ['parent', 0, true], ['child', 1, true], ['grandchild', 2, false]]);
    assert.deepEqual(flatten(areas, ['parent']).map(x => x.area.areaID), ['other', 'parent']);
  });
  test(`${app} 孤儿及循环区域不重复或死循环`, () => {
    const { flattenAreaTree: flatten } = load(app); const rows = flatten([area('orphan', 'missing'), area('a', 'b'), area('b', 'a'), area('a', 'b')]);
    assert.deepEqual(rows.map(x => x.area.areaID), ['orphan', 'a', 'b']);
  });
}

for (const app of ['mobile-uniapp']) {
  test(`${app} 选中父级显示完整子树，选中子级显示祖先路径`, () => {
    const { getAreaPath, getAreaSubtree } = load(app);
    const areas = [area('building', '1'), area('floor', 'building'), area('room', 'floor'), area('other', '1')];
    assert.deepEqual(getAreaPath(areas, 'room').map(x => x.areaID), ['building', 'floor', 'room']);
    assert.deepEqual(getAreaSubtree(areas, 'building').map(x => x.areaID), ['building', 'floor', 'room']);
    assert.deepEqual(getAreaSubtree(areas, 'floor').map(x => x.areaID), ['floor', 'room']);
    assert.deepEqual(getAreaPath(areas, 'missing'), []);
  });
  test(`${app} 异常环不会使路径和子树陷入循环`, () => {
    const { getAreaPath, getAreaSubtree } = load(app); const areas = [area('a', 'b'), area('b', 'a')];
    assert.equal(getAreaPath(areas, 'a').length, 2); assert.equal(getAreaSubtree(areas, 'a').length, 2);
  });
}
