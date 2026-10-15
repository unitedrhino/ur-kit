# IoT 基础应用

`web/` 是公开 IoT 客户端，`mobile/` 是 uni-app，`backend/` 是可运行的 Go 接入样例。Go 服务提供 `/healthz`、经平台认证的 `/api/v1/iot-basic/ping`，并在设置 `WEB_DIR` 时提供 Web SPA；Core/Things/Data 平台 API 按明确路径转发到 `PLATFORM_URL`，保持请求方法、认证头、响应状态和内容。

`ur-kit.lock.json` 同时锁定 `contracts/manifest.json` 与 `web-shared/` 的 SaaS 来源和内容摘要。仓库根目录运行 `node scripts/verify_iot_basic.mjs` 核对；Web 构建、Docker 构建、移动端 `pnpm codegen` 及 uni-app 开发/构建均会自动执行核对。合同或共享包从固定 SaaS 提交更新后，运行 `node scripts/verify_iot_basic.mjs --print` 生成待审阅的新锁内容，确认合同与共享包兼容后再更新锁文件并提交；不能在构建时自动改锁。

从 ur-kit 仓库根目录构建 Web 与 Go 的单容器镜像：

```sh
docker build -f apps/iot-basic/Dockerfile --build-arg VITE_GLOB_APPID=<平台应用标识> -t ur-kit-iot-basic:<版本> .
```

在 `apps/iot-basic/` 中通过 Compose 启动时，设置 `PLATFORM_URL` 为部署环境的平台 HTTP(S) 根地址、`VITE_GLOB_APPID` 为数字应用标识，并给 `IMAGE_VERSION` 设置不可变版本。`web/.env.production` 的数字 ID 是本地示例默认值，不能代替目标平台应用配置。运行镜像不含构建工具或移动端源码。移动端在 `mobile/` 内按其 `AGENTS.md` 独立构建。

后端本机验证：`cd backend && go test ./...`。Web 构建与移动端验证见仓库根目录 `README.md`。

## 开发自己的业务

按[前后端应用指南](../../.agents/skills/ur-kit-development/references/application-development.md)扩展 Web、移动端与后端。指南包含文件位置、独立 module 的依赖调整、认证与业务授权、定向验证和镜像交付。现有 `ping` 只示范平台认证；自己的数据访问与资源动作权限需要在后端实现。

## 真实平台浏览器冒烟

在已授权的本机隔离平台准备一个开通了当前 Web 应用的企业、可登录成员及其有权访问的项目，再从仓库根目录运行 `pnpm --filter org-iot-client run test:e2e:real`。脚本直接访问已启动的单容器，不模拟接口；校验真实登录、应用可见性、项目列表请求的企业与应用头、组织前缀 dashboard，以及刷新后的项目上下文。

运行前由本机测试环境注入下列变量，不把凭据写入仓库：

| 变量 | 含义 |
| --- | --- |
| `UR_KIT_SMOKE_BASE_URL` | 单容器的 HTTP(S) 根地址 |
| `UR_KIT_SMOKE_ORG_ID` | 企业路由 ID |
| `UR_KIT_SMOKE_TENANT_CODE` | 企业代码，用于校验请求头与应用授权 |
| `UR_KIT_SMOKE_USER`、`UR_KIT_SMOKE_PASSWORD` | 测试成员的登录凭据 |
| `UR_KIT_SMOKE_PROJECT_ID` | 预期在列表中出现的项目 ID |
| `UR_KIT_SMOKE_APP_ID` | 可选，默认 `600` |
| `UR_KIT_SMOKE_ROUTER_MODE` | 可选，生产镜像默认 `hash`；开发服务用 `html5` |
| `PLAYWRIGHT_EXECUTABLE_PATH` | 可选，指定已安装的 Chromium 可执行文件 |

脚本只输出状态与项目数量，不输出凭据或令牌。目标企业需要在真实 `self/app/get-list` 中可见该应用；平台账号的 `platform` 企业与普通企业的应用菜单范围不同，不能用模拟授权响应代替此项验收。
