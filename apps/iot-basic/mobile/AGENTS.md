# IoT 基础应用移动端开发规范

此目录是 `apps/iot-basic/mobile`，使用 uni-app + Vue 3 + TypeScript。平台地址必须通过 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL`、`VITE_TENANT_API_BASE_URL` 注入；公开仓不保存真实环境地址或密钥。

- 业务请求按 `contracts/manifest.json` 与 `apps/iot-basic/ur-kit.lock.json` 固定合同和共享包版本生成，不修改生成物来绕过合同差异；`pnpm codegen` 和 uni-app 的所有开发/构建入口先验证应用版本锁，代码生成再使用本目录锁定的 CLI 与 `openapitools.json` 固定生成器，失败须保留原客户端。
- 修改页面时运行 `pnpm tsc` 与目标平台的 `pnpm build:*`；改身份和请求层时补对应测试。
- 小程序 AppID、上传凭据和品牌配置由使用方在构建环境中注入。
- 根目录 `AGENTS.md` 是跨语言与版本规则的统一入口。
