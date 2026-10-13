// 本文件验证 Node 中间件拒绝伪造身份并执行权限检查。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { protectHTTP } from './index.mjs';

test('令牌和权限验证后才进入处理器', async () => {
  const makeResponse = () => ({ statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } });
  let called = false;
  const handler = protectHTTP((request, response) => {
    called = true;
    assert.equal(request.identity.userId, '42');
    assert.equal(request.headers['ithings-user'], undefined);
    for (const name of ['ithings-user-role', 'ithings-tenant-code', 'ithings-project-id', 'ithings-meta', 'ithings-set-token']) {
      assert.equal(request.headers[name], undefined);
    }
    response.end('ok');
  }, {
    authenticate: async (_request, token) => token === 'good' ? { userId: '42', tenantCode: 'demo' } : null,
    authorize: async () => true,
    resource: 'demo', action: 'view',
  });
  const bad = makeResponse();
  await handler({ method: 'POST', url: '/demo', headers: { 'ithings-token': 'bad', 'ithings-user': 'forged' } }, bad);
  assert.equal(bad.statusCode, 401);
  assert.equal(called, false);
  const good = makeResponse();
  await handler({ method: 'POST', url: '/demo', headers: { 'ithings-token': 'good', 'ithings-user': 'forged', 'ithings-user-role': 'admin', 'ithings-tenant-code': 'other', 'ithings-project-id': '999', 'ithings-meta': 'forged', 'ithings-set-token': 'forged' } }, good);
  assert.equal(good.body, 'ok');
  assert.equal(good.headers['X-Content-Type-Options'], 'nosniff');
  const webHeader = makeResponse();
  await handler({ method: 'POST', url: '/demo', headers: { token: 'good', 'ithings-user': 'forged' } }, webHeader);
  assert.equal(webHeader.body, 'ok');
});
