# IoT 基础应用

`web/` 是公开 IoT 客户端，`mobile/` 是 uni-app，`backend/` 是可运行的 Go 接入样例。Go 服务提供 `/healthz`、经平台认证的 `/api/v1/iot-basic/ping`，并在设置 `WEB_DIR` 时提供 Web SPA；Core/Things/Data 平台 API 按明确路径转发到 `PLATFORM_URL`，保持请求方法、认证头、响应状态和内容。

从 ur-kit 仓库根目录构建 Web 与 Go 的单容器镜像：

```sh
docker build -f apps/iot-basic/Dockerfile -t ur-kit-iot-basic:<版本> .
```

在 `apps/iot-basic/` 中通过 Compose 启动时，设置 `PLATFORM_URL` 为部署环境的平台 HTTP(S) 根地址，并给 `IMAGE_VERSION` 设置不可变版本。运行镜像不含构建工具或移动端源码。移动端在 `mobile/` 内按其 `AGENTS.md` 独立构建。

后端本机验证：`cd backend && go test ./...`。Web 构建与移动端验证见仓库根目录 `README.md`。
