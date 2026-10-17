# 应用可复用的平台能力

平台开发指南讲服务实现，应用开发可以复用下列公开能力。使用方无需平台私有源码；取得 SDK 不等于获得目标平台的操作权限。

## 能力与接入入口

| 能力 | 公开实现/合同 | 应用如何使用 |
| --- | --- | --- |
| HTTP / RPC 调用 | [SDK](../README.md#获取与安装)、[强类型 HTTP](../sdks/openapi/README.md) | Go/Java/Node，锁定同一合同版本 |
| WS 推送 | [共享客户端与协议](realtime.md) | Web、uni-app 现成实现；其他后端按协议接入 |
| 站内通知、消息中心 | [通知与发送](realtime.md#5-应用后端发送站内通知) | 授权后端发送；前端订阅提示并查询持久记录 |
| HTTP/RPC 中间件 | [middleware](../middleware/README.md) | 身份核验、可信上下文、可注入业务授权、错误与日志 |
| 企业/项目权限 | [平台权限缓存](../cache/README.md)、项目公开合同 | 用户、角色与资源范围同时检查，应用数据自行隔离 |
| 缓存与 Redis | [cache](../cache/README.md) | 本地/共享缓存、幂等 loader 和失效；平台私有对象不作为依赖 |
| 文件上传与下载 | [core-api 合同](../contracts/source/backend/.swagger/core-api.json) 中 common 上传接口 | 使用签名 URL 或上传接口，保留临时确认和私有访问边界 |
| 路由、应用、菜单 | [平台注册](../.agents/skills/ur-kit-development/references/platform-registration.md) | iot-basic 启动注册四端应用与 Web 菜单；handler、代理、页面和成员权限分别接入 |
| 定时/延时任务 | [任务注册与消费](../.agents/skills/ur-kit-development/references/platform-registration.md#5-注册任务组定时任务与处理器) | 管理合同 + 授权的消息消费者；创建记录不会自动执行代码 |
| Hook 与第三方事件 | [接入与验签](../.agents/skills/ur-kit-development/references/application-development.md#平台入口与部署) | 标准 HTTP 回调，独立校验 HMAC，按请求 ID 幂等 |
| 数据分析 | [core-data 合同](../contracts/source/backend/.swagger/core-data.json) | 管理员配置数据源/查询，应用以有权身份执行查询 |
| AI / IM 等其他服务 | 公开 Core AI/IM 合同与 SDK | 按目标服务提供的 HTTP/RPC 地址接入，基础应用代理默认只含 system/things/data |
| 字典、用户、角色与项目 | Core/Things HTTP / RPC 合同 | 使用生成客户端；不从私有模型/数据库直接读数据 |
| 设备属性、事件、行为与 OTA | [Things SDK](../things/sdk/README.md)、公开 Things 合同 | 上报/控制分别验证，设备真实执行与平台接受请求区分 |
| 物模型、设备缓存 | [schema](../things/sdk/schema)、[cache](../things/sdk/cache) | 通过可注入公开客户端加载 |
| MQTT、TCP/串口与云协议 | [协议指南](../.agents/skills/ur-kit-development/references/protocol-development.md) | 公开协议核心与授权总线，校验上下行及认证 |
| Modbus | [协议与模拟设备](../protocols/modbus/README.md) | TCP/UDP/RTU，先跑本机 demo |
| Docker 与运维 | [IoT 应用](../apps/iot-basic/README.md)、[urops](../.agents/skills/ur-kit-development/references/urops-deployment.md) | 构建自己的镜像，按自己的 Compose 部署和回滚 |

## 接入边界和当前缺少的封装

- **WS**：Web/uni-app 已有客户端和生命周期；Go/Java/Node 暂无专用高层 WS 封装，可按[公共协议](realtime.md)使用传输库。OpenAPI 中出现 connect 接口不代表已生成 WS 客户端。
- **通知**：已有发送/查询/已读合同和 Web 通知组件；发送需要单独授权与通知配置，不向浏览器提供服务端密钥。
- **Hook**：已有服务/能力合同和协议，尚无独立三语言验签中间件；普通 HTTP token 中间件不能代替 Hook 原始请求体验签。验签方法见[应用接入指南](../.agents/skills/ur-kit-development/references/application-development.md#hook-回调验签)。
- **上传和数据分析**：已有公开 HTTP 客户端；没有通用的“业务附件落库”或“业务报表自动完成”封装。应用处理临时文件确认、对象权限及查询受众。
- **调度**：已有 timed pb、协议 Timer 和 NATS 适配；部署必须提供 RPC/总线权限。不能仅靠普通 HTTP 凭据收取内部总线消息。
- **应用代理**：默认只转发 system、things、data。增加 AI/IM 等页面时核对实际请求前缀，按受控白名单扩展或由应用后端使用 SDK 调用，不假定所有合同都已有同源代理。
- **自定义 WS 频道/内部扩展**：平台 Hub、资源提供者和私有服务实现不作为应用运行依赖。已有频道可订阅，新增平台频道需平台实现；应用也可自建实时接口。

这些区别应写入自己的 `AGENTS.md` 和接入验收，AI 不能把“公开合同”“可复用客户端”“需要自己实现的业务逻辑”混为一项已完成能力。
