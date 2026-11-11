/** 区域设备查询与默认图片的行为回归。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** 加载 TypeScript 模块并注入网络替身。 */
function load(relative, modules = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, key => {
    if (!(key in modules)) throw Error(`未注入依赖 ${key}`);
    return modules[key];
  });
  return exports;
}

test('区域查询保留字符串 ID 与目标项目上下文，分享标识独立查询', async () => {
  const calls = [];
  const request = async options => {
    calls.push(options);
    if (options.data.withShared === 2) return { list: [{ productID: 'p', deviceName: 'd' }] };
    return { list: [{ productID: 'p', deviceName: 'd' }], total: 1 };
  };
  const { DeviceRepositoryImpl } = load('data/repositories/device.repository.impl.ts', {
    '../../utils/request': { request }, '../mappers/device.mapper': { DeviceMapper: { toEntity: x => x } },
    '../../utils/request-context': { getRequestContext: () => ({ projectID: '' }) },
  });
  const result = await new DeviceRepositoryImpl().getList({ projectID:'922337203685477500',areaID:'922337203685477501',areaIDs:['922337203685477501','922337203685477502'],page:1,size:20 });
  assert.equal(calls[0].data.areaID, '922337203685477501');
  assert.deepEqual(calls[0].data.areaIDs, ['922337203685477501','922337203685477502']);
  assert.equal(calls[0].header['ithings-project-id'], '922337203685477500');
  assert.equal(calls[0].omitProjectContext, true);
  assert.equal(calls[1].omitProjectContext, true);
  assert.equal(result.list[0].isShared, true);
});

test('网关使用提供的图片，水电表有独立默认图，其余设备不猜测', () => {
  const { defaultDeviceImage } = load('utils/device-image.ts');
  assert.match(defaultDeviceImage(2, '任意产品', '网关'), /gateway\.jpg$/);
  assert.match(defaultDeviceImage(1, '智能水表', ''), /water-meter\.jpg$/);
  assert.match(defaultDeviceImage(1, '', '会议室电表'), /electric-meter\.jpg$/);
  assert.equal(defaultDeviceImage(1, '温度传感器', '会议室'), '');
});

test('快速切换区域时旧请求不能覆盖新区域，结果限定当前项目与区域', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/pages/home/index.vue'), 'utf8');
  const code = source.slice(source.indexOf('async function loadAreaDevices('), source.indexOf('/** loadMoreHomeDevices'));
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const selected={value:'a'}, project={value:'p'}, devices={value:[]},loading={value:false},error={value:''},page={value:0},more={value:false}, pending=[];
  const include={value:true}, areas={value:[]}, areaLoading={value:false}, areaError={value:''};
  const run = new Function('selectedAreaID','currentFamilyID','areaDevices','areaDeviceLoading','areaDeviceError','areaDevicePage','areaDeviceHasMore','deviceService','includeSubareas','homeAreas','areaLoading','areaError','getAreaSubtree',`let areaDeviceRevision=0; ${js}; return loadAreaDevices;`)(selected,project,devices,loading,error,page,more,{getList: params=>new Promise(resolve=>pending.push({params,resolve}))},include,areas,areaLoading,areaError,(_,id)=>[{areaID:id},{areaID:id+'-child'}]);
  const old=run(true); selected.value='b'; const latest=run(true);
  pending[1].resolve({list:[{projectID:'p',areaID:'b-child',deviceName:'new'},{projectID:'other',areaID:'b',deviceName:'shared'}],total:2}); await latest;
  pending[0].resolve({list:[{projectID:'p',areaID:'a',deviceName:'old'}],total:1}); await old;
  assert.deepEqual(devices.value.map(x=>x.deviceName),['new']);
  assert.deepEqual(pending[1].params.areaIDs, ['b','b-child']);
  assert.equal(loading.value,false);
});

test('产品自定义图片优先，失效后才显示默认图，再失败回退通用图标', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/device-card/device-card.vue'), 'utf8');
  const code = source.slice(source.indexOf('const imageIndex ='), source.indexOf('/** select/tap'));
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const props = { productImg:'https://example.test/own.png', productName:'智能水表', deviceAlias:'', deviceType:1 };
  const state = new Function('props','ref','computed','watch','deviceImageCandidates',`${js}; return {displayImage,handleImageError};`)(props, value=>({value}), fn=>({get value(){return fn();}}),()=>{},()=>[props.productImg,'/static/device-defaults/water-meter.jpg']);
  assert.equal(state.displayImage.value, props.productImg);
  state.handleImageError();assert.equal(state.displayImage.value, '/static/device-defaults/water-meter.jpg');
  state.handleImageError();assert.equal(state.displayImage.value, '');
});
