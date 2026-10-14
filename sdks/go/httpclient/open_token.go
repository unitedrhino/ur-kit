// 本文件用标准 HMAC-SHA256 签发平台访问令牌 JWT，供非交互服务账号调用 HTTP 接口。
package httpclient

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

// SignOpenToken 使用访问密钥和显式到期时间生成平台 Bearer JWT；调用方应设置较短有效期。
func SignOpenToken(tenantCode, accessKey, accessSecret string, expiresAt time.Time) (string, error) {
	if strings.TrimSpace(tenantCode) != tenantCode || tenantCode == "" || strings.TrimSpace(accessKey) != accessKey || accessKey == "" || strings.TrimSpace(accessSecret) != accessSecret || accessSecret == "" || expiresAt.IsZero() || expiresAt.Unix() <= 0 {
		return "", errors.New("invalid platform access token fields")
	}
	encode := func(value any) (string, error) {
		body, err := json.Marshal(value)
		return base64.RawURLEncoding.EncodeToString(body), err
	}
	header, err := encode(struct {
		Alg string `json:"alg"`
		Typ string `json:"typ"`
	}{"HS256", "JWT"})
	if err != nil {
		return "", err
	}
	payload, err := encode(struct {
		AccessKey  string `json:"accessKey"`
		Exp        int64  `json:"exp"`
		TenantCode string `json:"tenantCode"`
	}{accessKey, expiresAt.Unix(), tenantCode})
	if err != nil {
		return "", err
	}
	message := header + "." + payload
	mac := hmac.New(sha256.New, []byte(accessSecret))
	_, _ = mac.Write([]byte(message))
	return message + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}
