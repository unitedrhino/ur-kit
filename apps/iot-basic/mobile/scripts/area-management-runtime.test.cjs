/** 区域管理运行测试：搜索分页、父级过滤及只读成员的变更保护。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
/** load 执行真实区域模块，替换网络和服务边界。 */
function load(file, deps) {
 const src=fs.readFileSync(path.resolve(__dirname,'../src',file),'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};new Function('require','exports',js)(name=>{assert.ok(name in deps,name);return deps[name]},exports);return exports;
}
/** repo 使用真实区域仓储及调用方控制的请求结果。 */
function repo(request) {return new (load('data/repositories/area.repository.impl.ts',{'../../utils/request':{request},'../mappers/area.mapper':{AreaMapper:{toEntity:x=>x}}}).AreaRepositoryImpl)()}

test('区域搜索覆盖其他页并在过滤后分页，父级和项目筛选始终保留',async()=>{
 const r=repo(async o=>{assert.equal(o.data.projectID,'p');assert.equal(o.data.parentAreaID,'parent');assert.equal(o.omitProjectContext,true);return o.data.page.page===1?{total:101,list:Array.from({length:100},(_,i)=>({areaName:'区域'+i}))}:{total:101,list:[{areaName:'目标区域'}]}});
 const result=await r.getList({projectID:'p',parentAreaID:'parent',page:1,size:20,areaName:'目标'});
 assert.equal(result.total,1);assert.equal(result.list[0].areaName,'目标区域');
});

test('区域管理资格只认可负责人或本人明确项目管理授权',async()=>{
 for(const authType of [1,2,3]) {
  const r=repo(async o=>o.url.endsWith('info/get-one')?{projectID:'p',adminUserID:'owner'}:{list:[{projectID:'p',targetID:'member',authType}]});
  assert.equal(await r.canManage('p','member'),authType===1);
 }
 const foreign=repo(async o=>o.url.endsWith('info/get-one')?{projectID:'p',adminUserID:'owner'}:{list:[{projectID:'other',targetID:'member',authType:1}]});
 assert.equal(await foreign.canManage('p','member'),false);
});

test('未获得区域管理资格时Provider拒绝创建、更新和删除',async()=>{
 const state=()=>({page:1,size:20,loading:false,hasMore:true,total:0});let writes=0;
 const {areaProvider}=load('providers/area.provider.ts',{'../services/area.service':{areaService:{canManage:async()=>false,getList:async()=>({list:[],total:0}),create:async()=>{writes++},update:async()=>{writes++},delete:async()=>{writes++}}},'../domain/models/page-state.model':{createPageState:state}});
 await areaProvider.initialize('p','reader');
 await assert.rejects(areaProvider.createArea({projectID:'p',areaName:'a'}));
 await assert.rejects(areaProvider.updateArea({areaID:'a',areaName:'b'}));
 await assert.rejects(areaProvider.deleteArea('a'));assert.equal(writes,0);
});

test('图标存入扩展标签，编辑保留原图片、配置及其他标签',async()=>{
 const writes=[];
 const r=repo(async o=>{
  if(o.url.endsWith('get-one'))return {areaImg:'https://example.invalid/old.png',configFile:'https://example.invalid/config',tags:{other:'保留'}};
  writes.push(o);return {areaID:'a'};
 });
 await r.create({projectID:'p',areaName:'区域',areaImg:'tabler:bed'});
 assert.equal(writes[0].data.areaImg,undefined);assert.equal(writes[0].data.tags.clientIcon,'tabler:bed');
 await r.update({areaID:'a',areaName:'区域2',areaImg:'tabler:plant'});
 assert.equal(writes[1].data.areaImg,'https://example.invalid/old.png');
 assert.equal(writes[1].data.configFile,'https://example.invalid/config');
 assert.deepEqual(writes[1].data.tags,{other:'保留',clientIcon:'tabler:plant'});
});

test('区域搜索忽略较慢的旧响应，重试成功后清除错误',async()=>{
 let completeOld; let fail=false;
 const state=()=>({page:1,size:20,loading:false,hasMore:true,total:0});
 const {areaProvider:p}=load('providers/area.provider.ts',{'../services/area.service':{areaService:{getList:async(project,page,size,name)=>{
  if(fail)throw new Error('暂不可用');
  if(name==='旧')return new Promise(resolve=>{completeOld=resolve});
  return {list:[{areaName:'新'}],total:1};
 }}},'../domain/models/page-state.model':{createPageState:state}});
 p.setProjectID('p');p.setFilter('旧');const old=p.loadFirst();
 p.setFilter('新');await p.loadFirst();completeOld({list:[{areaName:'旧'}],total:1});await old;
 assert.equal(p.getState().list[0].areaName,'新');
 fail=true;await p.loadFirst();assert.equal(p.getState().error,'暂不可用');
 fail=false;await p.loadFirst();assert.equal(p.getState().error,'');
});

test('区域管理资格查询失败显示错误且不开放变更',async()=>{
 const {areaProvider:p}=load('providers/area.provider.ts',{'../services/area.service':{areaService:{canManage:async()=>{throw new Error('资格查询失败')},getList:async()=>{throw new Error('不应继续查询')}}},'../domain/models/page-state.model':{createPageState:()=>({loading:false})}});
 await p.initialize('p','user');assert.equal(p.getState().canManage,false);assert.equal(p.getState().error,'资格查询失败');
});
