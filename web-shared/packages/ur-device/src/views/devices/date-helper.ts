export const dateRangeToIntervalParams = (dateRange: [number, number]) => {
  const [startTime, endTime] = dateRange;
  const duration = endTime - startTime;
  const durationInMs = duration;
  const durationInSeconds = durationInMs / 1000;
  const durationInMinutes = durationInSeconds / 60;
  const durationInHours = durationInMinutes / 60;
  const durationInDays = durationInHours / 24;
  // const durationInWeeks = durationInDays / 7;
  const durationInMonths = durationInDays / 30;
  const durationInYears = durationInDays / 365;

  // 根据时间跨度选择合适的间隔单位
  let interval: number;
  let intervalUnit: string;

  if (durationInYears >= 1) {
    // 超过1年，使用月为单位
    interval = Math.max(1, Math.round(durationInMonths / 12));
    intervalUnit = 'n'; // 月
  } else if (durationInMonths >= 1) {
    // 超过1个月，使用天为单位
    // interval = Math.max(1, Math.round(durationInDays / 30));
    // interval 固定1
    interval = 1;
    intervalUnit = 'd'; // 天
  } else if (durationInDays >= 1) {
    // 超过1天，使用天为单位
    // interval = Math.max(1, Math.round(durationInDays / 30));
    // interval 固定1
    interval = 1;
    intervalUnit = 'd'; // 天
  } else if (durationInHours >= 12) {
    // 超过12个小时，按小时分
    interval = 1;
    intervalUnit = 'h'; // 小时
  } else if (durationInHours >= 1) {
    // 超过1小时，使用分钟为单位
    interval = Math.max(1, Math.round(durationInMinutes / 60));
    intervalUnit = 'm'; // 分钟
  } else {
    // 小于1小时，最小使用分钟为单位
    interval = 1;
    intervalUnit = 'm'; // 分钟
  }

  // 生成 xAxis 数据
  const xAxisData = generateXAxisData(startTime, endTime, interval, intervalUnit);

  return {
    interval,
    intervalUnit,
    xAxisData,
  };
};

/**
 * 根据时间范围和间隔生成 xAxis 数据
 */
export const generateXAxisData = (startTime: number, endTime: number, interval: number, intervalUnit: string): string[] => {
  const data: string[] = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    const date = new Date(currentTime);
    let label: string;

    switch (intervalUnit) {
      case 'd': {
        // 天
        label = `${date.getDate()}号`;
        break;
      }
      case 'h': {
        // 小时
        label = `${date.getHours()}:00`;
        break;
      }
      case 'm': {
        // 分钟
        const minutes = date.getMinutes().toString().padStart(2, '0');
        label = `${date.getHours()}:${minutes}`;
        break;
      }
      case 'n': {
        // 月
        label = `${date.getMonth() + 1}月`;
        break;
      }
      case 's': {
        // 秒
        const seconds = date.getSeconds().toString().padStart(2, '0');
        label = `${date.getMinutes()}:${seconds}`;
        break;
      }
      case 'w': {
        // 周
        label = `第${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}周`;
        break;
      }
      case 'y': {
        // 年
        label = `${date.getFullYear()}年`;
        break;
      }
      default: {
        label = date.toLocaleString();
      }
    }

    data.push(label);

    // 计算下一个时间点
    switch (intervalUnit) {
      case 'd': {
        currentTime = new Date(currentTime + interval * 24 * 60 * 60 * 1000).getTime();
        break;
      }
      case 'h': {
        currentTime = new Date(currentTime + interval * 60 * 60 * 1000).getTime();
        break;
      }
      case 'm': {
        currentTime = new Date(currentTime + interval * 60 * 1000).getTime();
        break;
      }
      case 'n': {
        currentTime = new Date(date.getFullYear(), date.getMonth() + interval, date.getDate()).getTime();
        break;
      }
      case 's': {
        currentTime = new Date(currentTime + interval * 1000).getTime();
        break;
      }
      case 'w': {
        currentTime = new Date(currentTime + interval * 7 * 24 * 60 * 60 * 1000).getTime();
        break;
      }
      case 'y': {
        currentTime = new Date(date.getFullYear() + interval, date.getMonth(), date.getDate()).getTime();
        break;
      }
      default: {
        currentTime = new Date(currentTime + interval * 60 * 1000).getTime();
      } // 默认按分钟
    }
  }

  return data;
};
