import { describe, expect, it } from 'vitest';

import { timeHelper } from './timeHelper';

describe('timeHelper.generateTimeWindows', () => {
  it('按小时单位切分时间范围并闭合到 timeEnd', () => {
    const start = new Date('2026-01-01T00:00:00Z').getTime();
    const end = start + 3 * 60 * 60 * 1000; // 3 小时
    const windows = timeHelper().generateTimeWindows(start, end, 1, 'h');

    expect(windows).toHaveLength(3);
    expect(windows[0].timeStart).toBe(start);
    expect(windows[0].timeEnd).toBe(start + 60 * 60 * 1000);
    // 最后一个窗口的结束时间应收敛到 timeEnd，不超出
    expect(windows[2].timeEnd).toBe(end);
    // 窗口首尾相接无间隙
    expect(windows[1].timeStart).toBe(windows[0].timeEnd);
    expect(windows[1].timeEnd).toBe(windows[2].timeStart);
    // 文本字段同步生成
    expect(windows[0].timeStartText).toBe(new Date(start).toLocaleString());
    expect(windows[0].timeEndText).toBe(new Date(windows[0].timeEnd).toLocaleString());
  });

  it('各时间单位换算正确（分/秒/天/周/月/年）', () => {
    const start = 0;
    const end = 10 * 365 * 24 * 60 * 60 * 1000; // 足够大（仅用于天及以上单位，避免海量窗口）
    const th = timeHelper();

    // 1 天窗口 → 第二个窗口起点 = start + 86400000
    expect(th.generateTimeWindows(start, end, 1, 'd')[1].timeStart).toBe(24 * 60 * 60 * 1000);
    // 1 周窗口
    expect(th.generateTimeWindows(start, end, 1, 'w')[1].timeStart).toBe(7 * 24 * 60 * 60 * 1000);
    // 1 月按 30 天计算
    expect(th.generateTimeWindows(start, end, 1, 'n')[1].timeStart).toBe(30 * 24 * 60 * 60 * 1000);
    // 1 年按 365 天计算
    expect(th.generateTimeWindows(start, end, 1, 'y')[1].timeStart).toBe(365 * 24 * 60 * 60 * 1000);
    // 1 分钟 / 1 秒
    const tenMinutes = 10 * 60 * 1000;
    const tenSeconds = 10 * 1000;
    expect(th.generateTimeWindows(start, tenMinutes, 1, 'm')[1].timeStart).toBe(60 * 1000);
    expect(th.generateTimeWindows(start, tenSeconds, 1, 's')[1].timeStart).toBe(1000);
    // 1 毫秒 / 微秒 / 未知单位兜底（end 控制在 10ms 内）
    const tenMs = 10;
    expect(th.generateTimeWindows(start, tenMs, 1, 'a')[1].timeStart).toBe(1);
    expect(th.generateTimeWindows(start, tenMs, 1, 'u')[1].timeStart).toBe(0.001);
    expect(th.generateTimeWindows(start, tenMs, 2, 'x')[1].timeStart).toBe(2);
  });

  it('结束时间不足一个完整窗口时收敛为尾窗', () => {
    const start = 0;
    const end = 90 * 60 * 1000; // 90 分钟
    const windows = timeHelper().generateTimeWindows(start, end, 60, 'm');

    expect(windows).toHaveLength(2);
    expect(windows[1].timeEnd).toBe(end);
  });

  it('timeEnd 不大于 timeStart 时返回空数组', () => {
    expect(timeHelper().generateTimeWindows(100, 100, 1, 'd')).toEqual([]);
    expect(timeHelper().generateTimeWindows(200, 100, 1, 'd')).toEqual([]);
  });
});

describe('timeHelper.getTimeParams / getStartAndEndTimeParams', () => {
  it('day 粒度返回当日 0 点到 24 点', () => {
    const date = new Date(2026, 0, 15, 15, 30).getTime(); // 本地 2026-01-15 15:30
    const params = timeHelper().getTimeParams(date, 'day');

    expect(params.timeStart).toBe(new Date(2026, 0, 15, 0, 0, 0, 0).getTime());
    expect(params.timeEnd).toBe(new Date(2026, 0, 15, 23, 59, 59, 999).getTime());
  });

  it('month 粒度返回当月 1 号 0 点到月末最后一毫秒', () => {
    const date = new Date(2026, 1, 10).getTime(); // 2026-02（闰年 29 天）
    const params = timeHelper().getTimeParams(date, 'month');

    expect(params.timeStart).toBe(new Date(2026, 1, 1, 0, 0, 0, 0).getTime());
    expect(params.timeEnd).toBe(new Date(2026, 2, 1, 0, 0, 0, 0).getTime() - 1);
  });

  it('getStartAndEndTimeParams 将毫秒时间戳字符串化并生成展示文本', () => {
    const timeStart = new Date(2026, 5, 1).getTime();
    const timeEnd = new Date(2026, 5, 2).getTime();
    const result = timeHelper().getStartAndEndTimeParams({ timeStart, timeEnd });

    expect(result).toEqual({
      timeStart: String(timeStart),
      timeStartText: new Date(timeStart).toLocaleString(),
      timeEnd: String(timeEnd),
      timeEndText: new Date(timeEnd).toLocaleString(),
    });
  });
});
