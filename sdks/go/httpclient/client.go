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
	BaseURL    string
	Token      string
	TenantCode string
	ProjectID  string
	AppID      string
	HTTP       *http.Client
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
	base, err := url.Parse(client.BaseURL)
	if err != nil || base == nil || (base.Scheme != "http" && base.Scheme != "https") || base.Host == "" {
		return errors.New("invalid platform URL")
	}
	if !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") {
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
	request.Header.Set("ithings-token", client.Token)
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
	response, err := transport.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 16<<20))
	if err != nil {
		return err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return &APIError{Status: response.StatusCode, Body: data}
	}
	if responseBody == nil || len(data) == 0 {
		return nil
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()
	return decoder.Decode(responseBody)
}
