# Java SDK

`UrHttpClient` 使用 JDK 17 标准库发送平台 JSON POST；响应保留原始 JSON，以便消费方按 `BigInteger` / `BigDecimal` 解析 ID 和数值。认证令牌只放请求头，错误消息不打印令牌。
非交互服务账号可用 `UrOpenToken.sign(tenantCode, accessKey, accessSecret, Instant.now().plusSeconds(300))` 签发短期 JWT，再用 `UrHttpClient.forBearer(baseUrl, jwt)` 调用平台；登录令牌仍使用 `new UrHttpClient(baseUrl, token)`。AccessSecret 只由运行时注入，不写入仓库。
HTTP 和 RPC 客户端均可发送 `tenant-code`、`project-id` 与可选 `app-id`；ID 按字符串传递，避免中间层转换精度。
HTTP 客户端的地址、路径、空值与错误语义见 [三语言共同用例](../conformance/README.md)。

`UrRpcClient` 接收生成代码提供的 `MethodDescriptor`，支持阻塞 unary 调用或把认证后的 `Channel` 交给生成的 Stub。例如 `dm.DeviceManageGrpc.newBlockingStub(client.channel())`；`UrProtoMethods.unary("包.服务/方法", 请求默认实例, 响应默认实例)` 可用于没有强类型 Stub 的其他方法。`UrMiddleware` 为 Java HTTP 与 gRPC 服务注入可信身份，并执行可注入的权限判断。使用 `UrMiddleware.httpScoped` 或 `UrMiddleware.rpcScoped` 注入 `new UrPlatformAuthenticator(platformURL)`，它向平台核对企业成员和项目正授权；应用仍需提供按资源与动作判断的 `Authorizer`。原 `http` / `rpc` 工厂保留，兼容只接收令牌的既有认证器。

运行 `mvn test` 需要 JDK 17+ 与 Maven；仓库的本机测试也可用 Maven 容器执行。

如需 Core/Things 的强类型 protobuf 消息与服务 Stub，先在仓库根目录运行 `python3 scripts/generate_java_pb.py`，再运行 `mvn -f sdks/java/pom.xml test`。Java 编译器固定为 **libprotoc 25.6**，与 Maven 的 `protobuf-java 3.25.6` 匹配；通过 `UR_KIT_JAVA_PROTOC` 指定独立路径，不替换 Go 工具链所用的系统 protoc。生成器会在改写旧产物前拒绝缺失或不匹配的编译器。不要降级运行库或设置 `com.google.protobuf.use_unsafe_pre22_gencode` 绕过旧生成代码的安全检查。

Linux x86_64 可从 Protobuf 官方 Maven Central 坐标安装匹配编译器，并校验固定 SHA-256：

```sh
mkdir -p .temp/java-protoc-25.6
curl -fsSL https://repo.maven.apache.org/maven2/com/google/protobuf/protoc/3.25.6/protoc-3.25.6-linux-x86_64.exe -o .temp/java-protoc-25.6/protoc
printf '%s\n' 'a13450e63255d9e0d311feb6de70de0356b50f7791dc01cb9ce3732b74a41c69  .temp/java-protoc-25.6/protoc' | sha256sum -c -
chmod 700 .temp/java-protoc-25.6/protoc
export UR_KIT_JAVA_PROTOC="$PWD/.temp/java-protoc-25.6/protoc"
curl -fsSL https://repo.maven.apache.org/maven2/com/google/protobuf/protobuf-java/3.25.6/protobuf-java-3.25.6.jar -o .temp/java-protoc-25.6/protobuf-java.jar
printf '%s\n' '54943917af39f58303cab7d05f6cdf60d937c8304f49560b596bc1491ec83e8b  .temp/java-protoc-25.6/protobuf-java.jar' | sha256sum -c -
mkdir -p .temp/java-protoc-25.6/include
unzip -q .temp/java-protoc-25.6/protobuf-java.jar 'google/protobuf/*.proto' -d .temp/java-protoc-25.6/include
export UR_KIT_JAVA_PROTOC_INCLUDE="$PWD/.temp/java-protoc-25.6/include"
python3 scripts/generate_java_pb.py
mvn -f sdks/java/pom.xml test
```

单独的 Maven 编译器不包含 well-known include；上例从同版本官方 Java JAR 提取标准定义。也可用完整官方发行包的 `include` 目录；默认取编译器相邻上级的 `include`，或显式指定 `UR_KIT_JAVA_PROTOC_INCLUDE`，生成器核验 wrappers/descriptor 的固定摘要，缺失或不匹配时不覆盖旧生成物。已通过 Maven 下载该匹配 JAR 时可复用缓存中的文件，但仍核摘要，不依赖某台机器的绝对路径。

其他系统从同官方版本取得对应平台编译器，核验发布摘要后设置 `UR_KIT_JAVA_PROTOC`；上述 Linux 摘要不能用于其他平台。脚本从 `contracts/source` 的固定 SaaS 快照生成 57 个消息文件和 58 个服务 Stub 到 Maven `target/generated-sources/urkit/java`；重复生成会报告相同 SHA-256。Linux x86_64 首次生成从 Maven Central 下载固定版本的 gRPC Java 插件并校验 SHA-256；其他系统设置 `UR_KIT_GRPC_JAVA_PLUGIN` 指向已安装的 `protoc-gen-grpc-java`。生成目录是构建产物，不提交到 Git；发布 SDK 前应对指定快照执行生成与编译测试。
