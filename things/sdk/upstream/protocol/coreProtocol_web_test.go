// 本文件为 CoreProtocol 配置页静态 web 服务(startWebServer)的单元测试。
//
// 覆盖范围：
//  1. WebDir 为存在的目录时:随机端口启动静态文件服务,webPort 记录实际端口,HTTP 可访问目录内文件;
//  2. WebDir 为空或目录不存在时:不启动服务,webPort 保持为 0。
package protocol

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"gitee.com/unitedrhino/things/service/dmsvr/pb/dm"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestStartWebServerServesDir 验证配置页目录存在时静态文件服务正常启动并可访问。
func TestStartWebServerServesDir(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "index.html"), []byte("protocol-web-ok"), 0o644))

	p := &CoreProtocol{webDir: dir, Pi: &dm.ProtocolInfo{Code: "test-protocol"}}
	p.startWebServer()
	t.Cleanup(p.Stop)

	require.Greater(t, p.webPort, int64(0))
	resp, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d/index.html", p.webPort))
	require.NoError(t, err)
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "protocol-web-ok", string(body))
}

// TestStartWebServerCustomHandler 验证 WebHandler 非空时优先于 WebDir 静态服务生效。
func TestStartWebServerCustomHandler(t *testing.T) {
	p := &CoreProtocol{
		Pi: &dm.ProtocolInfo{Code: "test-protocol"},
		webHandler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusTeapot)
		}),
	}
	p.startWebServer()
	t.Cleanup(p.Stop)

	require.Greater(t, p.webPort, int64(0))
	resp, err := http.Get(fmt.Sprintf("http://127.0.0.1:%d/", p.webPort))
	require.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusTeapot, resp.StatusCode)
}

// TestStartWebServerSkipped 验证 WebDir 为空或目录不存在时不启动服务。
func TestStartWebServerSkipped(t *testing.T) {
	// 空目录配置
	p := &CoreProtocol{}
	p.startWebServer()
	assert.EqualValues(t, 0, p.webPort)

	// 目录不存在
	p2 := &CoreProtocol{webDir: filepath.Join(t.TempDir(), "not-exist")}
	p2.startWebServer()
	assert.EqualValues(t, 0, p2.webPort)
}
