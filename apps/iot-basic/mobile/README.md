# IoT 基础应用移动端

此目录是独立的 uni-app 项目，自带 `pnpm-lock.yaml`。从本目录安装时须忽略上层 Web workspace，否则 pnpm 只会安装上层项目，不会给移动端创建 `node_modules`。

```sh
cd apps/iot-basic/mobile
pnpm install --ignore-workspace --frozen-lockfile
pnpm run tsc
pnpm run test:contract
VITE_MP_WEIXIN_APPID=<微信小程序AppID> pnpm run build:mp-weixin
```

构建输出在 `dist/build/mp-weixin/`，使用微信开发者工具导入该目录进行端侧验收。接入平台时，通过构建环境提供 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL`、`VITE_TENANT_API_BASE_URL` 和目标小程序 AppID；仓库不保存目标环境地址或凭据。共享应用依赖版本由根目录合同清单和应用版本锁校验；移动端 HTTP 接口快照及其来源以本目录 `contracts/manifest.json` 为准。

移动端 HTTP 合同单独锁定在 `contracts/`，其 `manifest.json` 记录 SaaS 源提交和 Swagger 摘要；这样升级小程序时不会覆盖 ur-kit 其他 SDK 的 RPC 合同。维护者可执行 `python3 scripts/sync-mobile-contracts.py --saas <SaaS仓库> --sha <完整提交SHA>` 更新，并运行 `pnpm codegen`、类型检查及目标平台构建。真实部署地址、AppID 和发布凭据仍由使用方注入。
