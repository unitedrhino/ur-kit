/**
 * 文件说明：告警 Badge 语义变体映射
 * 统一告警模块各页面中"状态 → Badge variant / 级别 → Badge variant"的语义色映射，
 * 避免在 event / disposal / notify-record 三处各自重复实现。
 * 仅合并映射逻辑，不改变各页面原有的语义取值范围。
 */
import type { AlarmLevel } from '../types/alarm-v2.types';

import { levelLabel } from '../types/alarm-v2.types';

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary';

/** 等级 code → Badge 语义色（文案可被应用级覆盖，判定必须用 code 而非中文 label）。 */
const levelCodeVariant: Record<AlarmLevel, BadgeVariant> = {
  critical: 'destructive',
  major: 'default',
  minor: 'secondary',
  remind: 'outline',
};

/** 旧版中文 label → Badge 语义色（兼容历史入参，未覆盖文案的应用仍按此命中）。 */
const levelTextVariant: Record<string, BadgeVariant> = {
  紧急: 'destructive',
  重要: 'default',
  次要: 'secondary',
  提醒: 'outline',
};

/** 告警级别的 Badge 语义色：优先按 level code 判定，兼容传入中文 label。 */
export function levelVariant(level: string): BadgeVariant {
  if (level in levelCodeVariant) {
    return levelCodeVariant[level as AlarmLevel];
  }
  return levelTextVariant[level] || 'outline';
}

/**
 * 告警事件状态的 Badge 语义色（事件页 + 处置页共用）。
 * 优先按后端状态 code 判定（界面文案接入 i18n 后不再随语言变化），
 * 中文 key 仅兼容历史入参。取值范围：报警激活 / 已确认 / 恢复正常 / 已屏蔽。
 */
export function eventStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    alarmActive: 'destructive',
    acked: 'default',
    normal: 'secondary',
    shielded: 'outline',
    报警激活: 'destructive',
    已确认: 'default',
    恢复中: 'secondary',
    正常: 'secondary',
    已恢复: 'secondary',
    已屏蔽: 'outline',
  };
  return map[status] || 'outline';
}

/** 通知发送状态的 Badge 语义色（通知记录页 + 处置页通知表）。 */
export function notifyStatusVariant(status?: string): BadgeVariant {
  if (status === 'success') return 'secondary';
  if (status === 'fail') return 'destructive';
  return 'outline';
}

/** 事件统计卡片数字的语义色：优先按状态 code 判定，兼容中文 label。 */
export function statValueClass(label: string): string {
  if (label === 'alarmActive' || label === '报警激活') return 'text-destructive';
  if (label === 'acked' || label === '已确认') return 'text-primary';
  if (label === 'shielded' || label === '已屏蔽') return 'text-muted-foreground';
  return 'text-foreground';
}

/** 告警级别文案（供 Badge 使用）。 */
export function alarmLevelLabel(level: AlarmLevel): string {
  return levelLabel(level);
}
