# 通过 urops 部署自己的应用与协议网关

本指南对应支持 `urops app` 的版本；先用 `urops app --help` 核对已安装版本，未发布此能力的旧版不能使用下列命令。这里只说明本机独立部署，目标环境地址、凭据和配置由使用方提供。

## 从开发到运维的工具分工

1. **用 ur 准备技能**：开发技能是 `ur-kit-development`，API 操作技能是 `ur-api`。按[下载说明](../../../../README.md#通过-ur-下载开发技能)核对 CLI 能力，下载固定来源的完整技能目录并保留 `references/` 和 `_meta.json`；AI 的项目规则引用实际技能入口。没有公开 ZIP 资产时，从固定 ur-kit 提交获取源码，不编造下载地址。
2. **用 ur-kit 开发**：从自己的应用/协议项目引用固定 SDK 标签，使用公开客户端、中间件和缓存；完成业务后端、Web/移动端或设备协议及对应测试。源合同、服务地址与授权范围各自明确。
3. **用 ur 或服务自注册接入平台**：通过真实授权调用已开放的管理 API，登记/核验应用、菜单与业务数据；平台代理服务自注册和 timed 消费者按[注册指南](platform-registration.md)实现。配置提供的身份和权限不能由 CLI 或 SDK 自动放大。
4. **构建并交付镜像**：自己的仓保存 Dockerfile、Compose 和健康检查；先构建并测试镜像，再给部署主机提供不可变镜像版本及所需配置。IoT 基础应用从仓根执行 `docker compose -f apps/iot-basic/compose.yaml build`；它需要事先配置示例要求的变量。远端主机还需能从自己选定的镜像仓取得该镜像。
5. **用 urops 部署并验收**：TUI 填表或 `app up` 读取上述 Compose 与变量文件，等待健康结果；随后用 ur、应用页面或设备调试工具核验真实登录、权限与业务结果。网关还需实际验证认证、上下线、属性上报/控制与订阅；容器健康不能替代这些结果。

三者复用平台的身份与合同，各自配置分开：ur 使用操作者的 API 凭据，应用/网关使用自己的运行配置，urops 登记主机上的 Compose/变量文件路径。不要把操作者令牌固化进镜像或公开仓。升级记录应分别保存 SDK 标签、技能来源、工具版本和业务镜像版本。

## 应用自带配置

- 应用仓保存 Dockerfile、Compose 模板和配置说明，业务镜像使用固定版本；Web 与 Go 同容器的基础应用模板见 [Dockerfile](../../../../apps/iot-basic/Dockerfile) 与 [Compose](../../../../apps/iot-basic/compose.yaml)。
- 准备实际运行的 Compose 文件和可选变量文件，敏感值不提交公开仓。Compose 的相对挂载、环境文件和构建上下文以配置文件所在目录解析。
- 私有镜像先使用目标仓库的 `docker login`，urops 沿用当前用户的 Docker 认证，不把平台内置仓库账号用于任意私有仓。
- 部署镜像应已构建；本命令使用 Compose 的镜像拉取策略，不替使用方执行源码构建或向仓库发布镜像。

## 登记并部署

```sh
urops app up --name my-app --file <应用compose.yml> --env-file <本机变量文件> --json
urops app list --json
urops app status --name my-app --json
urops app logs --name my-app --lines 100 --json
```

首次 `up` 校验 Compose 后登记绝对路径，以后可省略 `--file` 和 `--env-file`。urops 使用独立项目名 `urops-app-<名称>`，不会复用内置平台的 Compose 项目；应用配置也应避免占用其他部署的固定容器名、端口或外部资源。状态目录默认位于当前 urops 配置下的 `apps/`，可用 `--state-dir` 为整个应用命令组指定另一个目录。

`up` 等待 Compose 服务运行和已声明的健康检查；服务未配置健康检查时，运行状态不代表业务就绪，应在自己的 Compose 中补健康检查并实际调用业务入口。`--wait-timeout` 控制就绪等待，`--pull missing|always|never` 控制拉取；离线验证使用本机已有镜像与 `--pull never`。

升级时修改应用配置中的不可变镜像版本，再运行 `urops app up --name my-app --json`。回滚时恢复先前配置的镜像版本，再执行同一命令；数据库与存量数据兼容性由应用迁移规则保证，不能仅回滚镜像就假定数据已回滚。

```sh
urops app stop --name my-app --json
```

`stop` 保留登记与数据；本入口不执行删除卷、卸载数据或整个平台重建。配置文件由应用维护，登记不会复制/展开凭据内容；需保留原文件供后续状态、日志及重启使用。Linux TUI 无需先执行登记命令：打开“自定义应用与协议网关 → 部署新应用/协议网关”，输入名称、Compose 路径和可选变量文件路径，核对摘要后确认部署。路径可包含空格，不加引号；输入错误可纠正，取消不启动部署。完成后返回即可看到新登记应用，并可查看状态、日志、更新或停止。

## 协议网关同样接入

网关仓提供自己的 Compose：配置网关镜像、RPC/设备端口、配置文件、平台 RPC 与消息总线连接及服务认证。TCP/UDP/串口、证书、设备映射和可选 Redis 均按具体网关需求声明，再用同一条 `urops app up --name <网关名称> --file <网关compose.yml>` 部署。

网关启动后自行向 Things 注册并持续心跳，平台地址必须能访问登记的 RPC 端点。设备流量与平台 RPC 的可达性分别验证，Compose 健康不能代替设备消息验收；属性上报与控制按[协议开发指南](protocol-development.md)验证。

云端协议网关页面只查看已登记资料与服务心跳；安装、升级、停止和镜像拉取在目标主机通过 urops 完成。旧云端容器管理写接口保留原合同并返回 urops 迁移提示，不再操作云主机 Docker；平台显示的在线状态表示近期心跳，并非远程 Docker Inspect 结果。
