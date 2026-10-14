package runtimeconfig

import (
	"testing"

	"gitee.com/unitedrhino/share/conf"
	"github.com/zeromicro/go-zero/core/discov"
	storecache "github.com/zeromicro/go-zero/core/stores/cache"
	"github.com/zeromicro/go-zero/core/stores/redis"
	"github.com/zeromicro/go-zero/zrpc"
)

func TestMergeConfigJSON(t *testing.T) {
	base := Config{
		TimedJobRpc: conf.RpcClientConf{
			Mode: conf.ClientModeGrpc,
			Conf: zrpc.RpcClientConf{
				Etcd: discov.EtcdConf{
					Hosts: []string{"127.0.0.1:2379"},
					Key:   "timedjob.rpc",
				},
			},
		},
		CacheRedis: storecache.ClusterConf{
			{
				RedisConf: redis.RedisConf{
					Host: "127.0.0.1:6379",
					Type: "node",
				},
			},
		},
		DevLink: conf.DevLinkConf{
			Mode:    "mqtt",
			SubMode: "emq",
			Mqtt: &conf.MqttConf{
				ClientID: "local-client",
				User:     "local-user",
				Pass:     "local-pass",
				Brokers:  []string{"tcp://localhost:1883"},
				OpenApi: &conf.DevOpenApi{
					Host:      "http://localhost:18083",
					ApiKey:    "local-key",
					SecretKey: "local-secret",
				},
			},
		},
	}

	override := `{"timedJobRpc":{"mode":"direct"},"devLink":{"mqtt":{"clientID":"aliyunMqtt.rpc","user":"aliyunMqttsvr","pass":"iThings"}}}`
	out, err := MergeConfigJSON(base, override)
	if err != nil {
		t.Fatalf("MergeConfigJSON() err = %v", err)
	}
	if out.TimedJobRpc.Mode != conf.ClientModeDirect {
		t.Fatalf("unexpected timed mode: %s", out.TimedJobRpc.Mode)
	}
	if out.DevLink.Mqtt.ClientID != "aliyunMqtt.rpc" {
		t.Fatalf("unexpected clientID: %s", out.DevLink.Mqtt.ClientID)
	}
	if out.DevLink.Mqtt.User != "aliyunMqttsvr" {
		t.Fatalf("unexpected user: %s", out.DevLink.Mqtt.User)
	}
	if out.DevLink.Mqtt.Pass != "iThings" {
		t.Fatalf("unexpected pass: %s", out.DevLink.Mqtt.Pass)
	}
	if len(out.DevLink.Mqtt.Brokers) != 1 || out.DevLink.Mqtt.Brokers[0] != "tcp://localhost:1883" {
		t.Fatalf("unexpected brokers: %#v", out.DevLink.Mqtt.Brokers)
	}
	if out.DevLink.Mqtt.OpenApi == nil {
		t.Fatal("expected openApi to be preserved")
	}
	if out.DevLink.Mqtt.OpenApi.Host != "http://localhost:18083" {
		t.Fatalf("unexpected openApi host: %s", out.DevLink.Mqtt.OpenApi.Host)
	}
}

func TestMergeDevLinkConfigJSONEmptyOverride(t *testing.T) {
	base := conf.DevLinkConf{
		Mode: "mqtt",
		Mqtt: &conf.MqttConf{
			ClientID: "local-client",
		},
	}
	out, err := MergeDevLinkConfigJSON(base, "")
	if err != nil {
		t.Fatalf("MergeDevLinkConfigJSON() err = %v", err)
	}
	if out != base {
		t.Fatalf("unexpected merged config: %#v", out)
	}
}

func TestMergeDevLinkConfigJSONInvalidJSON(t *testing.T) {
	_, err := MergeDevLinkConfigJSON(conf.DevLinkConf{}, "{")
	if err == nil {
		t.Fatal("expected invalid json error")
	}
}

// TestMergeConfigJSONExplicitEmptyAndNull 验证空字符串和空指针可清除默认连接设置。
func TestMergeConfigJSONExplicitEmptyAndNull(t *testing.T) {
	base := Config{DevLink: conf.DevLinkConf{Mqtt: &conf.MqttConf{
		ClientID: "default-client",
		OpenApi:  &conf.DevOpenApi{Host: "http://example.invalid"},
	}}}
	out, err := MergeConfigJSON(base, `{"devLink":{"mqtt":{"clientID":"","openApi":null}}}`)
	if err != nil {
		t.Fatal(err)
	}
	if out.DevLink.Mqtt == nil || out.DevLink.Mqtt.ClientID != "" || out.DevLink.Mqtt.OpenApi != nil {
		t.Fatalf("显式空值未生效: %+v", out.DevLink.Mqtt)
	}
	if base.DevLink.Mqtt.ClientID != "default-client" || base.DevLink.Mqtt.OpenApi == nil {
		t.Fatalf("基础配置被修改: %+v", base.DevLink.Mqtt)
	}
}
