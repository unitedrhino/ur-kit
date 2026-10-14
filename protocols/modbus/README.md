# Modbus 协议迁移

`Client{RTUOverTCP: true}` 使用 RTU 单元号、CRC16 和功能码响应长度，经 TCP 连接发送同一组读写操作；默认 `false` 仍使用 Modbus TCP 的 MBAP 帧。该模式适用于 RTU over TCP 网关，本机回环测试无需串口。`Client{TLS: &tls.Config{RootCAs: roots}}` 在 TCP 握手时校验设备证书并加密连接，也可与 RTU over TCP 帧组合；留空则维持明文 TCP。物理串口 RTU 和 RTU over UDP 尚未接线。

根目录客户端提供 Modbus TCP 线圈、离散输入、输入寄存器和保持寄存器的功能码 1/2/3/4/5/6/15/16。`Point` 接受原协议的 `registerType`、`valueType`、`bit`、`bitLen`、`byteSwap`、`wordSwap`、`multiWrite` 等 JSON 字段；`Client.ReadPoint` / `WritePoint` 按寄存器类型访问设备。保持寄存器 `uint16` 位域写入采用读改写，多个写入方须由接入服务按设备串行化，避免并发覆盖未选中的位。离散输入和输入寄存器只读。`HoldingPoint` 提供 uint16/32/64、int16/32/64、float32/64 和固定寄存器长度字符串的编解码，写入使用对应 Go 类型，不进行隐式数值转换。字符串按 UTF-8 原始字节写入，不足长度填充零字节，读取时去掉末尾零字节。`Simulator` 可配置四类设备点位，支持异常码 1/2/3，供集成测试和示例使用。

从仓库根目录运行 `go run ./protocols/modbus/cmd/demo`，会在回环地址启动模拟设备，读取寄存器 10 的初始值 42，写入 258 并再次读取。运行 `go test -race ./protocols/modbus/...` 验证完整 TCP 交互、TLS 证书拒绝与读写、批量线圈位序与回显、四类点位、位域、类型编解码、设备异常码及请求中途取消。示例不连接外部设备，也不需要平台配置。

`upstream/` 保留合同锁定 SaaS 提交中的 22 份 Modbus 原服务文件（排除两份环境 YAML）；`manifest.json` 记录来源和逐文件哈希。用 `python3 scripts/sync_modbus.py --saas <saas-repo> --sha <contracts/manifest.json 中的完整提交>` 同步，追加 `--check` 可只读核对。原服务仍依赖 Things 内部代码，且 `internal/svc/connector.go` 尚为占位实现；可独立运行的本机读写能力以根目录客户端和模拟器为准。协议服务的产品/设备同步、完整 Things 接入及 RTU 仍需迁移与测试。
