# 缓存迁移

`common/` 提供本地 TTL 缓存和 `LayeredCache` 三级缓存；后者依次读取有界本地内存、可注入的 Redis 存储和可信业务 loader。缓存键沿用 `cache:<name>:<key>`，跨实例失效主题沿用 `server.cache.sync.<name>`。调用方用 `LayeredOptions` 注入 store、事件总线、键格式和可选展示转换；业务变更使用 `Set` 或 `Invalidate`，不能只改数据库。失效代次阻止旧回源重新发布，JSON 快照避免调用方修改返回值污染缓存；Redis 故障时 `Get` 降级到 loader。事件发布在本地发布锁外，允许同步回调。写入和失效操作若返回存储错误，调用方须重试或处理失败，跨节点不保证强一致。

`platform/` 提供企业信息、按企业/用户/项目隔离的权限缓存、用户在线节点和 IM 已送达游标。业务数据由调用方的可信 loader 或存储接口提供，变更后应调用对应 `Invalidate`。游标存储的 `MaxTTL` 必须原子实现，避免乱序 ACK 回退。

`redis/` 实现三级缓存的 `GetString`/`SetTTL`/`SetNXTTL`/`Delete`、在线状态的 TTL 存储及 IM 游标的原子最大值更新；Lua 使用十进制字符串比较，保留大于 JavaScript 安全整数的 64 位 ID。使用 `NewStore(redisClient)` 后可注入 `common.NewLayeredCache`、`platform.NewUserOnlineCache` 和 `platform.NewDeliveredCursor`。

`common/upstream` 与 `platform/upstream` 是 SaaS 当前缓存代码快照，仍保留原始 Redis、事件总线与业务模型依赖；SaaS 服务使用公共接口前还需接入事件适配器并迁移调用点。快照本身不是可发布包。
