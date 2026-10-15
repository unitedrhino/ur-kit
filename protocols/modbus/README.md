# Modbus 客户端与模拟设备

本包提供独立 Go 驱动、点位编解码和本地模拟器。开发接入平台的网关，按[协议开发指南](../../.agents/skills/ur-kit-development/references/protocol-development.md)另行装配注册、配置同步、采集和控制；驱动读写成功不等于平台消息链路已经接通。

`Client{RTUOverTCP: true}` 使用 RTU 单元号、CRC16 和功能码响应长度，经 TCP 连接发送同一组读写操作；默认 `false` 仍使用 Modbus TCP 的 MBAP 帧。`Client{UDP: true}` 用 MBAP 数据报，`Client{RTUOverUDP: true}` 用带 CRC 的 RTU 数据报；两者均校验完整报文长度。`Client{TLS: &tls.Config{RootCAs: roots}}` 在 TCP 握手时校验设备证书并加密连接，也可与 RTU over TCP 帧组合；UDP 不支持 TLS。`Client{Address: "<serial-device>", UnitID: 1, Serial: &modbus.SerialConfig{BaudRate: 19200, DataBits: 8, StopBits: 1, Parity: "N"}}` 直接打开物理串口并收发相同的 RTU 帧；串口与网络模式、TLS 不能混用。串口参数零值采用 19200、8E1；使用 8N1 时须显式设置 `Parity: "N"`。同一串口的并发请求由接入服务串行化，调用取消和总超时会终止等待响应。

`Client.Probe(ctx)` 只打开并关闭 TCP、TLS、UDP 或串口传输，不发送 Modbus 功能码，适合配置页连通测试。UDP 建立本机套接字并不能证明远端设备在线；要验证实际设备响应，仍需读取已知可读点位。

持续采集设备时使用 `session, err := client.OpenSession(ctx)` 建立连接，再通过 `session.Client()` 调用原有读写方法，结束时调用 `session.Close()`。会话在同一 TCP/TLS/UDP/串口连接上串行发送请求，MBAP 事务号逐次递增；设备的合法异常帧返回 `ModbusException` 并保留连接，传输或帧校验失败、调用取消后关闭连接，接入方需重新创建会话。`Probe` 仍适合无需读写的配置验证。

根目录客户端提供 Modbus TCP 线圈、离散输入、输入寄存器和保持寄存器的功能码 1/2/3/4/5/6/15/16。`Point` 接受原协议的 `registerType`、`valueType`、`bit`、`bitLen`、`byteSwap`、`wordSwap`、`multiWrite` 等 JSON 字段；`Client.ReadPoint` / `WritePoint` 按寄存器类型访问设备。保持寄存器 `uint16` 位域写入采用读改写，多个写入方须由接入服务按设备串行化，避免并发覆盖未选中的位。离散输入和输入寄存器只读。`HoldingPoint` 提供 uint16/32/64、int16/32/64、float32/64 和固定寄存器长度字符串的编解码，写入使用对应 Go 类型，不进行隐式数值转换。字符串按 UTF-8 原始字节写入，不足长度填充零字节，读取时去掉末尾零字节。`Simulator` 可配置四类设备点位，支持异常码 1/2/3，供集成测试和示例使用。

从仓库根目录运行 `go run ./protocols/modbus/cmd/demo`，会在回环地址启动模拟设备，读取寄存器 10 的初始值 42，写入 258 并再次读取。运行 `go test -race ./protocols/modbus/...` 验证 TCP/UDP、物理串口伪终端与两类 RTU 网关帧的本机交互、TLS 证书拒绝与读写、批量线圈位序与回显、四类点位、位域、类型编解码、设备异常码及请求取消。示例不连接外部设备，也不需要平台配置；真实串口硬件与现场波特率仍需在设备端验收。

`upstream/` 保留合同锁定 SaaS 提交中的 22 份 Modbus 原服务文件（排除两份环境 YAML）；`manifest.json` 记录来源和逐文件哈希。用 `python3 scripts/sync_modbus.py --saas <saas-repo> --sha <contracts/manifest.json 中的完整提交>` 同步，追加 `--check` 可只读核对。该快照保留来源提交的服务内部依赖和占位实现，不是公开网关启动入口。可直接使用的 API 以本目录客户端、点位与模拟器为准；自己的网关按接入指南实现平台装配并验收。
