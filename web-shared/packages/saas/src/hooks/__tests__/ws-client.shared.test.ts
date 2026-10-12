// 文件说明：共享 WS 连接（acquire/releaseSharedWsClient）与替换关闭退避的单元测试。
// 覆盖生产 WS 连接风暴修复的关键行为：
// 1. 同 URL 多个使用方复用一条连接（避免服务端单用户连接上限的“踢最旧”互踢）
// 2. 引用计数归零才断开连接，再次获取建立新实例
// 3. 被服务端替换关闭时使用较长固定间隔重连，避免立即抢连风暴
// 4. 普通网络断开仍走基础退避
// 5. unlisten 只移除本地回调，不影响其他使用方
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { acquireSharedWsClient, releaseSharedWsClient, WS_CLOSE_REASON_REPLACED } from '../ws-client';

/** FakeWebSocket 记录所有实例，并提供模拟服务端事件的入口 */
class FakeWebSocket {
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;

  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: ((event: unknown) => void) | null = null;
  readyState = 0;
  sent: string[] = [];
  url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
  }

  send(data: string) {
    this.sent.push(data);
  }

  /** 模拟连接关闭（含服务端 Close 帧携带的 code/reason） */
  simulateClose(code: number, reason: string) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  /** 模拟服务端推送消息 */
  simulateMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  /** 模拟握手完成 */
  simulateOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({});
  }
}

describe('共享 WS 连接', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('同 URL 多个使用方复用同一实例且只建立一条连接', () => {
    const url = 'ws://shared.example.com/api/v1/system/common/websocket/connect';
    const clientA = acquireSharedWsClient({ url, token: 'token-a' });
    const clientB = acquireSharedWsClient({ url, token: 'token-a' });

    expect(clientA).toBe(clientB);
    expect(FakeWebSocket.instances).toHaveLength(1);

    releaseSharedWsClient(url);
    releaseSharedWsClient(url);
  });

  it('引用计数归零后断开连接，再次获取建立新实例', () => {
    const url = 'ws://shared2.example.com/api/v1/system/common/websocket/connect';
    acquireSharedWsClient({ url, token: 't' });
    expect(FakeWebSocket.instances).toHaveLength(1);

    releaseSharedWsClient(url);
    expect(FakeWebSocket.instances[0].readyState).toBe(FakeWebSocket.CLOSED);

    acquireSharedWsClient({ url, token: 't' });
    expect(FakeWebSocket.instances).toHaveLength(2);
    releaseSharedWsClient(url);
  });

  it('被服务端替换关闭时使用较长固定间隔重连，避免立即抢连', () => {
    const url = 'ws://replaced.example.com/api/v1/system/common/websocket/connect';
    acquireSharedWsClient({ url, token: 't' });
    const first = FakeWebSocket.instances[0];
    first.simulateOpen();

    first.simulateClose(1000, WS_CLOSE_REASON_REPLACED);

    // 基础退避（≤1s）内不应重连
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(1);

    // 达到 5s 最小间隔后重连
    vi.advanceTimersByTime(4000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    releaseSharedWsClient(url);
  });

  it('普通断开仍按基础退避重连（非替换场景不受长间隔影响）', () => {
    const url = 'ws://normal.example.com/api/v1/system/common/websocket/connect';
    acquireSharedWsClient({ url, token: 't' });
    const first = FakeWebSocket.instances[0];
    first.simulateOpen();

    first.simulateClose(1006, '');

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    releaseSharedWsClient(url);
  });

  it('unlisten 只移除本地回调，不再分发消息', () => {
    const url = 'ws://unlisten.example.com/api/v1/system/common/websocket/connect';
    const client = acquireSharedWsClient({ url, token: 't' });
    const ws = FakeWebSocket.instances[0];
    ws.simulateOpen();

    const callback = vi.fn();
    client.listen('user.notify.*', callback);
    ws.simulateMessage({ type: 'publish', channel: 'user.notify.1', data: { a: 1 } });
    expect(callback).toHaveBeenCalledTimes(1);

    client.unlisten('user.notify.*', callback);
    ws.simulateMessage({ type: 'publish', channel: 'user.notify.1', data: { a: 1 } });
    expect(callback).toHaveBeenCalledTimes(1);

    releaseSharedWsClient(url);
  });
});
