// 本文件用真实本机 WebSocket 验证单容器代理的升级、双向报文和认证拒绝。
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// TestWebSocketProxyIntegration 确认 WebSocket 请求穿过应用代理，且身份与推送合同保持不变。
func TestWebSocketProxyIntegration(t *testing.T) {
	platform := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/system/common/websocket/connect" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("ithings-user") != "" || r.Header.Get("ithings-meta") != "" {
			t.Error("不可信内部身份头被传入平台")
		}
		if r.URL.Query().Get("token") != "valid" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		if r.URL.Query().Get("app-id") != "42" || r.URL.Query().Get("tenant-code") != "demo" {
			t.Error("WebSocket 上下文参数在代理中丢失")
		}
		upgrader := websocket.Upgrader{}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Error(err)
			return
		}
		defer conn.Close()
		_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
		if err := conn.WriteJSON(map[string]any{"type": "connected", "data": map[string]int{"connID": 1}}); err != nil {
			t.Error(err)
			return
		}
		for {
			var msg struct {
				ID      int    `json:"id"`      // 对应客户端请求序号。
				Type    string `json:"type"`    // 当前频道协议消息类型。
				Channel string `json:"channel"` // 单个订阅目标。
			}
			if err := conn.ReadJSON(&msg); err != nil {
				return
			}
			if msg.Type == "ping" {
				_ = conn.WriteJSON(map[string]any{"id": msg.ID, "type": "pong"})
				continue
			}
			if msg.Channel != "device.prop.DEMO.sensor" {
				_ = conn.WriteJSON(map[string]any{"id": msg.ID, "type": "error", "code": 403, "msg": "forbidden"})
				continue
			}
			if msg.Type != "subscribe" && msg.Type != "unsubscribe" {
				t.Errorf("不符合当前协议的客户端消息：%+v", msg)
				return
			}
			_ = conn.WriteJSON(map[string]any{"id": msg.ID, "type": msg.Type + ".ok", "channel": msg.Channel})
			if msg.Type == "subscribe" {
				_ = conn.WriteJSON(map[string]any{
					"type": "publish", "channel": msg.Channel,
					"data": map[string]any{"projectID": "9007199254740993", "params": map[string]int{"temperature": 23}},
				})
			}
		}
	}))
	defer platform.Close()
	handler, err := newHandler(platform.URL, "")
	if err != nil {
		t.Fatal(err)
	}
	app := httptest.NewServer(handler)
	defer app.Close()
	endpoint := strings.Replace(app.URL, "http://", "ws://", 1) + "/api/v1/system/common/websocket/connect"
	headers := http.Header{"Ithings-User": []string{"forged"}, "Ithings-Meta": []string{"forged"}}
	conn, _, err := websocket.DefaultDialer.Dial(endpoint+"?token=valid&app-id=42&tenant-code=demo", headers)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_ = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	read := func(expected string) map[string]any {
		t.Helper()
		var msg map[string]any // 保留真实 JSON 解码，核对业务长整数以字符串传输。
		if err := conn.ReadJSON(&msg); err != nil {
			t.Fatal(err)
		}
		if msg["type"] != expected {
			t.Fatalf("期望 %s，得到 %+v", expected, msg)
		}
		return msg
	}
	read("connected")
	if err := conn.WriteJSON(map[string]any{"id": 1, "type": "subscribe", "channel": "device.prop.DEMO.sensor"}); err != nil {
		t.Fatal(err)
	}
	read("subscribe.ok")
	pushed := read("publish")
	if fmt.Sprint(pushed["data"].(map[string]any)["projectID"]) != "9007199254740993" {
		t.Fatal("项目编号失真")
	}
	if err := conn.WriteJSON(map[string]any{"id": 2, "type": "subscribe", "channel": "device.prop.other.sensor"}); err != nil {
		t.Fatal(err)
	}
	if denied := read("error"); denied["code"] != float64(403) {
		t.Fatal("订阅拒绝未透传")
	}
	if err := conn.WriteJSON(map[string]any{"id": 3, "type": "unsubscribe", "channel": "device.prop.DEMO.sensor"}); err != nil {
		t.Fatal(err)
	}
	read("unsubscribe.ok")
	if err := conn.WriteJSON(map[string]any{"id": 4, "type": "ping"}); err != nil {
		t.Fatal(err)
	}
	read("pong")
	invalid, response, err := websocket.DefaultDialer.Dial(endpoint+"?token=expired", nil)
	if invalid != nil {
		invalid.Close()
	}
	if response != nil {
		defer response.Body.Close()
	}
	if err == nil || response == nil || response.StatusCode != http.StatusUnauthorized {
		t.Fatalf("认证失败未透传：response=%v err=%v", response, err)
	}
}
