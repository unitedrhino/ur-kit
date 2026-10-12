// 本文件验证基础应用仅接受平台确认的令牌和企业成员关系。
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestVerifyPlatformToken 验证认证请求与企业成员检查。
func TestVerifyPlatformToken(t *testing.T) {
	platform := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/api/v1/system/user/self/get-one" || request.Header.Get("ithings-token") != "valid" {
			t.Error("平台认证请求不符合合同")
		}
		writer.Header().Set("Content-Type", "application/json")
		_, _ = writer.Write([]byte(`{"code":200,"data":{"userID":"9007199254740993","tenants":[{"tenantCode":"demo"}]}}`))
	}))
	defer platform.Close()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/iot-basic/ping", nil)
	request.Header.Set("tenant-code", "demo")
	identity, err := verifyPlatformToken(request, platform.URL, "valid")
	if err != nil || identity.UserID != "9007199254740993" || identity.TenantCode != "demo" {
		t.Fatalf("平台认证失败: identity=%+v err=%v", identity, err)
	}
	request.Header.Set("tenant-code", "other")
	if _, err := verifyPlatformToken(request, platform.URL, "valid"); err == nil {
		t.Fatal("不属于用户的企业被接受")
	}
}
