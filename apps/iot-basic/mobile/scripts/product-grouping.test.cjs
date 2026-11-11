/** 验证产品分类只展示有产品的项目，分页读取不会遗漏后续产品。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(app) {
  const source = fs.readFileSync(path.join(__dirname, `../../mobile/src/packageDevice/pages/bind/product-grouping.ts`), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('exports', 'require', js)(exports, require); return exports;
}
for (const app of ['mobile-uniapp']) {
  test(`${app} 隐藏空分类并保留未知分类产品`, () => {
    const { buildCategoryTabs, buildProductSections, OTHER_CATEGORY_KEY } = load(app);
    const categories = [{ id: 'a', name: '甲' }, { id: 'b', name: '乙' }, { id: 'c', name: '丙' }];
    const products = [{ categoryID: 'c' }, { categoryID: 'a' }, { categoryID: 'unknown' }];
    const tabs = buildCategoryTabs(categories, products);
    assert.deepEqual(tabs.map(x => x.key), ['a', 'c', OTHER_CATEGORY_KEY]);
    assert.deepEqual(buildProductSections(products, tabs, OTHER_CATEGORY_KEY)[0].products, [products[2]]);
    assert.deepEqual(buildCategoryTabs(categories, []), []);
    assert.deepEqual(buildCategoryTabs(categories, [products[0]]).map(x => x.key), ['c']);
  });
  test(`${app} 分页获取后续产品并拒绝不完整结果`, async () => {
    const { loadAllPages } = load(app);
    const items = Array.from({ length: 101 }, (_, i) => i);
    assert.deepEqual(await loadAllPages(async (page, size) => ({ list: items.slice((page - 1) * size, page * size), total: items.length })), items);
    await assert.rejects(loadAllPages(async page => ({ list: page === 1 ? [1] : [], total: 2 })), /加载不完整/);
  });
}
