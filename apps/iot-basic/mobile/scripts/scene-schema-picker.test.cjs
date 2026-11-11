/** 场景选择器回归：同产品读写切换与跨产品响应乱序不能泄漏旧选项。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
// 执行组件真实 setup，依赖替身仅用于控制模型请求完成顺序。
function setup() {
  const props = vue.reactive({ visible: false, productId: 'a', schemaType: 'property-read' });
  const pending = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/packageScene/components/schema-picker/schema-picker.vue'), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, '');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const run = new Function('ref','computed','watch','defineProps','withDefaults','defineEmits','deviceControlService','uni',code+';return {items,loadSchema};');
  const state = run(vue.ref,vue.computed,()=>{},()=>props,p=>p,()=>()=>{},{getThingModel:()=>new Promise(resolve=>pending.push(resolve))},{showToast:()=>{}});
  return {props,pending,...state};
}
test('触发条件转为同产品执行动作，排除只读属性',async()=>{
  const s=setup();const request=s.loadSchema('a');s.pending.shift()({properties:[{identifier:'temperature',mode:'r'},{identifier:'power',mode:'rw'}]});await request;
  assert.deepEqual(s.items.value.map(x=>x.dataID),['temperature','power']);
  s.props.schemaType='property-write';assert.deepEqual(s.items.value.map(x=>x.dataID),['power']);
  s.props.schemaType='property-read';assert.equal(s.items.value.length,2);
});
test('切换产品后的迟到响应不能覆盖新产品',async()=>{
  const s=setup();const old=s.loadSchema('a');s.props.productId='b';const latest=s.loadSchema('b');
  s.pending[1]({properties:[{identifier:'new',mode:'rw'}]});await latest;
  s.pending[0]({properties:[{identifier:'old',mode:'rw'}]});await old;
  assert.deepEqual(s.items.value.map(x=>x.dataID),['new']);
});
