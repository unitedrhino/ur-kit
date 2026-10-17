// 本文件在基础应用监听前自动同步客户端应用与菜单，所有管理身份均由平台核验。
package main

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/appseed"
	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// clientDefinitions 是应用自己维护的 Web/微信/Android/iOS 模板及菜单，包含稳定 ID 和原有标识。
//
//go:embed bootstrap/client.json
var clientDefinitions []byte

// registerClientApps 在启动阶段读取注册配置，完整同步成功才允许提供应用服务。
func registerClientApps(ctx context.Context, platform string, getenv func(string) string) error {
	if raw := strings.TrimSpace(getenv("APP_AUTO_REGISTER")); raw != "" {
		enabled, err := strconv.ParseBool(raw)
		if err != nil {
			return fmt.Errorf("APP_AUTO_REGISTER 必须为 true 或 false")
		}
		if !enabled {
			return nil
		}
	}
	token := strings.TrimSpace(getenv("PLATFORM_BOOTSTRAP_TOKEN"))
	file := strings.TrimSpace(getenv("PLATFORM_BOOTSTRAP_TOKEN_FILE"))
	if token != "" && file != "" {
		return fmt.Errorf("注册令牌与令牌文件只能配置一项")
	}
	if file != "" {
		body, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("读取注册令牌文件失败")
		}
		token = strings.TrimSpace(string(body))
	}
	if token == "" {
		return fmt.Errorf("自动注册需要 PLATFORM_BOOTSTRAP_TOKEN_FILE 或 PLATFORM_BOOTSTRAP_TOKEN（平台超级管理员登录令牌）")
	}
	entry := strings.TrimSpace(getenv("APP_PUBLIC_URL"))
	parsed, err := url.Parse(entry)
	if err != nil || parsed == nil || entry == "" || parsed.User != nil || parsed.Fragment != "" || !((parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != "" || parsed.Scheme == "" && parsed.Host == "" && strings.HasPrefix(entry, "/") && !strings.HasPrefix(entry, "//")) {
		return fmt.Errorf("APP_PUBLIC_URL 必须配置为可访问的 HTTP(S) 地址或平台内绝对路径")
	}
	appID := strings.TrimSpace(getenv("APP_ID"))
	if appID == "" {
		appID = "600"
	}
	numericID, err := strconv.ParseInt(appID, 10, 64)
	if err != nil || numericID <= 1 || strconv.FormatInt(numericID, 10) != appID || appID == "700" || appID == "800" || appID == "900" {
		return fmt.Errorf("APP_ID 必须是有效的独立 Web 应用 ID，不能占用移动端应用标识")
	}
	var definitions []appseed.Definition
	if err := json.Unmarshal(clientDefinitions, &definitions); err != nil {
		return fmt.Errorf("读取内置客户端模板失败: %w", err)
	}
	// Web 的平台入口和构建应用 ID 来自本项目配置，其他登录方式与企业个性化配置由平台保留。
	var web map[string]json.RawMessage
	if err := json.Unmarshal(definitions[0].App, &web); err != nil {
		return err
	}
	web["id"], _ = json.Marshal(appID)
	web["url"], _ = json.Marshal(entry)
	definitions[0].App, _ = json.Marshal(web)
	for index, menu := range definitions[0].Menus {
		var value map[string]json.RawMessage
		if err := json.Unmarshal(menu, &value); err != nil {
			return err
		}
		value["appID"], _ = json.Marshal(appID)
		definitions[0].Menus[index], _ = json.Marshal(value)
	}
	client := httpclient.Client{BaseURL: platform, Token: token, TenantCode: "platform", HTTP: &http.Client{Timeout: 15 * time.Second}}
	for _, definition := range definitions {
		if _, err := appseed.Register(ctx, client, definition); err != nil {
			return err
		}
	}
	return nil
}
