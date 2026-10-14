// 本文件验证 Node RPC 客户端的合同加载与认证元数据。
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { createRpcClient, rpcMetadata } from './rpc.mjs';

test('动态加载 proto 服务并生成认证元数据', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ur-kit-rpc-'));
  try {
    const protoPath = join(directory, 'demo.proto');
    writeFileSync(protoPath, 'syntax = "proto3"; package demo; service Echo { rpc Ping(PingReq) returns (PingResp); } message PingReq { string name = 1; } message PingResp { string name = 1; }');
    const client = createRpcClient({ protoPath, packageName: 'demo', serviceName: 'Echo', address: '127.0.0.1:1' });
    assert.equal(typeof client.Ping, 'function');
    client.close();
    const metadata = rpcMetadata({ token: 'test-token', tenantCode: 'demo', projectId: '9007199254740993', appId: '7' });
    assert.deepEqual(metadata.get('ithings-token'), ['test-token']);
    assert.deepEqual(metadata.get('project-id'), ['9007199254740993']);
    assert.deepEqual(metadata.get('app-id'), ['7']);
    assert.deepEqual(metadata.get('ithings-user'), []);
    assert.deepEqual(rpcMetadata({ token: 'test-token', projectId: 9007199254740993n }).get('project-id'), ['9007199254740993']);
    assert.throws(() => rpcMetadata({ token: 'test-token', projectId: 9007199254740993 }), /安全整数/);
    assert.throws(() => rpcMetadata({ token: 'test-token', appId: 9007199254740993 }), /安全整数/);
    assert.throws(() => rpcMetadata({ token: '  ' }), /token/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('固定 protocolSync 合同完成真实 gRPC 往返并保留大整数项目编号', async () => {
  const protoPath = fileURLToPath(new URL('../../contracts/source/backend/things/share/rpcs/protocolSync/proto/protocolSync.proto', import.meta.url));
  const definition = protoLoader.loadSync(protoPath, { longs: String, enums: String, defaults: false, oneofs: true });
  const Service = grpc.loadPackageDefinition(definition).protocolSync.protocolSync;
  const server = new grpc.Server();
  server.addService(Service.service, {
    SyncDevice(call, callback) {
      assert.deepEqual(call.metadata.get('ithings-token'), ['test-token']);
      assert.deepEqual(call.metadata.get('project-id'), ['9007199254740993']);
      assert.deepEqual(call.metadata.get('ithings-user'), []);
      assert.equal(call.request.productID, 'product-demo');
      callback(null, { deviceNames: ['sensor-1'] });
    },
  });
  const port = await new Promise((resolve, reject) => server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (error, boundPort) => error ? reject(error) : resolve(boundPort)));
  const client = createRpcClient({ protoPath, packageName: 'protocolSync', serviceName: 'protocolSync', address: `127.0.0.1:${port}` });
  try {
    const response = await new Promise((resolve, reject) => client.SyncDevice(
      { productID: 'product-demo' },
      rpcMetadata({ token: 'test-token', projectId: '9007199254740993' }),
      (error, value) => error ? reject(error) : resolve(value),
    ));
    assert.deepEqual(response.deviceNames, ['sensor-1']);
  } finally {
    client.close();
    await new Promise((resolve) => server.tryShutdown(resolve));
  }
});
