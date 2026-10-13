# Things SDK 迁移

`upstream/` 是 SaaS `backend/things/sdk` 固定提交的源码快照，包含 `protocol`、`deviceauth`、`seed`。它保留原始导入关系，当前仅供逐包解耦与对照，不能作为独立可用的 SDK 发布。迁移完成后将稳定 API 移到本目录，并在独立仓通过测试。

`protocol/tracking` 已提供独立的 MQTT 会话跟踪器，使用调用方注入的 Redis 客户端，并与原 `device:mqtt:*` 和 `device:lastActivity:*` 键及 JSON 消息字段兼容。`Sync`、`ClearClient` 和孤立记录清理在并发重连时只删除旧会话；原 `protocol` 的协议启动、云协议与 MQTT 收发仍处于解耦中，不能以此子包通过测试代替整个 SDK 验收。
