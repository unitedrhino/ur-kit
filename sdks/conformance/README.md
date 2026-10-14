# 三语言 HTTP 合同用例

`http-response.json` 是 Go、Java、Node HTTP 客户端共用的响应样本。`data.id` 是超过 JavaScript 安全整数范围的十进制 ID，`data.nullable` 是显式空值，`data.receivedTime` 是毫秒时间戳。

- 请求中的 ID 用十进制字符串传递。Go 反序列化使用 `json.Number`；Java 和 Node 返回原始 JSON，由调用方选择不会丢失精度的解析器。
- Node HTTP/RPC 的 `project-id`、`app-id` 请求头拒绝不安全的 Number；超过 JavaScript 安全整数范围时传十进制字符串或 BigInt，避免转换前已丢失精度。
- 平台地址是无凭据、无查询参数与片段的 HTTP(S) 根地址；API 路径以单个 `/` 开头，不含查询参数或片段。需要发送 JSON 空值时，明确传入 `null`。
- 认证令牌不能为空；服务端身份必须从可信认证器取得。HTTP 非 2xx 响应保留状态码与原始响应体，错误消息不得包含令牌。
- 三语言客户端均禁止跟随平台 HTTP 重定向；收到 3xx 时按非成功状态返回，令牌不得传向跳转目标。调用方注入的 Go HTTP 客户端重定向策略也会被本 SDK 覆盖。

修改这些语义时同步更新三语言测试，并核对 SaaS `apilegacy` 的旧客户端协议。
