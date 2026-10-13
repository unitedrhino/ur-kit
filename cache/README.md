# 缓存迁移

`common/` 提供可独立编译的 TTL 缓存；`platform/` 提供企业信息、按企业/用户/项目隔离的权限缓存、用户在线节点和 IM 已送达游标。业务数据由调用方的可信 loader 或存储接口提供，变更后应调用对应 `Invalidate`。游标存储的 `MaxTTL` 必须原子实现，避免乱序 ACK 回退。

`redis/` 实现在线状态的 TTL 存储及 IM 游标的原子最大值更新；Lua 使用十进制字符串比较，保留大于 JavaScript 安全整数的 64 位 ID。使用 `NewStore(redisClient)` 后可直接注入 `platform.NewUserOnlineCache` 和 `platform.NewDeliveredCursor`。

`common/upstream` 与 `platform/upstream` 是 SaaS 当前缓存代码快照，仍保留原始 Redis、事件总线与业务模型依赖；SaaS 服务使用公共接口前还需接入 Redis/事件适配器并迁移调用点。快照本身不是可发布包。
