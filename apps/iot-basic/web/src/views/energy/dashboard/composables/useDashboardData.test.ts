import { describe, expect, it, vi } from 'vitest';

// 单元测试加载公开仓内的真实中文语言包，避免依赖浏览器引导流程。
vi.mock('@vben/locales', async (importOriginal) => {
  const messages = (await import('../../../../../../../../web-shared/packages/saas/src/locales/langs/zh-CN/orgIotClient.json')).default;
  return {
    ...(await importOriginal<typeof import('@vben/locales')>()),
    $t: (key: string, args?: Record<string, unknown>) => {
      const path = key.replace(/^orgIotClient\./, '').split('.');
      let value: unknown = messages;
      for (const part of path) value = (value as Record<string, unknown>)?.[part];
      if (typeof value !== 'string') return key;
      let translated = value;
      for (const [name, replacement] of Object.entries(args ?? {})) {
        translated = translated.replaceAll(`{${name}}`, String(replacement));
      }
      return translated;
    },
  };
});

import {
  filterByRequestedAreaIDs,
  filterPropertyLogResponseByAreaIDs,
  getEnergyTimeParams,
  getPowerTimeParams,
} from './useDashboardData';

describe('getEnergyTimeParams', () => {
  it('四种粒度输出对应间隔单位、整窗边界与标签格式', () => {
    expect(getEnergyTimeParams('hour')).toMatchObject({ intervalUnit: 'h', format: 'HH:mm' });
    expect(getEnergyTimeParams('day')).toMatchObject({ intervalUnit: 'd', format: 'D日' });
    expect(getEnergyTimeParams('month')).toMatchObject({ intervalUnit: 'n', format: 'M月' });
    // year 粒度回看 4 年
    const year = getEnergyTimeParams('year');
    expect(year.intervalUnit).toBe('y');
    expect(Number(year.timeEnd) - Number(year.timeStart)).toBeGreaterThanOrEqual(4 * 365 * 24 * 3600 * 1000);
  });

  it('hour 粒度窗口为 [今日 0 点, 明日 0 点) 半开区间', () => {
    const { timeStart, timeEnd } = getEnergyTimeParams('hour');
    expect(Number(timeEnd) - Number(timeStart)).toBeLessThanOrEqual(2 * 24 * 3600 * 1000);
    expect(Number(timeEnd) - Number(timeStart)).toBeGreaterThanOrEqual(23 * 3600 * 1000);
  });
});

describe('getPowerTimeParams', () => {
  it('today 为 [今日 0 点, 今日末尾]；yesterday 平移一天', () => {
    const today = getPowerTimeParams('today');
    const yesterday = getPowerTimeParams('yesterday');
    expect(today.intervalUnit).toBe('h');
    // 昨日窗口结束早于今日窗口开始
    expect(Number(yesterday.timeEnd)).toBeLessThanOrEqual(Number(today.timeStart));
  });

  it('week 为近 7 天按天间隔', () => {
    const week = getPowerTimeParams('week');
    expect(week.intervalUnit).toBe('d');
    expect(week.format).toBe('M/D');
    expect(Number(week.timeEnd) - Number(week.timeStart)).toBeGreaterThanOrEqual(7 * 24 * 3600 * 1000);
  });
});

describe('filterByRequestedAreaIDs', () => {
  it('按请求区域过滤列表，缺失 areaID 的行保留', () => {
    const list = [
      { areaID: 1, v: 'a' },
      { areaID: 2, v: 'b' },
      { areaID: '', v: 'keep-empty' },
      { v: 'keep-no-id' },
    ];
    const filtered = filterByRequestedAreaIDs(list as any, ['1']);
    expect(filtered.map((item) => (item as any).v)).toEqual(['a', 'keep-empty', 'keep-no-id']);
  });

  it('空列表或空请求区域时原样返回', () => {
    expect(filterByRequestedAreaIDs([], ['1'])).toEqual([]);
    const list = [{ areaID: 1 }];
    expect(filterByRequestedAreaIDs(list, [])).toBe(list);
  });
});

describe('filterPropertyLogResponseByAreaIDs', () => {
  it('对响应的 list 做区域过滤并保留其他字段', () => {
    const resp = {
      total: 5,
      list: [
        { areaID: 1, value: 10 },
        { areaID: 2, value: 20 },
      ],
    };
    const filtered = filterPropertyLogResponseByAreaIDs(resp as any, ['2']);
    expect(filtered).toMatchObject({ total: 5 });
    expect(filtered?.list).toEqual([{ areaID: 2, value: 20 }]);
  });

  it('响应为空或无 list 时原样返回', () => {
    expect(filterPropertyLogResponseByAreaIDs(null, ['1'])).toBeNull();
    const noList = { total: 0 } as any;
    expect(filterPropertyLogResponseByAreaIDs(noList, ['1'])).toBe(noList);
  });
});
