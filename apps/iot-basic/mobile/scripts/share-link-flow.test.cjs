/** 链接分享合同：令牌仅在明确接收时授权，且设备身份按字符串传递。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** 将两套应用的服务加载为可注入请求替身的模块。 */
function load(app, calls) {
  const source = fs.readFileSync(path.join(__dirname, '../../', 'mobile', 'src/services/device-share-link.service.ts'), 'utf8').replaceAll('import.meta.env', 'globalThis.__shareTestEnv');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  const request = async options => { calls.push(options); if (options.url.endsWith('/app/core/get-one')) return {wxMiniConfig:{appID:'wx-current'}}; if (options.url.endsWith('/wx-mini/get-url-link')) return {urlLink:'https://wxaurl.cn/example'}; if (options.url.endsWith('batch-create')) return {shareToken:'token-value'}; if (options.url.endsWith('batch-get-list')) return {devices:[{productID:'p',deviceName:'d'}]}; return {}; };
  new Function('exports','require',code)(exports, id => id.endsWith('/request') ? {request} : id.endsWith('/request-context') ? {getRequestContext:()=>({tenantCode:'tenant-A'})} : id.includes('device-interact.repository.impl') ? {DeviceInteractRepositoryImpl: class {}} : (()=>{throw Error(id)})());
  return exports;
}
for (const app of ['mobile-uniapp']) {
 test(`${app} 生成与接收链接保留设备身份并禁止空接收`, async () => {
   const calls=[]; const s=load(app,calls);
   assert.equal(await s.createDeviceShareLink({productID:'p',deviceName:'d'}, {authType:1,groups:[],expDate:'',expTime:'23:59'}),'token-value');
   assert.deepEqual(calls[0].data,{devices:[{productID:'p',deviceName:'d'}],authType:1,schemaPerm:{},accessPerm:{},expTime:0});
   const {devices}=await s.getDeviceShareLink('token-value');
   await assert.rejects(s.acceptDeviceShareLink('token-value',[]));
   assert.equal(calls.length,2);
   await s.acceptDeviceShareLink('token-value',devices);
   assert.deepEqual(calls[2].data,{shareToken:'token-value',devices:[{productID:'p',deviceName:'d'}]});
   assert.equal(calls[2].omitProjectContext,true);
 });
 test(`${app} 自定义权限及截止时间写入分享请求`, async () => {
   const calls=[]; const s=load(app,calls);
   const model={properties:[{identifier:'temperature',mode:'r',funcGroup:1},{identifier:'setting',mode:'rw',funcGroup:2}],actions:[{identifier:'start',dir:'down',funcGroup:1}],events:[]};
   const options={authType:2,groups:['baseControl','deviceSetting','hubLog'],expDate:'2099-12-31',expTime:'23:59'};
   await s.createDeviceShareLink({productID:'p',deviceName:'d'},options,{getThingModel:async()=>model});
   assert.deepEqual(calls[0].data.schemaPerm,{temperature:{perm:3},setting:{perm:2},start:{perm:2}});
   assert.deepEqual(calls[0].data.accessPerm,{deviceSetting:{perm:2},hubLog:{perm:2}});
   assert.equal(calls[0].data.expTime,new Date('2099-12-31T23:59:00').getTime());
   await assert.rejects(s.createDeviceShareLink({productID:'p',deviceName:'d'},{...options,groups:[]}));
   assert.equal(calls.length,1);
 });
 test(`${app} 短时二维码携带分享凭证并拒绝其他二维码`, async () => {
   const calls=[]; const s=load(app,calls);
   await s.createDeviceShareLink({productID:'p',deviceName:'d'}, {authType:1,groups:[],expDate:'',expTime:'23:59'}, undefined, 'live_qr_share_v2');
   assert.equal(calls[0].data.useBy, 'live_qr_share_v2');
   const text = s.encodeDeviceShareQr('token-value');
   assert.deepEqual(s.parseDeviceShareQr(text), {token:'token-value', tenant:'tenant-A'});
   assert.equal(s.parseDeviceShareQr('https://example.com/?token=other'), null);
   await s.revokeDeviceShareToken('token-value');
   assert.equal(calls[1].data.shareToken, 'token-value');
 });
 test(`${app} 小程序分享核对 AppID 并保留运行版本`, async () => {
   const calls=[]; const s=load(app,calls);
   const url = await s.createMiniShareUrl('token-value', {appId:'wx-current', envVersion:'trial'});
   assert.equal(url, 'https://wxaurl.cn/example');
   assert.equal(calls[1].data.envVersion, 'trial');
   assert.match(calls[1].data.query, /deviceShareToken=token-value/);
   await assert.rejects(s.createMiniShareUrl('token-value', {appId:'wx-other', envVersion:'release'}));
   assert.equal(calls.length, 3);
 });
 test(`${app} 分享链接固定到配置的 H5 地址并编码参数`, () => {
   const calls=[]; const s=load(app,calls); globalThis.__shareTestEnv={VITE_SHARE_LANDING_URL:'https://example.test/'};
   try { const url=s.buildDeviceShareUrl('a&b'); assert.match(url,/shareToken=a%26b/); assert.match(url,/shareTenant=tenant-A/); const mini=s.buildDeviceShareUrl('token','https://wxaurl.cn/example',true); assert.match(mini,/fromMini=1/); assert.match(mini,/miniUntil=\d+/); }
   finally { delete globalThis.__shareTestEnv; }
 });
}
