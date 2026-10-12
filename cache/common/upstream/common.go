package caches

import (
	"github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/kv"
	"sync"
)

var (
	once  sync.Once
	store kv.Store
)

func InitStore(c cache.ClusterConf) {
	once.Do(func() { store = kv.NewStore(c) })
}

// SetStoreForTest 测试专用注入口：注入内存 kv.Store（如基于 miniredis 的 store）替换全局 store
// 解决 InitStore 的 sync.Once 在测试进程中只能初始化一次的问题
// 实现上将 once 标记为已执行，防止后续 InitStore 再次覆盖注入的 store
// 仅供测试代码（*_test.go、share/testkit）调用，生产代码禁止使用
func SetStoreForTest(s kv.Store) {
	once.Do(func() {}) // 标记 once 已执行，阻止后续 InitStore 覆盖
	store = s
}
func GetStore() kv.Store {
	return store
}
