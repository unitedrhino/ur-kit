import { addMonths, addYears, endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';

export type TimeWindow = {
  timeEnd: number;
  timeEndText: string;
  timeStart: number;
  timeStartText: string;
};

export type TimeParams = {
  timeEnd: number;
  timeStart: number;
};

export const timeHelper = () => {
  /**
   * 根据时间范围和间隔生成时间窗口
   * @param timeStart 开始时间戳(毫秒)
   * @param timeEnd 结束时间戳(毫秒)
   * @param interval 间隔数量
   * @param intervalUnit 时间单位: a (毫秒,默认), d (天), h (小时), m (分钟), n (月), s (秒), u (微秒), w (周), y (年)
   * @returns 时间窗口数组
   */
  const generateTimeWindows = (timeStart: number, timeEnd: number, interval: number, intervalUnit: string): TimeWindow[] => {
    const windows: TimeWindow[] = [];

    // 根据单位计算间隔毫秒数（仅用于固定长度的时间单位）
    const getIntervalMs = (interval: number, unit: string): number => {
      switch (unit) {
        case 'a': {
          // 毫秒(默认)
          return interval;
        }
        case 'd': {
          // 天
          return interval * 24 * 60 * 60 * 1000;
        }
        case 'h': {
          // 小时
          return interval * 60 * 60 * 1000;
        }
        case 'm': {
          // 分钟
          return interval * 60 * 1000;
        }
        case 's': {
          // 秒
          return interval * 1000;
        }
        case 'u': {
          // 微秒
          return interval / 1000;
        }
        case 'w': {
          // 周
          return interval * 7 * 24 * 60 * 60 * 1000;
        }
        default: {
          return interval;
        } // 默认为毫秒
      }
    };

    // 计算下一个时间点（支持月份和年份的准确计算）
    const getNextTimestamp = (currentTime: number, interval: number, unit: string): number => {
      if (unit === 'n') {
        // 月份：使用 addMonths 根据实际月份天数计算
        return addMonths(currentTime, interval).getTime();
      } else if (unit === 'y') {
        // 年份：使用 addYears 根据实际年份（考虑闰年）计算
        return addYears(currentTime, interval).getTime();
      } else {
        // 其他固定长度单位：直接加毫秒数
        return currentTime + getIntervalMs(interval, unit);
      }
    };

    let currentStart = timeStart;

    // 生成时间窗口，直到当前开始时间超过结束时间
    while (currentStart < timeEnd) {
      const nextStart = getNextTimestamp(currentStart, interval, intervalUnit);
      const currentEnd = Math.min(nextStart, timeEnd);

      windows.push({
        timeStart: currentStart,
        timeStartText: new Date(currentStart).toLocaleString(),
        timeEnd: currentEnd,
        timeEndText: new Date(currentEnd).toLocaleString(),
      });

      currentStart = currentEnd;
    }

    return windows;
  };

  const getTimeParams = (selectedDate: number, queryPeriod: string = 'day'): TimeParams => {
    return queryPeriod === 'day'
      ? {
          timeStart: startOfDay(selectedDate).getTime(),
          timeEnd: endOfDay(selectedDate).getTime(),
        }
      : {
          timeStart: startOfMonth(selectedDate).getTime(),
          timeEnd: endOfMonth(selectedDate).getTime(),
        };
  };
  // 构建时间参数
  const getStartAndEndTimeParams = (timeParams: TimeParams) => {
    return {
      timeStart: timeParams.timeStart.toString(),
      timeStartText: new Date(timeParams.timeStart).toLocaleString(),
      timeEnd: timeParams.timeEnd.toString(),
      timeEndText: new Date(timeParams.timeEnd).toLocaleString(),
    };
  };

  return {
    generateTimeWindows,
    getTimeParams,
    getStartAndEndTimeParams,
  };
};
