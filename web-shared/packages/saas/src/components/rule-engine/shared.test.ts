// 测试环境未装载异步语言包：mock $t 直查真实语言包 JSON，断言保持中文语义。
vi.mock('@vben/saas/locales', async () => {
  const messages = (await import('../../locales/langs/zh-CN/iotApp.json')).default;
  const all = { iotApp: messages };
  return {
    $t: (key: string, args?: Record<string, unknown>) => {
      let text: string = key;
      {
        const parts = key.split('.');
        let cursor: any = all[parts[0]!];
        for (const p of parts.slice(1)) cursor = cursor?.[p];
        if (typeof cursor === 'string') text = cursor;
      }
      if (args) {
        for (const [k, v] of Object.entries(args)) text = text.replaceAll(`{${k}}`, String(v));
      }
      return text;
    },
  };
});

import { vi, describe, expect, it  } from 'vitest';

import {
  hhmmToSec,
  isAiTaskEnabled,
  runStatusMeta,
  secToHHMM,
  summarizeAiTaskSchedule,
} from './shared';

describe('HH:MM 与秒偏移互转', () => {
  it('合法输入双向转换一致', () => {
    expect(hhmmToSec('08:00')).toBe(28800);
    expect(hhmmToSec('00:00')).toBe(0);
    expect(secToHHMM(28800)).toBe('08:00');
    expect(hhmmToSec('24:00')).toBeUndefined();
    expect(hhmmToSec('abc')).toBeUndefined();
  });
});

describe('执行状态徽标', () => {
  it('success/failed/running/未知值', () => {
    expect(runStatusMeta('success').label).toBe('成功');
    expect(runStatusMeta('failed').label).toBe('失败');
    expect(runStatusMeta('running').label).toBe('执行中');
    expect(runStatusMeta('weird').label).toBe('weird');
    expect(runStatusMeta(undefined).label).toBe('-');
  });
});

describe('AI 任务辅助（clone-task 语义）', () => {
  it('isAiTaskEnabled：enabled "1" 启用，"2"/空串按默认启用判断', () => {
    expect(isAiTaskEnabled('1')).toBe(true);
    expect(isAiTaskEnabled('2')).toBe(false);
    // clone-task create 后未显式停用的任务 enabled 出参缺省按启用处理
    expect(isAiTaskEnabled(undefined)).toBe(true);
  });

  it('summarizeAiTaskSchedule：间隔单位为分钟', () => {
    expect(summarizeAiTaskSchedule({ scheduleType: 'interval', scheduleInterval: 5 })).toBe('每 5 分钟');
    expect(summarizeAiTaskSchedule({ scheduleType: 'interval', scheduleInterval: 0 })).toBe('固定间隔');
  });

  it('summarizeAiTaskSchedule：daily/weekly/once/none', () => {
    expect(summarizeAiTaskSchedule({ scheduleType: 'daily', scheduleDailyTimeSec: 28800 })).toBe('每天 08:00');
    expect(summarizeAiTaskSchedule({ scheduleType: 'weekly', scheduleWeeklyDay: 1, scheduleWeeklyTimeSec: 32400 })).toBe(
      '每周一 09:00',
    );
    expect(summarizeAiTaskSchedule({ scheduleType: 'once' })).toBe('单次');
    expect(summarizeAiTaskSchedule({ scheduleType: 'none' })).toBe('非定时');
  });

  it('summarizeAiTaskSchedule：事件任务在列表显示触发方式与来源', () => {
    expect(summarizeAiTaskSchedule({ scheduleType: 'none', triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event' }))
      .toBe('事件触发 · device.report.thing.event');
  });
});
