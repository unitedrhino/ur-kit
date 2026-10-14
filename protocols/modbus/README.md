# Modbus 协议迁移

根目录 `Client.ReadHoldingRegisters` 与 `Client.WriteSingleRegister` 提供 Modbus TCP 功能码 3/6。`Simulator` 提供本地保持寄存器设备，支持异常码 1/2/3，供集成测试和示例使用。

从仓库根目录运行 `go run ./protocols/modbus/cmd/demo`，会在回环地址启动模拟设备，读取寄存器 10 的初始值 42，写入 258 并再次读取。运行 `go test -race ./protocols/modbus/...` 验证完整 TCP 交互、设备异常码及请求中途取消。示例不连接外部设备，也不需要平台配置。

`upstream/` 是现行 SaaS Modbus 服务源码快照（已移除环境配置）；它依赖 Things 内部代码，且 `internal/svc/connector.go` 尚为占位实现。完整 Things 协议接入、RTU 和更多功能码需要继续迁移与测试。
