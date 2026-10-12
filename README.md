# ur-kit

联犀公开开发套件：Core/Things 合同、跨语言客户端与中间件、IoT 基础应用、缓存及协议样例。

目录与迁移状态以 `AGENTS.md` 和 SaaS TASK-148 为准。合同来源写入 `contracts/manifest.json`；生成命令：

```sh
python3 scripts/sync_contracts.py --saas <saas-repo> --sha <40位提交SHA>
python3 scripts/sync_go_pb.py
```

SaaS 中 `.api` / `.proto` 为原始定义；本仓快照和客户端按标签锁定。公开示例仅使用本地占位配置。
