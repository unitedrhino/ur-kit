// 本文件验证 Node RPC 客户端的合同加载与认证元数据。
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createRpcClient, rpcMetadata } from './rpc.mjs';

test('动态加载 proto 服务并生成认证元数据', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ur-kit-rpc-'));
  try {
    const protoPath = join(directory, 'demo.proto');
    writeFileSync(protoPath, 'syntax = "proto3"; package demo; service Echo { rpc Ping(PingReq) returns (PingResp); } message PingReq { string name = 1; } message PingResp { string name = 1; }');
    const client = createRpcClient({ protoPath, packageName: 'demo', serviceName: 'Echo', address: '127.0.0.1:1' });
    assert.equal(typeof client.Ping, 'function');
    client.close();
    const metadata = rpcMetadata({ token: 'test-token', tenantCode: 'demo', projectId: '9007199254740993' });
    assert.deepEqual(metadata.get('ithings-token'), ['test-token']);
    assert.deepEqual(metadata.get('project-id'), ['9007199254740993']);
    assert.deepEqual(metadata.get('ithings-user'), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
