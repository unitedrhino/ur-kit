// 本文件验证公开 WS 客户端的协议、共享连接与重连，Node 22 原生去类型即可运行。
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { readFile } from 'node:fs/promises';
import { WsClient, acquireSharedWsClient, releaseSharedWsClient } from '../web-shared/packages/saas/src/hooks/ws-client.ts';

/** 本机传输替身按平台协议返回确认，记录客户端真正发送的报文。 */
class LocalSocket {
  static OPEN = 1;
  static instances = [];
  readyState = 0;
  sent = [];
  onmessage = null;
  onclose = null;
  onopen = null;
  /** 保存连接 URL，供握手凭据和上下文断言。 */
  constructor(url) { this.url = url; LocalSocket.instances.push(this); }
  /** 完成传输连接并下发平台 connected 确认。 */
  open() {
    this.readyState = 1;
    this.onopen?.({});
    this.receive({ type: 'connected', data: { connID: 1 } });
  }
  /** 接收业务确认和推送，保持与真实 MessageEvent 相同的 JSON 边界。 */
  receive(message) { this.onmessage?.({ data: JSON.stringify(message) }); }
  /** 解析出站报文；拒绝频道使用平台 error，其他订阅正常确认。 */
  send(raw) {
    const msg = JSON.parse(raw);
    this.sent.push(msg);
    if (msg.type === 'subscribe' || msg.type === 'unsubscribe') {
      queueMicrotask(() => this.receive(msg.channel === 'device.prop.denied.sensor'
        ? { type: 'error', id: msg.id, code: 403, msg: 'forbidden' }
        : { type: `${msg.type}.ok`, id: msg.id, channel: msg.channel }));
    }
  }
  /** 正常关闭或模拟断网，使客户端进入相应的生命周期。 */
  close(code = 1000, reason = '') {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }
}

/** 保存运行时传输，测试结束恢复，避免影响同进程其他调用。 */
const originalWebSocket = globalThis.WebSocket;
afterEach(() => { globalThis.WebSocket = originalWebSocket; LocalSocket.instances = []; });

// 验证 package exports 对外可发现，消费方无需进入共享包私有目录。
test('WS 窄入口直接指向现有无 UI 依赖客户端', async () => {
  const manifest = JSON.parse(await readFile(new URL('../web-shared/packages/saas/package.json', import.meta.url)));
  const entry = manifest.exports['./ws-client'];
  assert.equal(entry.default, './src/hooks/ws-client.ts');
  const source = await readFile(new URL('../web-shared/packages/saas/src/hooks/ws-client.ts', import.meta.url), 'utf8');
  assert.equal(/^import\s/m.test(source), false);
});

// 验证单频道订阅、正确解包、大整数业务 ID、退订和禁止访问时的错误。
test('应用按平台协议订阅属性和通知，并处理拒绝与退订', async () => {
  globalThis.WebSocket = LocalSocket;
  const client = new WsClient({ url: 'ws://localhost/realtime?app-id=42', token: 'sample&token', pingInterval: 60000 });
  try {
    client.connect();
    const socket = LocalSocket.instances.at(-1);
    socket.open();
    assert.equal(new URL(socket.url).searchParams.get('token'), 'sample&token');
    assert.equal(new URL(socket.url).searchParams.get('app-id'), '42');
    const data = [];
    const listener = (body, channel) => data.push({ body, channel });
    client.listen('user.notify.*', listener);
    await client.subscribe('device.prop.DEMO.sensor', listener);
    assert.deepEqual(socket.sent[0], { id: 1, type: 'subscribe', channel: 'device.prop.DEMO.sensor' });
    socket.receive({ type: 'publish', channel: 'device.prop.DEMO.sensor', data: { projectID: '9007199254740993', params: { temperature: 23 } } });
    socket.receive({ type: 'publish', channel: 'user.notify.7', data: { message: { subject: '通知' } } });
    assert.equal(data.length, 2);
    assert.equal(data[0].body.projectID, '9007199254740993');
    await assert.rejects(client.subscribe('device.prop.denied.sensor', listener), /forbidden/);
    await client.unsubscribe('device.prop.DEMO.sensor', listener);
    socket.receive({ type: 'publish', channel: 'device.prop.DEMO.sensor', data: {} });
    client.unlisten('user.notify.*', listener);
    socket.receive({ type: 'publish', channel: 'user.notify.7', data: {} });
    assert.equal(data.length, 2);
  } finally { client.disconnect(); }
});

// 验证重连后恢复订阅，正常页面无需重复叠加监听器。
test('断线后自动重连并恢复已确认的订阅', async () => {
  globalThis.WebSocket = LocalSocket;
  const client = new WsClient({ url: 'ws://localhost/reconnect', token: 'sample', reconnectInterval: 5, maxReconnectAttempts: 1, pingInterval: 60000 });
  try {
    client.connect();
    const first = LocalSocket.instances.at(-1);
    first.open();
    let count = 0;
    await client.subscribe('device.conn.DEMO.sensor', () => count++);
    first.close(1006, 'network lost');
    await delay(20);
    const next = LocalSocket.instances.at(-1);
    assert.notEqual(first, next);
    next.open();
    await delay(0);
    assert.equal(next.sent[0].channel, 'device.conn.DEMO.sensor');
    next.receive({ type: 'publish', channel: 'device.conn.DEMO.sensor', data: { status: 1 } });
    assert.equal(count, 1);
  } finally { client.disconnect(); }
});

// 验证共享连接的引用与监听隔离，释放一个组件不会断开其他组件。
test('通知与业务共享连接，最后一个使用方退出才关闭', () => {
  globalThis.WebSocket = LocalSocket;
  const url = 'ws://localhost/shared';
  const first = acquireSharedWsClient({ url, token: 'sample' });
  const second = acquireSharedWsClient({ url, token: 'sample' });
  try {
    assert.equal(first, second);
    assert.equal(LocalSocket.instances.length, 1);
    LocalSocket.instances[0].open();
    releaseSharedWsClient(url);
    assert.equal(second.isConnected(), true);
  } finally { releaseSharedWsClient(url); }
  assert.equal(LocalSocket.instances[0].readyState, 3);
});
