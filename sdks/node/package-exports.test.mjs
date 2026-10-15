// 本文件验证打包消费者能通过公开子路径导入 HTTP 与 RPC SDK。
import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient, signOpenToken } from '@unitedrhino/ur-kit-node';
import { createRpcClient, rpcMetadata } from '@unitedrhino/ur-kit-node/rpc';

// package exports 保证外部后端不需要依赖仓库内的相对文件路径。
test('公开包导出 HTTP、令牌与 RPC 入口', () => {
  assert.equal(typeof createClient, 'function');
  assert.equal(typeof signOpenToken, 'function');
  assert.equal(typeof createRpcClient, 'function');
  assert.equal(typeof rpcMetadata, 'function');
});
