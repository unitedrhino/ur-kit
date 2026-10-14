// 本文件提供与 SaaS 设备核心标识等形的公开值类型，供物模型读取函数签名使用。
package devices

// Core 标识一个产品下的设备，字段与 Things 设备核心标识的 JSON 合同一致。
type Core struct {
	ProductID  string `json:"productID"`
	DeviceName string `json:"deviceName"`
}
