// 本文件验证基础应用的启动注册、重复启动、配置覆盖及注册失败阻止服务启动的准备阶段。
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

// TestBootstrapRegistersCompleteClients 验证四个客户端和完整菜单均随应用启动同步，连续启动发送同一模板。
func TestBootstrapRegistersCompleteClients(t *testing.T) {
	var apps []map[string]any
	var menus [][]map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/system/app/info/batch-import" || r.Method != "POST" {
			t.Errorf("注册路由错误")
		}
		if r.Header.Get("ithings-token") != "local-admin" || r.Header.Get("tenant-code") != "platform" {
			t.Error("未发送注册身份")
		}
		var body struct {
			App   map[string]any   `json:"app"`
			Menus []map[string]any `json:"menus"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
		}
		apps = append(apps, body.App)
		menus = append(menus, body.Menus)
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprintf(w, `{"code":200,"data":{"id":%q}}`, body.App["id"])
	}))
	defer server.Close()
	config := map[string]string{"PLATFORM_BOOTSTRAP_TOKEN": "local-admin", "APP_PUBLIC_URL": "https://app.example.invalid/"}
	for range 2 {
		if err := registerClientApps(context.Background(), server.URL, func(k string) string { return config[k] }); err != nil {
			t.Fatal(err)
		}
	}
	if len(apps) != 8 {
		t.Fatalf("注册数量 %d", len(apps))
	}
	for i, id := range []string{"600", "700", "800", "900"} {
		if apps[i]["id"] != id || !reflect.DeepEqual(apps[i], apps[i+4]) || !reflect.DeepEqual(menus[i], menus[i+4]) {
			t.Fatalf("应用 %s 重复启动模板不一致", id)
		}
	}
	if apps[0]["url"] != config["APP_PUBLIC_URL"] || len(menus[0]) != 23 {
		t.Fatal("Web 入口或菜单不完整")
	}
	seen := map[string]bool{"1": true}
	visibleRoots := 0
	hidden := 0
	for _, m := range menus[0] {
		id, _ := m["id"].(string)
		parent, _ := m["parentID"].(string)
		if id == "" || seen[id] || !seen[parent] || m["appID"] != "600" {
			t.Fatalf("无效菜单层级 %v", m)
		}
		seen[id] = true
		if m["defaultIsHideInMenu"] == float64(1) {
			hidden++
		} else if parent == "1" {
			visibleRoots++
		}
	}
	if visibleRoots != 5 || hidden != 10 {
		t.Fatalf("原菜单可见性被改变: roots=%d hidden=%d", visibleRoots, hidden)
	}
	for _, index := range []int{1, 2, 3} {
		if len(menus[index]) != 0 {
			t.Fatal("移动端不应套用 Web 菜单")
		}
	}
}

// TestBootstrapTokenFileAndCustomApp 验证 Docker Secret 文件以及自定义 Web 应用 ID 在模板中一致。
func TestBootstrapTokenFileAndCustomApp(t *testing.T) {
	file := filepath.Join(t.TempDir(), "bootstrap-token")
	if err := os.WriteFile(file, []byte("file-admin\n"), 0600); err != nil {
		t.Fatal(err)
	}
	count := 0
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count++
		if r.Header.Get("ithings-token") != "file-admin" {
			t.Error("令牌文件未生效")
		}
		var body struct {
			App   map[string]any   `json:"app"`
			Menus []map[string]any `json:"menus"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if count == 1 {
			if body.App["id"] != "610" {
				t.Error("自定义应用 ID 未生效")
			}
			for _, m := range body.Menus {
				if m["appID"] != "610" {
					t.Error("菜单应用 ID 未覆盖")
				}
			}
		}
		_, _ = fmt.Fprintf(w, `{"code":200,"data":{"id":%q}}`, body.App["id"])
	}))
	defer s.Close()
	config := map[string]string{"PLATFORM_BOOTSTRAP_TOKEN_FILE": file, "APP_PUBLIC_URL": "/app/custom/", "APP_ID": "610"}
	if err := registerClientApps(context.Background(), s.URL, func(k string) string { return config[k] }); err != nil {
		t.Fatal(err)
	}
}

// TestBootstrapInvalidConfiguration 验证注册前置条件、明确禁用和权限错误。
func TestBootstrapInvalidConfiguration(t *testing.T) {
	cases := []map[string]string{
		{}, {"APP_AUTO_REGISTER": "bad"},
		{"PLATFORM_BOOTSTRAP_TOKEN": "a", "PLATFORM_BOOTSTRAP_TOKEN_FILE": "b", "APP_PUBLIC_URL": "/"},
		{"PLATFORM_BOOTSTRAP_TOKEN_FILE": "/file-does-not-exist", "APP_PUBLIC_URL": "/"},
		{"PLATFORM_BOOTSTRAP_TOKEN": "a", "APP_PUBLIC_URL": "//evil.invalid"},
		{"PLATFORM_BOOTSTRAP_TOKEN": "a", "APP_PUBLIC_URL": "/", "APP_ID": "700"},
	}
	for _, config := range cases {
		if err := registerClientApps(context.Background(), "", func(k string) string { return config[k] }); err == nil {
			t.Fatalf("接受错误配置: %v", config)
		}
	}
	if err := registerClientApps(context.Background(), "", func(k string) string {
		if k == "APP_AUTO_REGISTER" {
			return "false"
		}
		return ""
	}); err != nil {
		t.Fatal(err)
	}
	count := 0
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { count++; w.WriteHeader(http.StatusForbidden) }))
	defer s.Close()
	config := map[string]string{"PLATFORM_BOOTSTRAP_TOKEN": "ordinary-user", "APP_PUBLIC_URL": "/"}
	if err := registerClientApps(context.Background(), s.URL, func(k string) string { return config[k] }); err == nil || count != 1 {
		t.Fatalf("权限失败后继续注册: count=%d err=%v", count, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := registerClientApps(ctx, s.URL, func(k string) string { return config[k] }); err == nil {
		t.Fatal("已取消启动不应成功")
	}
}
