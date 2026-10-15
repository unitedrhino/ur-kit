// 本文件验证中间件包名与 RPC 子路径向仓外消费者公开完整入口。
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlatformAuthenticator, protectHTTP, protectUnaryRPC } from '@unitedrhino/ur-kit-middleware-node';
import { protectUnaryRPC as rpcSubpath } from '@unitedrhino/ur-kit-middleware-node/rpc';

// 包导出测试确保 HTTP、平台认证与 RPC 均可按发布包名加载。
test('中间件包导出 HTTP、平台认证与 RPC 入口', () => {
  assert.equal(typeof createPlatformAuthenticator, 'function');
  assert.equal(typeof protectHTTP, 'function');
  assert.equal(protectUnaryRPC, rpcSubpath);
});
