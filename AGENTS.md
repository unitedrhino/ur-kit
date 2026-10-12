# ur-kit 开发规范

本仓公开合同、SDK、中间件、缓存、协议与 IoT 基础应用。SaaS 的 `.api` 和 `.proto` 是合同来源；`contracts/source` 只由 `scripts/sync_contracts.py` 按固定提交生成，禁止直接修改。发布标签后消费者锁定版本，合同变更需记录兼容性和迁移方式。

- `apps/iot-basic/web` 是公开 IoT 客户端；`mobile` 是 uni-app；`backend` 是可运行的最小后端。平台管理端不属于本仓。
- `things/sdk`、`cache`、`middleware`、`protocols/modbus` 不得导入 SaaS 私有路径；服务特定对象经接口注入。
- HTTP 与 RPC 的身份、权限、错误码、日志、ID、空值与时间单位在 Go、Java、Node 间保持一致；外部请求携带的身份元数据必须先经认证。
- 不提交环境地址、凭据、证书、密钥或测试生产配置。示例只用占位符和本地模拟服务。
- 修改生成器后执行两次同步并检查第二次无差异；修改客户端或中间件后运行相应语言的测试和示例。

开发入口见 [开发技能](.agents/skills/ur-kit-development/SKILL.md)。
