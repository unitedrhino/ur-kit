// 本文件为 Modbus 配置页 web 服务的连通测试参数解析与响应结构单元测试。
//
// 覆盖范围:
//  1. 参数解析:合法 JSON、空 address、非法 JSON、键值对字符串、tcp+tls 模式;
//  2. 连通测试:非法地址(不存在的主机/端口)断言失败路径返回 Success=false;
//     连接成功的成功路径无法在单测中真实连上设备,以启动本地 TCP 监听模拟。
package web

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newPingRequest(body string) *http.Request {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/things/protocol/web/device/modbus?__action=ping",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}

// 解析合法 JSON 参数,字段与 DeviceFields 一致
func TestParsePingParamsJSON(t *testing.T) {
	req := newPingRequest(`{"address":"127.0.0.1:502","mode":"tcp","timeout":1500}`)
	p, err := parsePingParams(req)
	if err != nil {
		t.Fatalf("parse json params err: %v", err)
	}
	if p.Address != "127.0.0.1:502" || p.Mode != "tcp" || p.Timeout != 1500 {
		t.Fatalf("unexpected params: %+v", p)
	}
	// mode 缺省补 tcp
	req2 := newPingRequest(`{"address":"1.2.3.4:502"}`)
	p2, err := parsePingParams(req2)
	if err != nil {
		t.Fatalf("parse default mode err: %v", err)
	}
	if p2.Mode != "tcp" {
		t.Fatalf("expect default mode tcp, got %s", p2.Mode)
	}
	// timeout 缺省补 1000
	req3 := newPingRequest(`{"address":"1.2.3.4:502","mode":"rtu"}`)
	p3, err := parsePingParams(req3)
	if err != nil {
		t.Fatalf("parse default timeout err: %v", err)
	}
	if p3.Timeout != 1000 {
		t.Fatalf("expect default timeout 1000, got %d", p3.Timeout)
	}
}

// 空 address 必须报错
func TestParsePingParamsEmptyAddress(t *testing.T) {
	req := newPingRequest(`{"mode":"tcp"}`)
	if _, err := parsePingParams(req); err == nil {
		t.Fatal("expect error for empty address, got nil")
	}
}

// 非法 JSON(非 JSON 也非键值对)必须报错
func TestParsePingParamsInvalidBody(t *testing.T) {
	req := newPingRequest(`not-json-content`)
	if _, err := parsePingParams(req); err == nil {
		t.Fatal("expect error for invalid body, got nil")
	}
}

// 空 body 视为缺省(此时 address 为空)必须报错
func TestParsePingParamsEmptyBody(t *testing.T) {
	req := newPingRequest(``)
	if _, err := parsePingParams(req); err == nil {
		t.Fatal("expect error for empty body, got nil")
	}
}

// 键值对字符串参数(key=value&...)兼容解析
func TestParsePingParamsQueryString(t *testing.T) {
	req := newPingRequest(`address=127.0.0.1:502&mode=rtu&baudRate=9600&timeout=800`)
	p, err := parsePingParams(req)
	if err != nil {
		t.Fatalf("parse query-string params err: %v", err)
	}
	if p.Address != "127.0.0.1:502" || p.Mode != "rtu" || p.BaudRate != 9600 || p.Timeout != 800 {
		t.Fatalf("unexpected params: %+v", p)
	}
}

// 连通测试失败路径:不存在的地址(本地保留端口)断言返回 Success=false 且含错误描述
func TestDoPingUnreachableAddress(t *testing.T) {
	resp := doPing(context.Background(), &PingParams{Address: "127.0.0.1:1", Mode: "tcp", Timeout: 500})
	if resp.Success {
		t.Fatal("expect ping fail for unreachable address, got success")
	}
	if resp.ErrMsg == "" {
		t.Fatal("expect errMsg not empty on failure")
	}
	if resp.CostMs < 0 {
		t.Fatalf("expect costMs >= 0, got %d", resp.CostMs)
	}
}

// tcp+tls 模式无证书配置必须返回失败提示
func TestDoPingTLSMode(t *testing.T) {
	resp := doPing(context.Background(), &PingParams{Address: "127.0.0.1:502", Mode: "tcp+tls"})
	if resp.Success {
		t.Fatal("expect tcp+tls ping fail without cert, got success")
	}
	if !strings.Contains(resp.ErrMsg, "tcp+tls") {
		t.Fatalf("expect errMsg mention tcp+tls, got %q", resp.ErrMsg)
	}
}

// 连通测试成功路径:本地启动 TCP 监听模拟 Modbus 服务端,断言 Success=true
func TestDoPingLocalListener(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen err: %v", err)
	}
	defer ln.Close()
	// 接受连接后直接关闭,Open 只需 TCP 握手成功即可视为连通
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			_ = conn.Close()
		}
	}()
	addr := ln.Addr().String()
	resp := doPing(context.Background(), &PingParams{Address: addr, Mode: "tcp", Timeout: 500})
	if !resp.Success {
		t.Fatalf("expect ping success against local listener, got fail: %s", resp.ErrMsg)
	}
}

// TestProbeClientModes 验证设备页模式及数字奇偶校验按旧配置语义进入公开 SDK。
func TestProbeClientModes(t *testing.T) {
	serial, err := probeClient(&PingParams{Address: "/dev/example", Mode: "rtu", BaudRate: 9600, DataBits: 8, StopBits: 1, Parity: 2, Timeout: 700})
	if err != nil || serial.Serial == nil || serial.Serial.Parity != "O" || serial.Serial.BaudRate != 9600 || serial.Timeout.Milliseconds() != 700 {
		t.Fatalf("串口参数转换错误: %+v %v", serial, err)
	}
	defaultSerial, err := probeClient(&PingParams{Mode: "rtu"})
	if err != nil || defaultSerial.Serial == nil || defaultSerial.Serial.Parity != "N" || defaultSerial.Serial.StopBits != 2 {
		t.Fatalf("旧驱动默认 8N2 未保留: %+v %v", defaultSerial, err)
	}
	udp, err := probeClient(&PingParams{Address: "127.0.0.1:502", Mode: "rtuoverudp"})
	if err != nil || !udp.RTUOverUDP || udp.Serial != nil {
		t.Fatalf("RTU over UDP 模式转换错误: %+v %v", udp, err)
	}
	if _, err := probeClient(&PingParams{Mode: "rtu", Parity: 3}); err == nil {
		t.Fatal("非法串口奇偶校验未拒绝")
	}
	if _, err := probeClient(&PingParams{Mode: "unknown"}); err == nil {
		t.Fatal("未知连接模式未拒绝")
	}
}

// HandlePing 全链路:参数合法(本地监听)返回 200 与 success=true;
// 空 address 返回 400 与 success=false
func TestHandlePingHTTP(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen err: %v", err)
	}
	defer ln.Close()
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			_ = conn.Close()
		}
	}()

	// 成功路径
	body, _ := json.Marshal(map[string]any{"address": ln.Addr().String(), "mode": "tcp", "timeout": 500})
	req := newPingRequest(string(body))
	w := httptest.NewRecorder()
	HandlePing(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expect 200, got %d", w.Code)
	}
	respData, _ := io.ReadAll(w.Body)
	var resp PingResponse
	if err := json.Unmarshal(respData, &resp); err != nil {
		t.Fatalf("unmarshal response err: %v", err)
	}
	if !resp.Success {
		t.Fatalf("expect success=true, got %+v", resp)
	}

	// 失败路径:空 address
	req2 := newPingRequest(`{}`)
	w2 := httptest.NewRecorder()
	HandlePing(w2, req2)
	if w2.Code != http.StatusBadRequest {
		t.Fatalf("expect 400 for empty address, got %d", w2.Code)
	}
	var resp2 PingResponse
	respData2, _ := io.ReadAll(w2.Body)
	if err := json.Unmarshal(respData2, &resp2); err != nil {
		t.Fatalf("unmarshal failure response err: %v", err)
	}
	if resp2.Success {
		t.Fatal("expect success=false for empty address")
	}
}
