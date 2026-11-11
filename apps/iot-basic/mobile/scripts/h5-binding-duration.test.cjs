/** 持续状态表单的行为回归。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** 从实际页面提取函数并注入依赖，以验证异步结果和副作用。 */
function loadFunction(file, start, end, names, values, platform = 'h5') {
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  const raw = source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
  const code = platform === 'h5' ? raw.replace(/\/\/ #ifndef H5[\s\S]*?\/\/ #endif/g, '') : raw.replace(/\/\/ #ifdef H5[\s\S]*?\/\/ #endif/g, '');
  assert.ok(code.includes(start), '目标函数必须存在');
  const compiled = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return new Function(...names, `${compiled}; return ${start.match(/function (\w+)/)[1]};`)(...values);
}

test('持续状态缺少比较值不能提交，填写零值也有效', () => {
  const draft={value:{type:'device',device:{productID:'p',deviceName:'d',dataID:'x',values:[]}}}, added=[], messages=[];
  const run=loadFunction('packageScene/pages/create/index.vue','function commitDraftTrigger()', 'function commitDraftAction()',
    ['pendingTriggerValue','draftTriggerValue','preventInvalidProperty','draftTrigger','viewMode','firstValue','editingTriggerIndex','sceneEditProvider','returnToMain','clone','uni'],
    [undefined,{get value(){return String(draft.value.device.values[0] ?? '')},set value(v){draft.value.device.values=[v]}},()=>false,draft,{value:'duration'},v=>String(v?.[0] ?? ''),{value:-1},{addTrigger:x=>added.push(x)},()=>{},x=>JSON.parse(JSON.stringify(x)),{showToast:x=>messages.push(x.title)}]);
  run();assert.equal(added.length,0);assert.equal(messages.at(-1),'请输入持续状态的比较值');
  draft.value.device.values=['0'];run();assert.deepEqual(added[0].device.values,['0']);
});

/** 扫码绑定使用正式绑定接口，不自动解绑；成功刷新设备列表。 */
test('扫码无效不绑定，成功后刷新，绑定失败不解绑', async () => {
  for (const failure of [false, true]) {
    const visible = { value: true }, busy = { value: false }, calls = [], messages = [];
    const run = loadFunction('packageDevice/pages/bind/index.vue', 'async function handleQrResult(raw: string)', '/** handleQrScan',
      ['qrVisible','qrBinding','parseDeviceQr','deviceService','deviceListProvider','uni'],
      [visible,busy,raw=>raw==='valid'?{productID:'p',deviceName:'d'}:null,
        {bind:async (...args)=>{calls.push(args);if(failure)throw new Error('绑定失败');}},
        {loadFirst:async()=>calls.push('refresh')}, {showToast:x=>messages.push(x.title),showLoading:()=>{},hideLoading:()=>{}}]);
    await run('invalid'); assert.deepEqual(calls, []); assert.equal(messages.at(-1), '二维码格式不正确');
    await run('valid'); assert.deepEqual(calls, failure ? [['p','d']] : [['p','d'],'refresh']);
    assert.equal(messages.at(-1), failure ? '绑定失败' : '绑定成功'); assert.equal(busy.value, false);
  }
});

/** 原生扫码继续使用已有绑定等级处理，避免移动入口时改变既有业务。 */
test('原生扫码保留绑定等级规则', async () => {
  const calls = [];
  const run = loadFunction('packageDevice/pages/bind/index.vue', 'async function handleQrResult(raw: string)', '/** handleQrScan',
    ['qrVisible','qrBinding','parseDeviceQr','deviceService','deviceListProvider','uni'],
    [{value:true},{value:false},()=>({productID:'p',deviceName:'d'}),
      {bindWithLevelHandling:async (...args)=>calls.push(args)}, {loadFirst:async()=>calls.push('refresh')},
      {showToast:()=>{},showLoading:()=>{},hideLoading:()=>{}}], 'native');
  await run('valid'); assert.deepEqual(calls, [['p','d'],'refresh']);
});
