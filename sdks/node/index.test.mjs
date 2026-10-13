// 本文件验证 Node 客户端保留大整数及身份请求头。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from './index.mjs';

test('post 保留原始大整数响应', async () => {
  const client = createClient({
    baseUrl: 'https://example.invalid',
    token: 'test-token',
    fetchImpl: async (url, options) => {
      assert.equal(url.pathname, '/api/v1/system/test/get-one');
      assert.equal(options.headers['ithings-token'], 'test-token');
      assert.equal(options.headers['tenant-code'], 'demo');
      assert.equal(options.headers['app-id'], '7');
      return { ok: true, text: async () => '{"id":9007199254740993,"value":null}' };
    },
  });
  const result = await client.post('/api/v1/system/test/get-one', {}, { tenantCode: 'demo', appId: '7' });
  assert.equal(result, '{"id":9007199254740993,"value":null}');
});
