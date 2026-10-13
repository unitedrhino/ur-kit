---
name: ur-kit-development
description: 开发 ur-kit 合同、SDK、中间件、缓存、协议及 IoT 基础应用时使用。
---

# ur-kit 开发

1. 先读仓库根目录 `AGENTS.md`，核对 `contracts/manifest.json` 的 SaaS 来源提交。
2. 合同只通过 `python3 scripts/sync_contracts.py --saas <saas-path> --sha <full-sha>` 更新；先运行对应 SaaS 服务的 `build.sh` 并提交生成物，再以该提交导出。
3. `web-shared/` 只通过 `scripts/sync_web_shared.py` 按固定 SaaS 提交更新。同步后运行 `scripts/configure_web_workspace.py`、`pnpm install --frozen-lockfile`、`pnpm -r run stub --if-present` 和 `pnpm --filter org-iot-client build`；快照适配逻辑写回同步脚本。
4. 先运行 `python3 scripts/generate_java_pb.py` 两次核对消息与 gRPC 服务 Stub 哈希，再验证 Go/Java/Node 的 HTTP、RPC 示例、Java Maven 编译、`things/sdk/seed` 幂等性及重复生成无差异，最后才发布标签。Linux x86_64 的 gRPC Java 插件固定版本并校验 SHA-256；其他平台设置 `UR_KIT_GRPC_JAVA_PLUGIN`。检查旧客户端 `apilegacy` 受影响字段与鉴权。
5. Web 和 mobile 位于 `apps/iot-basic/`，改动客户端请求时一起核对合同版本。不要复制私有环境配置。
6. `cache/platform` 的在线状态和 IM 游标可注入 `cache/redis`；游标必须由 Redis 原子比较 64 位十进制 ID，不得经 Lua 浮点数转换。变更时运行 `go test -race ./cache/redis`。`upstream/` 仅为 SaaS 源码对照快照，含私有导入的包不得当作可发布 SDK。
7. `apps/iot-basic/Dockerfile` 从仓库根上下文构建 Web 与 Go，运行阶段只包含静态页面和 Go 二进制。`web/.env.production` 提供可公开的本地构建默认值，目标平台数字应用 ID 必须在构建时通过 `VITE_GLOB_APPID` 覆盖；不要依赖被忽略的开发机 `web/.env`。后端集成测试在 `apps/iot-basic/backend` 执行，镜像测试核对 Web 深层路径、样例业务接口、平台路径代理和健康检查；`mobile` 独立构建，不进入运行镜像。
8. `things/sdk/protocol/{runtimeconfig,cloud,core,mqtt,tracking}` 是已解耦的配置合并、云配置生命周期、配置/产品分页 RPC、外部产品 ID 映射、设备主子协议配置选择、协议注册心跳、可注入周期调度、MQTT 收发与会话跟踪。云配置 RPC 的身份上下文由接入方提供，分页未读完或解码失败不得提交部分配置或产品映射；产品同步回调逐项执行并汇总错误。`core.Timer` 的调度器由平台接入方提供，同一任务下的处理器逐个执行并汇总失败；Paho 适配器先 `Connect` 再订阅，`ResumeSubs` 只恢复待确认的订阅，已确认订阅需在 OnConnect 重连回调重新订阅。修改时运行 `go test -race ./things/sdk/protocol/...` 和 `go vet ./things/sdk/protocol/...`。Broker 集成测试需设置 `UR_KIT_TEST_MQTT_BROKER`；原 `things/sdk/upstream/protocol` 尚有 SaaS 私有导入，平台联调未完成，不能仅凭子模块测试宣称完整协议 SDK 可发布。
