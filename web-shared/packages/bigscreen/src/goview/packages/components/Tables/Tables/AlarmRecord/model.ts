/**
 * 文件说明：集中维护告警记录组件的数据兼容、状态文案和详情响应解析。
 */

/** AlarmVisual 描述告警枚举在大屏中的只读展示样式。 */
export interface AlarmVisual {
  color: string;
  label: string;
}

/** AlarmEventSummary 保存列表行携带的事件标识和原始元数据。 */
export interface AlarmEventSummary extends Record<string, unknown> {
  id: string;
}

/** AlarmEventDetail 描述只读详情弹窗消费的服务端数据。 */
export interface AlarmEventDetail {
  dealRecords: Record<string, any>[];
  event: null | Record<string, any>;
  notifyRecords: Record<string, any>[];
}

/** alarmStatusVisualMap 是告警状态到中文文案和颜色的唯一映射。 */
export const alarmStatusVisualMap: Record<string, AlarmVisual> = {
  acked: { color: '#f6c344', label: '已确认' },
  alarmActive: { color: '#ff4d4f', label: '报警激活' },
  normal: { color: '#4fd1a1', label: '已恢复' },
  recovered: { color: '#4fd1a1', label: '已恢复' },
  shielded: { color: '#8ba3b7', label: '已屏蔽' },
};

/** normalizeAlarmStatus 把正式状态和历史兼容状态统一为中文展示。 */
export function normalizeAlarmStatus(status: unknown): AlarmVisual {
  const key = String(status ?? '');
  return alarmStatusVisualMap[key] || { color: '#8ba3b7', label: key || '-' };
}

/** extractAlarmRowMetadata 从富数据集提取事件元数据，旧二维数组返回等长空占位。 */
export function extractAlarmRowMetadata(dataset: unknown): Array<AlarmEventSummary | null> {
  if (Array.isArray(dataset)) return dataset.map(() => null);
  if (!dataset || typeof dataset !== 'object') return [];
  const source = (dataset as { source?: unknown }).source;
  if (!Array.isArray(source)) return [];
  return source.map((row) => {
    if (!row || typeof row !== 'object') return null;
    const record = row as Record<string, any>;
    const rawMeta = record.__alarmEvent;
    if (rawMeta && typeof rawMeta === 'object' && String(rawMeta.id || '')) {
      return { ...rawMeta, id: String(rawMeta.id) };
    }
    const eventID = record.eventID ?? record.eventId ?? record.id;
    return eventID ? { ...record, id: String(eventID) } : null;
  });
}

/** unwrapAlarmDetailResponse 兼容统一响应信封和直接详情对象。 */
export function unwrapAlarmDetailResponse(response: unknown): AlarmEventDetail {
  const envelope = response && typeof response === 'object' ? (response as Record<string, any>) : {};
  const detail = envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope;
  return {
    dealRecords: Array.isArray(detail.dealRecords) ? detail.dealRecords : [],
    event: detail.event && typeof detail.event === 'object' ? detail.event : null,
    notifyRecords: Array.isArray(detail.notifyRecords) ? detail.notifyRecords : [],
  };
}

/** formatAlarmTime 把毫秒时间戳格式化为固定宽度的本地日期时间。 */
export function formatAlarmTime(timestamp: unknown): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return '-';
  const value = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return '-';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** formatAlarmTargets 把通知目标结构压缩为可读文本。 */
export function formatAlarmTargets(targets: unknown): string {
  if (!targets || typeof targets !== 'object') return '-';
  const target = targets as Record<string, unknown>;
  const parts: string[] = [];
  for (const [key, label] of [
    ['userIDs', '用户'],
    ['groupIDs', '用户组'],
    ['roleIDs', '角色'],
  ] as const) {
    const values = target[key];
    if (Array.isArray(values) && values.length > 0) parts.push(`${label}:${values.join(',')}`);
  }
  return parts.join('；') || '-';
}
