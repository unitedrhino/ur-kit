# ur-kit

联犀公开开发套件：Core/Things 合同、跨语言客户端与中间件、IoT 基础应用、缓存及协议样例。

合同来源写入 `contracts/manifest.json`。从 SaaS 的固定提交更新合同、Go pb、Things SDK、物模型、Modbus 和两类缓存快照时，在 SaaS 工作树运行总同步入口：

```sh
bash shell/sync-ur-kit-contracts.sh --kit <ur-kit仓库路径> --sha <40位SaaS提交SHA>
```

需要先核对服务生成物时可追加 `--build core:<服务名>` 或 `--build things:<服务名>`；若 `build.sh` 改变了生成物，先审查并提交 SaaS 结果，再用新提交 SHA 同步。总入口在同步前拒绝覆盖 ur-kit 中未提交的快照。SaaS 中 `.api` / `.proto` 为原始定义；本仓快照和客户端按标签锁定。公开示例仅使用本地占位配置。

`web-shared/` 保存 IoT Web 与结构监测 Web 共同使用的共享包快照，来源提交在 `web-shared/source.json`。同步时必须在干净的 SaaS 工作树上运行：

```sh
python3 scripts/sync_web_shared.py --saas <saas-worktree> --sha <40位提交SHA>
python3 scripts/configure_web_workspace.py
node scripts/verify_iot_basic.mjs --print
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
pnpm --filter org-iot-client build
```

本地回归先按上述顺序安装并生成共享包 stub，再运行 `pnpm --filter org-iot-client test:unit` 和 `pnpm --filter org-iot-client test:e2e`。使用系统 Chrome 时可设置 `PLAYWRIGHT_EXECUTABLE_PATH=<Chrome 可执行文件路径>`；浏览器测试固定中文语言并模拟平台接口。

`apps/iot-basic/web` 的共享包通过仓内 `link:` 路径引用，版本由 ur-kit Git 标签固定；`apps/iot-basic/ur-kit.lock.json` 同时核对合同与共享包的来源及内容摘要。同步后先审阅 `--print` 输出，更新锁文件，再运行 `node scripts/verify_iot_basic.mjs`；不依赖 SaaS 工作区。`apps/iot-basic/mobile`、`apps/iot-basic/backend` 分别在自己的目录构建和测试。Java SDK 使用 `sdks/java` 下的 Maven 项目，Go 与 Node 的客户端和中间件位于 `sdks/`、`middleware/`。

Go、Java、Node HTTP 客户端共享 [合同用例](sdks/conformance/README.md)，覆盖大整数 ID、显式空值、毫秒时间戳、地址与路径校验。RPC 客户端均以本机服务验证实际往返；[Node 调用示例](sdks/node/README.md) 使用固定的 `protocolSync` 合同。修改客户端时在对应语言目录运行测试。

Go 使用 [纯 RPC 客户端](sdks/go/rpcclient/README.md) 的公开 `NewXxxClient` 接入 Core/Things。公开包和模块依赖均不需要 SaaS 私有源码或权限；维护者同步合同与使用者构建应用是两个独立入口。`scripts/test_external_consumer.sh` 在仓外验证真实 RPC、大整数与认证，并检查全部公开 Go 包的依赖边界。

Core/Things 的强类型 HTTP 操作与模型见 [生成客户端](sdks/openapi/README.md)。它们由锁定 SaaS 提交的 Swagger 生成，提供 Go、Java、Node 三种源码；Node 大整数 ID 列表使用新增字符串字段。

IoT 基础应用的 Web 与 Go 可使用 [Dockerfile](apps/iot-basic/Dockerfile) 构建成一个容器；本机启动和端侧构建见 [应用说明](apps/iot-basic/README.md)。

## 当前可用范围

- `sdks/{go,java,node}` 和 `middleware/{go,java,node}` 提供 HTTP/RPC 客户端及身份、权限、错误、日志和基础安全头适配；Java protobuf 消息需先运行 `python3 scripts/generate_java_pb.py`。
- `cache/{common,platform,redis}` 提供独立 TTL、Redis/业务回源三级缓存与事件失效、业务缓存接口，以及与平台 `tenant` Hash 兼容的完整企业 JSON、Redis 在线状态与游标存储。`things/sdk/{seed,deviceauth,protocol,cache}` 提供独立种子、设备认证、配置/产品读取、协议注册、周期任务、MQTT 收发与会话跟踪，以及基于公开 Things RPC 的产品/设备资料 TTL 缓存。云协议可用 `cloud.NewRuntime` 组合 `core.Protocol`、配置来源、配置管理器、更新通知及周期任务；`cloud.RegisterDeviceSync` 将产品与设备分页接到周期任务，停止时等待在执行的定时处理器退出。`protocols/modbus` 有可运行的本地模拟设备。
- `cache/*/upstream` 与 `things/sdk/upstream` 保留 SaaS 源码对照，其中仍有私有导入，不能作为独立依赖。使用方应固定 Git 标签与对应合同清单；`v0.2.30` 包含结构预警站内通知合同、Go/Java/Node 强类型客户端、可编译缓存与协议入口，以及按来源提交校验的缓存源码快照。原服务调用点迁移和真实平台联调尚未完成。

各目录的最短验证命令和接入约束见 [开发技能](.agents/skills/ur-kit-development/SKILL.md)。
