/**
 * 文件说明：规则引擎「AI 数据任务」的纯逻辑工具（无 Vue 依赖）。
 * 汇总调度枚举元数据、摘要文案与时间转换，供 AI 任务列表/创建弹窗/执行记录复用。
 */

import { $t } from '@vben/saas/locales';

/** 周几选项，value 与 clone-task 一致（0 周日 ~ 6 周六） */
export const SIMULATE_WEEKDAY_OPTIONS: Array<{ label: string; value: number }> = [
  { label: $t('iotApp.project.weekdaySun'), value: 0 },
  { label: $t('iotApp.project.weekdayMon'), value: 1 },
  { label: $t('iotApp.project.weekdayTue'), value: 2 },
  { label: $t('iotApp.project.weekdayWed'), value: 3 },
  { label: $t('iotApp.project.weekdayThu'), value: 4 },
  { label: $t('iotApp.project.weekdayFri'), value: 5 },
  { label: $t('iotApp.project.weekdaySat'), value: 6 },
];

/** HH:MM 转当天秒偏移；格式非法返回 undefined */
export function hhmmToSec(hhmm: string): number | undefined {
  const matched = /^(\d{1,2}):(\d{1,2})$/.exec(hhmm.trim());
  if (!matched) return undefined;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (hour > 23 || minute > 59) return undefined;
  return hour * 3600 + minute * 60;
}

/** 当天秒偏移转 HH:MM */
export function secToHHMM(sec?: number): string {
  const total = Math.max(0, Math.floor(Number(sec ?? 0)));
  const hour = Math.floor(total / 3600) % 24;
  const minute = Math.floor((total % 3600) / 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** 去掉整数多余的 .0，用于摘要展示 */
function trimNumberText(num: number): string {
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(4)));
}

/** 格式化时间：兼容毫秒/秒时间戳（数字或数字字符串，后端 int64 ,string 序列化为字符串）；空值返回 - */
export function formatSimulateTime(val?: number | string): string {
  if (val === undefined || val === null || val === '') return '-';
  const ts = typeof val === 'number' ? val : Number(val);
  if (!Number.isNaN(ts)) {
    if (ts <= 0) return '-';
    return formatDateTime(new Date(ts < 1e12 ? ts * 1000 : ts));
  }
  // 非数字字符串按 ISO 时间解析（历史兼容）
  const date = new Date(val);
  return Number.isNaN(date.getTime()) ? '-' : formatDateTime(date);
}

/** 统一的时间展示格式 */
function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 任务/运行最近执行状态徽标元数据（文案与配色） */
export function runStatusMeta(status?: string): { label: string; tone: string } {
  switch (status) {
    case 'success': {
      return { label: $t('iotApp.project.runSuccess'), tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
    }
    case 'failed': {
      return { label: $t('iotApp.project.runFailed'), tone: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400' };
    }
    case 'running': {
      return { label: $t('iotApp.project.runRunning'), tone: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400' };
    }
    default: {
      return { label: status || '-', tone: 'border-border/60 bg-muted text-muted-foreground' };
    }
  }
}

// ==================== AI 数据任务（TASK-124，clone-task 语义） ====================

/** AI 任务调度摘要的宽松入参（scheduleInterval 单位为分钟，scheduleTime 为 ISO 字符串，语义对齐 clone-task） */
export interface AiTaskScheduleLike {
  scheduleType: string;
  triggerType?: string;
  subscribeTopic?: string;
  scheduleInterval?: number;
  scheduleTime?: string;
  scheduleDailyTimeSec?: number;
  scheduleWeeklyDay?: number;
  scheduleWeeklyTimeSec?: number;
}

/** 判断 AI 任务是否启用（clone-task enabled：'1' 启用 / 其他停用） */
export function isAiTaskEnabled(enabled?: string): boolean {
  return String(enabled ?? '1') === '1';
}

/** 生成 AI 任务调度摘要文案，如「每 5 分钟」「每天 08:00」「每周一 09:00」「单次」「非定时」 */
export function summarizeAiTaskSchedule(task: AiTaskScheduleLike): string {
  if (task.triggerType === 'subscribe_message') return task.subscribeTopic ? `${$t('iotApp.ruleTrigger.eventTriggered')} · ${task.subscribeTopic}` : $t('iotApp.ruleTrigger.eventTriggered');
  switch (task.scheduleType) {
    case 'interval': {
      const minutes = Number(task.scheduleInterval ?? 0);
      if (!minutes || minutes <= 0) return $t('iotApp.project.scheduleFixed');
      return $t('iotApp.project.scheduleEveryNMin', { minutes: trimNumberText(minutes) });
    }
    case 'daily': {
      return $t('iotApp.project.scheduleDailyAt', { time: secToHHMM(task.scheduleDailyTimeSec) });
    }
    case 'weekly': {
      const day = SIMULATE_WEEKDAY_OPTIONS.find((item) => item.value === task.scheduleWeeklyDay)?.label || $t('iotApp.project.weekdayUnknown');
      return $t('iotApp.project.scheduleWeeklyAt', { day, time: secToHHMM(task.scheduleWeeklyTimeSec) });
    }
    case 'once': {
      const text = task.scheduleTime ? formatDateTime(new Date(task.scheduleTime)) : '';
      return text ? $t('iotApp.project.scheduleOnceWithTime', { time: text }) : $t('iotApp.project.scheduleOnce');
    }
    default: {
      return $t('iotApp.project.scheduleNone');
    }
  }
}
