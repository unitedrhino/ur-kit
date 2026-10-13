// 本文件按固定 proto 合同动态创建 Node gRPC 客户端。
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// createRpcClient 从指定 proto 文件加载服务；非本机地址必须显式传入 TLS 凭据。
export function createRpcClient({ protoPath, packageName, serviceName, address, credentials }) {
  const definition = protoLoader.loadSync(protoPath, { longs: String, enums: String, defaults: false, oneofs: true });
  let namespace = grpc.loadPackageDefinition(definition);
  for (const segment of packageName.split('.')) namespace = namespace?.[segment];
  const Service = namespace?.[serviceName];
  if (typeof Service !== 'function') throw new Error('RPC service missing from proto contract');
  if (!credentials && !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(address)) {
    throw new Error('TLS credentials required for remote RPC');
  }
  return new Service(address, credentials ?? grpc.credentials.createInsecure());
}

// rpcMetadata 创建认证元数据；不发送可伪造的内部身份对象。
export function rpcMetadata({ token, tenantCode, projectId, appId }) {
  const metadata = new grpc.Metadata();
  if (token) metadata.set('ithings-token', token);
  if (tenantCode) metadata.set('tenant-code', tenantCode);
  if (projectId != null) metadata.set('project-id', String(projectId));
  if (appId != null) metadata.set('app-id', String(appId));
  return metadata;
}
