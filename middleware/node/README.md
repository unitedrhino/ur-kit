# Node 平台中间件

`@unitedrhino/ur-kit-middleware-node` 提供 `protectHTTP`、`protectUnaryRPC` 和可注入的平台身份认证器 `createPlatformAuthenticator`。平台认证器使用同版本 `@unitedrhino/ur-kit-node` HTTP 客户端；两包必须一起安装。中间件只验证身份范围，具体资源和动作权限由接入服务传入 `authorize` 回调。

首批按公开 Git 标签获取源码，在该标签的仓库根目录分别打包：

```sh
mkdir -p .temp/node-packages
npm pack ./sdks/node --pack-destination .temp/node-packages
npm pack ./middleware/node --pack-destination .temp/node-packages
```

在独立 Node 项目中安装两个生成的 tarball，然后按包名导入：

```js
import {
  createPlatformAuthenticator,
  protectHTTP,
  protectUnaryRPC,
} from '@unitedrhino/ur-kit-middleware-node';
import { protectUnaryRPC as rpcMiddleware } from '@unitedrhino/ur-kit-middleware-node/rpc';
```

`createPlatformAuthenticator({ baseUrl })` 返回可传给 HTTP/RPC 中间件的 `authenticate` 回调。`baseUrl` 是平台 HTTP(S) 根地址，由运行时配置；调用方负责设置 `resource`、`action` 和 `authorize`。`protectHTTP` 接收 Node HTTP 处理器，`protectUnaryRPC` 接收 gRPC 一元处理器。服务端先剥除外部自报的内部身份头，再核对令牌、企业与可选项目；错误回复不包含令牌或内部异常。

源码检出验证：在 `middleware/node` 目录运行 `pnpm install --ignore-workspace --frozen-lockfile` 和 `node --test`。发布前仍需用两个 tarball 在独立项目按包名导入并执行本机 HTTP/RPC 示例，避免仓内相对路径掩盖打包缺口。
