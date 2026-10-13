// 本文件提供 IoT 基础应用的最小 Go 后端示例。
package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	middleware "github.com/unitedrhino/ur-kit/middleware/go"
	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// main 启动健康检查与经平台令牌验证的样例端点。
func main() {
	platform := os.Getenv("PLATFORM_URL")
	handler, err := newHandler(platform, os.Getenv("WEB_DIR"))
	if err != nil {
		log.Fatal(err)
	}
	server := &http.Server{Addr: ":8080", Handler: handler, ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(server.ListenAndServe())
}

// newHandler 将健康检查、样例业务 API、平台接口代理和可选 Web 静态页组成单容器服务。
func newHandler(platform, webDir string) (http.Handler, error) {
	target, err := url.Parse(platform)
	if err != nil || target == nil || (target.Scheme != "http" && target.Scheme != "https") || target.Host == "" || (target.Path != "" && target.Path != "/") || target.RawQuery != "" || target.User != nil {
		return nil, errors.New("PLATFORM_URL 必须是 HTTP(S) 根地址")
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(writer http.ResponseWriter, _ *http.Request) {
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"status":"ok"}`))
	})
	mux.Handle("POST /api/v1/iot-basic/ping", middleware.HTTP(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		identity, _ := middleware.FromContext(request.Context())
		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(map[string]string{"message": "pong", "userId": identity.UserID})
	}), middleware.Options{
		Authenticator: middleware.AuthenticatorFunc(func(request *http.Request, token string) (middleware.Identity, error) {
			return verifyPlatformToken(request, platform, token)
		}),
	}))
	proxy := httputil.NewSingleHostReverseProxy(target)
	for _, prefix := range []string{"/api/v1/system/", "/api/v1/things/", "/api/v1/data/"} {
		mux.Handle(prefix, http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			// 平台自行认证原始令牌；内部身份只允许平台产生。
			for _, header := range []string{"ithings-user", "ithings-user-role", "ithings-tenant-code", "ithings-project-id"} {
				request.Header.Del(header)
			}
			proxy.ServeHTTP(writer, request)
		}))
	}
	if webDir != "" {
		if info, err := os.Stat(filepath.Join(webDir, "index.html")); err != nil || !info.Mode().IsRegular() {
			return nil, errors.New("WEB_DIR 缺少 index.html")
		}
		mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
			if request.Method != http.MethodGet && request.Method != http.MethodHead || strings.HasPrefix(request.URL.Path, "/api/") {
				http.NotFound(writer, request)
				return
			}
			file := filepath.Join(webDir, filepath.FromSlash(strings.TrimPrefix(path.Clean(request.URL.Path), "/")))
			if info, err := os.Stat(file); err != nil || !info.Mode().IsRegular() {
				file = filepath.Join(webDir, "index.html")
			}
			http.ServeFile(writer, request, file)
		})
	}
	return mux, nil
}

// verifyPlatformToken 向平台查询用户与企业归属，只有平台确认成员关系后才接受请求上下文。
func verifyPlatformToken(request *http.Request, platform, token string) (middleware.Identity, error) {
	var response struct {
		Code int `json:"code"`
		Data struct {
			UserID  string `json:"userID"`
			Tenants []struct {
				TenantCode string `json:"tenantCode"`
				Status     int64  `json:"status"`
			} `json:"tenants"`
		} `json:"data"`
	}
	client := httpclient.Client{BaseURL: platform, Token: token}
	if err := client.PostJSON(request.Context(), "/api/v1/system/user/self/get-one", map[string]bool{"withTenant": true}, &response); err != nil {
		return middleware.Identity{}, err
	}
	if response.Code != 200 || response.Data.UserID == "" {
		return middleware.Identity{}, errors.New("platform rejected token")
	}
	wantedTenant := strings.TrimSpace(request.Header.Get("tenant-code"))
	for _, tenant := range response.Data.Tenants {
		if tenant.TenantCode == wantedTenant && tenant.Status == 1 && wantedTenant != "" {
			return middleware.Identity{UserID: response.Data.UserID, TenantCode: wantedTenant}, nil
		}
	}
	return middleware.Identity{}, errors.New("tenant membership not verified")
}
