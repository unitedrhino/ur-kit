// 本文件通过平台用户与项目接口提供可直接接入的 Go 身份认证适配器。
package middleware

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// PlatformAuthenticator 用平台自身接口验证令牌、企业成员关系及可选项目上下文。
type PlatformAuthenticator struct {
	BaseURL string
	HTTP    *http.Client
}

// Authenticate 返回平台确认的身份；请求头中的企业和项目仅作待验证的选择值。
func (auth PlatformAuthenticator) Authenticate(request *http.Request, token string) (Identity, error) {
	tenant := strings.TrimSpace(request.Header.Get("tenant-code"))
	if strings.TrimSpace(token) == "" || tenant == "" {
		return Identity{}, errors.New("缺少令牌或企业")
	}
	transport := http.Client{Timeout: 5 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	if auth.HTTP != nil {
		transport = *auth.HTTP
		if transport.Timeout == 0 {
			transport.Timeout = 5 * time.Second
		}
		transport.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	}
	client := httpclient.Client{BaseURL: auth.BaseURL, Token: token, TenantCode: tenant, AppID: request.Header.Get("app-id"), HTTP: &transport}
	var user struct {
		Code int `json:"code"`
		Data struct {
			UserID  string `json:"userID"`
			Tenants []struct {
				TenantCode string `json:"tenantCode"`
				Status     int64  `json:"status"`
			} `json:"tenants"`
		} `json:"data"`
	}
	if err := client.PostJSON(request.Context(), "/api/v1/system/user/self/get-one", map[string]bool{"withTenant": true}, &user); err != nil || user.Code != http.StatusOK || user.Data.UserID == "" || user.Data.UserID == "0" {
		return Identity{}, errors.New("平台用户身份验证失败")
	}
	member := false
	for _, item := range user.Data.Tenants {
		if item.TenantCode == tenant && item.Status == 1 {
			member = true
			break
		}
	}
	if !member {
		return Identity{}, errors.New("当前用户没有企业成员身份")
	}
	identity := Identity{UserID: user.Data.UserID, TenantCode: tenant}
	selectedProject := strings.TrimSpace(request.Header.Get("project-id"))
	if selectedProject == "" {
		return identity, nil
	}
	projectID, err := strconv.ParseInt(selectedProject, 10, 64)
	if err != nil || projectID <= 0 {
		return Identity{}, errors.New("项目标识无效")
	}
	client.ProjectID = selectedProject
	var projects struct {
		Code int `json:"code"`
		Data struct {
			List []struct {
				ProjectID  string `json:"projectID"`
				TenantCode string `json:"tenantCode"`
				MyAuthType int64  `json:"myAuthType"`
			} `json:"list"`
		} `json:"data"`
	}
	if err := client.PostJSON(request.Context(), "/api/v1/things/project/info/get-list", map[string]any{"projectIDs": []string{selectedProject}}, &projects); err != nil || projects.Code != http.StatusOK {
		return Identity{}, errors.New("平台项目权限验证失败")
	}
	for _, item := range projects.Data.List {
		if item.ProjectID == selectedProject && item.TenantCode == tenant && item.MyAuthType > 0 {
			identity.ProjectID = selectedProject
			return identity, nil
		}
	}
	return Identity{}, errors.New("当前用户没有项目权限")
}
