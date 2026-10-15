# ur-kit 贡献与维护

本文面向修改 ur-kit 本身的维护者。接入 SDK、设备协议或基础应用，请从 [使用说明](README.md) 开始。

## 开发约束

先阅读 [AGENTS.md](AGENTS.md) 与 [ur-kit 开发技能](.agents/skills/ur-kit-development/SKILL.md)。公开 Go 包及其模块依赖不得引入 SaaS 私有源码；平台特定能力通过接口注入。不要提交目标环境地址、凭据或密钥。

## 同步接口合同和原始快照

SaaS 的 `.api` / `.proto` 是合同来源，来源提交记录在 `contracts/manifest.json`。有源仓权限的维护者从 SaaS 工作树运行：

```sh
bash shell/sync-ur-kit-contracts.sh --kit "<ur-kit仓库路径>" --sha "<40位SaaS提交SHA>"
```

总入口同步合同、Go pb、Things SDK、物模型、Modbus 和公共/平台缓存快照，并保护未提交的快照改动。需要核对服务生成物时追加 `--build core:<服务名>` 或 `--build things:<服务名>`；若 `build.sh` 改变了生成物，先审查并提交 SaaS 结果，再用新提交同步。不要手工修改生成快照。

`cache/*/upstream`、`things/sdk/upstream` 与 `protocols/modbus/upstream` 保留源代码对照，独立模块隔离了原始私有导入。它们不属于可消费 SDK；修改公开实现及同步适配规则时，核对逐文件来源和哈希。

Core/Things 强类型 HTTP 客户端的生成与语言验证见 [生成客户端](sdks/openapi/README.md)。Java protobuf 消息与 Stub 通过 `python3 scripts/generate_java_pb.py` 从仓内合同生成，无需在使用者环境访问 SaaS 源仓。

## 更新共享 Web 包

`web-shared/` 来源记录在 `web-shared/source.json`。在干净的 SaaS 工作树上确认固定提交后，从 ur-kit 根目录运行：

```sh
python3 scripts/sync_web_shared.py --saas "<saas-worktree>" --sha "<40位提交SHA>"
python3 scripts/configure_web_workspace.py
node scripts/verify_iot_basic.mjs --print
```

审阅合同与共享包的兼容性，再更新 `apps/iot-basic/ur-kit.lock.json`，随后验证：

```sh
node scripts/verify_iot_basic.mjs
pnpm install --frozen-lockfile
pnpm -r run stub --if-present
pnpm --filter org-iot-client build
```

锁文件同时校验合同与共享包的来源及内容摘要；构建不得自动更新它。快照的适配修改应落在同步脚本，避免下一次更新覆盖。

## 验证与发布

按本次改动选择验证范围，具体命令见开发技能：

- 修改生成器后同步两次，确认第二次无差异。
- 修改 Go / Java / Node 客户端或中间件后，核对认证、ID 精度、空值、错误码和时间单位，并验证对应语言的实际请求。
- 修改缓存、协议或 Modbus 时运行对应测试；外部设备与平台联调所需配置由测试环境注入。
- Web 本地回归使用 `pnpm --filter org-iot-client test:unit` 与 `pnpm --filter org-iot-client test:e2e`；移动端在自己的目录独立安装与验证。
- 基础应用的 Go 测试在 `apps/iot-basic/backend` 执行 `go test ./...`；镜像需验证健康检查、深层页面、认证接口及平台代理。

发布标签前按开发技能完成合同生成和语言验证。发布后执行：

```sh
bash scripts/test_external_consumer.sh --version "<vX.Y.Z>"
```

该脚本在仓外验证真实 RPC 和公共组件，并检查全部公开 Go 包及模块图没有私有 SaaS 依赖。维护阶段使用本地 SDK 工作树验证时，可省略 `--version`。

应用按 Git 标签锁定 SDK，合同版本与来源以 `contracts/manifest.json` 为准；不要把包内版本号当作合同版本。接口或行为变更应写清兼容性与迁移方式。


## 打包独立开发技能

技能源继续维护在 `.agents/skills/ur-kit-development/`；无需新建重复的顶层技能。从已审查的固定提交生成 ZIP：

```sh
python3 scripts/package_development_skill.py --ref <标签或完整提交SHA> --output .temp/skills
```

脚本只读取该提交的 Git 跟踪文件，包含完整参考文件和 `_meta.json` 来源清单。技能内导航保留相对路径；指向仓库源码、AGENTS 和 README 的链接会转换为公开 GitHub 固定提交链接。缺少来源或链接目标时打包失败，同一提交重复打包的 SHA256 应一致。

将生成的 `ur-kit-development-<完整SHA>.zip` 及其 SHA256 随经授权的发布提供下载。使用支持 `--skill` 的 CLI，以 `ur skills download --skill ur-kit-development --url <该ZIP的固定地址> --json` 验收；核对实际解压目录、技能名、参考文件、来源提交和安装指引。开发技能发布不等于 CLI 已发布，新参数须随 CLI 正常发布流程交付后才能要求旧版用户使用。
