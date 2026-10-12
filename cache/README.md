# 缓存迁移

`common/upstream` 与 `platform/upstream` 是 SaaS 当前缓存代码快照，保留原始依赖；需先将 Redis、事件总线、租户模型依赖改为接口，再提供可独立编译的公共与业务缓存 API。快照本身不是可发布包。
