// 本文件用本机 Redis 模拟服务验证企业 Hash 与原平台键和完整 JSON 的兼容性。
package platform

import (
	"context"
	"encoding/json"
	"sort"
	"strings"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	redisstore "github.com/unitedrhino/ur-kit/cache/redis"
)

// TestTenantDirectoryRedisRoundTrip 验证批量写入、读取、删除和错误批次不落库。
func TestTenantDirectoryRedisRoundTrip(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	t.Cleanup(func() { _ = client.Close() })
	store, err := redisstore.NewStore(client)
	if err != nil {
		t.Fatal(err)
	}
	directory, err := NewTenantDirectory(store)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	first := json.RawMessage(`{"code":"acme","ownerUserID":"9007199254740993","config":{"defaultProjectID":"9223372036854775001"}}`)
	if err := directory.SetMany(ctx, map[string]json.RawMessage{"acme": first, "other": json.RawMessage(`{"code":"other","name":"示例"}`)}); err != nil {
		t.Fatal(err)
	}
	if raw, err := client.HGet(ctx, "tenant", "acme").Result(); err != nil || raw != string(first) {
		t.Fatalf("平台 tenant Hash 不兼容: %s %v", raw, err)
	}
	value, found, err := directory.Get(ctx, "acme")
	if err != nil || !found || !strings.Contains(string(value), `"9223372036854775001"`) {
		t.Fatalf("大整数或完整 JSON 丢失: %s %v %v", value, found, err)
	}
	value[0] = '['
	value, found, err = directory.Get(ctx, "acme")
	if err != nil || !found || value[0] != '{' {
		t.Fatal("调用方修改了已存企业 JSON")
	}
	if err := directory.SetMany(ctx, map[string]json.RawMessage{
		"valid": json.RawMessage(`{"code":"valid"}`),
		"wrong": json.RawMessage(`{"code":"another"}`),
	}); err == nil {
		t.Fatal("不匹配的企业编码未拒绝")
	}
	if _, found, err := directory.Get(ctx, "valid"); err != nil || found {
		t.Fatal("错误批次仍写入了部分企业资料")
	}
	codes, err := directory.Codes(ctx)
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(codes)
	if len(codes) != 2 || codes[0] != "acme" || codes[1] != "other" {
		t.Fatalf("企业编码列表错误: %v", codes)
	}
	if err := directory.Delete(ctx, "acme"); err != nil {
		t.Fatal(err)
	}
	if _, found, err := directory.Get(ctx, "acme"); err != nil || found {
		t.Fatal("企业资料未删除")
	}
}
