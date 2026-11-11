/** 执行真实分享服务，验证基础控制按物模型标识授权且失败不创建分享。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
/** load 编译生产模块，仅替换网络仓储与物模型读取边界。 */
function load(file, deps, root = path.resolve(__dirname, '../src')) {
  const source = fs.readFileSync(path.resolve(root, file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)(name => { assert.ok(name in deps, name); return deps[name]; }, exports);
  return exports;
}
/** service 装配真实分享服务并记录最终写入参数。 */
function service(model, fail = false, root = path.resolve(__dirname, '../src')) {
  const writes = [];
  let reads = 0;
  const deps = {
    '../data/repositories/user-device.repository.impl': { UserDeviceRepositoryImpl: class { async shareCreate(data) { writes.push(data); return 'id'; } } },
    '../data/repositories/device-interact.repository.impl': { DeviceInteractRepositoryImpl: class { async getThingModel() { reads++; if (fail) throw new Error('模型读取失败'); return model; } } },
  };
  const helper = path.resolve(root, 'domain/models/device-share-permission.model.ts');
  if (fs.existsSync(helper)) deps['../domain/models/device-share-permission.model'] = load('domain/models/device-share-permission.model.ts', {}, root);
  return { instance: new (load('services/device-share.service.ts', deps, root).DeviceShareService)(), writes, reads: () => reads };
}
/** fixture 是含普通属性、系统属性和上行行为的物模型，验证不多授权限。 */
const fixture = {
  properties: [{ identifier: 'PowerSwitch', mode: 'rw', funcGroup: 1 }, { identifier: 'Temperature', mode: 'r', funcGroup: 1 }, { identifier: 'Maintenance', mode: 'rw', funcGroup: 2 }],
  actions: [{ identifier: 'RefreshStatus', dir: 'down' }, { identifier: 'ReportStatus', dir: 'up' }, { identifier: 'FactoryReset', dir: 'down', funcGroup: 2 }], events: [],
};
/** request 是基础控制分享请求，不包含分组伪标识。 */
const request = { productID: 'p', deviceName: 'd', sharedUserID: '9007199254740993', authType: 2 };

test('基础控制展开为真实功能标识，系统功能和上行行为不被授予', async () => {
  const h = service(fixture);
  await h.instance.create(request);
  assert.deepEqual(h.writes[0].schemaPerm, { PowerSwitch: { perm: 2 }, Temperature: { perm: 3 }, RefreshStatus: { perm: 2 } });
  assert.equal(h.writes[0].sharedUserID, '9007199254740993');
  assert.equal(h.writes[0].schemaPerm.baseControl, undefined);
});

test('无基础功能或物模型读取失败时不创建授权', async () => {
  for (const fail of [false, true]) {
    const h = service({ properties: [], actions: [], events: [] }, fail);
    await assert.rejects(h.instance.create(request));
    assert.equal(h.writes.length, 0);
  }
});

test('全部权限保持原合同，不依赖物模型读取成功', async () => {
  const h = service(null, true);
  await h.instance.create({ ...request, authType: 1 });
  assert.equal(h.reads(), 0);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].schemaPerm, undefined);
});

test('账号分享保留已配置的权限与截止时间', async () => {
  const h = service(null, true);
  const selected = { ...request, schemaPerm: { Maintenance: { perm: 2 } }, accessPerm: { deviceSetting: { perm: 2 }, hubLog: { perm: 2 } }, expTime: '4102444799000' };
  await h.instance.create(selected);
  assert.deepEqual(h.writes[0], selected);
  assert.equal(h.reads(), 0);
});
