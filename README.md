# ur-kit

联犀公开开发套件：Core/Things 合同、跨语言客户端与中间件、IoT 基础应用、缓存及协议样例。

合同来源写入 `contracts/manifest.json`；生成命令：

```sh
python3 scripts/sync_contracts.py --saas <saas-repo> --sha <40位提交SHA>
python3 scripts/sync_go_pb.py
```

SaaS 中 `.api` / `.proto` 为原始定义；本仓快照和客户端按标签锁定。公开示例仅使用本地占位配置。

`web-shared/` 保存 IoT Web 与结构监测 Web 共同使用的共享包快照，来源提交在 `web-shared/source.json`。同步时必须在干净的 SaaS 工作树上运行：

```sh
python3 scripts/sync_web_shared.py --saas <saas-worktree> --sha <40位提交SHA>
python3 scripts/configure_web_workspace.py
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
pnpm --filter org-iot-client build
```

本地回归先按上述顺序安装并生成共享包 stub，再运行 `pnpm --filter org-iot-client test:unit` 和 `pnpm --filter org-iot-client test:e2e`。使用系统 Chrome 时可设置 `PLAYWRIGHT_EXECUTABLE_PATH=<Chrome 可执行文件路径>`；浏览器测试固定中文语言并模拟平台接口。

`apps/iot-basic/web` 的共享包通过仓内 `link:` 路径引用，版本由 ur-kit Git 标签固定；不依赖 SaaS 工作区。`apps/iot-basic/mobile`、`apps/iot-basic/backend` 分别在自己的目录构建和测试。Java SDK 使用 `sdks/java` 下的 Maven 项目，Go 与 Node 的客户端和中间件位于 `sdks/`、`middleware/`。

IoT 基础应用的 Web 与 Go 可使用 [Dockerfile](apps/iot-basic/Dockerfile) 构建成一个容器；本机启动和端侧构建见 [应用说明](apps/iot-basic/README.md)。

## 当前可用范围

- `sdks/{go,java,node}` 和 `middleware/{go,java,node}` 提供 HTTP/RPC 客户端及身份、权限、错误、日志和基础安全头适配；Java protobuf 消息需先运行 `python3 scripts/generate_java_pb.py`。
- `cache/{common,platform,redis}` 提供独立 TTL、业务缓存接口及 Redis 在线状态与游标存储。`things/sdk/{seed,deviceauth,protocol}` 提供独立种子、设备认证、配置/产品读取、协议注册、MQTT 收发与会话跟踪；`protocols/modbus` 有本地模拟测试。
- `cache/*/upstream` 与 `things/sdk/upstream` 保留 SaaS 源码对照，其中仍有私有导入，不能作为独立依赖。原服务调用点迁移、真实平台联调和公开版本标签尚未完成；使用方应以已发布标签与对应合同清单为准。

各目录的最短验证命令和接入约束见 [开发技能](.agents/skills/ur-kit-development/SKILL.md)。
