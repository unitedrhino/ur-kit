// 本文件维护设备的公开 Modbus SDK 会话，避免采集与控制并发访问连接指针。
package domain

import sdkmodbus "github.com/unitedrhino/ur-kit/protocols/modbus"

// Client 返回当前设备客户端；会话关闭时进行中的请求会返回连接错误。
func (info *DevInfo) Client() *sdkmodbus.Client {
	info.CliMutex.RLock()
	defer info.CliMutex.RUnlock()
	return info.Cli
}

// SetSession 替换设备连接并释放旧会话；传入 nil 表示设备待重连。
func (info *DevInfo) SetSession(session *sdkmodbus.Session) {
	info.CliMutex.Lock()
	old := info.Session
	info.Session = session
	info.Cli = nil
	if session != nil {
		client := session.Client()
		info.Cli = &client
	}
	info.CliMutex.Unlock()
	if old != nil && old != session {
		_ = old.Close()
	}
}
