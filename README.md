# ur-kit

联犀公开开发套件：Core/Things 合同、跨语言客户端与中间件、IoT 基础应用、缓存及协议样例。

目录与迁移状态以 `AGENTS.md` 和 SaaS TASK-148 为准。合同来源写入 `contracts/manifest.json`；生成命令：

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

`apps/iot-basic/web` 的共享包通过仓内 `link:` 路径引用，版本由 ur-kit Git 标签固定；不依赖 SaaS 工作区。`apps/iot-basic/mobile`、`apps/iot-basic/backend` 分别在自己的目录构建和测试。Java SDK 使用 `sdks/java` 下的 Maven 项目，Go 与 Node 的客户端和中间件位于 `sdks/`、`middleware/`。
