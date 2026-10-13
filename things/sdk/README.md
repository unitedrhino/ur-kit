# Things SDK 迁移

`upstream/` 是 SaaS `backend/things/sdk` 固定提交的源码快照，包含 `protocol`、`deviceauth`、`seed`。它保留原始导入关系，当前仅供逐包解耦与对照，不能作为独立可用的 SDK 发布。迁移完成后将稳定 API 移到本目录，并在独立仓通过测试。

`protocol/tracking` 提供独立 MQTT 会话跟踪器，使用调用方注入的 Redis 客户端，并与原 `device:mqtt:*` 和 `device:lastActivity:*` 键及 JSON 消息字段兼容。`Sync`、`ClearClient` 和孤立记录清理在并发重连时只删除旧会话；`Touch`、`TouchMany` 只记录上行活动，不伪造在线状态。`ActiveByProduct` 按产品和时间窗查询活动设备，支持同毫秒大量设备分页；`DeleteActivity` 删除活动记录而不修改会话映射。

`protocol/core` 提供 Things protobuf 客户端注册/心跳、配置页、设备上行信封与下行主题；RPC 入口可直接使用 `core.GRPCRegistry{Client: dm.NewProtocolManageClient(connection)}`。调用方提供事件总线、注册 IP 与可选 Redis 活动记录，执行 `NewProtocol` 后调用 `Start`、`Publish`、`SubscribeDownlink` 和 `Stop`。

`protocol/core.Timer` 将原协议的周期同步任务拆成可注入的 `TimerScheduler`：传入任务组，向 Timer 登记一个或多个处理器后调用 `Start`。它使用与原协议一致的任务代码、主题、优先级和默认十分钟周期；平台触发时运行全部处理器并汇总错误。`core.GRPCTimerScheduler` 可直接使用公开 `timed` pb 的任务组与任务客户端，并通过接入方的 `TimerEventBus` 订阅平台事件。任务 RPC 失败后重试不会重复订阅；需要启动即同步时，接入方显式调用 `RunOnce`。本机 gRPC 集成测试已通过，真实平台事件总线联调仍待完成。

`protocol/mqtt` 提供 QoS 1 发布、共享订阅、EMQX 客户端上下线解析和兼容会话事件。`NewPahoTransport` 使用 Paho 客户端，记录已确认订阅并在自动重连后重新订阅，同时保留调用方的连接回调；先调用 `Connect(ctx)`，再通过 `mqtt.NewProtocol` 注入协议核心、事件总线和可选 `tracking.Tracker`，注册设备消息或连接事件处理器。其他 Broker 客户端可实现 `mqtt.Transport`。真实 Broker 收发测试可设置 `UR_KIT_TEST_MQTT_BROKER=tcp://<broker-host>:1883` 后运行 `go test -race ./things/sdk/protocol/mqtt`；原协议定时任务、设备/产品缓存迁移仍需完成。

`protocol/runtimeconfig.Resolve` 使用公开协议管理 RPC 获取启动配置：无客户端、未找到或空配置时使用本地默认值，RPC 故障和非法 JSON 显式报错；调用方负责传入平台授权上下文。`MergeConfigJSON` 接收调用方自己的配置类型并合并 JSON 覆写，保留未提交字段，允许显式设置 `false`、`0` 和 `null`，不再要求导入 SaaS 内部 `conf` 包。

`protocol/cloud.ConfigManager` 通过注入配置键、相等性和资源初始化函数管理云协议配置；整批更新失败会释放本轮新资源并保留旧版本，成功更新时关闭被替换或删除的旧资源。`GRPCConfigSource` 使用公开 pb 客户端按协议代码分页拉取配置，调用方提供 map 解码函数及带平台授权身份的上下文；`Refresh` 在完整拉取后才更新管理器。`ForEachConfig` 遍历使用该协议的产品，按主协议/子协议选择配置键，并让接入方实现产品设备同步回调；单个产品失败不会阻断其他产品。实际设备同步和平台权限由接入服务实现。

`protocol/cloud.ProductIDMap` 迁移原协议 SDK 的外部产品 ID 映射能力。调用方提供 `GRPCProductSource` 和协议配置字段名（通常为 `productID`），在已有定时任务或事件回调中调用 `Refresh`；分页或重复外部 ID 出错时保留旧快照。`Get` 查询平台产品 ID，`PlatformIDs` 返回副本。`DeviceProtocolConfig` 通过接入方提供的产品查询函数，按产品子协议归属选择设备的主协议或子协议配置。调度器和平台身份仍由接入服务注入。

`cache.NewProductInfoCache`、`cache.NewDeviceInfoCache` 使用公开 `dm` RPC 缓存产品与设备资料。`cache.NewTSLCache` 使用公开物模型 RPC 缓存产品 JSON，并将设备级属性、事件和行为与产品模型合并：同名条目以设备为准，空设备模型继承产品模型；产品 RPC 故障时仅有设备自身模型可降级。缓存键显式包含企业编码，调用方必须提供与该编码一致的可信认证上下文，并在产品或设备变更事件中调用 `InvalidateProduct` / `InvalidateDevice`。产品变更会失效已访问的设备聚合模型，在途旧响应不能回填。返回 JSON 是副本且保留扩展字段；平台内部 `schema.Model` 的完整语义校验与索引构建仍由 SaaS 适配层负责，不能直接用 JSON 聚合结果替换原内部模型。
