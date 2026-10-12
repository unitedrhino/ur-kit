/**
 * 统一日志工具：收集本地调试日志，并在短期调试会话中转发脱敏后的具名日志。
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 日志条目：本地仅保留脱敏后的结构化信息。 */
export interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  scope: string;
  name?: string;
  message: string;
  data?: unknown;
}

/** HTTP 请求日志元信息：只记录定位问题所需的非敏感字段。 */
export interface HttpLogMeta {
  requestId: string;
  url: string;
  method: 'POST' | 'GET';
  duration?: number;
  statusCode?: number;
  apiCode?: number;
  contentType?: string;
  responseType?: string;
  responseKeys?: string[];
  responseCodeType?: string;
  responseMsgType?: string;
  responseDataType?: string;
  responseLength?: number;
  hasToken: boolean;
  tenantCode?: string;
  projectID?: string;
}

/** 日志配置：控制本地历史容量和是否跨重启持久化。 */
export interface LoggerConfig {
  persistHistory?: boolean;
  historyLimit?: number;
  storageKey?: string;
}

interface BreadcrumbInput {
  category: string;
  message: string;
  level?: LogLevel;
  data?: unknown;
}

interface ExceptionContext {
  tags?: Record<string, string | number | boolean | undefined>;
  extra?: Record<string, unknown>;
}

/** MessageContext 描述显式远端消息的固定级别、检索标签与结构化上下文。 */
export interface MessageContext {
  level: 'info';
  tags?: Record<string, string | number | boolean | undefined>;
  extra?: Record<string, unknown>;
}

const DEFAULT_LOG_HISTORY_LIMIT = 200;
const DEFAULT_LOG_STORAGE_KEY = 'mobile_uniapp_log_history_v1';
const SENSITIVE_KEYS = [
  /^authorization$/,
  /token/,
  /password/,
  /signature/,
  /credentialdigest/,
  /^pwd$/,
  /^phone$/,
  /^mobile$/,
  /^phonecode$/,
  /^code$/,
  /^codeid$/,
  /captcha/,
  /^smscode$/,
  /^account$/,
];

const logHistory: LogEntry[] = [];
let logListener: ((entry: LogEntry) => void) | null = null;
let suppressConsoleCapture = false;
const capturedErrors = new WeakSet<object>();
const recentErrorMessages = new Map<string, number>();
let logSequence = 0;
let historyLoaded = false;
const buildMode = import.meta.env.MODE;
let loggerConfig: Required<LoggerConfig> = {
  persistHistory: true,
  historyLimit: DEFAULT_LOG_HISTORY_LIMIT,
  storageKey: DEFAULT_LOG_STORAGE_KEY,
};

/** setLogListener 将统一 logger 的新日志交给临时调试会话。 */
export function setLogListener(listener: ((entry: LogEntry) => void) | null): void {
  logListener = listener;
}

/** reportGlobalError 捕获应用错误并避免同一 Error 被多个全局入口重复提交。 */
export function reportGlobalError(error: unknown, name: string): void {
  if (error && typeof error === 'object') {
    if (capturedErrors.has(error)) return;
    capturedErrors.add(error);
  }
  if (!rememberErrorMessage(error instanceof Error ? error.message : String(error))) return;
  appendLog('error', name, error instanceof Error ? error.message : String(error), error);
}

/** rememberErrorMessage 对框架将同一异常转成字符串后的重复回调做短时间去重。 */
function rememberErrorMessage(message: string): boolean {
  const normalized = message.replace(/^(?:Error:\s*)+/, '');
  const now = Date.now();
  for (const [key, at] of recentErrorMessages) if (now - at > 1000) recentErrorMessages.delete(key);
  if (recentErrorMessages.has(normalized)) return false;
  recentErrorMessages.set(normalized, now);
  return true;
}

/** installConsoleErrorCapture 捕获直接 console.error，原控制台行为保持不变。 */
export function installConsoleErrorCapture(): void {
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    if (suppressConsoleCapture) return;
    const error = args.find((value) => value instanceof Error);
    if (error && capturedErrors.has(error)) return;
    if (error) capturedErrors.add(error);
    if (!rememberErrorMessage(error instanceof Error ? error.message : args.map(String).join(' '))) return;
    appendLog('error', 'console.error', error instanceof Error ? error.message : args.map(String).join(' '), { args });
  };
  // #ifdef H5
  window.addEventListener('error', (event) => reportGlobalError(event.error || event.message, 'app.error'));
  window.addEventListener('unhandledrejection', (event) => reportGlobalError(event.reason, 'promise.unhandled'));
  // #endif
}

/** configureLogger 配置本地日志历史策略；默认持久化最近 200 条脱敏日志。 */
export function configureLogger(config: LoggerConfig): void {
  loggerConfig = {
    persistHistory: config.persistHistory ?? loggerConfig.persistHistory,
    historyLimit: normalizeHistoryLimit(config.historyLimit ?? loggerConfig.historyLimit),
    storageKey: config.storageKey || loggerConfig.storageKey,
  };
  historyLoaded = false;
  hydrateLogHistory();
  trimLogHistory();
  if (loggerConfig.persistHistory) {
    persistLogHistory();
  } else {
    removePersistedLogHistory();
  }
}

/** sanitizeLogData 对日志数据做递归脱敏，避免 token、手机号、验证码等进入本地或远端日志。 */
export function sanitizeLogData(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeLogText(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeLogText(value.message),
      stack: value.stack ? sanitizeLogText(value.stack) : undefined,
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogData(item));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = isSensitiveKey(key) ? '[Filtered]' : sanitizeLogData(item);
    });
    return out;
  }
  return value;
}

/** sanitizeLogText 去除消息和堆栈文本中可识别的凭据与手机号。 */
function sanitizeLogText(value: string): string {
  return value
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [Filtered]')
    .replace(/\b(token|password|codeID|phone|mobile|authorization)(["'\s:=]+)([^&\s"',}]+)/gi, '$1$2[Filtered]')
    .replace(/\b1[3-9]\d{9}\b/g, '[Filtered]');
}

/** getLogHistory 返回最近的脱敏日志副本，便于现场调试或自动化断言。 */
export function getLogHistory(): LogEntry[] {
  hydrateLogHistory();
  return [...logHistory];
}

/** clearLogHistory 清空本地日志历史。 */
export function clearLogHistory(): void {
  logHistory.splice(0, logHistory.length);
  removePersistedLogHistory();
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((item) => item.test(normalized));
}

function createLogId(): string {
  logSequence += 1;
  return `${Date.now().toString(36)}-${logSequence.toString(36)}`;
}

function normalizeHistoryLimit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LOG_HISTORY_LIMIT;
  return Math.max(1, Math.floor(value));
}

function canUseUniStorage(): boolean {
  try {
    return typeof uni !== 'undefined'
      && typeof uni.getStorageSync === 'function'
      && typeof uni.setStorageSync === 'function'
      && typeof uni.removeStorageSync === 'function';
  } catch {
    return false;
  }
}

function isLogEntry(value: unknown): value is LogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<LogEntry>;
  return typeof entry.id === 'string'
    && typeof entry.time === 'string'
    && typeof entry.level === 'string'
    && typeof entry.scope === 'string'
    && typeof entry.message === 'string';
}

function hydrateLogHistory(): void {
  if (historyLoaded) return;
  historyLoaded = true;
  if (!loggerConfig.persistHistory || !canUseUniStorage()) return;
  try {
    const saved = uni.getStorageSync(loggerConfig.storageKey);
    if (!Array.isArray(saved)) return;
    const restored = saved.filter(isLogEntry).map((entry) => ({
      ...entry,
      data: entry.data === undefined ? undefined : sanitizeLogData(entry.data),
    }));
    logHistory.splice(0, logHistory.length, ...restored);
    trimLogHistory();
  } catch {
    // ignore storage read failures
  }
}

function trimLogHistory(): void {
  if (logHistory.length > loggerConfig.historyLimit) {
    logHistory.splice(0, logHistory.length - loggerConfig.historyLimit);
  }
}

function persistLogHistory(): void {
  if (!loggerConfig.persistHistory || !canUseUniStorage()) return;
  try {
    uni.setStorageSync(loggerConfig.storageKey, logHistory.map((entry) => ({
      ...entry,
      data: entry.data === undefined ? undefined : sanitizeLogData(entry.data),
    })));
  } catch {
    // ignore storage write failures
  }
}

function removePersistedLogHistory(): void {
  if (!canUseUniStorage()) return;
  try {
    uni.removeStorageSync(loggerConfig.storageKey);
  } catch {
    // ignore storage remove failures
  }
}

function isDevelopmentMode(): boolean {
  return buildMode !== 'production';
}

function appendLog(level: LogLevel, scope: string, message: string, data?: unknown): LogEntry {
  hydrateLogHistory();
  const entry: LogEntry = {
    id: createLogId(),
    time: new Date().toISOString(),
    level,
    scope,
    name: scope,
    message: sanitizeLogText(message),
    data: data === undefined ? undefined : sanitizeLogData(data),
  };
  logHistory.push(entry);
  trimLogHistory();
  persistLogHistory();
  writeConsole(entry);
  logListener?.(entry);
  return entry;
}

function writeConsole(entry: LogEntry): void {
  if (!isDevelopmentMode() && entry.level !== 'warn' && entry.level !== 'error') return;
  const prefix = `[${entry.scope}] ${entry.message}`;
  suppressConsoleCapture = true;
  try {
    if (entry.data === undefined) console[entry.level](prefix);
    else console[entry.level](prefix, entry.data);
  } finally {
    suppressConsoleCapture = false;
  }
}

function captureBreadcrumb(input: BreadcrumbInput): void {
  const breadcrumb: BreadcrumbInput = {
    ...input,
    data: input.data === undefined ? undefined : sanitizeLogData(input.data),
  };
  appendLog(breadcrumb.level || 'info', breadcrumb.category, breadcrumb.message, breadcrumb.data);
}

function captureException(error: unknown, context?: ExceptionContext): void {
  appendLog('error', 'exception', error instanceof Error ? error.message : 'Captured exception', {
    error,
    ...(context?.extra || {}),
    tags: context?.tags,
  });
}

/** captureMessage 将显式诊断事件写入具名 logger，仅在会话有效时上报。 */
function captureMessage(message: string, context?: MessageContext): void {
  const name = String(context?.tags?.name || context?.tags?.event || 'diagnostic.message');
  appendLog('info', name, message, context?.extra);
}

/** logger 是移动端统一日志入口。 */
export const logger = {
  debug(scope: string, message: string, data?: unknown): LogEntry {
    return appendLog('debug', scope, message, data);
  },
  info(scope: string, message: string, data?: unknown): LogEntry {
    return appendLog('info', scope, message, data);
  },
  warn(scope: string, message: string, data?: unknown): LogEntry {
    return appendLog('warn', scope, message, data);
  },
  error(scope: string, message: string, data?: unknown): LogEntry {
    return appendLog('error', scope, message, data);
  },
  addBreadcrumb: captureBreadcrumb,
  captureException,
  captureMessage,
};
