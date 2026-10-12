/**
 * 文件说明：告警通知详情的历史模板内容兼容渲染。
 */
import type { AlarmLevel } from '../types/alarm-v2.types';

import { getAlarmLevelLabelOverride } from '../types/alarm-v2.types';

/** LEVEL_VALUE_BY_CODE 等级 code → 数字值（数字键的旧数据映射用）。 */
const LEVEL_VALUE_BY_CODE: Record<string, string> = {
  critical: '4',
  major: '3',
  minor: '2',
  remind: '1',
};

/** NotificationRenderContext 描述渲染历史通知所需的告警事件快照字段。 */
export interface NotificationRenderContext {
  alarmName?: string;
  deviceName?: string;
  firstTriggerTime?: string;
  level?: string;
  recoveryTime?: string;
  targetName?: string;
  triggerContent?: string;
}

/** NotificationRecordDisplaySource 描述通知列表接口可直接提供的展示字段。 */
export interface NotificationRecordDisplaySource {
  alarmID?: string;
  alarmName?: string;
  eventID?: string;
  targetName?: string;
}

/** alarmLevelLabelMap 将告警级别枚举转换为用户可读文案（code/数字 → 应用覆盖后的展示文案）。 */
const alarmLevelLabelMap: Record<string, string> = {
  '1': '提醒',
  '2': '次要',
  '3': '重要',
  '4': '紧急',
  critical: '紧急',
  major: '重要',
  minor: '次要',
  remind: '提醒',
};

/** resolveAlarmLevelLabel 按应用级覆盖优先取等级文案（结构监测应用为蓝/黄/橙/红预警）。 */
function resolveAlarmLevelLabel(level?: string): string {
  if (!level) return '';
  const override =
    getAlarmLevelLabelOverride(level as AlarmLevel) ??
    getAlarmLevelLabelOverride(LEVEL_VALUE_BY_CODE[level as AlarmLevel] as AlarmLevel);
  return override || alarmLevelLabelMap[level] || level;
}

/** formatAlarmTemplateTime 按平台时区输出与后端模板一致的时间格式。 */
function formatAlarmTemplateTime(value?: string): string {
  if (!value) return '';
  const timestamp = Number(value);
  const source = Number.isNaN(timestamp) ? new Date(value) : new Date(timestamp);
  if (Number.isNaN(source.getTime())) return '';

  const chinaTime = new Date(source.getTime() + 8 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${chinaTime.getUTCFullYear()}-${pad(chinaTime.getUTCMonth() + 1)}-${pad(chinaTime.getUTCDate())} ${pad(chinaTime.getUTCHours())}:${pad(chinaTime.getUTCMinutes())}:${pad(chinaTime.getUTCSeconds())}`;
}

/** needsLegacyNotificationEvent 判断历史通知是否仍需事件详情参与模板渲染。 */
export function needsLegacyNotificationEvent(content?: string): boolean {
  return Boolean(content?.includes('{{'));
}

/** resolveNotificationRecordDisplay 解析通知列表的规则名称与告警对象展示值。 */
export function resolveNotificationRecordDisplay(
  record: NotificationRecordDisplaySource,
  event?: NotificationRenderContext,
): { device: string; ruleName: string } {
  return {
    device: record.targetName || event?.targetName || event?.deviceName || (record.eventID ? `事件 ${record.eventID}` : '-'),
    ruleName: record.alarmName || event?.alarmName || (record.alarmID ? `规则 ${record.alarmID}` : '-'),
  };
}

/** renderLegacyNotificationContent 使用事件快照渲染历史通知内容。 */
export function renderLegacyNotificationContent(content: string, timing: string, event?: NotificationRenderContext): string {
  if (!event || !content.includes('{{')) return content;

  const objectName = event.targetName || event.deviceName || '';
  const levelName = resolveAlarmLevelLabel(event.level) || event.level || '';
  const replacements: Record<string, string> = {
    consoleLink: '',
    content: event.triggerContent || '',
    currentLevelFmt: levelName,
    currentValueContent: event.triggerContent || '',
    deviceName: objectName,
    level: levelName,
    object: objectName,
    policyName: event.alarmName || '',
    recoveryTimeFmt: timing === 'recovery' ? formatAlarmTemplateTime(event.recoveryTime) : '',
    ruleName: event.alarmName || '',
    triggerTimeFmt: formatAlarmTemplateTime(event.firstTriggerTime),
  };

  return content.replaceAll(/\{\{\.?(\w+)\}\}/g, (template, field: string) => replacements[field] ?? template);
}
