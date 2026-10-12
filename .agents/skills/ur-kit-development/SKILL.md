---
name: ur-kit-development
description: 开发 ur-kit 合同、SDK、中间件、缓存、协议及 IoT 基础应用时使用。
---

# ur-kit 开发

1. 先读仓库根目录 `AGENTS.md`，核对 `contracts/manifest.json` 的 SaaS 来源提交。
2. 合同只通过 `python3 scripts/sync_contracts.py --saas <saas-path> --sha <full-sha>` 更新；先运行对应 SaaS 服务的 `build.sh` 并提交生成物，再以该提交导出。
3. `web-shared/` 只通过 `scripts/sync_web_shared.py` 按固定 SaaS 提交更新。同步后运行 `scripts/configure_web_workspace.py`、`pnpm install --frozen-lockfile`、`pnpm -r run stub --if-present` 和 `pnpm --filter org-iot-client build`；快照适配逻辑写回同步脚本。
4. 先验证 Go/Java/Node 的 HTTP、RPC 示例、`things/sdk/seed` 幂等性及重复生成无差异，再发布标签。检查旧客户端 `apilegacy` 受影响字段与鉴权。
5. Web 和 mobile 位于 `apps/iot-basic/`，改动客户端请求时一起核对合同版本。不要复制私有环境配置。
