// 本文件提供保持 JSON 数字精度和认证头的基础 HTTP 客户端。
package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// Client 保存平台地址、令牌、业务上下文与可替换的 HTTP 传输。
type Client struct {
	BaseURL string
	Token   string
	// BearerToken 为平台访问令牌签发的 JWT；与 Token 二选一。
	BearerToken string
	TenantCode  string
	ProjectID   string
	AppID       string
	HTTP        *http.Client
	// TokenHeader 仅接受平台支持的两个令牌头；空值使用 ithings-token。
	TokenHeader string
	// ResponseLimit 限制响应字节数；空值使用 16 MiB，上限也是 16 MiB。
	ResponseLimit int64
}

// APIError 表示平台返回的非成功状态和原始响应体。
type APIError struct {
	Status int
	Body   []byte
}

// Error 返回不包含认证信息的状态描述。
func (err *APIError) Error() string { return fmt.Sprintf("platform API status %d", err.Status) }

// PostJSON 向平台发送 JSON POST，并用 UseNumber 保留大整数与 ID 精度。
func (client Client) PostJSON(ctx context.Context, path string, requestBody, responseBody any) error {
	if (strings.TrimSpace(client.Token) == "") == (strings.TrimSpace(client.BearerToken) == "") {
		return errors.New("exactly one platform token is required")
	}
	tokenHeader := client.TokenHeader
	if tokenHeader == "" {
		tokenHeader = "ithings-token"
	}
	if tokenHeader != "ithings-token" && tokenHeader != "token" {
		return errors.New("invalid platform token header")
	}
	responseLimit := client.ResponseLimit
	if responseLimit == 0 {
		responseLimit = 16 << 20
	}
	if responseLimit < 0 || responseLimit > 16<<20 {
		return errors.New("invalid platform response limit")
	}
	base, err := url.Parse(client.BaseURL)
	if err != nil || base == nil || (base.Scheme != "http" && base.Scheme != "https") || base.Host == "" || base.User != nil || base.RawQuery != "" || base.Fragment != "" || (base.Path != "" && base.Path != "/") {
		return errors.New("invalid platform URL")
	}
	if !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") || strings.ContainsAny(path, "?#") {
		return errors.New("path must be absolute within platform")
	}
	body, err := json.Marshal(requestBody)
	if err != nil {
		return err
	}
	base.Path = strings.TrimSuffix(base.Path, "/") + path
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Content-Type", "application/json")
	if client.BearerToken != "" {
		request.Header.Set("Authorization", "Bearer "+client.BearerToken)
	} else {
		request.Header.Set(tokenHeader, client.Token)
	}
	if client.TenantCode != "" {
		request.Header.Set("tenant-code", client.TenantCode)
	}
	if client.ProjectID != "" {
		request.Header.Set("project-id", client.ProjectID)
	}
	if client.AppID != "" {
		request.Header.Set("app-id", client.AppID)
	}
	transport := client.HTTP
	if transport == nil {
		transport = http.DefaultClient
	}
	// 每次请求使用独立客户端副本，避免更改调用方共享客户端的重定向策略。
	requestClient := *transport
	requestClient.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	response, err := requestClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, responseLimit+1))
	if err != nil {
		return err
	}
	if int64(len(data)) > responseLimit {
		return errors.New("platform response exceeds limit")
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return &APIError{Status: response.StatusCode, Body: data}
	}
	if responseBody == nil || len(data) == 0 {
		return nil
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()
	if err := decoder.Decode(responseBody); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); err != io.EOF {
		return errors.New("invalid trailing platform response")
	}
	return nil
}
