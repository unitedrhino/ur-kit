# Things SDK 迁移

`upstream/` 是 SaaS `backend/things/sdk` 固定提交的源码快照，包含 `protocol`、`deviceauth`、`seed`。它保留原始导入关系，当前仅供逐包解耦与对照，不能作为独立可用的 SDK 发布。迁移完成后将稳定 API 移到本目录，并在独立仓通过测试。

`protocol/tracking` 提供独立 MQTT 会话跟踪器，使用调用方注入的 Redis 客户端，并与原 `device:mqtt:*` 和 `device:lastActivity:*` 键及 JSON 消息字段兼容。`Sync`、`ClearClient` 和孤立记录清理在并发重连时只删除旧会话；`Touch` 只记录上行活动，不伪造在线状态。

`protocol/core` 提供 Things protobuf 客户端注册/心跳、配置页、设备上行信封与下行主题；RPC 入口可直接使用 `core.GRPCRegistry{Client: dm.NewProtocolManageClient(connection)}`。调用方提供事件总线、注册 IP 与可选 Redis 活动记录，执行 `NewProtocol` 后调用 `Start`、`Publish`、`SubscribeDownlink` 和 `Stop`。

`protocol/mqtt` 提供 QoS 1 发布、共享订阅、EMQX 客户端上下线解析和兼容会话事件。`NewPahoTransport` 使用 Paho 客户端并启用自动重连与订阅恢复；先调用 `Connect(ctx)`，再通过 `mqtt.NewProtocol` 注入协议核心、事件总线和可选 `tracking.Tracker`，注册设备消息或连接事件处理器。其他 Broker 客户端可实现 `mqtt.Transport`。真实 Broker 收发测试可设置 `UR_KIT_TEST_MQTT_BROKER=tcp://<broker-host>:1883` 后运行 `go test -race ./things/sdk/protocol/mqtt`；原协议定时任务、设备/产品缓存迁移仍需完成。

`protocol/runtimeconfig.MergeConfigJSON` 接收调用方自己的配置类型并合并 JSON 覆写，保留未提交字段，允许显式设置 `false`、`0` 和 `null`，不再要求导入 SaaS 内部 `conf` 包。

`protocol/cloud.ConfigManager` 通过注入配置键、相等性和资源初始化函数管理云协议配置；整批更新失败会释放本轮新资源并保留旧版本，成功更新时关闭被替换或删除的旧资源。它不代替原协议的云配置拉取和设备同步。
