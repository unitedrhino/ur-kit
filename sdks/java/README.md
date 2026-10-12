# Java SDK

`UrHttpClient` 使用 JDK 17 标准库发送平台 JSON POST；响应保留原始 JSON，以便消费方按 `BigInteger` / `BigDecimal` 解析 ID 和数值。认证令牌只放请求头，错误消息不打印令牌。

`UrRpcClient` 接收生成代码提供的 `MethodDescriptor`，支持阻塞 unary 调用或把认证后的 `Channel` 交给生成的 Stub。`UrMiddleware` 为 Java HTTP 与 gRPC 服务注入可信身份，并执行可注入的权限判断。认证器须连接实际平台认证能力，不能使用示例中的固定令牌验证器。

运行 `mvn test` 需要 JDK 17+ 与 Maven；仓库的本机测试也可用 Maven 容器执行。
