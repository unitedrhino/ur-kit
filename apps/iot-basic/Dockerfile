# 本文件构建 IoT 基础 Web 与内嵌注册清单的 Go 服务，启动注册成功后提供单容器页面与 API。
FROM node:22-bookworm-slim AS web-build
RUN corepack enable
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web-shared/ ./web-shared/
COPY contracts/manifest.json ./contracts/manifest.json
COPY apps/iot-basic/ur-kit.lock.json ./apps/iot-basic/ur-kit.lock.json
COPY apps/iot-basic/web/package.json ./apps/iot-basic/web/package.json
COPY apps/iot-basic/web/.env.development apps/iot-basic/web/.env.test apps/iot-basic/web/.env.production ./apps/iot-basic/web/
COPY apps/iot-basic/mobile/package.json ./apps/iot-basic/mobile/package.json
COPY scripts/verify_iot_basic.mjs ./scripts/verify_iot_basic.mjs
RUN node scripts/verify_iot_basic.mjs
RUN --mount=type=cache,id=ur-kit-basic-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline && pnpm -r run stub --if-present
COPY apps/iot-basic/web/ ./apps/iot-basic/web/
ARG VITE_GLOB_APPID=600
RUN pnpm --filter org-iot-client build

FROM golang:1.25-alpine AS backend-build
WORKDIR /src
COPY go.mod go.sum ./
COPY middleware/go/ ./middleware/go/
COPY sdks/go/ ./sdks/go/
COPY apps/iot-basic/backend/ ./apps/iot-basic/backend/
RUN --mount=type=cache,id=ur-kit-basic-go-mod,target=/go/pkg/mod \
    --mount=type=cache,id=ur-kit-basic-go-build,target=/root/.cache/go-build \
    cd apps/iot-basic/backend && CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/iot-basic .

FROM alpine:3.21
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend-build /out/iot-basic /app/iot-basic
COPY --from=web-build /src/apps/iot-basic/web/dist /app/web
ENV WEB_DIR=/app/web
EXPOSE 8080
USER app
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
ENTRYPOINT ["/app/iot-basic"]
