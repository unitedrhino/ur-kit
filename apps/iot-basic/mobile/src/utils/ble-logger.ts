/**
 * BLE 日志收集器: 对外提供历史/订阅 API, 同时同步写到 console。
 * 抽取到独立模块以避免 bluetooth.datasource 与 ble-readiness 的循环依赖。
 */

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

function formatNow(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`;
}

function safePayload(payload: unknown): unknown {
  if (payload instanceof ArrayBuffer) {
    return { type: 'ArrayBuffer', byteLength: payload.byteLength };
  }
  if (payload instanceof Uint8Array) {
    return {
      type: 'Uint8Array',
      byteLength: payload.byteLength,
      hex: Array.from(payload).map((b) => b.toString(16).padStart(2, '0')).join(' '),
    };
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => safePayload(item));
  }
  if (payload && typeof payload === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
      out[key] = safePayload(value);
    });
    return out;
  }
  return payload;
}

export type BleLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface BleLogEntry {
  time: string;
  level: BleLogLevel;
  scope: string;
  message: string;
  payload?: unknown;
}

const BLE_LOG_HISTORY_LIMIT = 200;
const bleLogHistory: BleLogEntry[] = [];
const bleLogListeners = new Set<(entry: BleLogEntry) => void>();

function emitBleLog(level: BleLogLevel, scope: string, message: string, payload?: unknown): BleLogEntry {
  const entry: BleLogEntry = {
    time: formatNow(),
    level,
    scope,
    message,
    payload: payload === undefined ? undefined : safePayload(payload),
  };
  bleLogHistory.push(entry);
  if (bleLogHistory.length > BLE_LOG_HISTORY_LIMIT) {
    bleLogHistory.splice(0, bleLogHistory.length - BLE_LOG_HISTORY_LIMIT);
  }
  bleLogListeners.forEach((listener) => listener(entry));
  return entry;
}

function writeConsole(entry: BleLogEntry): void {
  const prefix = `[ble][${entry.time}][${entry.scope}] ${entry.message}`;
  if (entry.payload === undefined) {
    console[entry.level](prefix);
    return;
  }
  console[entry.level](prefix, entry.payload);
}

export function subscribeBleLogs(listener: (entry: BleLogEntry) => void): () => void {
  bleLogListeners.add(listener);
  return () => bleLogListeners.delete(listener);
}

export function getBleLogHistory(): BleLogEntry[] {
  return [...bleLogHistory];
}

export function clearBleLogs(): void {
  bleLogHistory.splice(0, bleLogHistory.length);
}

export const bleLogger = {
  debug(scope: string, message: string, payload?: unknown) {
    writeConsole(emitBleLog('debug', scope, message, payload));
  },
  info(scope: string, message: string, payload?: unknown) {
    writeConsole(emitBleLog('info', scope, message, payload));
  },
  warn(scope: string, message: string, payload?: unknown) {
    writeConsole(emitBleLog('warn', scope, message, payload));
  },
  error(scope: string, message: string, payload?: unknown) {
    writeConsole(emitBleLog('error', scope, message, payload));
  },
};
