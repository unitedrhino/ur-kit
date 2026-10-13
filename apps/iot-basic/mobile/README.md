# IoT 基础应用移动端

此目录是独立的 uni-app 项目，自带 `pnpm-lock.yaml`。从本目录安装时须忽略上层 Web workspace，否则 pnpm 只会安装上层项目，不会给移动端创建 `node_modules`。

```sh
cd apps/iot-basic/mobile
pnpm install --ignore-workspace --frozen-lockfile
pnpm run tsc
pnpm run test:contract
VITE_MP_WEIXIN_APPID=<微信小程序AppID> pnpm run build:mp-weixin
```

构建输出在 `dist/build/mp-weixin/`，使用微信开发者工具导入该目录进行端侧验收。接入平台时，通过构建环境提供 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL`、`VITE_TENANT_API_BASE_URL` 和目标小程序 AppID；仓库不保存目标环境地址或凭据。合同版本以仓库根目录 `contracts/manifest.json` 为准。
