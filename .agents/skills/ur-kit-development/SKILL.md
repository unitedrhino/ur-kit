---
name: ur-kit-development
description: 开发 ur-kit 合同、SDK、中间件、缓存、协议及 IoT 基础应用时使用。
---

# ur-kit 开发

1. 先读仓库根目录 `AGENTS.md`，核对 `contracts/manifest.json` 的 SaaS 来源提交。
2. 合同只通过 `python3 scripts/sync_contracts.py --saas <saas-path> --sha <full-sha>` 更新；先运行对应 SaaS 服务的 `build.sh` 并提交生成物，再以该提交导出。即使 Swagger 已有字段，也要核对生成的 Go HTTP 请求类型和实际 HTTP→RPC 转换；仅看 `.api` 或 Swagger 无法证明服务会接收并透传字段。重复运行 `build.sh` 核对生成结果稳定。
3. `web-shared/` 只通过 `scripts/sync_web_shared.py` 按固定 SaaS 提交更新。同步后运行 `scripts/configure_web_workspace.py`、`pnpm install --frozen-lockfile`、`pnpm -r run stub --if-present` 和 `pnpm --filter org-iot-client build`；快照适配逻辑写回同步脚本。
4. 先运行 `python3 scripts/generate_java_pb.py` 两次核对消息与 gRPC 服务 Stub 哈希，再验证 Go/Java/Node 的 HTTP、RPC 示例、Java Maven 编译、`things/sdk/seed` 幂等性及重复生成无差异，最后才发布标签。Linux x86_64 的 gRPC Java 插件固定版本并校验 SHA-256；其他平台设置 `UR_KIT_GRPC_JAVA_PLUGIN`。检查旧客户端 `apilegacy` 受影响字段与鉴权。
   HTTP 输入、ID、空值、时间与错误响应以 `sdks/conformance/README.md` 和共同样本为准；三语言客户端改动后一起核对。
5. Web 和 mobile 位于 `apps/iot-basic/`，改动客户端请求时一起核对合同版本。mobile 有独立锁文件，但位于外层 pnpm workspace 之下；在 `apps/iot-basic/mobile` 执行 `pnpm install --ignore-workspace --frozen-lockfile`，否则 pnpm 会安装外层 38 个项目而不创建 mobile 的 `node_modules`。随后运行 `pnpm run tsc`、`pnpm run test:contract` 与目标端 `pnpm run build:mp-weixin`；构建时由环境注入 `VITE_MP_WEIXIN_APPID`。不要复制私有环境配置。
6. `cache/common.LayeredCache` 通过 `LayeredOptions` 注入 Redis、事件总线和业务 loader，保留 `cache:<name>:<key>` 与 `server.cache.sync.<name>`；旧回源不能在失效后重新发布，事件广播必须在发布锁外。`cache/platform` 的企业 `tenant` Hash、在线状态和 IM 游标可注入 `cache/redis`；企业资料使用完整 JSON 并核对 Hash 字段与 JSON `code`，不要截断平台扩展字段。游标必须由 Redis 原子比较 64 位十进制 ID，不得经 Lua 浮点数转换。变更时运行 `go test -race ./cache/...`。`upstream/` 仅为 SaaS 源码对照快照，含私有导入的包不得当作可发布 SDK。
7. `apps/iot-basic/Dockerfile` 从仓库根上下文构建 Web 与 Go，运行阶段只包含静态页面和 Go 二进制。`web/.env.production` 提供可公开的本地构建默认值，目标平台数字应用 ID 必须在构建时通过 `VITE_GLOB_APPID` 覆盖；不要依赖被忽略的开发机 `web/.env`。后端集成测试在 `apps/iot-basic/backend` 执行，镜像测试核对 Web 深层路径、样例业务接口、平台路径代理和健康检查；`mobile` 独立构建，不进入运行镜像。
8. `things/sdk/protocol/{runtimeconfig,cloud,core,mqtt,tracking}` 是已解耦的启动配置读取/合并、云配置生命周期、配置/产品/设备分页 RPC、外部产品 ID 映射、设备主子协议配置选择、协议注册心跳、可注入周期调度、MQTT 收发与会话跟踪。协议自有 gRPC 服务通过 `core.Options.RPCRegistrars` 注册，需同时设置 `RPCListenAddr`，并在 `RPCServerOptions` 注入身份认证、权限和日志拦截器；反射仅在明确设置 `RPCReflection` 时启用。非 MQTT 设备调用 `core.ReportConnection` 发布上下线，不写 MQTT 会话。`runtimeconfig.Resolve` 的未找到和空配置保留本地默认值，其他 RPC 错误不能静默吞掉；运行配置与云配置 RPC 的身份上下文由接入方提供。分页未读完或解码失败不得提交部分配置或产品映射；`cloud.GRPCDeviceSource.ForEachDevice` 按产品分页并检查跨产品、重复设备，单设备同步失败继续处理且汇总错误，但已执行的回调不会自动回滚。`core.Timer` 的同一任务下处理器逐个执行并汇总失败；`core.GRPCTimerScheduler` 用公开 timed pb 注册任务，接入方必须提供带授权的 RPC 客户端与真实事件总线。Paho 适配器先 `Connect` 再订阅，`ResumeSubs` 只恢复待确认的订阅，已确认订阅需在 OnConnect 重连回调重新订阅。修改时运行 `go test -race ./things/sdk/protocol/...` 和 `go vet ./things/sdk/protocol/...`。Broker 集成测试需设置 `UR_KIT_TEST_MQTT_BROKER`；原 `things/sdk/upstream/protocol` 尚有 SaaS 私有导入，平台联调未完成，不能仅凭子模块测试宣称完整协议 SDK 可发布。
9. `things/sdk/cache` 用公开 `dm` RPC 客户端封装产品与设备资料、产品/设备 TSL JSON 的 TTL 缓存。缓存键显式包含企业编码，接入方用匹配该企业的真实授权上下文发起查询，并在平台产品/设备变更事件中显式调用失效方法；资料响应若带不匹配的企业编码会被拒绝，返回的 protobuf/JSON 均为副本。`TSLCache` 按设备条目覆盖产品同名条目并保留扩展字段，产品变更失效已访问的设备模型；SaaS 内部 `schema.Model` 校验和索引须在适配层完成。修改时运行 `go test -race ./things/sdk/cache/... ./cache/common/...`；公开 JSON 聚合不能直接替换原 `dmExport` 的完整内部模型。
10. `protocols/modbus` 的独立 TCP 样例提供保持寄存器读与单寄存器写，运行 `go test -race ./protocols/modbus/...` 核对功能码 3/6、设备回显和异常码；原 Modbus 服务源码仍在 `upstream/` 对照，样例不等于完整服务迁移。
