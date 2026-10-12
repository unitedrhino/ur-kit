import { realtimeService } from '../services/realtime.service';
import { eventBus } from '../utils/event-bus';

export interface WebSocketState {
  connected: boolean;
}

class WebSocketProvider {
  private state: WebSocketState = { connected: false };
  private listeners: Set<(s: WebSocketState) => void> = new Set();
  private eventHandlersReady = false;
  private currentToken = '';

  getState(): WebSocketState { return this.state; }

  subscribe(listener: (s: WebSocketState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void { this.listeners.forEach((fn) => fn(this.state)); }

  /** 初始化全局 WS 事件监听，避免多次 connect 重复注册。 */
  init(): void {
    if (this.eventHandlersReady) return;
    this.eventHandlersReady = true;
    eventBus.on('ws:connected', () => {
      this.state = { connected: true };
      this.notify();
    });
    eventBus.on('ws:disconnected', () => {
      this.state = { connected: false };
      this.notify();
    });
    eventBus.on('auth:token-confirmed', (token) => {
      this.connect(String(token || ''));
    });
  }

  connect(token: string): void {
    this.init();
    if (!token) return;
    if (this.currentToken === token && this.state.connected) return;
    this.currentToken = token;
    realtimeService.connect(token);
  }

  disconnect(): void {
    this.currentToken = '';
    realtimeService.disconnect();
    this.state = { connected: false };
    this.notify();
  }
}

export const webSocketProvider = new WebSocketProvider();
