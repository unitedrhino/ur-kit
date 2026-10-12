// 本文件提供 Modbus 协议配置页 web 服务总入口:WebHandler。
//
// 背景：apisvr 将 /api/v1/things/protocol/web/{scope}/modbus 反代到协议服务的
// web 端口(随机端口,心跳上报)。协议页与平台同源,页面加载走 GET 静态文件;
// 协议自有接口(连通测试等)经同路径 POST + query __action=<name> 分发到这里。
package web

import (
	"net/http"
	"os"
	"strings"
)

// NewWebHandler 构造配置页 web 服务 HTTP 处理器:
//   - query __action=ping 时执行 Modbus 连通测试(HandlePing);
//   - 其余请求(页面加载 GET/静态资源)回落 webDir 目录下的静态文件。
//
// 反代透传的完整路径(如 /api/v1/things/protocol/web/device/modbus)无法直接
// 映射到 webDir 内的文件,这里统一按 URL 的 basename 定位:webDir 下存在同名
// 文件则 serve 该文件(静态资源),否则 serve index.html(页面入口)。
// 不使用 http.FileServer 的原生路径映射,原因是其 serveFile 对以 /index.html
// 结尾的 URL 会 301 重定向到 ./ ,与反代路径场景不符。
func NewWebHandler(webDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("__action") == "ping" {
			HandlePing(w, r)
			return
		}
		// 页面请求统一限定为 GET/HEAD,其余方法(如 POST 无 __action)直接拒绝
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		base := baseName(r.URL.Path)
		name := webDir + "/" + base
		if base == "" || !isFile(name) {
			name = webDir + "/index.html"
		}
		http.ServeFile(w, r, name)
	})
}

// baseName 返回路径最后一段(去掉目录前缀与 query 之外的内容)。
// 形如 /web/device/modbus 或 /api/v1/.../web/device/modbus 均得到 modbus。
func baseName(p string) string {
	p = strings.TrimSuffix(p, "/")
	idx := strings.LastIndex(p, "/")
	if idx < 0 {
		return p
	}
	return p[idx+1:]
}

// isFile 判断路径是否为存在的普通文件(用于 webDir 下静态文件是否存在校验)。
func isFile(p string) bool {
	info, err := os.Stat(p)
	return err == nil && !info.IsDir()
}
