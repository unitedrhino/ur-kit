// 本文件提供 IoT 基础应用的最小 Go 后端示例。
package main

import (
	"context"
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
)

// main 在客户端模板注册成功后启动健康检查、Web 页面与经平台令牌验证的样例端点。
func main() {
	platform := os.Getenv("PLATFORM_URL")
	registrationCtx, cancelRegistration := context.WithTimeout(context.Background(), time.Minute)
	registrationErr := registerClientApps(registrationCtx, platform, os.Getenv)
	cancelRegistration()
	if registrationErr != nil {
		log.Fatal(registrationErr)
	}
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
		Authenticator: middleware.PlatformAuthenticator{BaseURL: platform},
	}))
	proxy := httputil.NewSingleHostReverseProxy(target)
	for _, prefix := range []string{"/api/v1/system/", "/api/v1/things/", "/api/v1/data/"} {
		mux.Handle(prefix, http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
			// 平台自行认证原始令牌；内部身份只允许平台产生。
			middleware.StripUntrustedIdentityHeaders(request.Header)
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
