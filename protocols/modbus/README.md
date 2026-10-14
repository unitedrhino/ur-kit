# Modbus 协议迁移

根目录 `Client.ReadHoldingRegisters` 与 `Client.WriteSingleRegister` 提供 Modbus TCP 功能码 3/6。`Simulator` 提供本地保持寄存器设备，支持异常码 1/2/3，供集成测试和示例使用。

从仓库根目录运行 `go run ./protocols/modbus/cmd/demo`，会在回环地址启动模拟设备，读取寄存器 10 的初始值 42，写入 258 并再次读取。运行 `go test -race ./protocols/modbus/...` 验证完整 TCP 交互、设备异常码及请求中途取消。示例不连接外部设备，也不需要平台配置。

`upstream/` 保留合同锁定 SaaS 提交中的 22 份 Modbus 原服务文件（排除两份环境 YAML）；`manifest.json` 记录来源和逐文件哈希。用 `python3 scripts/sync_modbus.py --saas <saas-repo> --sha <contracts/manifest.json 中的完整提交>` 同步，追加 `--check` 可只读核对。原服务仍依赖 Things 内部代码，且 `internal/svc/connector.go` 尚为占位实现；可独立运行的本机读写能力以根目录客户端和模拟器为准。完整 Things 协议接入、RTU 和更多功能码需要继续迁移与测试。
