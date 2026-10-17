// 本文件为独立应用提供通过公开 HTTP 接口幂等注册应用与菜单的入口，不依赖平台私有源码。
package appseed

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/unitedrhino/ur-kit/sdks/go/httpclient"
)

// Definition 保存平台 AppInfo/MenuInfo 合同的 JSON，ID 使用十进制字符串，保留未裁剪的公开字段。
type Definition struct {
	App   json.RawMessage   `json:"app"`   // 应用模板，包含固定 id。
	Menus []json.RawMessage `json:"menus"` // 本应用完整菜单模板，父节点在前；无菜单的移动应用使用空列表。
}

// Register 使用平台超级管理员令牌导入一个应用和菜单，返回平台确认的应用 ID。
// 调用方提供带超时的上下文；注册失败原样返回错误，不把部分同步当作成功。
func Register(ctx context.Context, client httpclient.Client, definition Definition) (string, error) {
	var app struct {
		ID string `json:"id"` // 本次固定注册的应用标识。
	}
	if err := json.Unmarshal(definition.App, &app); err != nil {
		return "", fmt.Errorf("应用模板不是有效 JSON: %w", err)
	}
	id, err := strconv.ParseInt(app.ID, 10, 64)
	if err != nil || id <= 1 || strconv.FormatInt(id, 10) != app.ID {
		return "", fmt.Errorf("应用模板必须提供有效的字符串 id")
	}
	var response struct {
		Code json.Number `json:"code"` // 平台业务状态，独立于 HTTP 状态。
		Data struct {
			ID string `json:"id"` // 按平台合同保留完整整数精度。
		} `json:"data"`
	}
	if err := client.PostJSON(ctx, "/api/v1/system/app/info/batch-import", definition, &response); err != nil {
		return "", fmt.Errorf("应用 %s 注册请求失败: %w", app.ID, err)
	}
	if response.Code.String() != "200" && response.Code.String() != "0" {
		return "", fmt.Errorf("应用 %s 注册被平台拒绝，业务码 %s", app.ID, response.Code)
	}
	if response.Data.ID != app.ID {
		return "", fmt.Errorf("应用 %s 注册响应标识不匹配", app.ID)
	}
	return app.ID, nil
}
