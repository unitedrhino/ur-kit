/**
 * 设备属性历史分析时间工具。
 *
 * 根据日期范围推导合理聚合间隔，并生成趋势图横轴标签。
 */

import { $t } from '@vben/locales';

/** dateRangeToIntervalParams 根据时间范围推导聚合间隔。 */
export function dateRangeToIntervalParams(dateRange: [number, number]) {
  const [startTime, endTime] = dateRange;
  const duration = endTime - startTime;
  const durationInMinutes = duration / 1000 / 60;
  const durationInHours = durationInMinutes / 60;
  const durationInDays = durationInHours / 24;
  const durationInMonths = durationInDays / 30;
  const durationInYears = durationInDays / 365;

  let interval: number;
  let intervalUnit: string;

  if (durationInYears >= 1) {
    interval = Math.max(1, Math.round(durationInMonths / 12));
    intervalUnit = 'n';
  } else if (durationInMonths >= 1 || durationInDays >= 1) {
    interval = 1;
    intervalUnit = 'd';
  } else if (durationInHours >= 12) {
    interval = 1;
    intervalUnit = 'h';
  } else if (durationInHours >= 1) {
    interval = Math.max(1, Math.round(durationInMinutes / 60));
    intervalUnit = 'm';
  } else {
    interval = 1;
    intervalUnit = 'm';
  }

  return {
    interval,
    intervalUnit,
    xAxisData: generateXAxisData(startTime, endTime, interval, intervalUnit),
  };
}

/** generateXAxisData 根据时间范围和间隔生成趋势图横轴标签。 */
export function generateXAxisData(startTime: number, endTime: number, interval: number, intervalUnit: string) {
  const data: string[] = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    const date = new Date(currentTime);
    let label: string;

    switch (intervalUnit) {
      case 'd': {
        label = $t('orgIotClient.deviceSpace.daySuffix', { day: date.getDate() });
        break;
      }
      case 'h': {
        label = `${date.getHours()}:00`;
        break;
      }
      case 'm': {
        label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        break;
      }
      case 'n': {
        label = $t('orgIotClient.deviceSpace.monthLabel', { month: date.getMonth() + 1 });
        break;
      }
      default: {
        label = date.toLocaleString();
      }
    }

    data.push(label);

    switch (intervalUnit) {
      case 'd': {
        currentTime += interval * 24 * 60 * 60 * 1000;
        break;
      }
      case 'h': {
        currentTime += interval * 60 * 60 * 1000;
        break;
      }
      case 'm': {
        currentTime += interval * 60 * 1000;
        break;
      }
      case 'n': {
        currentTime = new Date(date.getFullYear(), date.getMonth() + interval, date.getDate()).getTime();
        break;
      }
      default: {
        currentTime += interval * 60 * 1000;
      }
    }
  }

  return data;
}
