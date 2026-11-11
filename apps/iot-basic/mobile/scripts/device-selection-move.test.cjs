/** 多选移动回归：逐台鉴权、确认写入及部分失败。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** 注入设备服务替身，执行真实移动编排代码。 */
function load(service) {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/device-move.service.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('exports','require',js)(exports, key => { if (key === './device.service') return { deviceService: service }; throw Error(key); });
  return exports.moveDevicesToArea;
}
const device = name => ({ productID:'p', deviceName:name, projectID:'project', areaID:'old', isShared:false });

test('逐台回读并报告部分失败，未授权设备不会更新', async () => {
  const current = { a:device('a'),b:device('b'),c:{...device('c'),isShared:true} }, updates=[];
  const move=load({getDetail:async (_p,n)=>({...current[n]}),update:async v=>{updates.push(v.deviceName);if(v.deviceName==='b')throw Error('权限不足');current[v.deviceName].areaID=v.areaID;}});
  const result=await move([device('a'),device('b'),device('c')],'project','new',()=>true);
  assert.deepEqual(result.moved.map(x=>x.deviceName),['a']);
  assert.deepEqual(result.failed.map(x=>x.device.deviceName),['b','c']);
  assert.deepEqual(updates,['a','b']);
});
test('写入成功但响应丢失时以回读结果判定，项目切换后停止写入', async () => {
  let current=device('a');let active=true;const updates=[];
  const move=load({getDetail:async()=>({...current}),update:async v=>{updates.push(v.deviceName);current.areaID=v.areaID;active=false;throw Error('响应丢失');}});
  const first=await move([device('a'),device('b')],'project','new',()=>active);
  assert.deepEqual(updates,['a']);assert.equal(first.failed.length,2);
  active=true;current=device('a');
  const recovered=load({getDetail:async()=>({...current}),update:async v=>{current.areaID=v.areaID;throw Error('响应丢失');}});
  const second=await recovered([device('a')],'project','new',()=>true);
  assert.equal(second.moved.length,1);assert.equal(second.failed.length,0);
});
test('同名不同产品的设备保持独立选择', () => {
  const source=fs.readFileSync(path.join(__dirname, '../src/utils/use-device-selection.ts'),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports={};new Function('exports','require',js)(exports,()=>({ref:value=>({value})}));
  const selection=exports.useDeviceSelection();const a=device('same'), b={...a,productID:'other'};
  selection.begin(a);selection.toggle(b);assert.equal(selection.selected.value.length,2);
  selection.toggle(a);assert.equal(selection.selected.value[0].productID,'other');
});
