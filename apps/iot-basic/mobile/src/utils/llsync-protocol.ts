/**
 * LLSync WiFi 蓝牙绑定协议工具。
 *
 * 本文件只处理协议字节：广播 manufacturer data 解析、写入命令构造、
 * 以及设备 notify 事件解析。BLE 扫描、连接、订阅和写入由 service 层负责。
 */

/** 广播中的 16 bit 服务 UUID，用于扫描阶段过滤附近设备。 */
export const LLSYNC_ADVERTISING_SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB';
/** 设备 GATT 主服务 UUID。 */
export const LLSYNC_SERVICE_UUID = '0000FFF0-65D0-4E20-B56A-E493541BA4E2';
/** APP 写入设备信息/配网命令的特征 UUID。 */
export const LLSYNC_DEVICE_INFO_WRITE_UUID = '0000FFE1-65D0-4E20-B56A-E493541BA4E2';
/** 设备上报配网结果 notify 的特征 UUID。 */
export const LLSYNC_EVENT_NOTIFY_UUID = '0000FFE3-65D0-4E20-B56A-E493541BA4E2';

export const LLSYNC_SHORT_SERVICE_UUID = 'fff0';
export const LLSYNC_SHORT_WRITE_UUID = 'ffe1';
export const LLSYNC_SHORT_NOTIFY_UUID = 'ffe3';

export const LLSYNC_EVENT_DEVICE_INFO = 0x08;
export const LLSYNC_EVENT_SET_WIFI_MODE_RESULT = 0xe0;
export const LLSYNC_EVENT_SET_WIFI_INFO_RESULT = 0xe1;
export const LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT = 0xe2;
export const LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT = 0xe3;
export const LLSYNC_EVENT_GET_DEV_LOG_INFO = 0xe4;
/** 设备主动通知换网事务能力与阶段；与反方向的 E5 日志查询不冲突。 */
export const LLSYNC_EVENT_NETWORK_CHANGE = 0xe5;

/** LLSyncNetworkChange 描述本地候选网络事务；成功仍须收到保存后的标准联网回执。 */
export interface LLSyncNetworkChange {
  /** 版本 2 表示本地保存确认；旧云端确认版本和未知版本均拒绝。 */
  version: 2;
  /** 模式 1 只允许保留绑定换网，不发送绑定 Token。 */
  mode: 1;
  /** 与固件持久化状态一致的阶段，0—9。 */
  phase: number;
  /** 不含密码或密钥的错误码，0—6。 */
  error: number;
  /** 八字节请求标识的小写十六进制，供本次 BLE 事务关联。 */
  requestId: string;
}

export interface LLSyncAdvertisingInfo {
  moduleVersion: number;
  mac: string;
  productID: string;
}

export interface LLSyncDeviceInfo {
  version: number;
  mtu: number;
  needSetMtu: boolean;
  deviceName: string;
}

export interface LLSyncWifiConnectResult {
  connected: boolean;
  ssid: string;
  stationState: number;
}

export type LLSyncEventValue =
  | LLSyncDeviceInfo
  | LLSyncNetworkChange
  | { success: boolean; code: number }
  | LLSyncWifiConnectResult
  | { logStr: string };

export interface LLSyncEvent {
  type: number;
  raw: number[];
  data: number[];
  value?: LLSyncEventValue;
}

function arrayBufferToBytes(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

function normalizeByte(value: number): number {
  return value & 0xff;
}

function u16be(value: number): number[] {
  const normalized = Math.max(0, Math.min(0xffff, Math.floor(value)));
  return [(normalized >> 8) & 0xff, normalized & 0xff];
}

function utf8Encode(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
      continue;
    }
    if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      continue;
    }
    if ((code & 0xfc00) === 0xd800 && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if ((next & 0xfc00) === 0xdc00) {
        const point = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
        bytes.push(
          0xf0 | (point >> 18),
          0x80 | ((point >> 12) & 0x3f),
          0x80 | ((point >> 6) & 0x3f),
          0x80 | (point & 0x3f),
        );
        i += 1;
        continue;
      }
    }
    bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) {
      output += String.fromCharCode(b);
      continue;
    }
    if ((b & 0xe0) === 0xc0) {
      output += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
      continue;
    }
    if ((b & 0xf0) === 0xe0) {
      output += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
      continue;
    }
    if ((b & 0xf8) === 0xf0) {
      let point = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      point -= 0x10000;
      output += String.fromCharCode(0xd800 | (point >> 10));
      output += String.fromCharCode(0xdc00 | (point & 0x3ff));
    }
  }
  return output;
}

function stripNullPadding(bytes: number[]): number[] {
  const firstNullIndex = bytes.findIndex((byte) => byte === 0);
  return firstNullIndex >= 0 ? bytes.slice(0, firstNullIndex) : bytes;
}

/** bytesToArrayBuffer 将协议字节复制到独立 ArrayBuffer，避免共享底层缓存。 */
export function bytesToArrayBuffer(bytes: number[] | Uint8Array): ArrayBuffer {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes.map(normalizeByte));
  const output = new ArrayBuffer(source.byteLength);
  new Uint8Array(output).set(source);
  return output;
}

/** uuidMatchesShort 判断短 UUID 与 16/128 bit UUID 是否匹配。 */
export function uuidMatchesShort(uuid: string, shortUuid: string): boolean {
  const normalized = uuid.toLowerCase();
  const short = shortUuid.toLowerCase();
  return normalized === short || normalized.startsWith(`0000${short}-`) || normalized.includes(`-${short}-`);
}

/** hasLLSyncAdvertisingService 判断扫描结果是否声明了 FFF0 广播服务。 */
export function hasLLSyncAdvertisingService(uuids: string[] = []): boolean {
  return uuids.some((uuid) => uuidMatchesShort(uuid, LLSYNC_SHORT_SERVICE_UUID));
}

/** parseLLSyncAdvertisingData 解析广播 manufacturer data，提取模块版本、MAC 与 ProductID。 */
export function parseLLSyncAdvertisingData(advertisData?: ArrayBuffer): LLSyncAdvertisingInfo | null {
  if (!advertisData) return null;
  const bytes = arrayBufferToBytes(advertisData);
  if (bytes.length < 9) return null;

  // WiFi 配网广播直接存版本；高四位版本/低位绑定状态属于另一种标准蓝牙模式。
  const moduleVersion = bytes[2];
  const macBytes = bytes.slice(3, 9);
  const productID = utf8Decode(stripNullPadding(bytes.slice(9)));
  if (!productID) return null;

  return {
    moduleVersion,
    mac: macBytes.map((byte) => byte.toString(16).padStart(2, '0')).join(':'),
    productID,
  };
}

/** buildGetDeviceInfoCommand 构造 E0 查询设备信息命令。 */
export function buildGetDeviceInfoCommand(): number[] {
  return [0xe0];
}

/** buildSetWifiModeCommand 构造 E1 01 设置 STA 模式命令。 */
export function buildSetWifiModeCommand(): number[] {
  return [0xe1, 0x01];
}

/** buildSetWifiInfoCommand 构造 E2 WiFi 凭据命令，长度按官方实现只统计 SSID 与密码字节。 */
export function buildSetWifiInfoCommand(ssid: string, password: string): number[] {
  const ssidBytes = utf8Encode(ssid);
  const passwordBytes = utf8Encode(password);
  if (ssidBytes.length < 1 || ssidBytes.length > 32 || passwordBytes.length > 63
    || ssidBytes.includes(0) || passwordBytes.includes(0)) {
    throw new Error('WiFi 名称或密码长度无效');
  }
  const wifiInfoLength = ssidBytes.length + passwordBytes.length;
  return [0xe2, ...u16be(wifiInfoLength), ssidBytes.length, ...ssidBytes, passwordBytes.length, ...passwordBytes];
}

/** buildConnectWifiCommand 构造 E3 发起联网命令。 */
export function buildConnectWifiCommand(): number[] {
  return [0xe3];
}

/** buildSendTokenCommand 构造 E4 下发绑定 token 命令。 */
export function buildSendTokenCommand(token: string): number[] {
  const tokenBytes = utf8Encode(token);
  if (tokenBytes.length < 1 || tokenBytes.length > 32) throw new Error('绑定 Token 长度无效');
  return [0xe4, ...u16be(tokenBytes.length), ...tokenBytes];
}

/** buildGetLogCommand 构造 E5 获取设备端配网日志命令。 */
export function buildGetLogCommand(): number[] {
  return [0xe5];
}

/** buildWriteMtuResultCommand 构造 09 MTU 协商结果命令。 */
export function buildWriteMtuResultCommand(success: boolean): number[] {
  return [0x09, ...(success ? u16be(0) : u16be(0xffff))];
}

/** parseSuccessResult 只接受一个结果字节，不容许截断或尾随字段。 */
function parseSuccessResult(data: number[]): { success: boolean; code: number } {
  if (data.length !== 3) throw new Error('结果长度无效');
  const code = data[2] ?? 0xff;
  return { success: code === 0, code };
}

/** parseDeviceInfo 校验完整名称后返回设备身份与 MTU 能力。 */
function parseDeviceInfo(data: number[]): LLSyncDeviceInfo {
  if (data.length < 6) throw new Error('设备信息长度不足');
  const version = data[2] ?? 0;
  const mtuField = ((data[3] ?? 0) << 8) | (data[4] ?? 0);
  const needSetMtu = Boolean(mtuField >> 15);
  const mtu = mtuField & 0x1fff;
  const nameLength = data[5] ?? 0;
  if (!nameLength || nameLength > 48 || data.length !== 6 + nameLength) throw new Error('设备名称长度无效');
  const deviceName = utf8Decode(data.slice(6, 6 + nameLength));
  return { version, mtu, needSetMtu, deviceName };
}

/** parseWifiConnectResult 拒绝半包，不能把首片中的状态零误判为成功。 */
function parseWifiConnectResult(data: number[]): LLSyncWifiConnectResult {
  const stationState = data[3] ?? 0xff;
  const ssidLength = data[5] ?? 0;
  if (data.length < 6 || data[2] !== 1 || stationState > 1 || ssidLength > 32
    || data.length !== 6 + ssidLength || (stationState === 0 && ssidLength === 0)) throw new Error('联网结果无效');
  return {
    connected: stationState === 0,
    stationState,
    ssid: ssidLength > 0 ? utf8Decode(data.slice(6, 6 + ssidLength)) : '',
  };
}

/** parseLogResult 兼容原类型前缀及当前 HAL 直接发送的 UTF-8 日志正文。 */
function parseLogResult(data: number[]): { logStr: string } {
  if (data.length < 3) throw new Error('日志结果无效');
  return { logStr: utf8Decode(data.slice(data[2] <= 2 ? 3 : 2)) };
}

/** parseLLSyncEvent 将 notify 原始字节解析为配网阶段事件。 */
export function parseLLSyncEvent(bytes: number[] | Uint8Array | ArrayBuffer): LLSyncEvent | null {
  const raw = bytes instanceof ArrayBuffer ? arrayBufferToBytes(bytes) : Array.from(bytes);
  if (raw.length === 0) return null;
  const type = raw[0];
  const data = raw.slice(1);
  // 本函数只接收完整逻辑报文；BLE 通知分片必须先由连接专属解码器重组。
  if (raw.length < 3 || raw.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
    || (raw[1] & 0xc0) !== 0 || ((raw[1] << 8) | raw[2]) !== raw.length - 3) return { type, raw, data };
  try {
    switch (type) {
      case LLSYNC_EVENT_NETWORK_CHANGE: {
        // 严格拒绝截断、尾随数据、未知版本与非法数值，不能据此宣称支持换网。
        if (raw.length !== 15 || raw.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
          || raw[1] !== 0 || raw[2] !== 12 || raw[3] !== 2 || raw[4] !== 1
          || raw[5] > 9 || raw[6] > 6) return { type, raw, data };
        return {
          type, raw, data,
          value: {
            version: 2, mode: 1, phase: raw[5], error: raw[6],
            requestId: raw.slice(7).map((byte) => byte.toString(16).padStart(2, '0')).join(''),
          },
        };
      }
      case LLSYNC_EVENT_DEVICE_INFO:
        return { type, raw, data, value: parseDeviceInfo(data) };
      case LLSYNC_EVENT_SET_WIFI_MODE_RESULT:
      case LLSYNC_EVENT_SET_WIFI_INFO_RESULT:
      case LLSYNC_EVENT_SET_WIFI_TOKEN_RESULT:
        return { type, raw, data, value: parseSuccessResult(data) };
      case LLSYNC_EVENT_SET_WIFI_CONNECT_RESULT:
        return { type, raw, data, value: parseWifiConnectResult(data) };
      case LLSYNC_EVENT_GET_DEV_LOG_INFO:
        return { type, raw, data, value: parseLogResult(data) };
      default:
        return { type, raw, data };
    }
  } catch {
    return { type, raw, data };
  }
}

/** LLSyncEventDecoder 按连接串行重组通知；无序号协议不能跨连接或跨类型拼接。 */
export class LLSyncEventDecoder {
  /** pending 保存至多 4096 字节日志/协议正文，超时或断线后立即丢弃。 */
  private pending: { type: number; payload: number[]; started: number } | null = null;

  /** reset 必须在建立和释放连接时调用，避免旧设备半包污染新设备。 */
  reset(): void { this.pending = null; }

  /** push 输入一条完整 ATT 通知；非尾片返回 null，完整且有效后才返回事件。 */
  push(bytes: number[] | Uint8Array, now = Date.now()): LLSyncEvent | null {
    const raw = Array.from(bytes);
    if (this.pending && (now < this.pending.started || now - this.pending.started > 10000)) this.reset();
    if (raw.length < 3 || raw.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
      || (((raw[1] & 0x3f) << 8) | raw[2]) !== raw.length - 3) {
      this.reset(); return null;
    }
    const flag = raw[1] >> 6;
    const payload = raw.slice(3);
    if (payload.length > 4096) { this.reset(); return null; }
    if (flag === 0) { this.reset(); return parseLLSyncEvent(raw); }
    if (flag === 1) {
      this.pending = { type: raw[0], payload, started: now }; return null;
    }
    if (!this.pending || this.pending.type !== raw[0] || this.pending.payload.length + payload.length > 4096) {
      this.reset(); return null;
    }
    this.pending.payload.push(...payload);
    if (flag === 2) return null;
    const complete = [raw[0], ...u16be(this.pending.payload.length), ...this.pending.payload];
    this.reset();
    return parseLLSyncEvent(complete);
  }
}

/** isLLSyncSuccessResult 判断 E0/E1/E3 等结果事件是否表示成功。 */
export function isLLSyncSuccessResult(value: unknown): boolean {
  return !!value && typeof value === 'object' && (value as { success?: boolean }).success === true;
}
