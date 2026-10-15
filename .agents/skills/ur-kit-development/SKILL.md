---
name: ur-kit-development
description: 使用 ur-kit 开发设备协议、Web、uni-app 和 Go/Java/Node 后端，或维护公共 SDK、合同和基础应用时使用。
---

# ur-kit 开发

先读[根开发规范](../../../AGENTS.md)和[使用说明](../../../README.md)。开发自己的应用或协议只依赖公开仓、固定版本合同和目标平台的授权接口。

## 使用 ur-kit 开发应用

按当前工作选择指南，不必加载全部参考材料：

| 当前任务 | 必读指南 |
| --- | --- |
| 自己的 MQTT、Modbus、TCP/串口或云协议 | [协议开发：目录、装配、上下行、验收](references/protocol-development.md) |
| Web、移动端和 Go/Java/Node 业务后端 | [应用开发：骨架、鉴权、页面、测试、Docker](references/application-development.md) |
| 把规则带入自己的独立仓、交付前自查 | [项目规范与 AI 入口](references/project-rules.md) |

最短开发流程：

1. 固定 SDK 标签及合同版本。Go 按标签引用；Java、Node 按同一标签源码构建，安装方式见各自 README。大整数 ID 使用无损类型。
2. 确认业务/设备协议说明及目标平台提供的权限、连接方式。HTTP 应用令牌与可信服务间 RPC 认证分别配置；缺少平台接入条件时先完成本地模拟验证，并明确未验收项。
3. 先跑现有样例，再增加自己的业务代码。使用公开接口注入 RPC、消息总线、存储和认证；禁止依赖 `upstream/` 或私有 SaaS 包。
4. 认证身份从中间件上下文读取；企业/项目隔离和资源动作授权落实到服务端。协议验证属性上报与属性控制两条实际消息链路。
5. 按专项指南执行定向测试、构建和容器验收，记录实际结果。自己的仓也提交 `AGENTS.md` 与相应技能参考文件，不能只保留指向开发机的链接。

## 维护 ur-kit 本身

合同同步、生成器、共享源码及标签发布按[维护指南](../../../CONTRIBUTING.md)和[维护细则](references/maintenance.md)执行。使用方开发业务不需要运行 SaaS 同步脚本；原始定义的变化由平台维护者同步并发布新版本。
