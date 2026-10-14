# Node 平台客户端

`createClient` 发送平台 JSON HTTP 请求并返回原始响应文本，供调用方无损解析 64 位 ID。`createRpcClient` 从本仓锁定的 proto 合同创建 gRPC 客户端；`rpcMetadata` 附加平台令牌和企业、项目选择上下文。空令牌在发送前拒绝；大整数项目和应用 ID 传十进制字符串或 `BigInt`。

非交互服务账号使用 `signOpenToken({ tenantCode, accessKey, accessSecret, expiresAt: new Date(Date.now() + 300_000) })` 生成短期 JWT，再用 `createClient({ baseUrl, bearerToken: jwt })` 调用平台。不要在仓库中保存 AccessSecret；请求时不能同时填写 `token` 和 `bearerToken`。

以下示例调用本仓 `protocolSync` 合同。连接远程 RPC 时须显式提供 TLS 凭据；本机地址可省略。

```js
import { createRpcClient, rpcMetadata } from './rpc.mjs';

const client = createRpcClient({
  protoPath: '<ur-kit>/contracts/source/backend/things/share/rpcs/protocolSync/proto/protocolSync.proto',
  packageName: 'protocolSync',
  serviceName: 'protocolSync',
  address: '127.0.0.1:<local-port>',
});
const metadata = rpcMetadata({ token: '<platform-token>', projectId: '9007199254740993' });
try {
  const response = await new Promise((resolve, reject) => client.SyncDevice(
    { productID: '<product-id>' }, metadata,
    (error, value) => error ? reject(error) : resolve(value),
  ));
  console.log(response.deviceNames);
} finally {
  client.close();
}
```

运行 `node --test` 会启动本机 gRPC 服务，以固定的 `protocolSync.proto` 验证请求、响应、令牌和完整项目编号；同时运行 HTTP 合同用例，不需要连接平台环境。
