# 大屏调试/测试脚本

放置大屏改造时使用的 Playwright 自动化脚本。

## 前置条件

1. 启动 dev server:
   ```bash
   pnpm --filter org-iot-client exec vite --mode development --port 3006
   ```
2. 确保 Playwright chromium 已安装:
   ```bash
   pnpm --filter org-iot-client exec playwright install chromium
   ```

## 脚本列表

### dashboard-e2e.mjs — 端到端验证

自动登录 → 选企业 → 选项目 → 截图各粒度视图。

```bash
node apps/iot-basic/web/src/views/energy/dashboard/scripts/dashboard-e2e.mjs --headed
```

截图输出到 `.temp/dashboard-screenshots/`。

脚本默认会在进入 `/large-screen` 后自动检测当前是否为“默认大屏”，若处于“自定义大屏”会通过控制台入口 `ccd()` 拉起配置弹窗并切回“默认大屏”（以对齐 `default.vue` 的验证目标）。

可用环境变量:
- `DASHBOARD_PORT` — dev server 端口（默认 3006）
- `DASHBOARD_USER` / `DASHBOARD_PASS` — 登录凭据
- `DASHBOARD_TENANT` / `DASHBOARD_PROJECT` — 企业/项目名
- `DASHBOARD_FORCE_DEFAULT` — 是否强制切回默认大屏（默认开启；设为 `0` 可关闭）

### dashboard-api-debug.mjs — API 响应诊断

捕获大屏相关 API 的完整请求/响应，自动检测 timeWindow 重复。

```bash
# 捕获所有 API
node apps/iot-basic/web/src/views/energy/dashboard/scripts/dashboard-api-debug.mjs

# 只看区域 API
node ...dashboard-api-debug.mjs --api=area

# 只看能耗聚合 API
node ...dashboard-api-debug.mjs --api=energy
```

同样支持 `DASHBOARD_FORCE_DEFAULT=0` 跳过默认大屏切换逻辑。
