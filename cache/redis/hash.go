// 本文件把 Redis Hash 操作适配为平台业务缓存所需的最小接口。
package redisstore

import (
	"context"
	"errors"

	"github.com/redis/go-redis/v9"
)

// HashSet 设置一个 Hash 字段。
func (store *Store) HashSet(ctx context.Context, key, field, value string) error {
	if key == "" || field == "" {
		return errors.New("hash key and field are required")
	}
	return store.Client.HSet(ctx, key, field, value).Err()
}

// HashSetMany 在一个 Redis 命令中设置多个 Hash 字段。
func (store *Store) HashSetMany(ctx context.Context, key string, values map[string]string) error {
	if key == "" || len(values) == 0 {
		return errors.New("hash key and values are required")
	}
	for field := range values {
		if field == "" {
			return errors.New("hash field is required")
		}
	}
	return store.Client.HSet(ctx, key, values).Err()
}

// HashGet 读取一个 Hash 字段；不存在时返回 found=false。
func (store *Store) HashGet(ctx context.Context, key, field string) (string, bool, error) {
	if key == "" || field == "" {
		return "", false, errors.New("hash key and field are required")
	}
	value, err := store.Client.HGet(ctx, key, field).Result()
	if errors.Is(err, redis.Nil) {
		return "", false, nil
	}
	return value, err == nil, err
}

// HashDelete 删除一个 Hash 字段。
func (store *Store) HashDelete(ctx context.Context, key, field string) error {
	if key == "" || field == "" {
		return errors.New("hash key and field are required")
	}
	return store.Client.HDel(ctx, key, field).Err()
}

// HashKeys 返回 Hash 中全部字段名。
func (store *Store) HashKeys(ctx context.Context, key string) ([]string, error) {
	if key == "" {
		return nil, errors.New("hash key is required")
	}
	return store.Client.HKeys(ctx, key).Result()
}
