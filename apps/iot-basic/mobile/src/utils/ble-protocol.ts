/**
 * BLE 配网协议 V1.3 帧编解码 + 分包重组 (TypeScript 版)。
 *
 * 帧格式: HEAD(1) TYPE(1) TOTAL(1) NUM(1) LEN(1) DATA(0-58) CHK(1)
 * - HEAD: 0xA0 设备→APP, 0xB0 APP→设备
 * - CHK : (0 - sum(其他字节)) & 0xFF
 *
 * 使用示例:
 *   const frames = buildJsonFrames(HEAD_APP_TO_DEVICE, 2, { type: 2 });
 *   for (const frame of frames) writeBle(frame);
 *
 *   const reassembler = new Reassembler();
 *   const parsed = parseFrame(rxBuf);
 *   if (parsed) {
 *     const { message } = reassembler.feed(parsed);
 *     if (message) handle(message);
 *   }
 */

export const HEAD_DEVICE_TO_APP = 0xa0;
export const HEAD_APP_TO_DEVICE = 0xb0;

export const MAX_DATA = 58;
export const HEADER_LEN = 5;
export const TAIL_LEN = 1;
export const MAX_FRAME = HEADER_LEN + MAX_DATA + TAIL_LEN; // 64

export const TYPE_PROVISION = 1;
export const TYPE_RESCAN = 2;
export const TYPE_WIFI_LIST = 1; // 设备→APP
export const TYPE_SERVER_INFO = 2; // 设备→APP
export const TYPE_PROVISION_FAIL = 201;
export const TYPE_PROVISION_SUCCESS = 202;
export const TYPE_ACK = 255;

function checksum(buf: number[]): number {
  let sum = 0;
  for (const b of buf) sum += b;
  return (0 - sum) & 0xff;
}

function utf8Encode(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if ((code & 0xfc00) === 0xd800 && i + 1 < str.length) {
      // surrogate pair
      const next = str.charCodeAt(i + 1);
      if ((next & 0xfc00) === 0xdc00) {
        const cp = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
        bytes.push(
          0xf0 | (cp >> 18),
          0x80 | ((cp >> 12) & 0x3f),
          0x80 | ((cp >> 6) & 0x3f),
          0x80 | (cp & 0x3f),
        );
        i++;
        continue;
      }
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) {
      out += String.fromCharCode(b);
    } else if ((b & 0xe0) === 0xc0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if ((b & 0xf0) === 0xe0) {
      const c = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      out += String.fromCharCode(c);
    } else if ((b & 0xf8) === 0xf0) {
      let cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      cp -= 0x10000;
      out += String.fromCharCode(0xd800 | (cp >> 10));
      out += String.fromCharCode(0xdc00 | (cp & 0x3ff));
    }
  }
  return out;
}

export function bytesToArrayBuffer(bytes: number[] | Uint8Array): ArrayBuffer {
  const arr = bytes instanceof Uint8Array ? new Uint8Array(bytes) : new Uint8Array(bytes);
  // 拷贝到独立 ArrayBuffer, 避免共享底层缓冲 / SharedArrayBuffer 类型兼容问题
  const out = new ArrayBuffer(arr.byteLength);
  new Uint8Array(out).set(arr);
  return out;
}

export function arrayBufferToBytes(buf: ArrayBuffer): number[] {
  const view = new Uint8Array(buf);
  const out: number[] = new Array(view.length);
  for (let i = 0; i < view.length; i++) out[i] = view[i];
  return out;
}

/** 把业务负载切分为完整帧列表, 每帧最长 64 字节。 */
export function buildFrames(head: number, typeId: number, payload: number[], maxData = MAX_DATA): Uint8Array[] {
  const chunkSize = Math.max(1, Math.min(MAX_DATA, Math.floor(maxData)));
  const chunks: number[][] = [];
  if (payload.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < payload.length; i += chunkSize) {
      chunks.push(payload.slice(i, i + chunkSize));
    }
  }
  const total = chunks.length;
  if (total > 0xff) {
    throw new Error(`payload too large: ${payload.length} bytes -> ${total} chunks`);
  }

  const frames: Uint8Array[] = [];
  for (let idx = 0; idx < total; idx++) {
    const chunk = chunks[idx];
    const body = [head & 0xff, typeId & 0xff, total & 0xff, (idx + 1) & 0xff, chunk.length & 0xff, ...chunk];
    const chk = checksum(body);
    frames.push(new Uint8Array([...body, chk]));
  }
  return frames;
}

export function buildJsonFrames(head: number, typeId: number, obj: unknown, maxData = MAX_DATA): Uint8Array[] {
  const json = JSON.stringify(obj);
  return buildFrames(head, typeId, utf8Encode(json), maxData);
}

export interface ParsedFrame {
  head: number;
  typeId: number;
  total: number;
  num: number;
  data: number[];
}

/** 解析单帧, 校验失败返回 null。 */
export function parseFrame(buf: ArrayBuffer | Uint8Array | number[]): ParsedFrame | null {
  let bytes: number[];
  if (buf instanceof ArrayBuffer) {
    bytes = arrayBufferToBytes(buf);
  } else if (buf instanceof Uint8Array) {
    bytes = Array.from(buf);
  } else {
    bytes = buf;
  }
  if (bytes.length < HEADER_LEN + TAIL_LEN) return null;
  const [head, typeId, total, num, len] = bytes;
  if (bytes.length < HEADER_LEN + len + TAIL_LEN) return null;
  const data = bytes.slice(HEADER_LEN, HEADER_LEN + len);
  const chk = bytes[HEADER_LEN + len];
  if (checksum(bytes.slice(0, HEADER_LEN + len)) !== chk) return null;
  return { head, typeId, total, num, data };
}

interface PendingMessage {
  total: number;
  chunks: Map<number, number[]>;
}

export interface ReassembleResult {
  message: Record<string, unknown> | null;
  missing: number[];
}

/** 按 (head, typeId) 维度累积分包。 */
export class Reassembler {
  private pending = new Map<string, PendingMessage>();

  feed(frame: ParsedFrame): ReassembleResult {
    const key = `${frame.head}|${frame.typeId}`;
    let msg = this.pending.get(key);
    if (!msg || msg.total !== frame.total) {
      msg = { total: frame.total, chunks: new Map() };
      this.pending.set(key, msg);
    }
    msg.chunks.set(frame.num, frame.data);

    if (msg.chunks.size < msg.total) {
      return { message: null, missing: this.missing(msg) };
    }
    for (let i = 1; i <= msg.total; i++) {
      if (!msg.chunks.has(i)) return { message: null, missing: this.missing(msg) };
    }

    const all: number[] = [];
    for (let i = 1; i <= msg.total; i++) all.push(...msg.chunks.get(i)!);
    this.pending.delete(key);

    if (all.length === 0) return { message: {}, missing: [] };
    try {
      const json = utf8Decode(all);
      return { message: JSON.parse(json) as Record<string, unknown>, missing: [] };
    } catch {
      return { message: { _raw: all }, missing: [] };
    }
  }

  reset(): void {
    this.pending.clear();
  }

  private missing(msg: PendingMessage): number[] {
    const out: number[] = [];
    for (let i = 1; i <= msg.total; i++) {
      if (!msg.chunks.has(i)) out.push(i);
    }
    return out;
  }
}

export interface AckMessage {
  type: typeof TYPE_ACK;
  ack: number;
  value?: { index?: number[] };
}

export function buildAck(ackType: number, missing?: number[]): Uint8Array[] {
  const payload: AckMessage = { type: TYPE_ACK, ack: ackType };
  if (missing && missing.length > 0) payload.value = { index: missing };
  return buildJsonFrames(HEAD_APP_TO_DEVICE, TYPE_ACK, payload);
}
