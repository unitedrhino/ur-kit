import { config } from '../../config';
import { eventBus } from '../../utils/event-bus';
import { getRequestContext } from '../../utils/request-context';
import { clientDebugService } from '../../services/client-debug.service';

/** 连接稳定阈值：超过此时长才认为是"正常连接"，重置 backoff delay */
const STABLE_CONNECTION_MS = 10000;
/** 最大连续重连尝试时长，避免后台不可用时刷屏 console 和上报日志。 */
const MAX_RECONNECT_ELAPSED_MS = 3 * 60 * 1000;

export class WebSocketDataSource {
  private socket: WechatMiniprogram.SocketTask | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectStartedAt = 0;
  private reconnectEnabled = false;
  private connected = false;
  private connectTime = 0;
  private token = '';
  private msgID = 0;

  /** 需要保持的频道订阅，重连后自动重订阅 */
  private subscriptions = new Set<string>();

  connect(token: string): void {
    this.reconnectEnabled = !!token;
    this.reconnectStartedAt = 0;
    this.reconnectDelay = 1000;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.openSocket(token);
  }

  private openSocket(token: string): void {
    // 已有连接：若 token 未变则复用；token 变化（重新登录）需要先断开旧连接
    if (this.socket) {
      if (this.token === token) return;
      this.closeSocket();
    }
    this.token = token;
    if (!token) return;

    const header: Record<string, string> = {
      token,
      'app-id': config.appId,
      'device-id': clientDebugService.getInstanceID(),
    };
    const { tenantCode, projectID } = getRequestContext();
    if (tenantCode) header['ithings-tenant-code'] = tenantCode;
    if (projectID) header['ithings-project-id'] = projectID;

    let socketUrl = `${config.wsBaseUrl}/api/v1/system/common/websocket/connect`;
    // #ifdef H5
    // 浏览器 WebSocket 不允许自定义请求头；后端兼容从查询参数读取同名鉴权字段。
    const query = new URLSearchParams(header);
    socketUrl += `?${query.toString()}`;
    // #endif
    const socketOptions = {
      url: socketUrl,
      header,
      // H5 在未传回调时把 uni.connectSocket 包装为 Promise，无法注册 SocketTask 事件。
      success: () => {},
    };
    const socket = uni.connectSocket(socketOptions) as unknown as WechatMiniprogram.SocketTask;
    this.socket = socket;

    if (!socket || typeof socket.onOpen !== 'function') {
      this.socket = null;
      return;
    }

    socket.onOpen(() => {
      this.connected = true;
      this.connectTime = Date.now();
      this.startHeartbeat();
      eventBus.emit('ws:connected');
      // 注意：不在 onOpen 重置 reconnectDelay，
      // 只有稳定连接超过 STABLE_CONNECTION_MS 才重置（见 onClose）
    });

    socket.onMessage((res) => {
      try {
        const msg = JSON.parse(res.data as string) as {
          type: string;
          channel?: string;
          data?: unknown;
          code?: number;
        };
        if (msg.type === 'connected') {
          // 服务端确认连接后，恢复所有订阅
          this.resubscribeAll();
        } else if (msg.type === 'publish' && msg.channel) {
          this.handlePublish(msg.channel, msg.data);
        } else if (msg.type === 'pong' || msg.type === 'subscribe.ok' || msg.type === 'unsubscribe.ok') {
          // ignore
        }
      } catch {
        // ignore non-json
      }
    });

    socket.onClose(() => {
      if (this.socket !== socket) return;
      const wasConnected = this.connected && this.connectTime > 0;
      const shouldReconnect = wasConnected || this.reconnectStartedAt > 0;
      // 仅稳定连接后才重置 backoff，避免服务器立即 close 时一直以 1s 重连
      if (wasConnected && Date.now() - this.connectTime > STABLE_CONNECTION_MS) {
        this.reconnectDelay = 1000;
        this.reconnectStartedAt = 0;
      }
      this.socket = null;
      this.cleanup();
      if (shouldReconnect) {
        this.scheduleReconnect();
      }
      if (wasConnected) {
        eventBus.emit('ws:disconnected');
      }
    });

    socket.onError(() => {
      if (this.socket !== socket) return;
      const wasConnected = this.connected && this.connectTime > 0;
      const shouldReconnect = wasConnected || this.reconnectStartedAt > 0;
      this.socket = null;
      this.cleanup();
      if (shouldReconnect) {
        this.scheduleReconnect();
      }
    });
  }

  disconnect(): void {
    this.reconnectEnabled = false;
    this.reconnectStartedAt = 0;
    this.closeSocket();
  }

  private closeSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
    this.socket?.close({});
    this.socket = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 订阅指定频道。若 WS 已连接则立即发送订阅消息；重连后自动重订阅。
   */
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    if (this.connected) {
      this.sendMsg({ id: ++this.msgID, type: 'subscribe', channel });
    }
  }

  /**
   * 取消订阅指定频道。
   */
  unsubscribe(channel: string): void {
    if (!this.subscriptions.has(channel)) return;
    this.subscriptions.delete(channel);
    if (this.connected) {
      this.sendMsg({ id: ++this.msgID, type: 'unsubscribe', channel });
    }
  }

  private sendMsg(msg: Record<string, unknown>): void {
    if (this.connected && this.socket) {
      this.socket.send({ data: JSON.stringify(msg) });
    }
  }

  /** 重连后重新订阅所有已注册频道 */
  private resubscribeAll(): void {
    for (const channel of this.subscriptions) {
      this.sendMsg({ id: ++this.msgID, type: 'subscribe', channel });
    }
  }

  /**
   * 路由 publish 消息到 eventBus 对应事件。
   *
   * device.conn.*  → ws:device.status  （ConnStatus 1=在线/2=离线 → DeviceStatus 2/3）
   * device.prop.*  → ws:device.property（PropertyReportV2 按属性逐条 emit）
   */
  private handlePublish(channel: string, data: unknown): void {
    if (channel.startsWith('user.notify.')) {
      eventBus.emit('ws:user.notify', data);
    } else if (channel.startsWith('device.conn.')) {
      // ConnectMsg: { device: {productID, deviceName}, status: 1|2, timestamp: string }
      const d = data as { device: { productID: string; deviceName: string }; status: number };
      eventBus.emit('ws:device.status', {
        productID: d.device.productID,
        deviceName: d.device.deviceName,
        // ConnStatus 1=连接 → DeviceStatus 2(在线), ConnStatus 2=断连 → DeviceStatus 3(离线)
        status: d.status === 1 ? 2 : 3,
      });
    } else if (channel.startsWith('device.prop.')) {
      // PropertyReportV2: { device: {productID, deviceName}, timestamp: string, params: {[id]: value} }
      const d = data as {
        device: { productID: string; deviceName: string };
        timestamp: string;
        params: Record<string, unknown>;
      };
      for (const [dataID, value] of Object.entries(d.params)) {
        eventBus.emit('ws:device.property', {
          productID: d.device.productID,
          deviceName: d.device.deviceName,
          dataID,
          value,
          timestamp: Number(d.timestamp),
        });
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.send({ data: JSON.stringify({ type: 'ping' }) });
      }
    }, 30000) as unknown as number;
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    this.connected = false;
    this.connectTime = 0;
    this.stopHeartbeat();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.reconnectEnabled || !this.token) return;
    const now = Date.now();
    if (!this.reconnectStartedAt) {
      this.reconnectStartedAt = now;
    }
    const elapsed = now - this.reconnectStartedAt;
    if (elapsed >= MAX_RECONNECT_ELAPSED_MS) {
      this.reconnectEnabled = false;
      this.reconnectStartedAt = 0;
      this.reconnectDelay = 1000;
      return;
    }
    const delay = Math.min(this.reconnectDelay, MAX_RECONNECT_ELAPSED_MS - elapsed);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.socket = null;
      this.openSocket(this.token);
    }, delay) as unknown as number;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
}

export const wsDataSource = new WebSocketDataSource();
