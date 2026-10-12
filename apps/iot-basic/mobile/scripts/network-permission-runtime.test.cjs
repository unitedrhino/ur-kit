/** 网络入口权限回归：执行真实仓储，只允许已有查询接口。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

/** harness 注入既有 API 响应，记录调用以验证无签名或绑定副作用。 */
function harness({ owner = 'u1', authType = 3, targetID = 'u1', projectID = 'p1', fail = false } = {}) {
  const calls = [];
  const source = fs.readFileSync(path.resolve(__dirname, '../src/data/repositories/device-network.repository.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const request = async (options) => {
    calls.push(options);
    if (options.url.endsWith('device/info/get-one')) return { productID: '8', deviceName: 'WATCHER', projectID: 'p1' };
    if (options.url.endsWith('self/get-one')) return { userID: 'u1' };
    if (options.url.endsWith('project/info/get-one')) return { projectID: 'p1', adminUserID: owner, status: 1 };
    assert.equal(options.url, '/api/v1/things/data/project/get-list');
    if (fail) throw new Error('permission unavailable');
    return { list: [{ projectID, targetID, authType }] };
  };
  new Function('require', 'exports', js)(() => ({ request }), exports);
  return { repository: new exports.DeviceNetworkRepository(), calls };
}
const target = { productID: '8', deviceName: 'WATCHER' };

test('项目拥有者复用三个只读接口，不调用签名、物模型或绑定接口', async () => {
  const { repository, calls } = harness();
  assert.deepEqual(await repository.authorize(target), { allowed: true });
  assert.equal(calls.length, 3);
});
test('明确项目管理员放行；普通成员、其他用户与其他项目授权拒绝', async () => {
  for (const [options, allowed] of [
    [{ owner: 'other', authType: 1 }, true],
    [{ owner: 'other', authType: 2 }, false],
    [{ owner: 'other', authType: 3 }, false],
    [{ owner: 'other', authType: 1, targetID: 'other' }, false],
    [{ owner: 'other', authType: 1, projectID: 'other' }, false],
  ]) assert.deepEqual(await harness(options).repository.authorize(target), { allowed });
});
test('权限查询失败不放行，设备身份不匹配不继续查询', async () => {
  await assert.rejects(harness({ owner: 'other', fail: true }).repository.authorize(target), /unavailable/);
  const { repository, calls } = harness();
  assert.deepEqual(await repository.authorize({ ...target, deviceName: 'OTHER' }), { allowed: false });
  assert.equal(calls.length, 1);
});
