/**
 * 项目级 IoT 实时数据中枢（单例）
 *
 * 职责：
 * - 维护一条到统一 WebSocket 推送系统的连接，订阅项目聚合频道
 *   `project.prop.{projectID}`（属性上报）与 `project.conn.{projectID}`（设备上下线）
 * - 按组件注册的兴趣表把消息分发给对应图表（微批合并，避免消息风暴导致卡顿）
 * - 断线自动重连并重订阅，重连成功后触发各组件补一次首载，弥补断线窗口
 *
 * 后端消息负载：
 * - 属性（批量）：{ device:{productID,deviceName}, timestamp:"毫秒字符串", params:{identifier:value} }
 * - 属性（单值）：{ device:{productID,deviceName}, timestamp:"毫秒字符串", identifier, param }
 * - 上下线：{ device:{productID,deviceName}, status: 1|2, timestamp:"毫秒字符串" }（1=上线 2=离线）
 */

import { ref } from 'vue';

import { WsClient } from '@vben/saas';
import { useAccessStore, useProjectStore } from '@vben/stores';

/** 实时属性消息（兼容批量 PropertyReportV2 与单属性 PropertyReport 两种负载） */
export interface RealtimePropMessage {
  device: { deviceName: string; productID: string };
  /** 单属性质量或逐属性质量，原样传递到数值过滤层。 */
  quality?: string | Record<string, string>;
  /** 平台接收毫秒时间，未知为 0；兼容旧版字符串与空值。 */
  receivedTime?: number | string | null;
  identifier?: string;
  param?: unknown;
  params?: Record<string, unknown>;
  timestamp?: number | string;
}

/** 设备上下线消息（status: 1=上线，2=离线） */
export interface RealtimeConnMessage {
  device: { deviceName: string; productID: string };
  status: number;
  timestamp?: number | string;
}

/** 组件兴趣注册项 */
export interface RealtimeInterest {
  /** 组件唯一标识（调试用） */
  chartKey: string;
  /** 组件关注的产品 ID */
  productID?: string;
  /** 组件关注的设备列表（空表示不限） */
  deviceNames?: string[];
  /** 组件关注的属性标识符列表（空表示不限） */
  dataIDs?: string[];
  /** 属性消息批量回调（微批合并后触发一次） */
  applyProps?: (msgs: RealtimePropMessage[]) => void;
  /** 上下线消息回调（原始消息，调用方自行防抖） */
  applyConn?: (msg: RealtimeConnMessage) => void;
  /** 重连成功后的补载回调（一般为组件首载函数） */
  refetch?: () => void;
}

/** 中枢连接状态（供 UI 提示） */
export const realtimeStatus = ref<'connected' | 'idle' | 'reconnecting'>('idle');

/** 属性消息微批合并间隔（ms） */
const PROP_BATCH_MS = 300;

const interests = new Map<number, RealtimeInterest>();
let interestSeq = 0;

let client: null | WsClient = null;
let currentProjectID = '';
let hadConnected = false;
/** 重连后待补载标记：onConnected 在订阅成功后统一补载一次 */
let propChannel = '';
let connChannel = '';

/** 各兴趣的待 flush 属性消息队列 */
const pendingPropMsgs = new Map<number, RealtimePropMessage[]>();
let flushTimer: null | ReturnType<typeof setTimeout> = null;
let tokenSyncTimer: null | ReturnType<typeof setInterval> = null;

/** 构建 WebSocket 连接地址（与 use-notifications 同口径：API 源转 ws/wss，缺省回退页面源） */
function buildWsUrl(): string {
  const envUrl = (import.meta.env.VITE_GLOB_API_URL as string | undefined) || '';
  const raw = (envUrl || (typeof window === 'undefined' ? '' : window.location.origin)).trim().replace(/\/$/, '');
  return `${raw.replace(/^https?/, (p: string) => (p === 'https' ? 'wss' : 'ws'))}/api/v1/system/common/websocket/connect`;
}

function resolveToken(): string {
  try {
    return useAccessStore().accessToken ?? '';
  } catch {
    return '';
  }
}

/** 微批 flush：把合并后的消息分发给各兴趣 */
function flushPropMsgs() {
  flushTimer = null;
  for (const [id, msgs] of pendingPropMsgs) {
    pendingPropMsgs.delete(id);
    const interest = interests.get(id);
    if (interest?.applyProps && msgs.length > 0) {
      try {
        interest.applyProps(msgs);
      } catch (error) {
        console.error('[projectRealtime] applyProps error:', error);
      }
    }
  }
}

function enqueuePropMsg(interestID: number, msg: RealtimePropMessage) {
  const list = pendingPropMsgs.get(interestID) ?? [];
  list.push(msg);
  pendingPropMsgs.set(interestID, list);
  if (!flushTimer) {
    flushTimer = setTimeout(flushPropMsgs, PROP_BATCH_MS);
  }
}

/** 消息负载中涉及的属性标识符 */
function msgIdentifiers(msg: RealtimePropMessage): string[] {
  if (msg.params && typeof msg.params === 'object') return Object.keys(msg.params);
  return msg.identifier ? [msg.identifier] : [];
}

/** 判断属性消息是否命中组件兴趣 */
function matchPropInterest(interest: RealtimeInterest, msg: RealtimePropMessage): boolean {
  if (!interest.applyProps) return false;
  if (interest.productID && interest.productID !== msg.device?.productID) return false;
  if (interest.deviceNames?.length && !interest.deviceNames.includes(msg.device?.deviceName)) return false;
  if (interest.dataIDs?.length) {
    const ids = msgIdentifiers(msg);
    if (!ids.some((id) => interest.dataIDs!.includes(id))) return false;
  }
  return true;
}

function onPropPublish(data: unknown) {
  const msg = data as RealtimePropMessage;
  if (!msg?.device?.productID || !msg.device.deviceName) return;
  for (const [id, interest] of interests) {
    if (matchPropInterest(interest, msg)) enqueuePropMsg(id, msg);
  }
}

function onConnPublish(data: unknown) {
  const msg = data as RealtimeConnMessage;
  if (!msg?.device?.deviceName) return;
  for (const interest of interests.values()) {
    if (!interest.applyConn) continue;
    try {
      interest.applyConn(msg);
    } catch (error) {
      console.error('[projectRealtime] applyConn error:', error);
    }
  }
}

/** 重连成功后补一次首载，弥补断线期间的数据缺口 */
function refetchAll() {
  for (const interest of interests.values()) {
    try {
      interest.refetch?.();
    } catch (error) {
      console.error('[projectRealtime] refetch error:', error);
    }
  }
}

/**
 * 初始化中枢（幂等）：建立连接并订阅项目聚合频道。
 * 已用相同 projectID 初始化时为 no-op；projectID 变化时重建连接。
 */
export function initRealtimeHub(projectID?: string | number): void {
  const pid = String(projectID ?? '').trim();
  if (!pid || pid === '0') return;
  if (client && currentProjectID === pid) return;

  disposeRealtimeHub();
  currentProjectID = pid;
  propChannel = `project.prop.${pid}`;
  connChannel = `project.conn.${pid}`;

  client = new WsClient({
    maxReconnectAttempts: 0, // 大屏常驻页面：无限重连
    token: resolveToken(),
    url: buildWsUrl(),
  });

  // token 刷新后同步给 client（下次连接/重连生效）
  try {
    const accessStore = useAccessStore();
    // 简单轮询同步，避免在非 setup 上下文使用 watch 的泄漏问题
    let lastToken = accessStore.accessToken ?? '';
    tokenSyncTimer = setInterval(() => {
      const token = accessStore.accessToken ?? '';
      if (token && token !== lastToken) {
        lastToken = token;
        client?.setToken(token);
      }
    }, 30_000);
  } catch {
    /* access store 不可用时忽略 */
  }

  client.onConnected = () => {
    // 订阅两个项目聚合频道（重连时 WsClient 会自动 resubscribe，此处仅在首次注册订阅）
    void Promise.all([
      client!.subscribe(propChannel, onPropPublish),
      client!.subscribe(connChannel, onConnPublish),
    ])
      .then(() => {
        realtimeStatus.value = 'connected';
        if (hadConnected) {
          // 重连成功：补一次全量首载
          refetchAll();
        }
        hadConnected = true;
      })
      .catch((error: unknown) => {
        console.error('[projectRealtime] subscribe error:', error);
      });
  };
  client.onDisconnected = () => {
    if (realtimeStatus.value !== 'idle') realtimeStatus.value = 'reconnecting';
  };

  realtimeStatus.value = 'reconnecting';
  client.connect();
}

/** 惰性初始化：从项目上下文（cookie project-id）读取当前项目并初始化 */
function lazyInitFromProjectStore(): void {
  if (client) return;
  try {
    const projectStore = useProjectStore();
    const pid = projectStore.currentProjectID;
    if (pid) initRealtimeHub(pid);
  } catch {
    /* 非 pinia 上下文时忽略，由宿主页面显式 init */
  }
}

/** 注册组件兴趣，返回注销函数 */
export function registerRealtimeInterest(interest: RealtimeInterest): () => void {
  lazyInitFromProjectStore();
  const id = ++interestSeq;
  interests.set(id, interest);
  return () => {
    interests.delete(id);
    pendingPropMsgs.delete(id);
  };
}

/** 销毁中枢（离开大屏/项目切换时调用） */
export function disposeRealtimeHub(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  pendingPropMsgs.clear();
  if (tokenSyncTimer) {
    clearInterval(tokenSyncTimer);
    tokenSyncTimer = null;
  }
  client?.disconnect();
  client = null;
  currentProjectID = '';
  hadConnected = false;
  realtimeStatus.value = 'idle';
}
