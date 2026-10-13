# Modbus 协议迁移

根目录 `Client.ReadHoldingRegisters` 与 `Client.WriteSingleRegister` 是可独立运行的 Modbus TCP 功能码 3/6 读写样例，`go test ./protocols/modbus` 使用本地模拟设备验证请求、回显、异常码和错误响应。`upstream/` 是现行 SaaS Modbus 服务源码快照（已移除环境配置）；它依赖 Things 内部代码，且 `internal/svc/connector.go` 尚为占位实现。完整 Things 协议接入、RTU 和更多功能码需要继续迁移与测试。
