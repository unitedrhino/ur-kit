# 服务中间件

Go、Node 和 Java 的 HTTP/RPC 中间件读取平台 `ithings-token` 或 `token`；需要兼容通用客户端时，也接受 `Authorization: Bearer <令牌>`。优先级依次为 `ithings-token`、`token`、Bearer。身份和权限必须由调用方提供的平台认证器、授权器验证；外部自报的 `ithings-user`、`ithings-user-role`、`ithings-tenant-code`、`ithings-project-id`、`ithings-meta`、`ithings-set-token` 会从业务可见请求中移除，保留令牌及普通企业/项目选择头。Java HTTP 使用过滤后的 `HttpExchange` 视图，因为 JDK 原请求头不可修改。访问日志仅记录方法、路径和耗时，不记录令牌。

Go 入口为 `middleware/go`，Node 入口为 `middleware/node/index.mjs` 与 `rpc.mjs`，Java 入口为 `sdks/java` 的 `UrMiddleware`。集成时先以本地模拟平台验证令牌、企业成员关系、拒绝无权限请求、错误码与基础安全响应头，再接真实平台地址。
