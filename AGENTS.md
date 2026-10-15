# ur-kit 开发规范

使用本套件开发应用时，从 [README](README.md) 和[开发技能](.agents/skills/ur-kit-development/SKILL.md)的接入导航开始；平台能力通过公开 SDK、合同与可注入接口接入，无需访问 SaaS 私有源码。下述合同同步规则适用于维护 ur-kit 本身。

本仓公开合同、SDK、中间件、缓存、协议与 IoT 基础应用。SaaS 的 `.api` 和 `.proto` 是合同来源；`contracts/source` 只由 `scripts/sync_contracts.py` 按固定提交生成，禁止直接修改。发布标签后消费者锁定版本，合同变更需记录兼容性和迁移方式。

- `apps/iot-basic/web` 是公开 IoT 客户端；`mobile` 是 uni-app；`backend` 是可运行的最小后端。平台管理端不属于本仓。
- `web-shared/` 是按 SaaS 固定提交导出的共享 Web 包闭包；只通过 `scripts/sync_web_shared.py` 更新，修改快照适配规则应落在该脚本，避免下次同步丢失。
- 可发布的 `things/sdk`、`cache`、`middleware`、`protocols/modbus` 不得导入 SaaS 私有路径；服务特定对象经接口注入。`things/sdk/upstream` 与 `cache/platform/upstream` 仅作原源码对照，含私有导入，不参与公开 SDK 构建。
- HTTP 与 RPC 的身份、权限、错误码、日志、ID、空值与时间单位在 Go、Java、Node 间保持一致；外部请求携带的身份元数据必须先经认证。
- 不提交环境地址、凭据、证书、密钥或测试生产配置。示例只用占位符和本地模拟服务。
- 修改生成器后执行两次同步并检查第二次无差异；修改客户端或中间件后运行相应语言的测试和示例。

## 按开发目标加载指南

- 自定义协议：[协议开发指南](.agents/skills/ur-kit-development/references/protocol-development.md)，包括 MQTT、Modbus、云协议及属性上下行验收。
- 前后端应用：[应用开发指南](.agents/skills/ur-kit-development/references/application-development.md)，包括 Web、uni-app、Go/Java/Node 后端及 Docker。
- 独立项目：[项目规范模板](.agents/skills/ur-kit-development/references/project-rules.md)，复制骨架时带入技能参考文件并修正链接。

新增业务代码不要求更新 SaaS 原始合同。基础后端只示范平台认证；业务授权、企业/项目数据隔离和数据库迁移由应用实现。开发前确认验收条件；交付区分本地模拟、真实平台和硬件测试，跳过不计为通过。
