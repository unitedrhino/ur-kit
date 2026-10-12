# Java SDK

`UrHttpClient` 使用 JDK 17 标准库发送平台 JSON POST；响应保留原始 JSON，以便消费方按 `BigInteger` / `BigDecimal` 解析 ID 和数值。认证令牌只放请求头，错误消息不打印令牌。

Java RPC 生成与服务端 HTTP/RPC 中间件尚未接入，当前包不能代表完整 Java SDK 发布。运行 `mvn test` 前需安装 JDK 17 与 Maven。
