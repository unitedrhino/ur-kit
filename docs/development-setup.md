# 从零准备开发环境

本文面向使用 ur-kit 开发自己应用或协议的人。只需公开仓和平台授予的接入权限，无需下载 SaaS 私有仓。命令示例使用 Bash；Windows 推荐在 WSL2 Ubuntu 中执行同一套命令，编辑器连接到 WSL 工作目录。

## 1. 按目标安装工具

| 开发目标 | 必需工具 |
| --- | --- |
| Go 后端、协议和 Modbus 例子 | Git、Go 1.25+（本指南验证使用 1.26.0） |
| Web / uni-app | Node.js 22.12+、Corepack / pnpm；pnpm 版本由各项目 `packageManager` 固定 |
| 编写自己的 Proto / go-zero RPC 服务 | Go、goctl、protoc、protoc-gen-go、protoc-gen-go-grpc |
| Java SDK | JDK 17、Maven、Python 3、protoc |
| 本机单容器部署 | Docker Engine / Desktop 与 Compose v2 |

直接调用 SDK 中已生成的 Go RPC 客户端，不需要 goctl 或重新生成平台 Proto。基础应用现有 Go 后端使用标准 HTTP，并非等待 goctl 生成的空目录。

### 安装 Go 与 Git

从 [Go 官方安装页](https://go.dev/doc/install)下载符合系统和 CPU 架构的安装包，选择 Go 1.25 或更新的受支持版本；Linux 安装包解压到独立的新目录，不能覆盖旧 Go 树。macOS 使用官方 pkg，Windows 使用 MSI 或在 WSL 内安装 Linux 版。

Linux / WSL 首次安装示例（已有 Go 时先按官方指南处理升级）：

```sh
sudo apt-get update
sudo apt-get install -y git curl ca-certificates unzip xz-utils build-essential
curl -fLO https://go.dev/dl/go1.26.0.linux-amd64.tar.gz
# 先对照 https://go.dev/dl/ 校验下载文件的 SHA256；ARM64 改用 linux-arm64 包。
sha256sum go1.26.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.26.0.linux-amd64.tar.gz
export PATH="/usr/local/go/bin:$PATH"
export PATH="$(go env GOPATH)/bin:$PATH"
git --version
go version
```

把两行 `export PATH=...` 加入自己的 `~/.bashrc` 或 `~/.zshrc`，新终端也要能找到 Go 工具。如果设置了自定义 `GOBIN`，将该目录加入 PATH。不要把凭据写入全局代理或公开仓。

### 安装 Node.js 与 pnpm

从 [Node.js 官方下载页](https://nodejs.org/en/download)安装 Node.js 22.12+ 的受支持版本，安装后重新打开终端。Linux/WSL 也可按该页的版本管理器步骤安装。先确认 `node --version`，再启用 Corepack：

```sh
node --version
npm --version
corepack enable
```

若没有 Corepack，或遇到签名校验错误，按 [pnpm 官方安装说明](https://pnpm.io/installation)先运行 `npm install --global corepack@latest`，再启用。每次进入项目目录后执行 `pnpm --version`；Corepack 会使用该目录 `package.json` 锁定的版本：Web 根目录为 **10.14.0**，移动端独立项目为 **10.33.0**。不要为切换项目手工改锁文件。

## 2. 获取源码，先跑一个无平台例子

```sh
git clone https://github.com/unitedrhino/ur-kit.git
cd ur-kit
# 开发前记录当前来源；生产依赖固定发布标签，例如 v0.2.36。
git rev-parse HEAD
go mod download
go run ./protocols/modbus/cmd/demo
```

预期读写结果为 `holding register 10: 42 -> 258`。例子启动本机模拟设备，不需要平台、Redis 或真实串口。

## 3. 安装 goctl 与 Proto 工具

只有要新建或修改自己的 RPC 服务时才需要本节。[goctl](https://go-zero.dev/getting-started/installation/goctl/) 负责生成 go-zero 服务骨架，`protoc` 编译 Proto，两个 Go 插件分别生成消息类型和 gRPC 接口。以下 Go 工具版本固定，避免每次安装改变生成结果：

```sh
# Ubuntu / Debian / WSL；macOS 可使用 brew install protobuf。
sudo apt-get install -y protobuf-compiler
go install github.com/zeromicro/go-zero/tools/goctl@v1.9.2
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.11
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.6.1
export PATH="$(go env GOPATH)/bin:$PATH"
goctl --version
protoc --version
protoc-gen-go --version
protoc-gen-go-grpc --version
goctl env check --verbose
```

其他系统可从 [Protobuf 官方安装页](https://protobuf.dev/installation/)获取编译器，解压后把 `bin` 加入 PATH，保留同包 `include` 目录。`goctl env check --install` 可交互补装缺失组件；需要可重复生成时优先使用上面的固定插件版本。本指南在 protoc 3.21.12 验证，升级后须核对生成 diff。安装方法另见 [gRPC Go 指南](https://grpc.io/docs/languages/go/quickstart/)。

### 初始化自己的 Proto 并生成 RPC 服务

在 ur-kit 目录之外创建独立项目；不要修改 `contracts/source` 或平台 pb 来添加自己的业务。以下命令完整创建 `Demo.Ping` 服务：

```sh
mkdir my-rpc
cd my-rpc
go mod init example.com/my-rpc
mkdir proto
cat > proto/demo.proto <<'PROTO'
// 本文件定义自有演示服务，不扩展平台公共合同。
syntax = "proto3";
package demo;
option go_package = "./pb";

// PingReq 是调用方提交的问候文本。
message PingReq { string message = 1; }
// PingResp 是服务返回的问候文本。
message PingResp { string message = 1; }
// Demo 提供独立业务 RPC。
service Demo { rpc Ping(PingReq) returns (PingResp); }
PROTO
go get github.com/zeromicro/go-zero@v1.10.3 github.com/unitedrhino/ur-kit@v0.2.36
goctl rpc protoc proto/demo.proto --go_out=. --go-grpc_out=. --zrpc_out=. --style=goZero
# goctl 默认模板使用 etcd；首次本机体验改为直连模式，不需要另装 etcd。
cat > etc/demo.yaml <<'YAML'
Name: demo.rpc
ListenOn: 127.0.0.1:19090
Mode: dev
YAML
go mod tidy
go test ./...
go run demo.go -f etc/demo.yaml
```

生成结果包含 `pb/`（消息和 gRPC 类型）、`demo/`（客户端）、`internal/{config,logic,server,svc}/`（配置与业务骨架）、`etc/demo.yaml` 和 `demo.go`。在 `internal/logic/pingLogic.go` 实现自己的逻辑；生成的 `todo` 不是业务实现。上述体验配置只监听 `127.0.0.1:19090`，标准 gRPC 客户端可直连验证；默认 Ping 返回空消息。结束时 Ctrl+C。正式运行时按部署配置服务发现与平台可达地址。

只想快速创建默认示例可用 `goctl rpc new my-rpc`；上面显式 Proto 方式更方便固定包名和业务合同。后续修改 `proto/demo.proto` 后，在该项目根目录重新执行同一条 `goctl rpc protoc ...`，检查 diff，再测试。把命令放入自己的 `build.sh`，不要手改 pb。仅需要消息和标准 gRPC 客户端时使用 `protoc --go_out=. --go-grpc_out=. proto/demo.proto`，无需生成服务骨架。

上述服务仅验证代码生成与本机启动。实际接入必须再加[中间件](../middleware/README.md)的认证/权限、日志、TLS 与项目隔离，并按[平台注册指南](../.agents/skills/ur-kit-development/references/platform-registration.md)实现服务自注册、菜单或任务；生成代码不会自动完成这些接入。

## 4. 安装前端依赖，运行 Web 与 Go 后端

回到 ur-kit 根目录安装 **Web workspace**：

```sh
pnpm --version
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
node scripts/verify_iot_basic.mjs
```

准备平台管理员分配的 HTTP 根地址 `PLATFORM_URL`、数字应用标识 `VITE_GLOB_APPID`、有权成员与项目。在两个终端分别运行：

```sh
# 终端一，起点为 ur-kit 根目录；替换为已授权的平台地址。
export PLATFORM_URL='https://<platform-host>'
cd apps/iot-basic/backend
go mod download
go run .
```

```sh
# 终端二，起点为 ur-kit 根目录；替换为实际平台数字应用 ID。
export VITE_GLOB_APPID='<app-id>'
BACKEND_URL=http://127.0.0.1:8080 pnpm --filter org-iot-client dev
```

打开 Vite 输出的地址，`curl -f http://127.0.0.1:8080/healthz` 应返回健康结果；登录和业务数据需要真实授权平台。后端默认 8080，Web 请求经过此后端；仅改前端代理不会给账号授予权限。生产构建执行 `pnpm --filter org-iot-client build`。

### uni-app 单独安装

移动端不属于上层 Web workspace，必须在自己的目录执行：

```sh
cd apps/iot-basic/mobile
pnpm --version
pnpm install --ignore-workspace --frozen-lockfile
pnpm run test:contract
pnpm run tsc
pnpm run dev:h5
```

运行前提供 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL`、`VITE_TENANT_API_BASE_URL`。微信小程序还要提供 `VITE_MP_WEIXIN_APPID`，运行 `pnpm run build:mp-weixin`，用微信开发者工具导入 `dist/build/mp-weixin/`，配置合法域名与端侧权限。详见[移动端说明](../apps/iot-basic/mobile/README.md)。

## 5. 按需构建与排障

- Docker：先按 [Docker 官方安装说明](https://docs.docker.com/get-started/get-docker/)装好 Engine/Desktop 和 Compose v2，确认 `docker version`、`docker compose version`；之后按 [IoT 基础应用](../apps/iot-basic/README.md)构建单容器，再按 [urops 指南](../.agents/skills/ur-kit-development/references/urops-deployment.md)部署。Docker 并非安装 Go/前端开发依赖的前置条件。
- Java：先安装 JDK 17、Maven、Python 3 和本指南 protoc，确认 `java -version`、`mvn -version`、`python3 --version`；生成和本地安装顺序见 [Java SDK](../sdks/java/README.md)。Node 后端打包另见 [Node SDK](../sdks/node/README.md)。
- `goctl` / 插件找不到：核对 `go env GOPATH GOBIN` 和 PATH，重新打开终端；`protoc` 与插件是三个不同程序。
- Go 依赖下载失败：先核对网络与 `go env GOPROXY`；公共 SDK 不要求私仓凭据，不通过导入 SaaS 私包解决。
- Web 提示 Node 版本不支持：在**当前终端**检查 `node --version`，至少 22.12；不要删 engines 或降低依赖版本掩盖问题。
- pnpm 冻结安装失败：确认当前所在目录和 `packageManager`，不要混用 npm/yarn 或删除锁文件。移动端须带 `--ignore-workspace`。
- `@vben/*` 无法解析：从完整公开仓根目录安装 Web 依赖并执行 stub；这些包随 `web-shared` 提供，不能仅复制 `web/` 后直接从 npm 安装。

环境准备后按[开发技能](../.agents/skills/ur-kit-development/SKILL.md)选择协议、前后端应用、平台注册和部署工作流。技能来自 ur-kit；ur CLI 只按其现有能力辅助平台 API 操作。
