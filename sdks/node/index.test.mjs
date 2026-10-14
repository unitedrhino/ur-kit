// 本文件验证 Node 客户端保留大整数及身份请求头。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { createClient } from './index.mjs';

test('post 保留原始大整数响应', async () => {
  const fixture = (await readFile(new URL('../conformance/http-response.json', import.meta.url), 'utf8')).trimEnd();
  const client = createClient({
    baseUrl: 'https://example.invalid',
    token: 'test-token',
    fetchImpl: async (url, options) => {
      assert.equal(url.pathname, '/api/v1/system/test/get-one');
      assert.equal(options.headers['ithings-token'], 'test-token');
      assert.equal(options.headers['tenant-code'], 'demo');
      assert.equal(options.headers['app-id'], '7');
      assert.equal(JSON.parse(options.body).id, '9007199254740993');
      return { ok: true, text: async () => fixture };
    },
  });
  const result = await client.post('/api/v1/system/test/get-one', { id: '9007199254740993' }, { tenantCode: 'demo', appId: '7' });
  assert.equal(result, fixture);
  assert.match(result, /"id":9007199254740993/);
  assert.match(result, /"nullable":null/);
  assert.match(result, /"receivedTime":1760000000123/);
});

test('post 保留 BigInt 项目 ID 请求头', async () => {
  const client = createClient({
    baseUrl: 'https://example.invalid', token: 'test-token',
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers['project-id'], '9007199254740993');
      return { ok: true, text: async () => '{}' };
    },
  });
  assert.equal(await client.post('/api/demo', null, { projectId: 9007199254740993n }), '{}');
});

test('post 拒绝空令牌、非根地址及含查询的接口路径', async () => {
  for (const options of [
    { baseUrl: 'https://example.invalid', token: ' ' },
    { baseUrl: 'https://user:pass@example.invalid', token: 'valid' },
    { baseUrl: 'https://example.invalid/root', token: 'valid' },
    { baseUrl: 'https://example.invalid/?key=value', token: 'valid' },
  ]) assert.throws(() => createClient(options));
  const client = createClient({ baseUrl: 'https://example.invalid', token: 'valid', fetchImpl: () => { throw new Error('不应发送请求'); } });
  await assert.rejects(client.post('/api/demo?x=1', {}));
  await assert.rejects(client.post('/api/demo', undefined));
  await assert.rejects(client.post('/api/demo', {}, { projectId: 9007199254740993 }), /安全整数/);
  await assert.rejects(client.post('/api/demo', {}, { appId: 9007199254740993 }), /安全整数/);
});

test('post 保留平台错误状态与响应且不泄露令牌', async () => {
  const client = createClient({ baseUrl: 'https://example.invalid', token: 'secret-token', fetchImpl: async () => ({
    ok: false, status: 403, text: async () => '{"code":403,"msg":"denied"}',
  }) });
  await assert.rejects(client.post('/api/denied', null), (error) => {
    assert.equal(error.status, 403);
    assert.equal(error.body, '{"code":403,"msg":"denied"}');
    assert.doesNotMatch(error.message, /secret-token/);
    return true;
  });
});

test('post 拒绝跨站重定向且不向目标发送令牌', async () => {
  let leaked = false;
  const target = createServer((request, response) => {
    leaked = Boolean(request.headers['ithings-token']);
    response.writeHead(200).end('{}');
  });
  target.listen(0, '127.0.0.1');
  await once(target, 'listening');
  const platform = createServer((_request, response) => {
    response.writeHead(307, { location: `http://127.0.0.1:${target.address().port}/leak` }).end();
  });
  platform.listen(0, '127.0.0.1');
  await once(platform, 'listening');
  try {
    const client = createClient({ baseUrl: `http://127.0.0.1:${platform.address().port}`, token: 'private-token' });
    await assert.rejects(client.post('/api/redirect', null), (error) => error.status === 307);
    assert.equal(leaked, false);
  } finally {
    platform.closeAllConnections();
    target.closeAllConnections();
    await Promise.all([new Promise((resolve) => platform.close(resolve)), new Promise((resolve) => target.close(resolve))]);
  }
});
