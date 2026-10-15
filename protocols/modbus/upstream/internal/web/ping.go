// 本文件定义 Modbus 配置页 web 服务所需的 HTTP 分发与连通性测试参数/响应结构。
//
// 背景：协议配置页(backend/protocol/modbus/web/index.html)由协议服务自托管，
// apisvr 反代固定路由后与平台同源；协议自有接口(如连通测试)经当前页面 URL
// 的 query __action=<name> POST 分发到 WebHandler。
package web

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/spf13/cast"
	sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"
	"github.com/zeromicro/go-zero/core/logx"
)

// PingParams 连通测试请求参数,key 与设备级连接参数表单(DeviceFields,
// backend/protocol/modbus/internal/svc/serviceContext.go)一致。
type PingParams struct {
	Address  string `json:"address"`  // 地址:网络模式为 host:port,串口模式为串口设备路径
	Mode     string `json:"mode"`     // 连接模式:rtuovertcp/rtuoverudp/rtu/tcp/tcp+tls/udp
	BaudRate uint   `json:"baudRate"` // 波特率(仅串口模式)
	DataBits uint   `json:"dataBits"` // 数据位(仅串口模式)
	StopBits uint   `json:"stopBits"` // 停止位(仅串口模式)
	Parity   uint   `json:"parity"`   // 奇偶校验:0=无 1=偶 2=奇(仅串口模式)
	Timeout  uint   `json:"timeout"`  // 请求超时毫秒,默认 1000
}

// PingResponse 连通测试响应结构。
type PingResponse struct {
	Success bool   `json:"success"` // 是否连接成功
	CostMs  int64  `json:"costMs"`  // 耗时毫秒
	ErrMsg  string `json:"errMsg"`  // 失败时的错误描述,成功为空
}

// writeJSON 统一以 application/json 写响应并忽略写出错误。
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// parsePingParams 解析 ping 请求 JSON body;mode 缺省按 tcp 处理,其余 key 与
// DeviceFields 一致。参数非法(非 JSON 或必填的 address 为空)时返回错误。
func parsePingParams(r *http.Request) (*PingParams, error) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 64*1024))
	if err != nil {
		return nil, err
	}
	// 兼容:连接参数可能以纯字符串形式传输(表单拼串),否则按 JSON 对象解析
	var p *PingParams
	var raw map[string]any
	if err := json.Unmarshal(body, &raw); err != nil {
		if str := strings.TrimSpace(string(body)); str != "" {
			p = &PingParams{}
			parts := strings.Split(str, "&")
			for _, part := range parts {
				kv := strings.SplitN(part, "=", 2)
				if len(kv) != 2 {
					continue
				}
				key := strings.TrimSpace(kv[0])
				val := strings.TrimSpace(kv[1])
				switch key {
				case "address":
					p.Address = val
				case "mode":
					p.Mode = val
				case "baudRate":
					p.BaudRate = cast.ToUint(val)
				case "dataBits":
					p.DataBits = cast.ToUint(val)
				case "stopBits":
					p.StopBits = cast.ToUint(val)
				case "parity":
					p.Parity = cast.ToUint(val)
				case "timeout":
					p.Timeout = cast.ToUint(val)
				}
			}
		}
	} else {
		p = &PingParams{}
		if v, ok := raw["address"]; ok {
			p.Address = cast.ToString(v)
		}
		if v, ok := raw["mode"]; ok {
			p.Mode = cast.ToString(v)
		}
		if v, ok := raw["baudRate"]; ok {
			p.BaudRate = cast.ToUint(v)
		}
		if v, ok := raw["dataBits"]; ok {
			p.DataBits = cast.ToUint(v)
		}
		if v, ok := raw["stopBits"]; ok {
			p.StopBits = cast.ToUint(v)
		}
		if v, ok := raw["parity"]; ok {
			p.Parity = cast.ToUint(v)
		}
		if v, ok := raw["timeout"]; ok {
			p.Timeout = cast.ToUint(v)
		}
	}
	if p == nil {
		return nil, fmt.Errorf("请求体解析失败:非 JSON 且非键值对字符串")
	}
	if p.Address == "" {
		return nil, fmt.Errorf("address 不能为空")
	}
	if p.Mode == "" {
		p.Mode = "tcp"
	}
	if p.Timeout == 0 {
		p.Timeout = 1000
	}
	return p, nil
}

// probeClient 把设备页参数映射为公开 SDK 的传输模式与串口参数。
func probeClient(p *PingParams) (sdkmodbus.Client, error) {
	client := sdkmodbus.Client{Address: p.Address, Timeout: time.Duration(p.Timeout) * time.Millisecond}
	switch strings.ToLower(strings.TrimSpace(p.Mode)) {
	case "", "tcp":
	case "udp":
		client.UDP = true
	case "rtuovertcp":
		client.RTUOverTCP = true
	case "rtuoverudp":
		client.RTUOverUDP = true
	case "rtu":
		parity := "N"
		switch p.Parity {
		case 0:
			parity = "N"
		case 1:
			parity = "E"
		case 2:
			parity = "O"
		default:
			return client, fmt.Errorf("不支持的串口奇偶校验: %d", p.Parity)
		}
		stopBits := int(p.StopBits)
		if stopBits == 0 && parity == "N" {
			// 原驱动在无奇偶校验且未配置停止位时使用 8N2，需保持设备线缆一致。
			stopBits = 2
		}
		client.Serial = &sdkmodbus.SerialConfig{BaudRate: int(p.BaudRate), DataBits: int(p.DataBits), StopBits: stopBits, Parity: parity}
	default:
		return client, fmt.Errorf("不支持的 Modbus 连接模式: %s", p.Mode)
	}
	return client, nil
}

// doPing 使用表单参数检查传输连接，不向设备发送 Modbus 功能码。
// 连接成功返回 Success=true;失败(含参数非法、地址不可达、串口不存在等)返回
// Success=false 与错误描述,不向上抛错,保证协议页总能拿到结构化结果。
func doPing(ctx context.Context, p *PingParams) *PingResponse {
	start := time.Now()
	resp := &PingResponse{}
	// tcp+tls 模式需要客户端证书与 CA,页面暂不支持配置证书,直接提示
	if p.Mode == "tcp+tls" {
		resp.Success = false
		resp.CostMs = time.Since(start).Milliseconds()
		resp.ErrMsg = "tcp+tls 模式需要客户端证书,暂不支持页面连通测试"
		return resp
	}
	client, err := probeClient(p)
	if err != nil {
		resp.Success = false
		resp.CostMs = time.Since(start).Milliseconds()
		resp.ErrMsg = err.Error()
		return resp
	}
	// 公开 SDK 只打开并关闭传输，失败统一收敛为结构化响应。
	err = client.Probe(ctx)
	cost := time.Since(start).Milliseconds()
	if err != nil {
		resp.Success = false
		resp.CostMs = cost
		resp.ErrMsg = err.Error()
		return resp
	}
	resp.Success = true
	resp.CostMs = cost
	return resp
}

// HandlePing 处理 __action=ping 的 HTTP 请求:解析参数 -> 连通测试 -> 返回 JSON。
// 始终返回 200(参数或连接失败也以 JSON 结构化返回),便于页面统一渲染。
func HandlePing(w http.ResponseWriter, r *http.Request) {
	p, err := parsePingParams(r)
	if err != nil {
		logx.WithContext(r.Context()).Errorf("modbus web ping parse params err:%v", err)
		writeJSON(w, http.StatusBadRequest, PingResponse{Success: false, ErrMsg: err.Error()})
		return
	}
	logx.WithContext(r.Context()).Infof("modbus web ping addr:%s mode:%s timeout:%d",
		p.Address, p.Mode, p.Timeout)
	resp := doPing(r.Context(), p)
	writeJSON(w, http.StatusOK, resp)
}
