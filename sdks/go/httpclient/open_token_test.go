// 本文件用跨语言共同样本验证平台访问令牌的字段顺序、时效单位与签名。
package httpclient

import (
	"encoding/json"
	"os"
	"testing"
	"time"
)

// TestSignOpenToken 验证三语言相同样本生成完全一致的 Bearer JWT。
func TestSignOpenToken(t *testing.T) {
	raw, err := os.ReadFile("../../conformance/open-token.json")
	if err != nil {
		t.Fatal(err)
	}
	var sample struct {
		TenantCode   string `json:"tenantCode"`
		AccessKey    string `json:"accessKey"`
		AccessSecret string `json:"accessSecret"`
		ExpiresAt    string `json:"expiresAt"`
		Expected     string `json:"expected"`
	}
	if err := json.Unmarshal(raw, &sample); err != nil {
		t.Fatal(err)
	}
	expiry, err := time.Parse(time.RFC3339, sample.ExpiresAt)
	if err != nil {
		t.Fatal(err)
	}
	token, err := SignOpenToken(sample.TenantCode, sample.AccessKey, sample.AccessSecret, expiry)
	if err != nil || token != sample.Expected {
		t.Fatalf("跨语言访问令牌签名不一致: %v", err)
	}
	if _, err := SignOpenToken(sample.TenantCode, sample.AccessKey, "", expiry); err == nil {
		t.Fatal("空访问密钥 Secret 仍签发令牌")
	}
}
