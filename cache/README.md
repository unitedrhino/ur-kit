# 缓存迁移

`common/` 提供可独立编译的 TTL 缓存；`platform/` 提供企业信息以及按企业、用户、项目隔离的权限缓存。业务数据由调用方的可信 loader 提供，变更后应调用对应 `Invalidate`。

`common/upstream` 与 `platform/upstream` 是 SaaS 当前缓存代码快照，仍保留原始 Redis、事件总线与业务模型依赖；尚未迁完的在线状态和 IM 已送达游标等行为需在适配接口后逐项迁入。快照本身不是可发布包。
