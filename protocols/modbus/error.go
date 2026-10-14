// 本文件区分设备返回的合法异常帧与传输损坏，供持久会话判断连接是否可复用。
package modbus

import "fmt"

// ModbusException 表示设备以标准异常功能码返回的业务错误；Code 为线缆异常码。
type ModbusException struct {
	Code byte
}

// Error 返回与既有客户端相同的错误文本，供日志与调用方识别。
func (exception ModbusException) Error() string {
	return fmt.Sprintf("modbus exception code %d", exception.Code)
}
