/**
 * 文件说明：告警 Badge 语义变体映射单元测试
 * 覆盖级别/状态/通知状态的语义色映射与统计卡片颜色。
 */
import { describe, expect, it } from 'vitest';

import {
  alarmLevelLabel,
  eventStatusVariant,
  levelVariant,
  notifyStatusVariant,
  statValueClass,
} from '../useAlarmBadgeVariant';

describe('useAlarmBadgeVariant', () => {
  it('告警级别应映射到正确的 Badge 变体', () => {
    expect(levelVariant('紧急')).toBe('destructive');
    expect(levelVariant('重要')).toBe('default');
    expect(levelVariant('次要')).toBe('secondary');
    expect(levelVariant('提醒')).toBe('outline');
    expect(levelVariant('未知')).toBe('outline');
  });

  it('告警事件状态应映射到正确的 Badge 变体', () => {
    expect(eventStatusVariant('报警激活')).toBe('destructive');
    expect(eventStatusVariant('已确认')).toBe('default');
    expect(eventStatusVariant('正常')).toBe('secondary');
    expect(eventStatusVariant('已恢复')).toBe('secondary');
    expect(eventStatusVariant('已屏蔽')).toBe('outline');
    expect(eventStatusVariant('未知')).toBe('outline');
  });

  it('通知发送状态应映射到正确的 Badge 变体', () => {
    expect(notifyStatusVariant('success')).toBe('secondary');
    expect(notifyStatusVariant('fail')).toBe('destructive');
    expect(notifyStatusVariant('pending')).toBe('outline');
    expect(notifyStatusVariant(undefined)).toBe('outline');
  });

  it('统计卡片数值应有语义色', () => {
    expect(statValueClass('报警激活')).toBe('text-destructive');
    expect(statValueClass('已确认')).toBe('text-primary');
    expect(statValueClass('已屏蔽')).toBe('text-muted-foreground');
    expect(statValueClass('默认')).toBe('text-foreground');
  });

  it('告警级别文案应由后端枚举还原', () => {
    expect(alarmLevelLabel('major')).toBe('重要');
  });
});
