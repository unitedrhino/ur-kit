# Things SDK 迁移

`upstream/` 是 SaaS `backend/things/sdk` 固定提交的源码快照，包含 `protocol`、`deviceauth`、`seed`。它保留原始导入关系，当前仅供逐包解耦与对照，不能作为独立可用的 SDK 发布。迁移完成后将稳定 API 移到本目录，并在独立仓通过测试。
