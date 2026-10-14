# Modbus 协议迁移

根目录 `Client.ReadHoldingRegisters`、`Client.WriteSingleRegister` 与 `Client.WriteMultipleRegisters` 提供 Modbus TCP 保持寄存器功能码 3/6/16。`HoldingPoint` 提供 uint16/32/64、int16/32/64、float32/64 和固定寄存器长度字符串的编解码，可配置寄存器内字节交换、相邻寄存器字序交换，以及单寄存器强制使用功能码 16。`Client.ReadHoldingPoint` 和 `WriteHoldingPoint` 可直接读写配置点位；写入使用对应 Go 类型，不进行隐式数值转换。字符串按 UTF-8 原始字节写入，不足长度填充零字节，读取时去掉末尾零字节。`Simulator` 提供本地保持寄存器设备，支持异常码 1/2/3，供集成测试和示例使用。

从仓库根目录运行 `go run ./protocols/modbus/cmd/demo`，会在回环地址启动模拟设备，读取寄存器 10 的初始值 42，写入 258 并再次读取。运行 `go test -race ./protocols/modbus/...` 验证完整 TCP 交互、类型点位、设备异常码及请求中途取消。示例不连接外部设备，也不需要平台配置。

`upstream/` 保留合同锁定 SaaS 提交中的 22 份 Modbus 原服务文件（排除两份环境 YAML）；`manifest.json` 记录来源和逐文件哈希。用 `python3 scripts/sync_modbus.py --saas <saas-repo> --sha <contracts/manifest.json 中的完整提交>` 同步，追加 `--check` 可只读核对。原服务仍依赖 Things 内部代码，且 `internal/svc/connector.go` 尚为占位实现；可独立运行的本机读写能力以根目录客户端和模拟器为准。线圈、离散输入、输入寄存器、位域、完整 Things 协议接入及 RTU 仍需迁移与测试。
