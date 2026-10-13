// 本文件用本机模拟平台验证 Node 认证器的企业、项目和重定向边界。
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createPlatformAuthenticator } from './index.mjs';

// startServer 启动仅服务本测试的本机 HTTP 平台并返回关闭函数。
async function startServer(handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

test('平台认证器核对企业成员与项目权限且拒绝重定向', async (t) => {
  let forwarded = false;
  const foreign = await startServer((_request, response) => { forwarded = true; response.end('unexpected'); });
  t.after(foreign.close);
  let mode = 'normal';
  const platform = await startServer((request, response) => {
    assert.equal(request.headers['ithings-token'], 'valid');
    assert.equal(request.headers['tenant-code'], 'demo');
    if (mode === 'redirect') { response.writeHead(302, { location: foreign.url }); response.end(); return; }
    response.setHeader('content-type', 'application/json');
    if (request.url === '/api/v1/system/user/self/get-one') {
      response.end(JSON.stringify({ code: 200, data: { userID: '9007199254740993', tenants: [{ tenantCode: 'demo', status: 1 }] } }));
      return;
    }
    assert.equal(request.url, '/api/v1/things/project/info/get-list');
    assert.equal(request.headers['project-id'], '101');
    response.end(JSON.stringify({ code: 200, data: { list: [{ projectID: '101', tenantCode: 'demo', myAuthType: mode === 'forbidden' ? 0 : 2 }] } }));
  });
  t.after(platform.close);
  const authenticate = createPlatformAuthenticator({ baseUrl: platform.url });
  const request = { headers: { 'tenant-code': 'demo' } };
  assert.deepEqual(await authenticate(request, 'valid'), { userId: '9007199254740993', tenantCode: 'demo' });
  request.headers['project-id'] = '101';
  assert.deepEqual(await authenticate(request, 'valid'), { userId: '9007199254740993', tenantCode: 'demo', projectId: '101' });
  const rpcCall = { metadata: { get: (name) => ({ 'tenant-code': ['demo'], 'project-id': ['101'] })[name] ?? [] } };
  assert.deepEqual(await authenticate(rpcCall, 'valid'), { userId: '9007199254740993', tenantCode: 'demo', projectId: '101' });
  mode = 'forbidden';
  await assert.rejects(authenticate(request, 'valid'), /project permission/);
  request.headers['project-id'] = '9223372036854775808';
  await assert.rejects(authenticate(request, 'valid'), /invalid project selection/);
  request.headers['project-id'] = '101';
  mode = 'redirect';
  await assert.rejects(authenticate(request, 'valid'));
  assert.equal(forwarded, false);
});
