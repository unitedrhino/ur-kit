# 应用接入 WebSocket 与消息通知

独立 Web、移动端和业务后端都可以订阅平台推送，无需平台私有源码。前端已有连接实现；Go/Java/Node 可按同一公开频道协议使用各自 WebSocket 运行库。HTTP/RPC SDK 不会自动变成 WS 客户端，OpenAPI 生成的 connect 方法也不能代替 WebSocket Upgrade。

## 1. 选择入口

| 场景 | 入口 | 使用方式 |
| --- | --- | --- |
| Vue Web | `@vben/saas/ws-client` | 直接使用独立的 WsClient 和共享连接，不经过包含大量 UI 的包根入口 |
| IoT Web 通知面板 | `useNotifications` / 现有布局 | 已整合用户通知；新增业务复用现有连接 |
| uni-app | `mobile/src/services/realtime.service.ts` | 复用 datasource、provider 和 eventBus，不在每个页面重复 connectSocket |
| Node 22 后端 | 原生 `WebSocket` | 按下面协议连接，自己管理重连和订阅 |
| Java 17 后端 | `HttpClient.newWebSocketBuilder()` | 使用标准库 Listener、分片拼接与请求背压 |
| Go 后端 | WebSocket 运行库 | 使用握手请求头携带令牌，按协议收发 JSON |

当前 Go/Java/Node SDK 提供 HTTP/RPC 封装；尚无分别封装好的三语言 WS 高层客户端。服务端不必下载 Web UI 包，按本协议使用标准/公开传输库即可。

`@vben/saas/ws-client` 是新增窄入口，需使用包含该入口的 ur-kit 源码提交/后续发布版本。`v0.2.36` 已有相同实现，可从 `@vben/saas` 包根导入，但会经过宽导出；不要声称旧标签已经具有新增子路径。SDK 合同标签与共享源码提交分别锁定。

## 2. 认证与连接地址

入口是 `GET /api/v1/system/common/websocket/connect`，HTTP(S) 根地址对应 WS(S)。用户令牌、数字应用 ID、当前企业/项目和设备实例标识来自登录及应用上下文。

浏览器原生 WebSocket 不能任意设置请求头，当前平台允许在 URL 查询串提供 `token`、`app-id`、`tenant-code`、`project-id`、`device-id`。服务端运行库可以通过请求头传递认证。生产使用 TLS，代理访问日志隐藏 token 查询参数。

选择企业/项目不是授权证明。频道仍由平台检查用户对设备、项目等资源的权限；通配符也不能扩大可见范围。

IoT 基础应用的开发链路为：

```text
浏览器 WS → Vite /api 代理（ws: true）→ Go 应用代理 → 平台 WS
```

生产镜像由 Go 直接转发升级请求；外部网关仍须支持 Upgrade 和长连接超时。不要因普通 HTTP API 可用就认为 WS 也已验证。

## 3. Web 业务接入

以下为应用壳层统一装配示例，`wsURL` 应与现有布局使用的地址完全一致。取得一个共享引用后，在应用退出时释放；普通页面只管理自己的回调。

```ts
// 本文件在应用壳层装配设备实时数据；参数来自已认证的应用状态。
import { acquireSharedWsClient, releaseSharedWsClient } from '@vben/saas/ws-client';

/** 将设备实时状态接入应用；同一壳层只创建一次，返回退出时清理函数。 */
export function startRealtime(wsURL: string, token: string, productID: string, deviceName: string,
  onProperty: (value: unknown, channel: string) => void, onFailure: (error: unknown) => void) {
  const client = acquireSharedWsClient({ url: wsURL, token });
  const channel = `device.prop.${productID}.${deviceName}`;
  // onConnected 是连接级回调，由壳层统一管理；页面不要反复覆盖它。
  const previous = client.onConnected;
  const subscribe = () => { void client.subscribe(channel, onProperty).catch(onFailure); };
  const connected = (data: unknown) => { previous?.(data); subscribe(); };
  client.onConnected = connected;
  if (client.isConnected()) subscribe();
  return async () => {
    if (client.onConnected === connected) client.onConnected = previous;
    try { await client.unsubscribe(channel, onProperty); }
    finally { releaseSharedWsClient(wsURL); }
  };
}
```

壳层应保证只装配一次。多个业务模块通过稳定回调和同一连接管理自己的订阅，不反复嵌套连接级回调。卸载后移除回调，退出登录和切换身份时由壳层统一清理连接与旧范围数据；`setToken` 仅更新下次握手使用的令牌，不能保证现有连接身份立即刷新。

`listen` / `unlisten` 只管理本地回调，适合平台自动订阅的 `user.notify.<userID>`；`subscribe` / `unsubscribe` 才会发送服务端订阅协议。订阅确认失败要向页面反馈，不能悄悄显示为已连接。

移动端连接由 [provider](../apps/iot-basic/mobile/src/providers/websocket.provider.ts) 管理，业务通过 [RealtimeService](../apps/iot-basic/mobile/src/services/realtime.service.ts) 订阅，事件经 `ws:device.property`、`ws:device.status`、`ws:user.notify` 分发。退出页面移除业务监听；不要随意断开全应用共用连接。

## 4. 公共频道协议

等待服务端 `connected` 后再订阅：

```json
{"id":1,"type":"subscribe","channel":"device.prop.DEMO.sensor1"}
```

服务端返回同一 id 的 `subscribe.ok`，失败返回 `error` 与业务 code/msg。一次只传一个 `channel`，不是旧的 `up.sub`、`channels` 数组或 `body.code/params`。

```json
{
  "type":"publish",
  "channel":"device.prop.DEMO.sensor1",
  "data":{
    "device":{"productID":"DEMO","deviceName":"sensor1"},
    "projectID":"9007199254740993",
    "timestamp":"1792112400000",
    "receivedTime":1792112400123,
    "params":{"temperature":23},
    "quality":{"temperature":"GOOD"}
  }
}
```

| 频道 | 内容 |
| --- | --- |
| `device.prop.<productID>.<deviceName>` | 整包属性变化 |
| `device.prop.<productID>.<deviceName>.<identifier>` | 单属性变化 |
| `device.conn.<productID>.<deviceName>` | 上下线 |
| `device.event.<productID>.<deviceName>.<identifier>` | 物模型事件 |
| `device.action.<productID>.<deviceName>.<identifier>` | 行为消息 |
| `device.ota.<productID>.<deviceName>` | OTA 进度 |
| `project.prop.<projectID>` / `project.conn.<projectID>` | 项目聚合 |
| `area.prop.<projectID>.<areaID>` | 区域聚合 |
| `user.notify.<userID>` | 站内通知 |
| `sys.alarm.<tenantCode>` | 告警 |

取消用 `unsubscribe`，确认是 `unsubscribe.ok`；应用层心跳用 `ping`/`pong`。ID 按字符串保留精度，采集 timestamp 和接收 receivedTime 都是毫秒，但前者序列化为字符串；通知时间有不同单位，不能全部乘同一个系数。

断网重连后重新认证并恢复有效订阅，再查询快照补齐断线期间的数据。WS 不保证历史补发，也不能作为属性控制已被设备执行的唯一证据。

## 5. 应用后端发送站内通知

接收平台推送和发送业务通知是两条能力。应用后端可通过平台公开通知接口发送消息，再由平台通知系统分发到用户频道；不需要导入私有 Hub/Publisher。

- HTTP：`POST /api/v1/system/notify/message/info/send`。
- RPC：公开 sys `NotifyManage` 的 `MessageInfoSend`。
- 合同：[通知 API](../contracts/source/backend/core/service/apisvr/http/system/notify/message.api)、[通知 Proto](../contracts/source/backend/core/service/syssvr/proto/notify.proto)。

请求示例：

```json
{
  "userIDs":["9007199254740993"],
  "isGlobal":2,
  "notifyCode":"<registered-notify-code>",
  "subject":"业务处理完成",
  "body":"本次业务结果已生成，请进入应用查看。"
}
```

该管理接口要求平台授予相应权限，普通用户的 WS 订阅权不包含发送权。`notifyCode` 的渠道、模板和受众需提前配置；后端从已核验业务范围计算收件人，不能让前端任意提交全局群发。

用户通知中心另有列表/未读/已读合同。WS 只做即时提示，重新登录或消息中心打开后仍通过 HTTP 读取持久记录；收到推送不能替代已读提交或必达确认。

应用自定义任意频道的发布、命名空间和授权提供者并非现有通用 SDK 的外部注册 API。需要独立业务实时通道时，可在自己的后端实现 WS；需要扩展平台频道时由平台维护者增加对应能力，不能伪造平台内部总线身份。

## 6. 验证

在 ur-kit 根目录运行：

```sh
# Node 22.13+ 的原生 TypeScript 去类型，用于无 UI 依赖的客户端协议测试。
node --experimental-strip-types --test scripts/test_realtime.mjs
# 本机真实 WebSocket，验证单容器代理、订阅/推送/退订/心跳和认证拒绝。
(cd apps/iot-basic/backend && go test -run TestWebSocketProxyIntegration -v .)
```

测试使用本机传输替身/模拟平台，不声称完成真实平台联调。接入目标平台后还要验证实际账号权限、设备上报、通知发送、断线重连、企业/项目切换及小程序合法域名。
