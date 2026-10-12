package protocol

import (
	"context"
	"encoding/json"
	"sort"
	"testing"

	"gitee.com/unitedrhino/things/share/devices"
	"github.com/stretchr/testify/require"
	"github.com/zeromicro/go-zero/core/stores/redis"
)

type mqttTrackingStore interface {
	HgetCtx(ctx context.Context, key, field string) (string, error)
	HsetCtx(ctx context.Context, key, field, value string) error
	HdelCtx(ctx context.Context, key, field string) (bool, error)
	HgetallCtx(ctx context.Context, key string) (map[string]string, error)
	ZaddCtx(ctx context.Context, key string, score int64, value string) (bool, error)
	ZremCtx(ctx context.Context, key string, values ...any) (int, error)
	ZrangeCtx(ctx context.Context, key string, start, stop int64) ([]string, error)
	ZcardCtx(ctx context.Context, key string) (int, error)
	ZrevrangebyscoreWithScoresAndLimitCtx(ctx context.Context, key string, start, stop int64, page, size int) ([]redis.Pair, error)
	ExpireCtx(ctx context.Context, key string, seconds int) error
}

type fakeMqttTrackingStore struct {
	hashes map[string]map[string]string
	zsets  map[string]map[string]int64
	expire map[string]int
}

func newFakeMqttTrackingStore() *fakeMqttTrackingStore {
	return &fakeMqttTrackingStore{
		hashes: map[string]map[string]string{},
		zsets:  map[string]map[string]int64{},
		expire: map[string]int{},
	}
}

func (f *fakeMqttTrackingStore) HgetCtx(_ context.Context, key, field string) (string, error) {
	if v, ok := f.hashes[key]; ok {
		if fieldVal, exists := v[field]; exists {
			return fieldVal, nil
		}
	}
	return "", redis.Nil
}

func (f *fakeMqttTrackingStore) HsetCtx(_ context.Context, key, field, value string) error {
	if _, ok := f.hashes[key]; !ok {
		f.hashes[key] = map[string]string{}
	}
	f.hashes[key][field] = value
	return nil
}

func (f *fakeMqttTrackingStore) HdelCtx(_ context.Context, key, field string) (bool, error) {
	if _, ok := f.hashes[key]; !ok {
		return false, nil
	}
	_, exists := f.hashes[key][field]
	delete(f.hashes[key], field)
	return exists, nil
}

func (f *fakeMqttTrackingStore) HgetallCtx(_ context.Context, key string) (map[string]string, error) {
	if v, ok := f.hashes[key]; ok {
		out := make(map[string]string, len(v))
		for k, vv := range v {
			out[k] = vv
		}
		return out, nil
	}
	return map[string]string{}, nil
}

func (f *fakeMqttTrackingStore) ZaddCtx(_ context.Context, key string, score int64, value string) (bool, error) {
	if _, ok := f.zsets[key]; !ok {
		f.zsets[key] = map[string]int64{}
	}
	_, existed := f.zsets[key][value]
	f.zsets[key][value] = score
	return !existed, nil
}

func (f *fakeMqttTrackingStore) ZremCtx(_ context.Context, key string, values ...any) (int, error) {
	set := f.zsets[key]
	if set == nil {
		return 0, nil
	}
	n := 0
	for _, v := range values {
		if s, ok := v.(string); ok {
			if _, exists := set[s]; exists {
				delete(set, s)
				n++
			}
		}
	}
	return n, nil
}

func (f *fakeMqttTrackingStore) ZrangeCtx(_ context.Context, key string, start, stop int64) ([]string, error) {
	set := f.zsets[key]
	if set == nil {
		return []string{}, nil
	}
	out := make([]string, 0, len(set))
	for k := range set {
		out = append(out, k)
	}
	return out, nil
}

func (f *fakeMqttTrackingStore) ZcardCtx(_ context.Context, key string) (int, error) {
	set := f.zsets[key]
	return len(set), nil
}

func (f *fakeMqttTrackingStore) ZrevrangebyscoreWithScoresAndLimitCtx(_ context.Context, key string, start, stop int64, page, size int) ([]redis.Pair, error) {
	set := f.zsets[key]
	if set == nil {
		return []redis.Pair{}, nil
	}
	var out []redis.Pair
	for k, score := range set {
		if score >= start && score <= stop {
			out = append(out, redis.Pair{Key: k, Score: score})
		}
	}
	// 按 score 降序排序
	sort.Slice(out, func(i, j int) bool {
		return out[i].Score > out[j].Score
	})
	// 分页
	offset := page * size
	if offset >= len(out) {
		return []redis.Pair{}, nil
	}
	end := offset + size
	if end > len(out) {
		end = len(out)
	}
	return out[offset:end], nil
}

func (f *fakeMqttTrackingStore) ExpireCtx(_ context.Context, key string, seconds int) error {
	f.expire[key] = seconds
	return nil
}

func marshalCore(t *testing.T, c devices.Core) string {
	t.Helper()
	b, err := json.Marshal(c)
	require.NoError(t, err)
	return string(b)
}

func marshalConn(t *testing.T, c devices.DevConn) string {
	t.Helper()
	b, err := json.Marshal(c)
	require.NoError(t, err)
	return string(b)
}

func TestSyncDeviceMqttTrackingWritesOnFirstConnection(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	dev := devices.Core{ProductID: "p1", DeviceName: "d1"}
	conn := devices.DevConn{ClientID: "client-1", ProductID: dev.ProductID, DeviceName: dev.DeviceName}

	// 模拟真实 Redis：空 Hash 时 HGET 返回 redis.Nil
	err := syncDeviceMqttTracking(ctx, store, conn, 123)
	require.NoError(t, err)

	require.Equal(t, marshalConn(t, conn), store.hashes[DeviceMqttDevice][GenDeviceTopicKey(dev)])
	require.Equal(t, marshalCore(t, dev), store.hashes[DeviceMqttClientID][conn.ClientID])
	require.EqualValues(t, 123, store.zsets[genDeviceLastActivityKey(dev.ProductID)][GenDeviceTopicKey(dev)])
}

// TestIsDeviceMqttConnectedUsesSessionTracking 验证行为下发与 MQTT 连接使用同一会话事实来源。
func TestIsDeviceMqttConnectedUsesSessionTracking(t *testing.T) {
	store := newFakeMqttTrackingStore()
	dev := devices.Core{ProductID: "product-a", DeviceName: "device-a"}
	if connected, err := isDeviceMqttConnected(
		context.Background(),
		store,
		dev,
	); err != nil || connected {
		t.Fatalf("无会话设备不应在线：connected=%v err=%v", connected, err)
	}
	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(dev): marshalConn(t, devices.DevConn{
			ProductID: dev.ProductID, DeviceName: dev.DeviceName,
			ClientID: "mqtt-client-a", Action: devices.ActionConnected,
		}),
	}
	if connected, err := isDeviceMqttConnected(
		context.Background(),
		store,
		dev,
	); err != nil || !connected {
		t.Fatalf("有效 MQTT 会话必须判定在线：connected=%v err=%v", connected, err)
	}
}

func TestSyncDeviceMqttTrackingClearsOldClientReverseMapping(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	dev := devices.Core{ProductID: "p1", DeviceName: "d1"}
	oldConn := devices.DevConn{ClientID: "old-client", ProductID: dev.ProductID, DeviceName: dev.DeviceName}
	newConn := devices.DevConn{ClientID: "new-client", ProductID: dev.ProductID, DeviceName: dev.DeviceName}

	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(dev): marshalConn(t, oldConn),
	}
	store.hashes[DeviceMqttClientID] = map[string]string{
		oldConn.ClientID: marshalCore(t, dev),
	}

	err := syncDeviceMqttTracking(ctx, store, newConn, 123)
	require.NoError(t, err)

	_, oldExists := store.hashes[DeviceMqttClientID][oldConn.ClientID]
	require.False(t, oldExists)
	require.Equal(t, marshalCore(t, dev), store.hashes[DeviceMqttClientID][newConn.ClientID])
	require.Equal(t, marshalConn(t, newConn), store.hashes[DeviceMqttDevice][GenDeviceTopicKey(dev)])
	require.EqualValues(t, 123, store.zsets[genDeviceLastActivityKey(dev.ProductID)][GenDeviceTopicKey(dev)])
}

func TestClearDeviceMqttTrackingByClientIDDoesNotDeleteCurrentReplacement(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	dev := devices.Core{ProductID: "p1", DeviceName: "d1"}
	oldConn := devices.DevConn{ClientID: "old-client", ProductID: dev.ProductID, DeviceName: dev.DeviceName}
	newConn := devices.DevConn{ClientID: "new-client", ProductID: dev.ProductID, DeviceName: dev.DeviceName}

	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(dev): marshalConn(t, newConn),
	}
	store.hashes[DeviceMqttClientID] = map[string]string{
		oldConn.ClientID: marshalCore(t, dev),
		newConn.ClientID: marshalCore(t, dev),
	}
	store.zsets[genDeviceLastActivityKey(dev.ProductID)] = map[string]int64{
		GenDeviceTopicKey(dev): 123,
	}

	err := clearDeviceMqttTrackingByClientID(ctx, store, oldConn.ClientID)
	require.NoError(t, err)

	_, oldExists := store.hashes[DeviceMqttClientID][oldConn.ClientID]
	require.False(t, oldExists)
	require.Equal(t, marshalConn(t, newConn), store.hashes[DeviceMqttDevice][GenDeviceTopicKey(dev)])
	require.EqualValues(t, 123, store.zsets[genDeviceLastActivityKey(dev.ProductID)][GenDeviceTopicKey(dev)])
}

func TestClearDeviceMqttTrackingByClientIDDeletesCurrentMapping(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	dev := devices.Core{ProductID: "p1", DeviceName: "d1"}
	conn := devices.DevConn{ClientID: "client-1", ProductID: dev.ProductID, DeviceName: dev.DeviceName}

	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(dev): marshalConn(t, conn),
	}
	store.hashes[DeviceMqttClientID] = map[string]string{
		conn.ClientID: marshalCore(t, dev),
	}
	store.zsets[genDeviceLastActivityKey(dev.ProductID)] = map[string]int64{
		GenDeviceTopicKey(dev): 123,
	}

	err := clearDeviceMqttTrackingByClientID(ctx, store, conn.ClientID)
	require.NoError(t, err)

	_, exists := store.hashes[DeviceMqttClientID][conn.ClientID]
	require.False(t, exists)
	_, exists = store.hashes[DeviceMqttDevice][GenDeviceTopicKey(dev)]
	require.False(t, exists)
	_, exists = store.zsets[genDeviceLastActivityKey(dev.ProductID)][GenDeviceTopicKey(dev)]
	require.False(t, exists)
}

func TestPruneStaleDeviceMqttTrackingRemovesUnknownClients(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	staleDev := devices.Core{ProductID: "p1", DeviceName: "stale"}
	activeDev := devices.Core{ProductID: "p1", DeviceName: "active"}
	staleConn := devices.DevConn{ClientID: "stale-client", ProductID: staleDev.ProductID, DeviceName: staleDev.DeviceName}
	activeConn := devices.DevConn{ClientID: "active-client", ProductID: activeDev.ProductID, DeviceName: activeDev.DeviceName}

	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(staleDev):  marshalConn(t, staleConn),
		GenDeviceTopicKey(activeDev): marshalConn(t, activeConn),
	}
	store.hashes[DeviceMqttClientID] = map[string]string{
		staleConn.ClientID:  marshalCore(t, staleDev),
		activeConn.ClientID: marshalCore(t, activeDev),
	}
	store.zsets[genDeviceLastActivityKey(staleDev.ProductID)] = map[string]int64{
		GenDeviceTopicKey(staleDev):  11,
		GenDeviceTopicKey(activeDev): 22,
	}

	err := pruneStaleDeviceMqttTracking(ctx, store, map[string]struct{}{
		activeConn.ClientID: {},
	})
	require.NoError(t, err)

	_, exists := store.hashes[DeviceMqttClientID][staleConn.ClientID]
	require.False(t, exists)
	_, exists = store.hashes[DeviceMqttDevice][GenDeviceTopicKey(staleDev)]
	require.False(t, exists)
	_, exists = store.zsets[genDeviceLastActivityKey(staleDev.ProductID)][GenDeviceTopicKey(staleDev)]
	require.False(t, exists)

	require.Equal(t, marshalCore(t, activeDev), store.hashes[DeviceMqttClientID][activeConn.ClientID])
	require.Equal(t, marshalConn(t, activeConn), store.hashes[DeviceMqttDevice][GenDeviceTopicKey(activeDev)])
	require.EqualValues(t, 22, store.zsets[genDeviceLastActivityKey(activeDev.ProductID)][GenDeviceTopicKey(activeDev)])
}

func TestPruneStaleDeviceMqttTrackingRemovesOrphanActivity(t *testing.T) {
	store := newFakeMqttTrackingStore()
	ctx := context.Background()
	orphanDev := devices.Core{ProductID: "p1", DeviceName: "orphan"}
	activeDev := devices.Core{ProductID: "p1", DeviceName: "active"}
	activeConn := devices.DevConn{ClientID: "active-client", ProductID: activeDev.ProductID, DeviceName: activeDev.DeviceName}

	// deviceMap 中有同产品的有效设备，确保 pidSet 能提取到 p1
	store.hashes[DeviceMqttDevice] = map[string]string{
		GenDeviceTopicKey(activeDev): marshalConn(t, activeConn),
	}
	store.zsets[genDeviceLastActivityKey(orphanDev.ProductID)] = map[string]int64{
		GenDeviceTopicKey(orphanDev): 99,
		GenDeviceTopicKey(activeDev): 100,
	}

	err := pruneStaleDeviceMqttTracking(ctx, store, map[string]struct{}{
		activeConn.ClientID: {},
	})
	require.NoError(t, err)

	_, exists := store.zsets[genDeviceLastActivityKey(orphanDev.ProductID)][GenDeviceTopicKey(orphanDev)]
	require.False(t, exists)
	// 有效设备应保留
	require.EqualValues(t, 100, store.zsets[genDeviceLastActivityKey(activeDev.ProductID)][GenDeviceTopicKey(activeDev)])
}

// TestMqttProtocolSharedSubscriptionGroup 验证设备消息和连接状态使用同一个配置组。
func TestMqttProtocolSharedSubscriptionGroup(t *testing.T) {
	protocol := &MqttProtocol{
		DevSubHandle:             make(map[string]DevHandle),
		sharedSubscriptionPrefix: "$share/saas-new-wumei/",
	}
	devHandler := func(context.Context, string, []byte) error { return nil }
	connHandler := func(_ context.Context, info devices.DevConn) (devices.DevConn, error) { return info, nil }

	require.NoError(t, protocol.SubscribeDevMsg("+/+/+/post", devHandler))
	require.NoError(t, protocol.SubscribeDevConn(connHandler))
	require.Contains(t, protocol.DevSubHandle, "$share/saas-new-wumei/+/+/+/post")
	require.Contains(t, protocol.DevSubHandle, "$share/saas-new-wumei/$SYS/brokers/+/clients/#")
}
