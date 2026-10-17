# IoT 基础应用

`web/` 是公开 IoT 客户端，`mobile/` 是 uni-app，`backend/` 是可运行的 Go 接入样例。Go 服务提供 `/healthz`、经平台认证的 `/api/v1/iot-basic/ping`，并在设置 `WEB_DIR` 时提供 Web SPA；Core/Things/Data 平台 API 按明确路径转发到 `PLATFORM_URL`，保持请求方法、认证头、响应状态和内容。

`ur-kit.lock.json` 同时锁定 `contracts/manifest.json` 与 `web-shared/` 的 SaaS 来源和内容摘要。仓库根目录运行 `node scripts/verify_iot_basic.mjs` 核对；Web 构建、Docker 构建、移动端 `pnpm codegen` 及 uni-app 开发/构建均会自动执行核对。合同或共享包从固定 SaaS 提交更新后，运行 `node scripts/verify_iot_basic.mjs --print` 生成待审阅的新锁内容，确认合同与共享包兼容后再更新锁文件并提交；不能在构建时自动改锁。

从 ur-kit 仓库根目录构建 Web 与 Go 的单容器镜像：

```sh
docker build -f apps/iot-basic/Dockerfile --build-arg VITE_GLOB_APPID=<平台应用标识> -t ur-kit-iot-basic:<版本> .
```

在 `apps/iot-basic/` 中通过 Compose 启动时，使用下节注册配置，并给 `IMAGE_VERSION` 设置不可变版本。Compose 将同一个 `APP_ID` 同时传入 Web 构建的 `VITE_GLOB_APPID` 和后端，避免应用上下文不一致；直接 `docker build` 时仍使用上面的构建参数。运行镜像不含构建工具或移动端源码。移动端在 `mobile/` 内按其 `AGENTS.md` 独立构建。

## 启动时自动注册

后端默认在监听端口前注册 Web、微信、Android、iOS 四个客户端（原 ID 600/700/800/900），以及 Web 的 23 个完整菜单模板。清单位于 [`backend/bootstrap/client.json`](backend/bootstrap/client.json)，由应用维护，不再依赖 Things 启动下发客户端菜单；平台物联网管理端 200 仍由平台维护。Go 二进制已内嵌清单，运行镜像不需要读取源码文件。

| 变量 | 作用 |
| --- | --- |
| `PLATFORM_URL` | 已授权的平台 HTTP(S) 根地址；平台必须先升级到提供应用批量注册 HTTP 接口的版本 |
| `APP_AUTO_REGISTER` | 默认 `true`；平台已完成应用配置、仅运行普通业务时可明确设为 `false` |
| `APP_ID` | Web 的稳定数字应用 ID，默认 `600`；自定义时与 Web 构建应用 ID 相同，不能占用移动端 ID |
| `APP_PUBLIC_URL` | Web 的真实可访问入口（HTTP(S) URL 或平台内绝对路径），自动注册时必填 |
| `PLATFORM_BOOTSTRAP_TOKEN` | 平台超级管理员登录令牌，只用于服务端注册 |
| `PLATFORM_BOOTSTRAP_TOKEN_FILE` | 容器内令牌文件路径；与直接令牌二选一，适合 Secret 挂载 |

注册令牌由平台管理员通过既有登录流程取得，不能使用普通成员 token 代替，不能写入 Vite 变量、镜像或 Git。默认启动方式在运行环境注入令牌和入口后执行：

```sh
# 从 ur-kit 根目录执行；运行环境预先提供 PLATFORM_URL、APP_PUBLIC_URL 和注册令牌。
docker compose -f apps/iot-basic/compose.yaml config -q
docker compose -f apps/iot-basic/compose.yaml up --build -d
```

使用仓库外令牌文件时，在运行环境设置 `PLATFORM_BOOTSTRAP_TOKEN_SOURCE` 为宿主机文件路径，再执行：

```sh
docker compose -f apps/iot-basic/compose.yaml -f apps/iot-basic/compose.secret.yaml up --build -d
```

文件须允许容器内 `app` 用户读取；Compose 的本地文件 Secret 挂载不保证重写宿主文件权限。限制宿主文件及其父目录访问，不在日志或终端输出 token。注册令牌失效时默认启动会失败；完成注册后可撤销该令牌，并明确以 `APP_AUTO_REGISTER=false` 运行，后续升级需同步新模板时再提供授权。

注册按固定 ID 和菜单自然键幂等同步，重复启动不增加菜单；模板默认字段由清单维护，企业自定义名称、图标、显隐、排序与已有登录配置保留。已软删除的应用或菜单不复活。注册接口/认证不可用或回填失败时进程退出，Compose 按重启策略重试，不以缺少菜单的状态上线。

菜单注册不等于成员拥有所有业务权限。使用实际有权成员检查应用和菜单列表；默认仍保留隐藏详情页与通知/日志分组的隐藏设置，不能把所有内置页面都强行显示到侧栏。基础应用不自动创建企业、项目和成员，不自动登记自定义业务路由或定时任务；按[注册指南](../../.agents/skills/ur-kit-development/references/platform-registration.md)接入这些对象。

后端本机验证：`cd backend && go test ./...`。Web 构建与移动端验证见仓库根目录 `README.md`。

默认应用名称和菜单由前端按当前语言显示，企业自行改名后保留原文。完成前端依赖安装后，在仓库根运行 `pnpm --filter org-iot-client test:menu-i18n`，可验证内嵌注册模板的 23 个菜单及四端名称、描述与 14 种语言资源一致；该检查不代替具体业务页面的显示验收。

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
