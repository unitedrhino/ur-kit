// 本文件提供 IoT 基础应用的最小 Go 后端示例。
package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	middleware "github.com/unitedrhino/ur-kit/middleware/go"
	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// main 启动健康检查与经平台令牌验证的样例端点。
func main() {
	platform := os.Getenv("PLATFORM_URL")
	if platform == "" {
		log.Fatal("PLATFORM_URL 必填")
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
	server := &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(server.ListenAndServe())
}

// verifyPlatformToken 向平台查询用户与企业归属，只有平台确认成员关系后才接受请求上下文。
func verifyPlatformToken(request *http.Request, platform, token string) (middleware.Identity, error) {
	var response struct {
		Code int `json:"code"`
		Data struct {
			UserID  string `json:"userID"`
			Tenants []struct {
				TenantCode string `json:"tenantCode"`
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
		if tenant.TenantCode == wantedTenant && wantedTenant != "" {
			return middleware.Identity{UserID: response.Data.UserID, TenantCode: wantedTenant}, nil
		}
	}
	return middleware.Identity{}, errors.New("tenant membership not verified")
}
