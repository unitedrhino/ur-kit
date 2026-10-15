# ur-kit

联犀（UnitedRhino）应用与物联网开发套件，用于连接联犀平台、开发业务应用和接入设备协议。提供 Go、Java、Node 的 HTTP / RPC 客户端、中间件，以及可复用的 Web、移动端和 Go 后端示例。

SDK 可独立使用，构建应用无需访问联犀 SaaS 私有源码。调用平台接口时，需要准备平台地址、有效令牌及对应的企业、项目和应用权限。

## 选择你需要的能力

| 你要做什么 | 使用入口 |
| --- | --- |
| Go 后端调用平台 HTTP / RPC | [Go 接入示例](#go-快速接入)、[纯 RPC 客户端](sdks/go/rpcclient/README.md) |
| Java 后端调用平台 HTTP / RPC | [Java SDK](sdks/java/README.md) |
| Node 后端调用平台 HTTP / RPC | [Node SDK](sdks/node/README.md) |
| 使用 Core / Things 强类型 HTTP 接口 | [Go / Java / Node 生成客户端](sdks/openapi/README.md) |
| 为自己的 HTTP / RPC 服务接入认证和权限 | [服务中间件](middleware/README.md) |
| 复用公共缓存、企业权限缓存和 Redis 存储 | [缓存组件](cache/README.md) |
| 开发设备协议、MQTT 或云云对接 | [Things SDK](things/sdk/README.md) |
| 读取和校验物模型、使用产品与设备缓存 | [物模型](things/sdk/schema)、[设备缓存](things/sdk/cache) |
| 接入 Modbus TCP / UDP / RTU 设备 | [Modbus 客户端和模拟设备](protocols/modbus/README.md) |
| 基于现成客户端开发自己的应用 | [IoT 基础应用](apps/iot-basic/README.md) |

## 获取与安装

按 Git 标签固定版本，应用使用的 SDK 与接口合同保持同一版本。以下示例使用 `v0.2.36`。

**Go**：在你的 Go 项目中安装（Go 1.25+）：

```sh
go get github.com/unitedrhino/ur-kit@v0.2.36
```

**Java、Node 或应用源码**：获取同一标签的代码：

```sh
git clone --branch v0.2.36 --depth 1 https://github.com/unitedrhino/ur-kit.git
cd ur-kit
```

- **Node**：在 `sdks/node` 执行 `pnpm install --ignore-workspace --frozen-lockfile`，再执行 `pnpm pack`；在自己的项目中安装生成的 `.tgz`。HTTP 入口是 `@unitedrhino/ur-kit-node`，RPC 入口是 `@unitedrhino/ur-kit-node/rpc`。详见 [Node 安装与调用](sdks/node/README.md)。
- **Java**：准备 JDK 17+、Maven、Python 3 和 `protoc`。在仓库根目录先执行 `python3 scripts/generate_java_pb.py`，再执行 `mvn -f sdks/java/pom.xml install`；消息和 RPC Stub 从仓内合同生成。工具配置和调用方式见 [Java SDK 说明](sdks/java/README.md)。

Node 和 Java 当前按源码打包或安装到本地依赖仓使用，尚未发布 npm / Maven 公共仓库。它们的包内版本与 Git 标签分别管理；固定本次获取的 Git 标签及构建产物。

## Go 快速接入

下面通过 HTTP 查询一个有权访问的产品。先从运行环境提供 `PLATFORM_URL`、`PLATFORM_TOKEN`、`TENANT_CODE` 和 `PRODUCT_ID`；平台地址填写 HTTP(S) 根地址。按需提供 `PROJECT_ID` 和 `APP_ID` 选择业务上下文。

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// main 按运行配置查询产品，输出保留原始 ID 精度的 JSON 响应。
func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client := httpclient.Client{
		BaseURL: os.Getenv("PLATFORM_URL"), Token: os.Getenv("PLATFORM_TOKEN"),
		TenantCode: os.Getenv("TENANT_CODE"), ProjectID: os.Getenv("PROJECT_ID"),
		AppID: os.Getenv("APP_ID"),
	}
	var response json.RawMessage
	err := client.PostJSON(ctx, "/api/v1/things/product/info/get-one",
		map[string]string{"productID": os.Getenv("PRODUCT_ID")}, &response)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(response))
}
```

RPC 调用使用公开 pb 包的 `NewXxxClient(connection)`；已有 go-zero 连接可传入 `Conn()`。认证元数据与 TLS 配置见 [纯 RPC 客户端](sdks/go/rpcclient/README.md)。应用 HTTP / RPC 服务的认证、权限、错误处理和基础安全头见 [中间件说明](middleware/README.md)。

平台 JSON API 使用 POST。JavaScript 中超过安全整数范围的 ID 使用十进制字符串；HTTP 原始 JSON、空值、错误码和时间单位的处理见 [三语言接口约定](sdks/conformance/README.md)。令牌、密钥和目标环境地址由应用配置注入。

## 启动 IoT 基础应用

[`apps/iot-basic`](apps/iot-basic/README.md) 提供一套可扩展的应用骨架：

```text
apps/iot-basic/
├── web/        # Vue 3 物联网客户端
├── mobile/     # uni-app 移动端 / 小程序
└── backend/    # Go 后端示例、平台认证与 API 代理
```

Web 与 Go 后端构建成一个镜像、一个容器。先配置平台根地址 `PLATFORM_URL`、已开通的平台数字应用标识 `VITE_GLOB_APPID` 和镜像版本 `IMAGE_VERSION`，从仓库根目录运行：

```sh
docker compose -f apps/iot-basic/compose.yaml up --build -d
```

应用端口由 `HTTP_PORT` 配置，默认 `8080`；`/healthz` 提供健康检查。后端提供认证后的示例业务接口，并转发平台 Core / Things / Data 请求。登录前，需要在平台为目标企业和成员开通该应用及项目权限。移动端单独构建。

本地开发 Web 使用 Node 22.12+，pnpm 版本见根目录 `package.json`。在仓库根目录执行：

```sh
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
BACKEND_URL="$PLATFORM_URL" pnpm --filter org-iot-client dev
```

通过 `VITE_GLOB_APPID` 覆盖目标平台的数字应用标识；生产构建使用 `pnpm --filter org-iot-client build`。Web 使用仓内共享组件，无需克隆其他源码仓库。移动端的安装、平台地址和小程序 AppID 配置见 [移动端说明](apps/iot-basic/mobile/README.md)。

## 试用 Modbus

在仓库根目录运行：

```sh
go run ./protocols/modbus/cmd/demo
```

示例在本机启动模拟设备，读取初始值 `42`、写入 `258` 并再次读取，无需连接平台或物理设备。实际设备的 TCP、UDP、串口、TLS、点位类型与持久会话配置见 [Modbus 接入说明](protocols/modbus/README.md)。

## 使用 AI 开发

使用支持 `AGENTS.md` 的开发工具打开本仓，先读取 [开发规范](AGENTS.md)，再加载 [应用接入技能](.agents/skills/ur-kit-development/SKILL.md#使用-ur-kit-开发应用)。按任务加载[协议开发指南](.agents/skills/ur-kit-development/references/protocol-development.md)或[前后端应用指南](.agents/skills/ur-kit-development/references/application-development.md)，覆盖代码放置、组件装配、认证授权、实际消息链路与 Docker 验收。套件维护另见技能中的维护导航。

### 通过 ur 下载开发技能

支持 `--skill` 的 CLI 可下载独立开发技能包；先用 `ur skills download --help` 确认当前版本支持，再执行：

```sh
ur skills download --skill ur-kit-development --url <固定提交的开发技能ZIP地址> --json
```

将 JSON 返回的 `localPath` 目录整体复制到自己的项目 `.agents/skills/`，保留参考文件和来源清单，再在项目 `AGENTS.md` 写明技能入口。开发技能与 `ur-api` API 操作技能可以同时使用；`ur skills install/update` 目前只管理内置 `ur-api`。

旧版 CLI 尚不支持 `--skill` 时，可检出本文指南所在的固定提交，复制 `.agents/skills/ur-kit-development/`，按项目规范模板修正离开源码树后的链接。维护者按[技能打包流程](CONTRIBUTING.md#打包独立开发技能)生成可供下载的 ZIP；包内源码链接已固定为公开提交链接。

自己的应用固定 SDK 标签，按[项目规范模板](.agents/skills/ur-kit-development/references/project-rules.md)在应用仓保留 `AGENTS.md`、所需技能和参考文件，记录所用版本、业务边界及验证命令。协议接入使用公开 SDK 接口，平台 RPC、事件总线、存储和认证配置由应用提供。

参与套件维护、更新接口合同或发布版本，请阅读 [贡献与维护指南](CONTRIBUTING.md)。
