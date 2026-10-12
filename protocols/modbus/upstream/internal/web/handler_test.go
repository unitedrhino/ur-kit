// 本文件为 Modbus 配置页 web 服务入口 NewWebHandler 的单元测试。
//
// 覆盖范围:
//  1. 反代路径(如 /web/device/modbus)回落静态文件服务,返回 web 目录的 index.html;
//  2. 根路径 / 同样返回 index.html;
//  3. __action=ping 时走连通测试分发(返回 JSON,而非静态文件)。
package web

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// 构造临时 web 目录并写入最小 index.html,再构造 NewWebHandler
func newTestHandler(t *testing.T) http.Handler {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>modbus-page</html>"), 0o644); err != nil {
		t.Fatalf("write index.html err: %v", err)
	}
	return NewWebHandler(dir)
}

func doGet(t *testing.T, h http.Handler, path string) (*httptest.ResponseRecorder, string) {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	body, _ := io.ReadAll(w.Body)
	return w, string(body)
}

// 反代透传的完整路径(如 /web/device/modbus)应回落到 index.html
func TestWebHandlerDevicePath(t *testing.T) {
	h := newTestHandler(t)
	w, body := doGet(t, h, "/api/v1/things/protocol/web/device/modbus?productID=1&deviceName=d1")
	if w.Code != http.StatusOK {
		t.Fatalf("expect 200 for device path, got %d", w.Code)
	}
	if !strings.Contains(body, "modbus-page") {
		t.Fatalf("expect index.html content, got %q", body)
	}
}

// 根路径应返回 index.html
func TestWebHandlerRootPath(t *testing.T) {
	h := newTestHandler(t)
	w, body := doGet(t, h, "/")
	if w.Code != http.StatusOK {
		t.Fatalf("expect 200 for root path, got %d", w.Code)
	}
	if !strings.Contains(body, "modbus-page") {
		t.Fatalf("expect index.html content, got %q", body)
	}
}

// product 反代路径同样回落到 index.html
func TestWebHandlerProductPath(t *testing.T) {
	h := newTestHandler(t)
	w, body := doGet(t, h, "/api/v1/things/protocol/web/product/modbus?productID=1")
	if w.Code != http.StatusOK {
		t.Fatalf("expect 200 for product path, got %d", w.Code)
	}
	if !strings.Contains(body, "modbus-page") {
		t.Fatalf("expect index.html content, got %q", body)
	}
}

// __action=ping 应分发到连通测试(JSON 响应),而非静态文件
func TestWebHandlerPingDispatch(t *testing.T) {
	h := newTestHandler(t)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/things/protocol/web/device/modbus?__action=ping", strings.NewReader(`{}`))
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	body, _ := io.ReadAll(w.Body)
	if !strings.Contains(string(body), "success") {
		t.Fatalf("expect ping JSON response, got %q", body)
	}
}
