// 本文件验证 Node gRPC 中间件对令牌和身份元数据的处理。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import grpc from '@grpc/grpc-js';
import { protectUnaryRPC } from './rpc.mjs';

test('RPC 一元方法只接受验证后的身份', async () => {
  const handler = protectUnaryRPC((call, callback) => {
    assert.equal(call.identity.userId, '42');
    assert.deepEqual(call.metadata.get('ithings-user'), []);
    for (const name of ['ithings-user-role', 'ithings-tenant-code', 'ithings-project-id', 'ithings-meta', 'ithings-set-token']) {
      assert.deepEqual(call.metadata.get(name), []);
    }
    callback(null, { ok: true });
  }, { authenticate: async (_call, token) => token === 'good' ? { userId: '42', tenantCode: 'demo' } : null });
  const metadata = new grpc.Metadata();
  metadata.set('ithings-token', 'good');
  metadata.set('ithings-user', 'forged');
  for (const name of ['ithings-user-role', 'ithings-tenant-code', 'ithings-project-id', 'ithings-meta', 'ithings-set-token']) metadata.set(name, 'forged');
  await new Promise((resolve, reject) => handler({ metadata }, (error, response) => error ? reject(error) : (assert.deepEqual(response, { ok: true }), resolve())));
  const webMetadata = new grpc.Metadata();
  webMetadata.set('token', 'good');
  await new Promise((resolve, reject) => handler({ metadata: webMetadata }, (error, response) => error ? reject(error) : (assert.deepEqual(response, { ok: true }), resolve())));
});

test('非字符串 RPC Authorization 返回未认证错误', async () => {
  const handler = protectUnaryRPC(() => { throw new Error('不应进入业务处理器'); }, {
    authenticate: async () => { throw new Error('不应调用认证器'); },
  });
  const metadata = {
    get(name) { return name === 'authorization' ? [Buffer.from('Bearer good')] : []; },
    remove() {},
  };
  await new Promise((resolve, reject) => handler({ metadata }, (error) => {
    if (error?.code === grpc.status.UNAUTHENTICATED) resolve();
    else reject(error ?? new Error('缺少未认证错误'));
  }));
});
