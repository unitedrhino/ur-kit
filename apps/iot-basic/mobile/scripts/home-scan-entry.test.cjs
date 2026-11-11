/** 首页扫码直达：使用真实页面 onLoad 逻辑验证只打开一次扫码并保留登录回跳。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
for (const app of ['mobile-uniapp']) {
  test(`${app} 首页扫码直达及登录回跳`, async () => {
    const source = fs.readFileSync(path.join(__dirname, '../../', 'mobile', 'src/packageDevice/pages/bind/index.vue'), 'utf8');
    const match = source.match(/onLoad\(async \(query\?: Record<string, unknown>\) => \{[\s\S]*?\n\}\);/);
    assert.ok(match, '未找到扫码入口页面加载逻辑');
    const js = ts.transpileModule(match[0], {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
    let load, scanned = 0, categories = 0; const guards = [];
    const api = new Function('onLoad','ensurePageReady','refreshProductSelectionCardVisibility','handleQrScan','loadCategoriesAndProducts', `let scanOnEntry = false, scanOnlyEntry = false, pageReady = false, scanStatusTitle = {value:''}, scanStatusDesc = {value:''}; ${js}; return {state:()=>({scanOnEntry,scanOnlyEntry,pageReady})}`)(
      fn => { load = fn }, async (...args) => { guards.push(args); return true }, () => {}, () => { scanned++ }, async () => { categories++ },
    );
    await load({scan:'1'}); assert.equal(scanned,1); assert.equal(categories,1); assert.equal(api.state().scanOnEntry,false); assert.equal(api.state().scanOnlyEntry,true); assert.deepEqual(guards[0],[ '/packageDevice/pages/bind/index', {scan:'1'} ]);
    await load({}); assert.equal(scanned,1); assert.equal(api.state().scanOnlyEntry,false);
    const conditional = source.slice(source.indexOf('// #ifdef H5\nimport QrCamera'), source.indexOf("import { deviceService }"));
    assert.match(conditional, /\/\/ #endif\s*import \{ parseDeviceShareQr \}/, '分享码解析须在微信编译中保留');
  });
}
