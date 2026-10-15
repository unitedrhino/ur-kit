# 开发自己的前后端应用

源码路径相对 ur-kit 根目录。使用 [IoT 基础应用](../../../../apps/iot-basic/README.md) 前，准备平台开通的数字应用标识、企业、成员及项目权限；接入自己的业务无需下载 SaaS 源仓。

报告、文档、任务等普通业务应用，先读[通用业务页面与定时报告](business-pages-and-reports.md)。其中说明页面复用、企业/可选项目范围、后台任务状态及文件交付；IoT 客户端提供工程骨架，业务页面按自己的流程组织。

## 1. 选择复用方式与目录

建议先保留套件目录结构，在自己的仓开发 `apps/iot-basic/{web,mobile,backend}`；共享目录和锁文件保持同一来源。只复制 `web/` 或 `mobile/` 会丢失仓内依赖及合同校验脚本。

| 业务内容 | 当前入口 | 自己的代码放置方式 |
| --- | --- | --- |
| Go HTTP 服务、业务 API、平台代理 | [backend/main.go](../../../../apps/iot-basic/backend/main.go) | 初始入口可直接扩展；变复杂后按 handler/service/repository 分层 |
| Web 页面、布局、路由 | `apps/iot-basic/web/src/views`、`src/router/routes/modules/app.ts` | 新业务页面在本应用中增加，路由注册到本应用 |
| 共享鉴权、请求、状态和组件 | `web-shared/packages/` | 优先复用；应用特有组件留在应用目录，不直接改生成快照 |
| 移动端页面与分包 | `apps/iot-basic/mobile/src/pages`、`src/packageDevice`、`src/pages.json` | 按页面和分包组织，复用导航/权限/主题组件 |
| 移动端业务、仓储和 HTTP | `mobile/src/services`、`src/domain`、`src/data` | 页面调用服务/仓储，平台生成客户端由数据层封装 |
| 版本与依赖 | `ur-kit.lock.json`、各 `package.json` 和 lockfile | 记录 SDK 标签、合同和共享快照来源 |

如果只抽出 Go 后端到全新的独立仓，修改其 module 名称，把 `github.com/unitedrhino/ur-kit v0.0.0` 改为固定发布标签（如 `v0.2.36`），删除 `replace ... => ../../..` 后执行 `go mod tidy`。原样例使用仓内 replace 是为共同开发；独立仓不能保留失效的相对目录或私有替换。

单独拆 Web/mobile 时必须同时调整仓内 `link:`、Vite 别名、共享包闭包、合同目录和验证脚本的相对路径，并验证全新安装；也可从固定标签构建共享包后在自己的仓锁定制品。不要把尚未发布到 npm 的 `@vben/*` 当成可直接从公共 npm 获取的包，不要通过删版本校验使项目看似可构建。首次接入优先保留现有布局。

## 2. 先跑通开发基线

### Go 与 Web

从 ur-kit 根目录打开两个终端，先设置本机已授权平台根地址 `PLATFORM_URL` 与数字应用标识 `VITE_GLOB_APPID`：

```sh
# 终端一：Go 样例监听 8080，平台根地址由环境变量注入。
cd apps/iot-basic/backend
go run .
```

```sh
# 终端二：从仓库根目录执行；自有 API 和平台代理均经过本地 Go 服务。
node scripts/verify_iot_basic.mjs
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
BACKEND_URL=http://127.0.0.1:8080 pnpm --filter org-iot-client dev
```

只调平台页面时可将 `BACKEND_URL` 指向平台；调自有后端必须指向 Go 服务。不要把可公开的 Vite 环境变量用于服务端密钥。沿用 IoT 客户端壳时保持 `VITE_GLOB_APPNAME=org-iot-client`，任意改名会影响组织前缀登录路由；数字应用标识按目标平台配置。

### uni-app

在 `apps/iot-basic/mobile` 单独执行：

```sh
pnpm install --ignore-workspace --frozen-lockfile
pnpm run tsc
pnpm run test:contract
pnpm run dev:h5
```

提前设置 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL`、`VITE_TENANT_API_BASE_URL`。小程序构建再提供 `VITE_MP_WEIXIN_APPID`，详见 [移动端规范](../../../../apps/iot-basic/mobile/AGENTS.md) 和 [移动端说明](../../../../apps/iot-basic/mobile/README.md)。认证的域名白名单、端侧权限和真机能力由使用方配置；浏览器通过不能代替小程序验收。

## 3. 开发一条自己的业务链路

1. 明确接口路径、POST 请求/响应、错误码、ID/空值/时间语义及读写权限，先添加测试。自己的接口置于业务前缀，如 `/api/v1/my-app/`；平台 Core/Things/Data API 继续由平台维护。
2. 参考 Go 样例的认证 `ping` 注册路由，复用 `middleware.HTTP`、`PlatformAuthenticator`，通过 `FromContext` 获取身份。**ping 只示范认证，不提供业务资源授权或数据库隔离**；真实业务必须设置 `Resource`、`Action` 和自己的 `Authorizer`，并在查询/写入时使用核验后的企业和项目条件，验证请求对象属于该范围。不能直接相信 body 里的项目 ID。
3. 根据业务增加数据库接口和事务。基础后端未内置业务数据库；新增表和存量数据变化实现幂等迁移，并验证重复启动、唯一约束与回滚后的读取兼容性。
4. 后端调用平台用固定版本的 HTTP/纯 RPC 客户端，限时请求并处理平台业务错误。企业/项目选择由认证器核验。业务 token 或服务凭据只在服务端配置，不写入前端代码。
5. Web 页面在本应用路由注册，复用现有布局、请求器和状态。平台 API 复用 `@vben/api`，自己的 API 封装留在应用中；不要改平台生成客户端加入业务路径。切换企业/项目时清空旧数据，避免迟到响应覆盖当前上下文；数字 ID 以字符串保存和传递。
6. mobile 同步增加 service/repository、页面和路由，复用已有认证与上下文管理。只有平台合同升级才运行 `pnpm codegen`；自有业务类型放在应用层，不手改 `src/data/openapi`。
7. 按当前项目使用的 UI 和交互规范复用组件；加载、空数据、错误、无权限和提交中状态都要有明确反馈。可见文案使用“企业”，不向产品用户暴露内部实现配置。

平台代理只放行 `/api/v1/system/`、`/api/v1/things/`、`/api/v1/data/`。保持方法、body、状态和认证语义，先剥离不可信 `ithings-*` 内部身份头。新增业务约束（如设备指令权）应在自己的服务核验；单纯透传不会实现自己的业务权限。SPA fallback 不得把未知 `/api/` 路径返回成 HTML。

### Java / Node 后端

基础应用的可运行后端是 Go；改用 Java/Node 时，在自己的 `backend/` 建立相应服务并复用 [Java SDK](../../../../sdks/java/README.md)、[Node SDK](../../../../sdks/node/README.md) 与 [中间件](../../../../middleware/README.md)。Node 中间件另见 [打包与接入示例](../../../../middleware/node/README.md)。

三语言的认证器核验平台身份范围，资源动作仍由自己的授权器实现。Java 使用 `UrMiddleware.httpScoped` / `rpcScoped`，Node 使用 `createPlatformAuthenticator`；RPC 服务使用对应 RPC 中间件。Java 本地 Maven 安装、Node tarball 必须来自同一 Git 标签；尚无公共包仓发布时不能写成直接安装某个未发布版本。替换后端后同步修改 Dockerfile 的构建/运行阶段，保留代理、静态页和健康检查合同，并运行对应语言测试。

## 4. 最小充分验证与单容器交付

从 ur-kit 根目录选择受影响的验证：

```sh
# 后端是独立 module。
(cd apps/iot-basic/backend && go test ./...)
# Web：单测、类型与生产构建。
pnpm --filter org-iot-client test:unit
pnpm --filter org-iot-client typecheck
pnpm --filter org-iot-client build
# mobile 在其目录执行。
(cd apps/iot-basic/mobile && pnpm run tsc && pnpm run test:contract)
(cd apps/iot-basic/mobile && pnpm run build:mp-weixin)
```

只运行涉及的端和包；若基线检查已有失败，记录原有失败与本次差异，不能删断言当作通过。新增后端业务至少覆盖有效请求、空/坏令牌、跨企业/项目越权、资源动作拒绝、非法参数与依赖故障。

镜像与 Compose 都在根目录执行（准备 `PLATFORM_URL`、`VITE_GLOB_APPID`、不可变 `IMAGE_VERSION`）：

```sh
docker compose -f apps/iot-basic/compose.yaml config -q
docker compose -f apps/iot-basic/compose.yaml up --build -d
```

镜像构建使用 [现有 Dockerfile](../../../../apps/iot-basic/Dockerfile) 的仓库根上下文，多阶段分别构建 Web 和 Go；mobile 单独交付。验证 `/healthz`、Web 深层路径刷新、未知 API 返回、认证业务接口、平台代理和新增业务链路；配置经运行环境注入。端口用 `HTTP_PORT`，回滚使用上一不可变镜像。

有本机真实平台与账号时按 [应用说明](../../../../apps/iot-basic/README.md) 执行 `test:e2e:real`，验证真实登录、应用开通、项目上下文和刷新；自己的新页面补相应定向验收。交付时分别记录模拟测试、真实平台测试、小程序/真机、镜像的实际结果。
