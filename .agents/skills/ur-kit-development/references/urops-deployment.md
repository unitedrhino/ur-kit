# 通过 urops 部署自己的应用与协议网关

本指南对应支持 `urops app` 的版本；先用 `urops app --help` 核对已安装版本，未发布此能力的旧版不能使用下列命令。这里只说明本机独立部署，目标环境地址、凭据和配置由使用方提供。

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
