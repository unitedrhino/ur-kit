// 本文件管理云协议的配置生命周期；平台查询和具体协议初始化由调用方注入。
package cloud

import (
	"context"
	"errors"
	"sort"
	"sync"
)

// Options 定义协议配置标识、相等性和资源初始化函数。
type Options[C any] struct {
	Key     func(C) string
	Equal   func(C, C) bool
	Prepare func(context.Context, C) (func(), error)
}

// entry 保存一项已生效配置及其需要在替换时释放的资源。
type entry[C any] struct {
	config C
	close  func()
}

// ConfigManager 以单次提交的方式同步云协议配置并管理资源释放。
type ConfigManager[C any] struct {
	applyMu sync.Mutex
	mu      sync.RWMutex
	options Options[C]
	items   map[string]entry[C]
	closed  bool
}

// NewConfigManager 要求调用方提供稳定配置键、相等性和资源初始化行为。
func NewConfigManager[C any](options Options[C]) (*ConfigManager[C], error) {
	if options.Key == nil || options.Equal == nil || options.Prepare == nil {
		return nil, errors.New("cloud configuration key, equality and initializer are required")
	}
	return &ConfigManager[C]{options: options, items: make(map[string]entry[C])}, nil
}

// Reconcile 按完整配置列表更新状态；准备阶段失败时保留原配置并释放新建资源。
func (manager *ConfigManager[C]) Reconcile(ctx context.Context, configs []C) error {
	if manager == nil {
		return errors.New("cloud configuration manager is required")
	}
	manager.applyMu.Lock()
	defer manager.applyMu.Unlock()
	manager.mu.RLock()
	if manager.closed {
		manager.mu.RUnlock()
		return errors.New("cloud configuration manager is closed")
	}
	old := manager.items
	manager.mu.RUnlock()
	newConfigs := make(map[string]C, len(configs))
	for _, config := range configs {
		key := manager.options.Key(config)
		if key == "" {
			return errors.New("cloud configuration key is empty")
		}
		if _, exists := newConfigs[key]; exists {
			return errors.New("duplicate cloud configuration key")
		}
		newConfigs[key] = config
	}
	keys := make([]string, 0, len(newConfigs))
	for key := range newConfigs {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	prepared := make(map[string]entry[C], len(newConfigs))
	newClose := make([]func(), 0, len(newConfigs))
	for _, key := range keys {
		config := newConfigs[key]
		if previous, exists := old[key]; exists && manager.options.Equal(previous.config, config) {
			prepared[key] = previous
			continue
		}
		if err := ctx.Err(); err != nil {
			closeAll(newClose)
			return err
		}
		closeFunc, err := manager.options.Prepare(ctx, config)
		if err != nil {
			if closeFunc != nil {
				closeFunc()
			}
			closeAll(newClose)
			return err
		}
		prepared[key] = entry[C]{config: config, close: closeFunc}
		newClose = append(newClose, closeFunc)
	}
	if err := ctx.Err(); err != nil {
		closeAll(newClose)
		return err
	}
	manager.mu.Lock()
	manager.items = prepared
	manager.mu.Unlock()
	for key, previous := range old {
		if current, exists := prepared[key]; !exists || !manager.options.Equal(previous.config, current.config) {
			if previous.close != nil {
				previous.close()
			}
		}
	}
	return nil
}

// closeAll 释放本轮准备的新资源，不影响此前已生效的配置。
func closeAll(functions []func()) {
	for _, closeFunc := range functions {
		if closeFunc != nil {
			closeFunc()
		}
	}
}

// Get 返回指定键的当前配置；不存在时第二个返回值为 false。
func (manager *ConfigManager[C]) Get(key string) (C, bool) {
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	if item, exists := manager.items[key]; exists {
		return item.config, true
	}
	var empty C
	return empty, false
}

// List 按配置键顺序返回当前配置快照。
func (manager *ConfigManager[C]) List() []C {
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	keys := make([]string, 0, len(manager.items))
	for key := range manager.items {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := make([]C, 0, len(keys))
	for _, key := range keys {
		result = append(result, manager.items[key].config)
	}
	return result
}

// Close 只释放当前生效资源一次，并拒绝后续更新。
func (manager *ConfigManager[C]) Close() {
	if manager == nil {
		return
	}
	manager.applyMu.Lock()
	defer manager.applyMu.Unlock()
	manager.mu.Lock()
	if manager.closed {
		manager.mu.Unlock()
		return
	}
	manager.closed = true
	old := manager.items
	manager.items = nil
	manager.mu.Unlock()
	for _, item := range old {
		if item.close != nil {
			item.close()
		}
	}
}
