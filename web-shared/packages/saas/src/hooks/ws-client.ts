/**
 * WebSocket Client SDK (TypeScript)
 *
 * 适配新版 WebSocket 推送系统，支持：
 * - 点分层级频道订阅（device.prop.productA.deviceB.temperature）
 * - 通配符匹配（* 匹配单段，> 匹配剩余所有段）
 * - 自动重连（默认指数退避 + 抖动，最多 10 次）与心跳
 * - 消息回调按频道分发
 * - 同源共享单例（acquire/releaseSharedWsClient）：同一页面多个业务模块
 *   复用一条连接，避免同账号多连接触发服务端单用户连接上限的“踢最旧”替换
 */

// ==================== 类型定义 ====================

export const WS_MSG_TYPE = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  PONG: 'pong',
  CONNECTED: 'connected',
  // 后端统一使用 publish 下发数据，保留 DATA 别名兼容历史代码
  DATA: 'publish',
  PUBLISH: 'publish',
  ERROR: 'error',
  // 后端订阅/取消订阅成功响应为 subscribe.ok / unsubscribe.ok
  SUBSCRIBED: 'subscribe.ok',
  UNSUBSCRIBED: 'unsubscribe.ok',
  // IM 应用层 ACK 回执：客户端收到 im.push.message 后上行，服务端记录已送达游标
  IM_ACK: 'im.ack',
} as const

export type WsMsgType = (typeof WS_MSG_TYPE)[keyof typeof WS_MSG_TYPE]

/** 服务端下发消息 */
export interface WsServerMessage {
  id?: number
  type: WsMsgType
  channel?: string
  code?: number
  msg?: string
  data?: unknown
  ts?: number
}

/** 客户端上行消息 */
export interface WsClientMessage {
  id?: number
  type: string
  channels?: string[]
}

/** 指数退避：1s 起 ×2，封顶 30s；equal jitter 打散多标签同时重连 */
const WS_RECONNECT_BASE_MS = 1000
const WS_RECONNECT_CAP_MS = 30_000

/** 服务端替换连接时下发的关闭原因（与后端 websocket.CloseReasonReplaced 保持一致） */
export const WS_CLOSE_REASON_REPLACED = 'replaced by newer connection from same device'

/** 被服务端替换后的最小重连间隔（ms）：避免多端互踢时被踢连接立即抢连形成风暴 */
const WS_REPLACED_RECONNECT_MIN_MS = 5000

/** 连接配置 */
export interface WsClientOptions {
  /** WebSocket 地址，如 ws://localhost:8080/api/v1/system/common/websocket/connect */
  url: string
  /** 认证 token */
  token: string
  /** 心跳间隔（ms），默认 25000 */
  pingInterval?: number
  /**
   * 固定重连间隔（ms）。>0 时每次重连都用该间隔；不传或 0 则使用指数退避 + 抖动（推荐）
   */
  reconnectInterval?: number
  /** 最大重连次数，0 表示无限，默认 10 */
  maxReconnectAttempts?: number
}

/** 数据回调 */
export type WsDataCallback = (data: unknown, channel: string) => void

interface PendingRequest {
  resolve: (msg: WsServerMessage) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

// ==================== 通配符匹配 ====================

/**
 * 匹配频道模式
 * - 精确匹配：device.prop.productA.deviceB
 * - * 匹配恰好一个段：device.*.productA.deviceB
 * - > 匹配一个或多个段（仅末尾）：device.prop.productA.>
 */
export function matchChannel(pattern: string, channel: string): boolean {
  const patParts = pattern.split('.')
  const chanParts = channel.split('.')

  let pi = 0
  let ci = 0

  while (pi < patParts.length && ci < chanParts.length) {
    const seg = patParts[pi]

    if (seg === '>') {
      return ci < chanParts.length
    }

    if (seg !== '*' && seg !== chanParts[ci]) {
      return false
    }

    pi++
    ci++
  }

  return pi === patParts.length && ci === chanParts.length
}

// ==================== WsClient ====================

export class WsClient {
  private url: string
  private token: string
  private pingInterval: number
  private reconnectInterval: number
  private maxReconnectAttempts: number

  private ws: WebSocket | null = null
  private msgID = 0
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectCount = 0
  private closed = false

  private listeners = new Map<string, Set<WsDataCallback>>()
  private pending = new Map<number, PendingRequest>()
  private subscriptions = new Set<string>()

  // 事件回调
  onConnected: ((data: unknown) => void) | null = null
  onDisconnected: ((code: number, reason: string) => void) | null = null
  onError: ((event: Event) => void) | null = null

  constructor(options: WsClientOptions) {
    this.url = options.url
    this.token = options.token
    this.pingInterval = options.pingInterval ?? 25000
    this.reconnectInterval = options.reconnectInterval ?? 0
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10
  }

  /** 更新鉴权 token（登录刷新后调用，下次 doConnect / 重连会使用新 token） */
  setToken(token: string): void {
    this.token = token
  }

  /** 底层连接是否已打开（共享连接下接入方据此判断是否需要补订阅） */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  // ==================== 连接管理 ====================

  connect(): void {
    this.closed = false
    this.reconnectCount = 0
    this.doConnect()
  }

  private doConnect(): void {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }

    const separator = this.url.includes('?') ? '&' : '?'
    const wsUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectCount = 0
    }

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data as string)
    }

    this.ws.onclose = (event: CloseEvent) => {
      this.stopPing()
      this.onDisconnected?.(event.code, event.reason)
      if (!this.closed) {
        // 服务端替换（同账号多连接超限被踢）时拉长重连间隔，避免互踢重连风暴
        this.scheduleReconnect(event.reason === WS_CLOSE_REASON_REPLACED)
      }
    }

    this.ws.onerror = (event: Event) => {
      this.onError?.(event)
    }
  }

  disconnect(): void {
    this.closed = true
    this.stopPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    if (this.ws) {
      this.ws.close(1000, 'client disconnect')
      this.ws = null
    }
    for (const [, p] of this.pending) {
      clearTimeout(p.timer)
      p.reject(new Error('disconnected'))
    }
    this.pending.clear()
  }

  /** 下一次重连等待时间：固定间隔模式 或 指数退避 + equal jitter */
  private nextReconnectDelayMs(): number {
    if (this.reconnectInterval > 0) {
      return this.reconnectInterval
    }
    const exp = Math.min(WS_RECONNECT_CAP_MS, WS_RECONNECT_BASE_MS * 2 ** this.reconnectCount)
    const low = exp * 0.5
    return Math.floor(low + Math.random() * (exp - low))
  }

  private scheduleReconnect(replacedByServer = false): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.maxReconnectAttempts > 0 && this.reconnectCount >= this.maxReconnectAttempts) {
      return
    }
    // 被服务端替换时使用较长固定间隔：此时立即抢连会再次触发服务端替换，形成互踢风暴
    const delay = replacedByServer
      ? Math.max(WS_REPLACED_RECONNECT_MIN_MS, this.nextReconnectDelayMs())
      : this.nextReconnectDelayMs()
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectCount++
      this.doConnect()
    }, delay)
  }

  // ==================== 心跳 ====================

  private startPing(): void {
    this.stopPing()
    this.pingTimer = setInterval(() => {
      this.send({ type: WS_MSG_TYPE.PING })
    }, this.pingInterval)
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  // ==================== 订阅 ====================

  /**
   * 仅注册本地回调，不向服务端发送 subscribe 消息。
   * 适用于服务端已自动订阅的频道（如 user.notify.{userID}、sys.alarm.{tenantCode}）。
   */
  listen(channel: string, callback: WsDataCallback): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)
  }

  async subscribe(channel: string, callback: WsDataCallback): Promise<void> {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)

    if (this.subscriptions.has(channel)) {
      return
    }

    await this.request(WS_MSG_TYPE.SUBSCRIBE, { channel })
    this.subscriptions.add(channel)
  }

  async unsubscribe(channel: string, callback?: WsDataCallback): Promise<void> {
    if (callback) {
      const cbs = this.listeners.get(channel)
      if (cbs) {
        cbs.delete(callback)
        if (cbs.size === 0) {
          this.listeners.delete(channel)
        }
      }
    } else {
      this.listeners.delete(channel)
    }

    if (!this.listeners.has(channel) || this.listeners.get(channel)!.size === 0) {
      this.subscriptions.delete(channel)
      await this.request(WS_MSG_TYPE.UNSUBSCRIBE, { channel })
    }
  }

  /**
   * 仅移除本地回调，不向服务端发送 unsubscribe。
   * 用于服务端自动订阅的频道（如 user.notify.*），以及共享连接中
   * 各调用方只清理自身回调、不影响其他使用方的场景。
   */
  unlisten(channel: string, callback: WsDataCallback): void {
    const cbs = this.listeners.get(channel)
    if (!cbs) return
    cbs.delete(callback)
    if (cbs.size === 0) {
      this.listeners.delete(channel)
    }
  }

  // ==================== 消息处理 ====================

  private handleMessage(raw: string): void {
    let msg: WsServerMessage
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    switch (msg.type) {
      case WS_MSG_TYPE.CONNECTED:
        this.startPing()
        this.resubscribe()
        this.onConnected?.(msg.data)
        break

      case WS_MSG_TYPE.DATA:
      case WS_MSG_TYPE.PUBLISH:
        if (msg.channel) {
          this.dispatchData(msg.channel, msg.data)
        }
        break

      case WS_MSG_TYPE.SUBSCRIBED:
      case WS_MSG_TYPE.UNSUBSCRIBED:
        if (msg.id) this.resolveRequest(msg.id, msg)
        break

      case WS_MSG_TYPE.ERROR:
        if (msg.id) this.rejectRequest(msg.id, msg)
        break

      case WS_MSG_TYPE.PONG:
        break
    }
  }

  private dispatchData(channel: string, data: unknown): void {
    for (const [pattern, callbacks] of this.listeners) {
      if (matchChannel(pattern, channel)) {
        for (const cb of callbacks) {
          try {
            cb(data, channel)
          } catch (e) {
            console.error('ws callback error:', e)
          }
        }
      }
    }
  }

  private async resubscribe(): Promise<void> {
    if (this.subscriptions.size === 0) return
    const channels = Array.from(this.subscriptions)
    try {
      // 后端协议一次只接受单个 channel 字段
      for (const ch of channels) {
        await this.request(WS_MSG_TYPE.SUBSCRIBE, { channel: ch })
      }
    } catch (e) {
      console.error('ws resubscribe error:', e)
    }
  }

  // ==================== 底层通信 ====================

  private nextID(): number {
    return ++this.msgID
  }

  private send(msg: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /** 发送 IM 应用层 ACK 回执（连接未建立时静默丢弃，不阻塞业务） */
  sendAck(data: Record<string, unknown>): void {
    this.send({ type: WS_MSG_TYPE.IM_ACK, data })
  }

  private request(type: string, payload: Record<string, unknown>, timeout = 5000): Promise<WsServerMessage> {
    return new Promise((resolve, reject) => {
      const id = this.nextID()
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`ws request timeout: ${type}`))
      }, timeout)

      this.pending.set(id, { resolve, reject, timer })
      this.send({ id, type, ...payload })
    })
  }

  private resolveRequest(id: number, msg: WsServerMessage): void {
    const p = this.pending.get(id)
    if (p) {
      clearTimeout(p.timer)
      this.pending.delete(id)
      p.resolve(msg)
    }
  }

  private rejectRequest(id: number, msg: WsServerMessage): void {
    const p = this.pending.get(id)
    if (p) {
      clearTimeout(p.timer)
      this.pending.delete(id)
      p.reject(new Error(msg.msg || `ws error code=${msg.code}`))
    }
  }
}

// ==================== 共享连接（同源单例） ====================

/** 共享连接条目 */
interface SharedWsEntry {
  /** 共享的 WsClient 实例 */
  client: WsClient
  /** 引用计数：归零时断开连接并回收实例 */
  refCount: number
}

/** 按 URL 缓存的共享连接：同一页面同源只保留一条 WS 连接 */
const sharedWsClients = new Map<string, SharedWsEntry>()

/**
 * 获取（或创建）指定 URL 的共享 WsClient 并占用一个引用。
 * 首个引用会立即建立连接；同一 URL 的多个使用方（如全局通知与 IM 工作台）
 * 复用同一实例、各自通过 listen/subscribe 订阅自己的频道，
 * 避免同账号建立多条连接触发服务端单用户连接上限的“踢最旧”替换与重连风暴。
 */
export function acquireSharedWsClient(options: WsClientOptions): WsClient {
  let entry = sharedWsClients.get(options.url)
  if (!entry) {
    entry = { client: new WsClient(options), refCount: 0 }
    sharedWsClients.set(options.url, entry)
  }
  if (options.token) {
    entry.client.setToken(options.token)
  }
  entry.refCount += 1
  if (entry.refCount === 1) {
    entry.client.connect()
  }
  return entry.client
}

/**
 * 释放共享 WsClient 的一个引用；最后一个引用释放时断开连接并回收实例。
 */
export function releaseSharedWsClient(url: string): void {
  const entry = sharedWsClients.get(url)
  if (!entry) return
  entry.refCount -= 1
  if (entry.refCount > 0) return
  entry.client.disconnect()
  sharedWsClients.delete(url)
}
