# 开发自己的设备协议

本文所有源码路径均相对 ur-kit 根目录。先读 [Things SDK](../../../../things/sdk/README.md)，按需打开下表中的公开实现及其同目录测试；`upstream/` 仅供来源对照，不能复制为可运行服务。

Go、goctl、protoc 和插件安装，以及自有 Proto 初始化命令见[开发环境准备](../../../../docs/development-setup.md)。仅调用公开 pb 不需要重新生成平台合同；协议自己的认证/同步 RPC 使用自己的 Proto。

## 1. 确认输入与代码归属

开始前列清：设备身份和认证算法、传输方式、上行/下行报文样本、属性标识及类型、时间单位、控制应答、超时和重试规则。Modbus 还需点表、单元号、地址基准、字节/字序、缩放和串口参数；MQTT 还需主题、QoS、Broker 设备认证与 ACL 配置。SDK 不会从厂家名称推导这些内容。

独立服务建议按以下职责组织（是新项目布局，不是要求修改套件目录）：

```text
my-protocol/
├── AGENTS.md
├── .agents/skills/ur-kit-development/   # 所用技能及参考文件
├── cmd/gateway/                       # 配置、依赖装配、启动与退出
├── internal/config/                   # 本地默认值与平台配置类型
├── internal/codec/                    # 厂家报文与物模型转换
├── internal/gateway/                  # 设备连接、采集、控制和应答
├── internal/platform/                 # 公开 RPC、事件总线与存储适配
├── testdata/                          # 脱敏报文和点表
├── Dockerfile
└── compose.yaml
```

在自己的 Go module 中执行 `go get github.com/unitedrhino/ur-kit@v0.2.36`，不引入 SaaS 的 `service/.../client`、`internal/svc` 或 `platformcore`。标准 gRPC 连接只引用公开 pb；依赖的模块、服务名及方法以该标签合同为准。Java/Node 可使用公开 HTTP/RPC 客户端和中间件；本文的协议运行时和 Modbus 驱动是 Go 包，其他语言须自行实现对应运行时适配。

## 2. 选择组件并装配平台连接

| 需要的能力 | 公开入口与参考文件 |
| --- | --- |
| 协议注册、心跳、设备消息信封、下行、停止 | [core](../../../../things/sdk/protocol/core/core.go)、[生命周期测试](../../../../things/sdk/protocol/core/core_test.go) |
| 服务间 gRPC、协议配置读取 | [RPC 客户端](../../../../sdks/go/rpcclient/README.md)、[runtimeconfig](../../../../things/sdk/protocol/runtimeconfig/source.go) |
| NATS 消息总线 | [natsbus](../../../../things/sdk/protocol/natsbus/bus.go) |
| MQTT 设备收发和重订阅 | [mqtt](../../../../things/sdk/protocol/mqtt/mqtt.go)、[Paho](../../../../things/sdk/protocol/mqtt/paho.go) |
| 设备认证接口 | [deviceauth](../../../../things/sdk/deviceauth) |
| MQTT 会话与最后活动时间 | [tracking](../../../../things/sdk/protocol/tracking/tracking.go) |
| 云配置和产品设备同步 | [cloud](../../../../things/sdk/protocol/cloud)、[运行时集成测试](../../../../things/sdk/protocol/cloud/runtime_integration_test.go) |
| 设备/产品缓存和物模型校验 | [cache](../../../../things/sdk/cache)、[schema](../../../../things/sdk/schema) |
| Modbus 点位读写和模拟设备 | [Modbus 说明](../../../../protocols/modbus/README.md)、[可运行例子](../../../../protocols/modbus/cmd/demo/main.go) |

平台接入须由平台管理员提供：Things RPC 的服务发现或连接地址及服务认证方式、NATS 的连接/账号及主题授权、按需提供 Redis、Broker 连接和管理 API 权限。仅有 HTTP 根地址和登录令牌，不能假定可以访问平台内部 RPC、NATS 或 Redis。不要让 AI 伪造 root 元数据绕过服务认证。

装配顺序：

1. 创建带 TLS/服务认证拦截器的标准 gRPC 连接，用 `dm.NewProtocolManageClient(connection)` 构造 `core.GRPCRegistry`。`rpcclient` 的令牌拦截器用于平台允许的应用 RPC；服务间认证按平台实际合同配置。
2. 连接消息总线。平台使用普通 NATS 时可创建 `natsbus.New(natsbus.Options{Conn: connection, Queue: protocolCode, Logger: logger})`；队列组、主题及消息格式须与平台路由一致。同协议的负载分担实例共享队列组。需要持久重投时注入符合 `core.Bus` 的持久总线适配器。
3. 构造 `core.Options`，至少设置 `Info`（含唯一 `Code`）、`Registry`、`Bus`、`RegisterIP`；注册 IP 必须是平台可达地址。需要认证或同步等协议 RPC 时实现公开服务接口并通过 `RPCRegistrars` 注册，同时配置 `RPCListenAddr` 及认证/授权拦截器。心跳不会自动实现这些 RPC。
4. 调用 `core.NewProtocol`，登记下行处理器和资源清理回调，调用 `Start(ctx)`；确认注册与首次心跳成功后再开始采集/消费。任何后续启动失败都要停止已经启动的资源。停止时调用 `Stop()`，并关闭自己持有的总线、RPC、设备连接；总线适配器的 `Close()` 不会代替关闭外部 NATS 连接。
5. 有平台运行配置时先用 `runtimeconfig.Resolve` 按自己的类型读取/合并；未找到保留默认值，RPC 故障不能当作未配置。显式 `null` 会覆盖原值，构造运行配置时不要序列化无意覆盖的空字段。

MQTT 分支：先 `NewPahoTransport`、`Connect(ctx)`，再用 `mqtt.NewProtocol` 和 `SubscribeDevMsg`/`SubscribeDevConn` 装配。连接事件先验证身份和所属协议再 `ReportDevConn`；Broker 认证和 ACL 仍须接入真实设备认证服务，SDK 创建 MQTT 连接本身不会给设备配置权限。EMQX `$SYS` 连接事件格式不能直接套用到其他 Broker；有 Hook 时实现对应事件适配。断线恢复需验证原已确认订阅重新生效。

云协议分支：用 `cloud.ConfigManager` 初始化云连接；配置 `GRPCConfigSource`，可配 `ProductIDMap`、`GRPCDeviceSource`、`RegisterDeviceSync` 和 `core.Timer`。最后由 `cloud.NewRuntime(...).Start(ctx)` 统一启动，不再重复调用底层 `Base.Start`。全量配置拉取失败保留原快照；更新订阅必须可取消。

产品、设备和物模型缓存按企业编码隔离；回源 RPC 使用同一企业的可信授权上下文。在产品/设备变更订阅中调用相应 `InvalidateProduct`/`InvalidateDevice`，仅配置 TTL 不等于已接入平台变更通知。分页错误或模型校验失败不能发布部分配置，也不能用空快照覆盖仍有效的数据。

## 3. 打通属性上报与属性控制

### 属性上报

设备报文 → 厂家解码 → 校验设备归属和物模型 → `core.Message` → `core.Publish` → 平台消费、存储 → 通过平台查询接口读回。

- `ProductID`、`DeviceName` 必须来自已验证映射，不能直接信任报文中的其他设备身份。
- `Handle`、`Type`、`Topic` 及 `Payload` 内部 JSON 必须符合平台该协议的物模型消息合同。`core.Publish` 只封装信封，不替你把厂家 JSON 转为平台属性格式；从所锁版本的 [协议合同](../../../../contracts/source) 和平台提供的合法报文样本核对。
- `Payload` 是 `[]byte`，外层 JSON 编码按 Go 字节数组规则处理；不要再手工给它套一层 Base64。`Timestamp`、`ReceivedTime` 是毫秒，未填时 SDK 使用当前毫秒值；若厂家用秒，解码阶段显式转换。
- SDK 上行总线主题为 `device.up.<Handle>.<ProductID>.<DeviceName>`，协议代码由核心填入。总线发送成功不证明平台已经写入，必须查询实际属性值。

普通属性消息使用 `Handle="thing"`、`Type="property"`。例如温度模型已经定义 `temperature` 时，`Payload` 的原始 JSON 可以是：

```json
{
  "method": "report",
  "msgToken": "sample-report-1",
  "timestamp": 1792022400000,
  "sys": {"noAsk": true},
  "params": {"temperature": 42.25}
}
```

运行时使用实际毫秒时间和不重复的消息标识；`noAsk=true` 表示不要求平台回复此条上报。这是转换后的平台报文，厂家 MQTT 原始主题/数据可以不同；协议负责转换，属性标识须与产品或设备物模型一致。

### 属性控制

平台控制 API → `device.down.<协议Code>.>` → `SubscribeDownlink` → 核对目标与物模型 → 厂家编码 → 实际设备 → 厂家应答 → 按合同上报应答/属性 → 平台读回。

- `SubscribeDownlink` 给出解析后的 `*core.Message`；处理器需验证目标设备由本协议管理、参数可写、取值与类型合法，不能按任意主题转发。
- MQTT 用 `PublishToDev`；Modbus 根据点表调用 `WritePoint` 或相应写入方法，只读点拒绝写入。位域读改写与同设备并发控制须串行化。
- 按消息 ID 关联超时、重试和应答，重复命令按厂家能力去重。确认发送成功、Broker 确认、设备执行成功分别记录；网关返回 `200` 不能当作真实硬件执行成功。
- MQTT 用验证后的会话报告上下线；非 MQTT 用 `core.ReportConnection`，设备掉线后停止使用旧会话，恢复连接后继续采集。UDP `Probe` 成功不证明设备在线。

属性控制的 `Handle`/`Type` 同为 `thing`/`property`，`Payload` 示例：

```json
{
  "method": "control",
  "msgToken": "sample-control-1",
  "params": {"temperature": 43.5}
}
```

完成设备交互后，按平台应答合同通过同一设备的属性上行信封发布结果，例如成功报文 `{"method":"controlReply","msgToken":"sample-control-1","code":200,"msg":"ok"}`。应答 `msgToken` 必须取下行原值；失败按实际合同返回错误，不无条件上报成功。只有厂商协议确认了执行，才能把结果记录为设备执行成功；随后采集或读取属性确认真实值。

## 4. 定向验证与 Docker 交付

先在 ur-kit 根目录运行不依赖外部环境的例子：

```sh
go run ./protocols/modbus/cmd/demo
```

预期输出 `holding register 10: 42 -> 258`。自己的仓运行编解码失败/成功样本和网关集成测试；修改 SDK 才在 ur-kit 根目录运行 `go test -race ./things/sdk/protocol/... ./protocols/modbus/...`。真实 Broker/NATS 测试需显式配置，跳过不能记作通过，开关见 Things SDK README。

自己的集成测试至少断言：

- 错误身份、跨设备主题、通配订阅和系统主题按 ACL 拒绝；合法消息实际送达。
- 属性上报后平台读回数值、设备、时间和单位一致；控制后检查设备收到的报文/寄存器及平台结果。
- 设备正常与异常断线、网关断线重连、恢复订阅、配置变更后连接切换、停止后的端口/订阅释放。
- Modbus 覆盖点表字节序、缩放、异常帧、超时及恢复；硬件验收使用真实设备参数。

Dockerfile 使用多阶段编译自己的网关，运行阶段只含二进制和必要运行文件；Compose 注入配置、按需映射协议端口与串口设备。配置页/认证 RPC 存在时确保平台注册地址和暴露端口一致；设备存活与服务健康分别检查。仅本地验证，不凭历史环境信息部署远程。交付记录使用的 SDK 标签、镜像版本、测试条件、实际通过项和待硬件验证项。


## 部署与平台管理边界

协议网关可按[urops 部署指南](urops-deployment.md)使用自己的 Compose 在目标主机安装、更新、停止和查看日志；云端仅查看已注册网关资料与近期心跳，不再在云主机拉镜像或操作容器。注册应用/菜单、平台代理/Web 路由和任务消费见[平台注册指南](platform-registration.md)。
