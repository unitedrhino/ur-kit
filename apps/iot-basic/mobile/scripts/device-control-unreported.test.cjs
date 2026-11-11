/** 真实控制服务不把没有采样时间的物模型默认值当作设备上报。 */
const test=require('node:test');const assert=require('node:assert/strict');const ts=require('typescript');const fs=require('node:fs');const path=require('node:path');
/** service 只替换生产服务的仓储边界，不复制属性合并逻辑。 */
function service(timestamp){
 const src=fs.readFileSync(path.resolve(__dirname,'../src/services/device-control.service.ts'),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};const deps={
  '../data/repositories/device-interact.repository.impl':{DeviceInteractRepositoryImpl:class{async getThingModel(){return {properties:[{identifier:'Temperature',mode:'r',define:{type:'float'}}],actions:[],events:[]}}async getLatestProperties(){return [{dataID:'Temperature',value:0,timestamp}]}}},
  '../data/repositories/device-msg.repository.impl':{DeviceMsgRepositoryImpl:class{}},
  '../domain/models/device-control.model':{SUPPORTED_DEFINE_TYPES:['bool','int','float','string','enum','timestamp']},
 };
 new Function('require','exports',js)(name=>{assert.ok(name in deps,name);return deps[name]},exports);
 return new exports.DeviceControlService();
}
test('未上报的默认0显示为空，真实上报的0被保留',async()=>{
 assert.equal((await service(0).loadControlModel({productID:'p',deviceName:'d'})).properties[0].value,null);
 assert.equal((await service(1000).loadControlModel({productID:'p',deviceName:'d'})).properties[0].value,0);
});
