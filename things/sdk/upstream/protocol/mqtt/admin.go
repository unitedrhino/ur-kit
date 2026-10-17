// 本仓维护此适配层及其 RPC 类型；不随 kit 的公开合同同步升级。
// 本文件提供独立于 MQTT 传输连接的 EMQX 客户端订阅管理接口。
package mqtt

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
	"time"
)

// Admin 使用 EMQX 管理接口管理指定设备客户端的订阅。
type Admin struct {
	BaseURL string       // EMQX 管理接口的基础地址。
	APIKey  string       // HTTP Basic Auth 用户名。
	Secret  string       // HTTP Basic Auth 密码。
	Client  *http.Client // 可选的 HTTP 客户端，默认超时为十秒。
}

// subscription 表示 EMQX 管理接口中的一个订阅主题及服务质量。
type subscription struct {
	Topic string `json:"topic"`
	QoS   int    `json:"qos,omitempty"`
}

// client 按配置返回用于本次请求的 HTTP 客户端。
func (admin *Admin) client() *http.Client {
	if admin.Client != nil {
		return admin.Client
	}
	return &http.Client{Timeout: 10 * time.Second}
}

// request 对指定设备客户端执行一次带身份认证的管理请求并解析响应。
func (admin *Admin) request(ctx context.Context, method, clientID, suffix string, payload any, result any) error {
	if admin == nil || admin.BaseURL == "" || clientID == "" {
		return errors.New("EMQX management address and client ID are required")
	}
	var body io.Reader
	if payload != nil {
		data, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewReader(data)
	}
	endpoint := strings.TrimRight(admin.BaseURL, "/") + "/api/v5/clients/" + url.PathEscape(clientID) + suffix
	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return err
	}
	req.SetBasicAuth(admin.APIKey, admin.Secret)
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := admin.client().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("EMQX management request failed: %s: %s", resp.Status, strings.TrimSpace(string(data)))
	}
	if result != nil && len(data) > 0 {
		return json.Unmarshal(data, result)
	}
	return nil
}

// GetClientSub 返回指定设备客户端当前订阅的主题。
func (admin *Admin) GetClientSub(ctx context.Context, clientID string) ([]string, error) {
	var current []subscription
	if err := admin.request(ctx, http.MethodGet, clientID, "/subscriptions", nil, &current); err != nil {
		return nil, err
	}
	topics := make([]string, 0, len(current))
	for _, item := range current {
		topics = append(topics, item.Topic)
	}
	return topics, nil
}

// SetClientMutSub 为设备客户端批量补充尚未订阅的主题。
func (admin *Admin) SetClientMutSub(ctx context.Context, clientID string, topics []string, qos int) error {
	if len(topics) == 0 {
		return nil
	}
	current, err := admin.GetClientSub(ctx, clientID)
	if err != nil {
		return err
	}
	exists := make(map[string]struct{}, len(current))
	for _, topic := range current {
		exists[topic] = struct{}{}
	}
	additions := make([]subscription, 0, len(topics))
	for _, topic := range topics {
		if _, ok := exists[topic]; ok {
			continue
		}
		additions = append(additions, subscription{Topic: topic, QoS: qos})
		exists[topic] = struct{}{}
	}
	if len(additions) == 0 {
		return nil
	}
	return admin.request(ctx, http.MethodPost, clientID, "/subscribe/bulk", additions, nil)
}

// SetClientMutUnSub 为设备客户端批量取消指定主题订阅。
func (admin *Admin) SetClientMutUnSub(ctx context.Context, clientID string, topics []string) error {
	if len(topics) == 0 {
		return nil
	}
	removals := make([]subscription, 0, len(topics))
	for _, topic := range topics {
		removals = append(removals, subscription{Topic: topic})
	}
	return admin.request(ctx, http.MethodPost, clientID, "/unsubscribe/bulk", removals, nil)
}
