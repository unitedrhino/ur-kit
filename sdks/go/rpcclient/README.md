# Go 纯 RPC 客户端

公开生成的消息、客户端与服务接口位于 `sdks/go/pb`，构建和运行均不需要 SaaS 源码或私有仓权限。调用方提供标准 `grpc.ClientConnInterface`；使用 go-zero 时可传入现有连接的 `Conn()`。

```go
connection, err := grpc.NewClient(address,
    grpc.WithTransportCredentials(credentials.NewTLS(tlsConfig)),
    grpc.WithUnaryInterceptor(rpcclient.UnaryClientInterceptor(rpcclient.Context{
        Token: token, TenantCode: tenantCode,
    })))
if err != nil {
    return err
}
defer connection.Close()
client := dm.NewProductManageClient(connection)
response, err := client.ProductInfoGetOne(ctx, &dm.ProductInfoGetOneReq{ProductID: productID})
```

这里的 `dm` 为 `github.com/unitedrhino/ur-kit/sdks/go/pb/things/service/dmsvr/pb/dm`，`rpcclient` 为本包。地址、令牌和 TLS 配置由应用注入。Core 同样使用对应公开 pb 包的 `NewXxxClient`；不要导入 SaaS 的 `service/.../client`，其中可能包含服务端进程内调用适配。

应用调用使用本包的令牌拦截器；已有可信服务间连接继续使用平台自身的服务认证配置与拦截器。不能把内部 root 身份伪造成外部令牌。

执行 `bash scripts/test_external_consumer.sh` 会在仓外真实调用本地 gRPC 服务，并检查所有公开 Go 包和模块依赖。按发布标签验证时加 `--version vX.Y.Z`。`upstream/` 中的原始源码是同步对照资料，由独立嵌套模块隔离，不是可消费包；合同同步脚本读取 SaaS 仅属于维护阶段，SDK 使用者无需执行。
