/**
 * 设备日志归一化与日期聚合工具。
 *
 * 页面从多个物联网日志接口读取不同字段结构，本文件负责转成统一 Timeline 数据，
 * 并复刻旧 App 的日期聚合展示方式，支持按日期分组后按需展开条目。
 */

import { formatPropertyTime, propertyQualityLabel } from '@vben/saas/utils';
import { $t } from '@vben/locales';

import type { ThingsApi } from '@vben/api';

/** DeviceLogTabKey 表示设备日志页面的四个业务视图。 */
export type DeviceLogTabKey = 'control' | 'debug' | 'status' | 'thingModel';

/** DeviceLogTone 表示日志结果在页面上的语义色调。 */
export type DeviceLogTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning';

/** DeviceLogDetailRow 是详情抽屉中展示的一行键值。 */
export interface DeviceLogDetailRow {
  /** 详情字段名。 */
  label: string;
  /** 详情字段值。 */
  value: string;
}

/** DeviceLogTimelineItem 是所有日志归一后的展示结构。 */
export interface DeviceLogTimelineItem {
  /** 当前日志的业务标签。 */
  badgeLabel: string;
  /** 日志所属日期，用于聚合分组。 */
  dateLabel: string;
  /** 详情抽屉展示字段。 */
  detailRows: DeviceLogDetailRow[];
  /** 日志发起人或来源。 */
  actor?: string;
  /** 归一化后的唯一标识。 */
  id: string;
  /** 原始接口记录。 */
  raw: unknown;
  /** 结果色调。 */
  resultTone: DeviceLogTone;
  /** 摘要说明。 */
  subtitle?: string;
  /** 所属日志页签。 */
  tab: DeviceLogTabKey;
  /** 毫秒时间戳。 */
  timestamp: number;
  /** 组内展示时间。 */
  timeLabel: string;
  /** 日志主标题。 */
  title: string;
}

/** DeviceLogDateGroup 是按日期聚合后的日志组。 */
export interface DeviceLogDateGroup {
  /** 日期分组键。 */
  dateLabel: string;
  /** 当前日期下被折叠隐藏的数量。 */
  hiddenCount: number;
  /** 当前日期下所有日志。 */
  items: DeviceLogTimelineItem[];
  /** 当前日期下实际展示的日志。 */
  visibleItems: DeviceLogTimelineItem[];
}

/** SchemaNameMap 保存物模型标识符到显示名的映射。 */
export type SchemaNameMap = Record<string, string>;

const STATUS_LABELS: Record<number, { label: string; title: string; tone: DeviceLogTone }> = {
  1: { label: $t('orgIotClient.deviceStatus.online'), title: $t('orgIotClient.deviceLogs.statusOnlineTitle'), tone: 'success' },
  2: { label: $t('orgIotClient.deviceStatus.offline'), title: $t('orgIotClient.deviceLogs.statusOfflineTitle'), tone: 'danger' },
};

const CONTROL_ACTION_LABELS: Record<string, string> = {
  actionSend: $t('orgIotClient.deviceLogs.actionSend'),
  propertyControlSend: $t('orgIotClient.deviceLogs.propertyControlSend'),
  propertyGetReportSend: $t('orgIotClient.deviceLogs.propertyGetReportSend'),
};

const HUB_ACTION_LABELS: Record<string, string> = {
  action: $t('orgIotClient.deviceLogs.hubAction'),
  connected: $t('orgIotClient.deviceLogs.hubConnected'),
  disconnected: $t('orgIotClient.deviceLogs.hubDisconnected'),
  event: $t('orgIotClient.deviceLogs.hubEvent'),
  gateway: $t('iotApp.productPage.deviceTypeGateway'),
  property: $t('iotApp.productPage.property'),
  thing: $t('orgIotClient.deviceLogs.thingModel'),
};

const EVENT_TYPE_LABELS: Record<string, { label: string; tone: DeviceLogTone }> = {
  alert: { label: $t('orgIotClient.deviceLogs.toneAlert'), tone: 'warning' },
  fault: { label: $t('orgIotClient.deviceLogs.toneFault'), tone: 'danger' },
  info: { label: $t('orgIotClient.deviceLogs.toneInfo'), tone: 'success' },
};

function padNumber(value: number) {
  return String(value).padStart(2, '0');
}

function toTimestamp(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateLabel(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function formatTimeLabel(timestamp: number) {
  const date = new Date(timestamp);
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildBaseItem(tab: DeviceLogTabKey, timestampValue: string | number | undefined, raw: unknown, suffix: string) {
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

function getSchemaName(schemaMap: SchemaNameMap, identifier: string | undefined, fallbackName?: string) {
  if (!identifier) return fallbackName || $t('orgIotClient.deviceLogs.unknownIdentifier');
  return schemaMap[identifier] || fallbackName || identifier;
}

function getActor(raw: ThingsApi.DeviceMsgSendLogInfo) {
  return raw.user?.nickName || raw.user?.userName || raw.account || raw.userID || $t('orgIotClient.deviceLogs.systemActor');
}

function getResult(rawCode: number | string | undefined) {
  const code = String(rawCode ?? '');
  if (code === '200') {
    return { label: $t('orgIotClient.deviceLogs.resultSuccess'), tone: 'success' as DeviceLogTone };
  }
  if (!code || code === '0') {
    return { label: $t('orgIotClient.deviceSpace.unknown'), tone: 'neutral' as DeviceLogTone };
  }
  return { label: $t('orgIotClient.deviceLogs.resultFailed'), tone: 'danger' as DeviceLogTone };
}

/** buildSchemaNameMap 从设备物模型列表生成标识符名称映射。 */
export function buildSchemaNameMap(schemas: ThingsApi.DeviceSchema[] = []): SchemaNameMap {
  return schemas.reduce<SchemaNameMap>((result, item) => {
    if (item.identifier) {
      result[item.identifier] = item.name || item.identifier;
    }
    return result;
  }, {});
}

/** mergeAndSortTimelineItems 将多源日志按时间倒序合并。 */
export function mergeAndSortTimelineItems(items: DeviceLogTimelineItem[]) {
  return [...items].sort((a, b) => b.timestamp - a.timestamp);
}

/** groupTimelineItems 按日期聚合日志，并按展开状态决定可见条目。 */
export function groupTimelineItems(items: DeviceLogTimelineItem[], expanded: Record<string, boolean>): DeviceLogDateGroup[] {
  const groups = new Map<string, DeviceLogTimelineItem[]>();
  for (const item of mergeAndSortTimelineItems(items)) {
    const group = groups.get(item.dateLabel) || [];
    group.push(item);
    groups.set(item.dateLabel, group);
  }

  return [...groups.entries()].map(([dateLabel, groupItems]) => {
    const isExpanded = Boolean(expanded[dateLabel]);
    const visibleItems = isExpanded ? groupItems : groupItems.slice(0, 1);
    return {
      dateLabel,
      hiddenCount: Math.max(0, groupItems.length - visibleItems.length),
      items: groupItems,
      visibleItems,
    };
  });
}

/** normalizeStatusLog 将上下线日志转成 Timeline 条目。 */
export function normalizeStatusLog(raw: ThingsApi.DeviceMsgStatusLogInfo): DeviceLogTimelineItem {
  const status = STATUS_LABELS[Number(raw.status)] || { label: $t('orgIotClient.deviceSpace.unknown'), title: $t('orgIotClient.deviceLogs.statusChangeFallback'), tone: 'neutral' as DeviceLogTone };
  const base = buildBaseItem('status', raw.timestamp, raw, `${raw.productID || ''}-${raw.deviceName || ''}-${raw.status || ''}`);

  return {
    ...base,
    badgeLabel: status.label,
    detailRows: [
      { label: $t('orgIotClient.deviceLogs.colProductId'), value: stringifyValue(raw.productID) },
      { label: $t('iotApp.card.deviceId'), value: stringifyValue(raw.deviceName) },
      { label: $t('orgIotClient.deviceLogs.statusValue'), value: stringifyValue(raw.status) },
    ],
    resultTone: status.tone,
    subtitle: $t('orgIotClient.deviceLogs.deviceStatusSuffix', { device: raw.deviceName || '-', status: status.label }),
    title: status.title,
  };
}

/** normalizeControlLog 将控制日志或行为日志转成 Timeline 条目。 */
export function normalizeControlLog(
  raw: ThingsApi.DeviceMsgSendLogInfo,
  schemaMap: SchemaNameMap = {},
  tab: DeviceLogTabKey = 'control',
): DeviceLogTimelineItem {
  const action = raw.action || '';
  const actionLabel = tab === 'thingModel' && action === 'actionSend' ? $t('orgIotClient.deviceLogs.actionCall') : CONTROL_ACTION_LABELS[action] || action || $t('orgIotClient.deviceLogs.controlCommand');
  const dataName = getSchemaName(schemaMap, raw.dataID);
  const result = getResult(raw.resultCode);
  const base = buildBaseItem(tab, raw.timestamp, raw, `${raw.traceID || ''}-${raw.dataID || ''}-${action}`);

  return {
    ...base,
    actor: getActor(raw),
    badgeLabel: result.label,
    detailRows: [
      { label: $t('orgIotClient.deviceLogs.colActionType'), value: actionLabel },
      { label: $t('orgIotClient.deviceLogs.colDataId'), value: stringifyValue(raw.dataID) },
      { label: $t('orgIotClient.deviceLogs.colContent'), value: stringifyValue(raw.content) },
      { label: $t('orgIotClient.deviceLogs.colResult'), value: stringifyValue(raw.resultCode) },
      { label: $t('orgIotClient.deviceLogs.colOperator'), value: getActor(raw) },
      { label: $t('orgIotClient.deviceLogs.colTraceId'), value: stringifyValue(raw.traceID) },
    ],
    resultTone: result.tone,
    subtitle: stringifyValue(raw.content),
    title: `${actionLabel}：${dataName}`,
  };
}

/** normalizeHubLog 将云端诊断日志转成 Timeline 条目。 */
export function normalizeHubLog(raw: ThingsApi.DeviceMsgHubLogInfo, tab: DeviceLogTabKey = 'debug'): DeviceLogTimelineItem {
  const actionLabel = HUB_ACTION_LABELS[raw.action] || raw.action || $t('orgIotClient.deviceLogs.diagnoseFallback');
  const result = getResult(raw.resultCode);
  const base = buildBaseItem(tab, raw.timestamp, raw, `${raw.traceID || ''}-${raw.requestID || ''}-${raw.action || ''}`);

  return {
    ...base,
    badgeLabel: actionLabel,
    detailRows: [
      { label: $t('orgIotClient.deviceLogs.colReceivedTime'), value: formatPropertyTime(raw.receivedTime) },
      { label: $t('orgIotClient.deviceLogs.colCategory'), value: actionLabel },
      { label: $t('orgIotClient.deviceLogs.colTopic'), value: stringifyValue(raw.topic) },
      { label: $t('orgIotClient.deviceLogs.colContent'), value: stringifyValue(raw.content) },
      { label: $t('orgIotClient.deviceLogs.colResponse'), value: stringifyValue(raw.respPayload) },
      { label: $t('orgIotClient.deviceLogs.colRequestId'), value: stringifyValue(raw.requestID) },
      { label: $t('orgIotClient.deviceLogs.colTraceId'), value: stringifyValue(raw.traceID) },
      { label: $t('orgIotClient.deviceLogs.colResultShort'), value: stringifyValue(raw.resultCode) },
    ],
    resultTone: result.tone === 'danger' ? 'danger' : 'info',
    subtitle: raw.topic || raw.content,
    title: $t('orgIotClient.deviceLogs.cloudDiagTitle', { action: actionLabel }),
  };
}

/** normalizePropertyLog 将属性历史转成物模型 Timeline 条目。 */
export function normalizePropertyLog(raw: ThingsApi.DeviceMsgPropertyLogInfo, schemaMap: SchemaNameMap = {}): DeviceLogTimelineItem {
  const dataName = getSchemaName(schemaMap, raw.dataID, raw.dataName);
  const base = buildBaseItem('thingModel', raw.timestamp, raw, `${raw.deviceName || ''}-${raw.dataID || ''}`);

  return {
    ...base,
    badgeLabel: propertyQualityLabel(raw),
    detailRows: [
      { label: $t('orgIotClient.deviceLogs.propName'), value: dataName },
      { label: $t('orgIotClient.deviceLogs.colDataId'), value: stringifyValue(raw.dataID) },
      { label: $t('orgIotClient.deviceLogs.rawValue'), value: stringifyValue(raw.value) },
      { label: $t('orgIotClient.deviceLogs.quality'), value: propertyQualityLabel(raw) },
      { label: $t('orgIotClient.deviceLogs.dataTime'), value: formatPropertyTime(raw.timestamp) },
      { label: $t('orgIotClient.deviceLogs.colReceivedTime'), value: formatPropertyTime(raw.receivedTime) },
      { label: $t('iotApp.card.deviceId'), value: stringifyValue(raw.deviceName) },
    ],
    resultTone: propertyQualityLabel(raw) === $t('orgIotClient.deviceLogs.qualityGood') ? 'success' : raw.quality === 'BAD' ? 'danger' : 'warning',
    subtitle: $t('orgIotClient.deviceLogs.valueSubtitle', { value: raw.quality === 'BAD' ? $t('orgIotClient.deviceLogs.dataUnavailable') : stringifyValue(raw.value), time: formatPropertyTime(raw.receivedTime) }),
    title: $t('orgIotClient.deviceLogs.propReportTitle', { name: dataName }),
  };
}

/** normalizeEventLog 将事件历史转成物模型 Timeline 条目。 */
export function normalizeEventLog(raw: ThingsApi.DeviceMsgEventLogInfo, schemaMap: SchemaNameMap = {}): DeviceLogTimelineItem {
  const eventType = EVENT_TYPE_LABELS[raw.type || ''] || { label: raw.type || $t('orgIotClient.deviceLogs.eventFallback'), tone: 'warning' as DeviceLogTone };
  const dataName = getSchemaName(schemaMap, raw.dataID);
  const base = buildBaseItem('thingModel', raw.timestamp, raw, `${raw.dataID || ''}-${raw.type || ''}`);

  return {
    ...base,
    badgeLabel: eventType.label,
    detailRows: [
      { label: $t('orgIotClient.deviceLogs.colReceivedTime'), value: formatPropertyTime(raw.receivedTime) },
      { label: $t('orgIotClient.deviceLogs.eventName'), value: dataName },
      { label: $t('orgIotClient.deviceLogs.eventId'), value: stringifyValue(raw.dataID) },
      { label: $t('orgIotClient.deviceLogs.eventType'), value: eventType.label },
      { label: $t('orgIotClient.deviceLogs.params'), value: stringifyValue(raw.params) },
    ],
    resultTone: eventType.tone,
    subtitle: stringifyValue(raw.params),
    title: $t('orgIotClient.deviceLogs.eventReportTitle', { name: dataName }),
  };
}
