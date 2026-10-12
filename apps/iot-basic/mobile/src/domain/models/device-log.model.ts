/**
 * 设备日志模型：统一三类设备日志的查询时间、展示条目、日期分组与归一化规则。
 */

/** DeviceLogTabKey 表示移动端设备日志页的三个业务页签。 */
export type DeviceLogTabKey = 'debug' | 'operation' | 'status';

/** DeviceLogTone 表示日志结果在页面上的语义色调。 */
export type DeviceLogTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

/** DeviceLogTimePreset 表示设备日志页内置的快捷时间范围。 */
export type DeviceLogTimePreset = 'last30m' | 'last7d' | 'today' | 'yesterday';

/** DeviceLogDetailRow 是日志详情内展示的一行键值。 */
export interface DeviceLogDetailRow {
  /** 详情字段名。 */
  label: string;
  /** 详情字段值。 */
  value: string;
}

/** DeviceLogTimelineItem 是不同后端日志归一后的时间线展示结构。 */
export interface DeviceLogTimelineItem {
  /** 日志标签文案。 */
  badgeLabel: string;
  /** 日期分组标签。 */
  dateLabel: string;
  /** 详情字段列表。 */
  detailRows: DeviceLogDetailRow[];
  /** 操作人或来源。 */
  actor?: string;
  /** 是否在页面展开详情。 */
  expanded?: boolean;
  /** 归一化唯一标识。 */
  id: string;
  /** 原始日志记录。 */
  raw: unknown;
  /** 展示色调。 */
  resultTone: DeviceLogTone;
  /** 摘要信息。 */
  subtitle?: string;
  /** 所属页签。 */
  tab: DeviceLogTabKey;
  /** 毫秒时间戳。 */
  timestamp: number;
  /** 组内时间标签。 */
  timeLabel: string;
  /** 主标题。 */
  title: string;
}

/** DeviceLogDateGroup 是按日期聚合后的日志组。 */
export interface DeviceLogDateGroup {
  /** 日期分组标签。 */
  dateLabel: string;
  /** 折叠状态下隐藏的条数。 */
  hiddenCount: number;
  /** 当前日期下全部条目。 */
  items: DeviceLogTimelineItem[];
  /** 当前日期下实际展示条目。 */
  visibleItems: DeviceLogTimelineItem[];
}

/** DeviceLogTimeRange 是日志接口和页面筛选共同使用的时间范围。 */
export interface DeviceLogTimeRange {
  /** 结束日期选择器值。 */
  endDate: string;
  /** 人类可读标签。 */
  label: string;
  /** 开始日期选择器值。 */
  startDate: string;
  /** 接口结束毫秒时间戳。 */
  timeEnd: string;
  /** 接口开始毫秒时间戳。 */
  timeStart: string;
}

/** SchemaNameMap 保存物模型标识符到显示名的映射。 */
export type SchemaNameMap = Record<string, string>;

/** DeviceStatusLogRaw 是上下线日志接口返回的核心字段。 */
export interface DeviceStatusLogRaw {
  deviceName?: string;
  productID?: string;
  status?: number;
  timestamp?: number | string;
}

/** DeviceOperationLogRaw 是控制/操作日志接口返回的核心字段。 */
export interface DeviceOperationLogRaw {
  account?: string;
  action?: string;
  content?: string;
  dataID?: string;
  deviceName?: string;
  productID?: string;
  resultCode?: number | string;
  timestamp?: number | string;
  traceID?: string;
  user?: { nickName?: string; userName?: string };
  userID?: string;
}

/** DeviceDebugLogRaw 是云端诊断日志接口返回的核心字段。 */
export interface DeviceDebugLogRaw {
  action?: string;
  content?: string;
  requestID?: string;
  respPayload?: string;
  resultCode?: number | string;
  timestamp?: number | string;
  topic?: string;
  traceID?: string;
}

/** DeviceEventLogRaw 是事件日志接口返回的核心字段。 */
export interface DeviceEventLogRaw {
  dataID?: string;
  params?: string;
  timestamp?: number | string;
  type?: string;
}

/** DevicePropertyLogRaw 是属性日志接口返回的核心字段。 */
export interface DevicePropertyLogRaw {
  dataID?: string;
  dataName?: string;
  deviceName?: string;
  timestamp?: number | string;
  value?: unknown;
}

/** DeviceSdkLogRaw 是设备端 SDK 日志接口返回的核心字段。 */
export interface DeviceSdkLogRaw {
  content?: string;
  loglevel?: number;
  logLevel?: number;
  timestamp?: number | string;
}

const STATUS_LABELS: Record<number, { label: string; title: string; tone: DeviceLogTone }> = {
  1: { label: '在线', title: '设备上线', tone: 'success' },
  2: { label: '离线', title: '设备离线', tone: 'danger' },
};

const OPERATION_ACTION_LABELS: Record<string, string> = {
  actionSend: '行为调用',
  propertyControlSend: '属性控制',
  propertyGetReportSend: '数据采集',
};

const DEBUG_ACTION_LABELS: Record<string, string> = {
  action: '操作',
  connected: '上线',
  disconnected: '下线',
  event: '事件',
  gateway: '网关',
  property: '属性',
  thing: '物模型',
};

const EVENT_TYPE_LABELS: Record<string, { label: string; tone: DeviceLogTone }> = {
  alert: { label: '告警', tone: 'warning' },
  fault: { label: '故障', tone: 'danger' },
  info: { label: '信息', tone: 'success' },
};

const SDK_LEVEL_LABELS: Record<number, { label: string; tone: DeviceLogTone }> = {
  1: { label: '关闭', tone: 'neutral' },
  2: { label: '错误', tone: 'danger' },
  3: { label: '告警', tone: 'warning' },
  4: { label: '信息', tone: 'info' },
  5: { label: '调试', tone: 'neutral' },
};

const PRESET_LABELS: Record<DeviceLogTimePreset, string> = {
  last30m: '近30分钟',
  last7d: '近7天',
  today: '今天',
  yesterday: '昨天',
};

/** DEVICE_LOG_TIME_PRESETS 是页面快捷时间范围的展示顺序。 */
export const DEVICE_LOG_TIME_PRESETS: Array<{ label: string; value: DeviceLogTimePreset }> = [
  { label: PRESET_LABELS.last30m, value: 'last30m' },
  { label: PRESET_LABELS.today, value: 'today' },
  { label: PRESET_LABELS.yesterday, value: 'yesterday' },
  { label: PRESET_LABELS.last7d, value: 'last7d' },
];

/** padNumber 把数字补齐成两位字符串。 */
function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

/** toTimestamp 将接口时间字段转换为毫秒时间戳。 */
function toTimestamp(value: number | string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** formatDateLabel 将时间戳格式化为日期分组标签。 */
function formatDateLabel(timestamp: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

/** formatTimeLabel 将时间戳格式化为组内时间标签。 */
function formatTimeLabel(timestamp: number): string {
  if (!timestamp) return '--:--:--';
  const date = new Date(timestamp);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;
}

/** formatDateInput 将 Date 转成 picker 可用的 yyyy-MM-dd。 */
function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

/** parseDateParts 将 yyyy-MM-dd 拆成数字，避免 iOS 解析字符串日期异常。 */
function parseDateParts(date: string): { day: number; monthIndex: number; year: number } | null {
  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  return { day, monthIndex, year };
}

/** parseDateStart 生成本地日期起始毫秒时间戳。 */
function parseDateStart(date: string): number | null {
  const parts = parseDateParts(date);
  return parts ? new Date(parts.year, parts.monthIndex, parts.day, 0, 0, 0, 0).getTime() : null;
}

/** parseDateEnd 生成本地日期结束毫秒时间戳。 */
function parseDateEnd(date: string): number | null {
  const parts = parseDateParts(date);
  return parts ? new Date(parts.year, parts.monthIndex, parts.day, 23, 59, 59, 999).getTime() : null;
}

/** stringifyValue 将任意日志值转换为安全展示文本。 */
function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** getSchemaName 根据物模型映射返回显示名称。 */
function getSchemaName(schemaMap: SchemaNameMap, identifier?: string, fallbackName?: string): string {
  if (!identifier) return fallbackName || '未知标识';
  return schemaMap[identifier] || fallbackName || identifier;
}

/** getActor 从控制日志中提取操作者。 */
function getActor(raw: DeviceOperationLogRaw): string {
  return raw.user?.nickName || raw.user?.userName || raw.account || raw.userID || '系统';
}

/** getResult 将接口结果码映射为展示标签和色调。 */
function getResult(rawCode: number | string | undefined): { label: string; tone: DeviceLogTone } {
  const code = String(rawCode ?? '');
  if (code === '200') return { label: '成功', tone: 'success' };
  if (!code || code === '0') return { label: '未知', tone: 'neutral' };
  return { label: '失败', tone: 'danger' };
}

/** buildBaseItem 创建日志条目的公共字段。 */
function buildBaseItem(tab: DeviceLogTabKey, timestampValue: number | string | undefined, raw: unknown, suffix: string) {
  const timestamp = toTimestamp(timestampValue);
  return {
    dateLabel: formatDateLabel(timestamp),
    id: `${tab}-${timestamp}-${suffix}`,
    raw,
    tab,
    timestamp,
    timeLabel: formatTimeLabel(timestamp),
  };
}

/** createDeviceLogTimeRangeFromPreset 根据快捷范围生成接口时间范围。 */
export function createDeviceLogTimeRangeFromPreset(preset: DeviceLogTimePreset, now = new Date()): DeviceLogTimeRange {
  const end = new Date(now);
  const start = new Date(now);

  if (preset === 'last30m') {
    start.setMinutes(start.getMinutes() - 30);
  } else if (preset === 'last7d') {
    start.setDate(start.getDate() - 7);
  } else if (preset === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  }

  return {
    endDate: formatDateInput(end),
    label: PRESET_LABELS[preset],
    startDate: formatDateInput(start),
    timeEnd: String(end.getTime()),
    timeStart: String(start.getTime()),
  };
}

/** createDeviceLogTimeRangeFromDates 根据自定义起止日期生成接口时间范围。 */
export function createDeviceLogTimeRangeFromDates(startDate: string, endDate: string): DeviceLogTimeRange {
  const start = parseDateStart(startDate);
  const end = parseDateEnd(endDate);
  if (start === null || end === null || start > end) {
    throw new Error('自定义时间范围无效');
  }
  return {
    endDate,
    label: '自定义日期',
    startDate,
    timeEnd: String(end),
    timeStart: String(start),
  };
}

/** mergeAndSortDeviceLogItems 将多源日志按时间倒序合并。 */
export function mergeAndSortDeviceLogItems(items: DeviceLogTimelineItem[]): DeviceLogTimelineItem[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

/** groupDeviceLogTimelineItems 按日期聚合日志，并按展开状态决定可见条目。 */
export function groupDeviceLogTimelineItems(
  items: DeviceLogTimelineItem[],
  expanded: Record<string, boolean>,
): DeviceLogDateGroup[] {
  const groups = new Map<string, DeviceLogTimelineItem[]>();
  for (const item of mergeAndSortDeviceLogItems(items)) {
    const group = groups.get(item.dateLabel) || [];
    group.push(item);
    groups.set(item.dateLabel, group);
  }

  return [...groups.entries()].map(([dateLabel, groupItems]) => {
    const hasManualState = Object.prototype.hasOwnProperty.call(expanded, dateLabel);
    const isExpanded = hasManualState ? Boolean(expanded[dateLabel]) : true;
    const visibleItems = isExpanded ? groupItems : groupItems.slice(0, 1);
    return {
      dateLabel,
      hiddenCount: Math.max(0, groupItems.length - visibleItems.length),
      items: groupItems,
      visibleItems,
    };
  });
}

/** buildSchemaNameMap 从物模型列表生成标识符名称映射。 */
export function buildSchemaNameMap(schemas: Array<{ identifier?: string; name?: string }>): SchemaNameMap {
  return schemas.reduce<SchemaNameMap>((result, item) => {
    if (item.identifier) result[item.identifier] = item.name || item.identifier;
    return result;
  }, {});
}

/** normalizeDeviceStatusLog 将上下线日志转成 Timeline 条目。 */
export function normalizeDeviceStatusLog(raw: DeviceStatusLogRaw): DeviceLogTimelineItem {
  const status = STATUS_LABELS[Number(raw.status)] || { label: '未知', title: '状态变更', tone: 'neutral' as DeviceLogTone };
  const base = buildBaseItem('status', raw.timestamp, raw, `${raw.productID || ''}-${raw.deviceName || ''}-${raw.status || ''}`);
  return {
    ...base,
    badgeLabel: status.label,
    detailRows: [
      { label: '产品ID', value: stringifyValue(raw.productID) },
      { label: '设备ID', value: stringifyValue(raw.deviceName) },
      { label: '状态值', value: stringifyValue(raw.status) },
    ],
    resultTone: status.tone,
    subtitle: `设备 ${raw.deviceName || '-'} ${status.label}`,
    title: status.title,
  };
}

/** normalizeDeviceOperationLog 将操作日志转成 Timeline 条目。 */
export function normalizeDeviceOperationLog(raw: DeviceOperationLogRaw, schemaMap: SchemaNameMap = {}): DeviceLogTimelineItem {
  const action = raw.action || '';
  const actionLabel = OPERATION_ACTION_LABELS[action] || action || '操作命令';
  const dataName = getSchemaName(schemaMap, raw.dataID);
  const result = getResult(raw.resultCode);
  const base = buildBaseItem('operation', raw.timestamp, raw, `${raw.traceID || ''}-${raw.dataID || ''}-${action}`);
  return {
    ...base,
    actor: getActor(raw),
    badgeLabel: result.label,
    detailRows: [
      { label: '操作类型', value: actionLabel },
      { label: '数据标识', value: stringifyValue(raw.dataID) },
      { label: '内容', value: stringifyValue(raw.content) },
      { label: '执行结果', value: stringifyValue(raw.resultCode) },
      { label: '操作者', value: getActor(raw) },
      { label: '链路ID', value: stringifyValue(raw.traceID) },
    ],
    resultTone: result.tone,
    subtitle: stringifyValue(raw.content),
    title: `${actionLabel}：${dataName}`,
  };
}

/** normalizeDeviceDebugLog 将云端诊断日志转成 Timeline 条目。 */
export function normalizeDeviceDebugLog(raw: DeviceDebugLogRaw): DeviceLogTimelineItem {
  const actionLabel = DEBUG_ACTION_LABELS[raw.action || ''] || raw.action || '诊断';
  const result = getResult(raw.resultCode);
  const base = buildBaseItem('debug', raw.timestamp, raw, `${raw.traceID || ''}-${raw.requestID || ''}-${raw.action || ''}`);
  return {
    ...base,
    badgeLabel: actionLabel,
    detailRows: [
      { label: '类别', value: actionLabel },
      { label: '主题', value: stringifyValue(raw.topic) },
      { label: '内容', value: stringifyValue(raw.content) },
      { label: '响应', value: stringifyValue(raw.respPayload) },
      { label: '请求ID', value: stringifyValue(raw.requestID) },
      { label: '链路ID', value: stringifyValue(raw.traceID) },
      { label: '结果', value: stringifyValue(raw.resultCode) },
    ],
    resultTone: result.tone === 'danger' ? 'danger' : 'info',
    subtitle: raw.topic || raw.content,
    title: `云端诊断：${actionLabel}`,
  };
}

/** normalizeDeviceEventLog 将事件日志转成调试 Timeline 条目。 */
export function normalizeDeviceEventLog(raw: DeviceEventLogRaw, schemaMap: SchemaNameMap = {}): DeviceLogTimelineItem {
  const eventType = EVENT_TYPE_LABELS[raw.type || ''] || { label: raw.type || '事件', tone: 'warning' as DeviceLogTone };
  const dataName = getSchemaName(schemaMap, raw.dataID);
  const base = buildBaseItem('debug', raw.timestamp, raw, `${raw.dataID || ''}-${raw.type || ''}`);
  return {
    ...base,
    badgeLabel: eventType.label,
    detailRows: [
      { label: '事件名称', value: dataName },
      { label: '事件标识', value: stringifyValue(raw.dataID) },
      { label: '事件类型', value: eventType.label },
      { label: '参数', value: stringifyValue(raw.params) },
    ],
    resultTone: eventType.tone,
    subtitle: stringifyValue(raw.params),
    title: `事件上报：${dataName}`,
  };
}

/** normalizeDevicePropertyLog 将属性日志转成调试 Timeline 条目。 */
export function normalizeDevicePropertyLog(raw: DevicePropertyLogRaw, schemaMap: SchemaNameMap = {}): DeviceLogTimelineItem {
  const dataName = getSchemaName(schemaMap, raw.dataID, raw.dataName);
  const base = buildBaseItem('debug', raw.timestamp, raw, `${raw.deviceName || ''}-${raw.dataID || ''}`);
  return {
    ...base,
    badgeLabel: '属性',
    detailRows: [
      { label: '属性名称', value: dataName },
      { label: '数据标识', value: stringifyValue(raw.dataID) },
      { label: '属性值', value: stringifyValue(raw.value) },
      { label: '设备ID', value: stringifyValue(raw.deviceName) },
    ],
    resultTone: 'info',
    subtitle: `值：${stringifyValue(raw.value)}`,
    title: `属性上报：${dataName}`,
  };
}

/** normalizeDeviceSdkLog 将设备 SDK 日志转成调试 Timeline 条目。 */
export function normalizeDeviceSdkLog(raw: DeviceSdkLogRaw): DeviceLogTimelineItem {
  const level = SDK_LEVEL_LABELS[Number(raw.loglevel ?? raw.logLevel)] || { label: '日志', tone: 'neutral' as DeviceLogTone };
  const base = buildBaseItem('debug', raw.timestamp, raw, `${raw.loglevel ?? raw.logLevel ?? ''}-${raw.content || ''}`);
  return {
    ...base,
    badgeLabel: level.label,
    detailRows: [
      { label: '日志级别', value: level.label },
      { label: '内容', value: stringifyValue(raw.content) },
    ],
    resultTone: level.tone,
    subtitle: stringifyValue(raw.content),
    title: `SDK日志：${level.label}`,
  };
}
