import { endOfDay, startOfDay, subDays, subHours, subMinutes } from 'date-fns';

export const ykShortcuts = {
  今天: () => {
    const cur = new Date();
    return [startOfDay(cur).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
  近三天: () => {
    const cur = new Date();
    return [startOfDay(subDays(cur, 2)).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
  近一周: () => {
    const cur = new Date();
    return [startOfDay(subDays(cur, 6)).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
  近一月: () => {
    const cur = new Date();
    // 近一月 = 过去30天（而非 subMonths，避免月份天数不一致）
    return [startOfDay(subDays(cur, 29)).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
  近一年: () => {
    const cur = new Date();
    // 近一年 = 过去365天（而非 subYears，避免闰年不一致）
    return [startOfDay(subDays(cur, 364)).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
};

export const ykShortcutDeviceLogs = {
  近30分钟: () => {
    const cur = new Date();
    return [subMinutes(cur, 30).getTime(), cur.getTime()] as [number, number];
  },
  近1小时: () => {
    const cur = new Date();
    return [subHours(cur, 1).getTime(), cur.getTime()] as [number, number];
  },
  今天: () => {
    const cur = new Date();
    return [startOfDay(cur).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
  昨天: () => {
    const cur = new Date();
    const yesterday = subDays(cur, 1);
    return [startOfDay(yesterday).getTime(), endOfDay(yesterday).getTime()] as [number, number];
  },
  近7天: () => {
    const cur = new Date();
    return [startOfDay(subDays(cur, 6)).getTime(), endOfDay(cur).getTime()] as [number, number];
  },
};

// 判断是否属于 ykShortcutDeviceLogs
// 是否 返回 key 否则返回 null
export const timeRangeToYkShortcutDeviceLogs = (timeStart: number, timeEnd: number): null | string => {
  const duration = timeEnd - timeStart;

  // 允许的误差范围（1分钟）
  const tolerance = 60 * 1000;

  // 近30分钟: 30分钟的持续时间
  if (Math.abs(duration - 30 * 60 * 1000) < tolerance) {
    return '近30分钟';
  }

  // 近1小时: 1小时的持续时间
  if (Math.abs(duration - 60 * 60 * 1000) < tolerance) {
    return '近1小时';
  }

  // 今天/昨天: 都是从某天开始到某天结束（约24小时）
  // 需要通过判断 startDate 是哪一天来区分
  const dayDuration = 24 * 60 * 60 * 1000 - 1; // endOfDay - startOfDay 的差值
  if (Math.abs(duration - dayDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();

    // 今天
    if (startDate.toDateString() === today.toDateString()) {
      return '今天';
    }

    // 昨天
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (startDate.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
  }

  // 近7天: 7天的持续时间（从6天前到今天）
  const sevenDaysDuration = 7 * 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - sevenDaysDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    const sixDaysAgo = startOfDay(subDays(today, 6));
    if (startDate.toDateString() === sixDaysAgo.toDateString()) {
      return '近7天';
    }
  }

  return null;
};

// 判断是否属于 ykShortcuts
// 返回 key 或 null
export const timeRangeToYkShortcuts = (timeStart: number, timeEnd: number): null | string => {
  const duration = timeEnd - timeStart;
  const tolerance = 60 * 1000; // 1分钟误差

  // 今天: 约24小时
  const dayDuration = 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - dayDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    if (startDate.toDateString() === today.toDateString()) {
      return '今天';
    }
  }

  // 近三天: 约3天
  const threeDaysDuration = 3 * 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - threeDaysDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    const twoDaysAgo = startOfDay(subDays(today, 2));
    if (startDate.toDateString() === twoDaysAgo.toDateString()) {
      return '近三天';
    }
  }

  // 近一周: 约7天
  const sevenDaysDuration = 7 * 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - sevenDaysDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    const sixDaysAgo = startOfDay(subDays(today, 6));
    if (startDate.toDateString() === sixDaysAgo.toDateString()) {
      return '近一周';
    }
  }

  // 近一月: 约30天
  const monthDuration = 30 * 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - monthDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    const twentyNineDaysAgo = startOfDay(subDays(today, 29));
    if (startDate.toDateString() === twentyNineDaysAgo.toDateString()) {
      return '近一月';
    }
  }

  // 近一年: 约365天
  const yearDuration = 365 * 24 * 60 * 60 * 1000 - 1;
  if (Math.abs(duration - yearDuration) < tolerance) {
    const startDate = new Date(timeStart);
    const today = new Date();
    const threeHundredSixtyFourDaysAgo = startOfDay(subDays(today, 364));
    if (startDate.toDateString() === threeHundredSixtyFourDaysAgo.toDateString()) {
      return '近一年';
    }
  }

  return null;
};
