<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { TimeWindow } from '@vben/ur-hooks';

import { ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { timeHelper } from '@vben/ur-hooks';

// import { postThingsDeviceMsgPropertyAggIndex } from '#/api/v1/api';
import { format } from 'date-fns';
// @ts-ignore
import { findIndex } from 'lodash';
// import type { DeviceInfo } from '#/api/v1/models';

const { generateTimeWindows } = timeHelper();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// const props = defineProps<{
//   // dataIDs: string[];
//   // aggName: string;
//   // // date: number;

//   // timeStart: number;
//   // timeEnd: number;
//   // interval: number;
//   // intervalUnit: string;

//   // deviceInfo: DeviceInfo;
// }>();

const getDatas = async (
  dataIDs: string[],
  aggName: string,
  queryParams: {
    deviceName: string;
    interval: number;
    intervalUnit: string;
    productID: string;
    projectID: string;

    timeEnd: number;
    timeStart: number;
    xAxisData: string[];
  },
) => {
  const timeStartText = format(queryParams.timeStart, 'yyyy-MM-dd HH:mm:ss');
  const timeEndText = format(queryParams.timeEnd, 'yyyy-MM-dd HH:mm:ss');

  // 今日用能趋势 1 h
  const todayEpTrendsData = await ThingsApi.postApiV1ThingsDeviceMsgPropertyAggIndex({
    // productCategoryID: 7,

    projectID: queryParams.projectID,
    productID: queryParams.productID,
    deviceName: queryParams.deviceName,

    timeStart: queryParams.timeStart.toString(),
    // @ts-expect-error
    timeStartText,
    timeEnd: queryParams.timeEnd.toString(),
    timeEndText,
    debugText: `${dataIDs.join(',')}--${aggName}`,
    interval: queryParams.interval,
    intervalUnit: queryParams.intervalUnit,
    aggs: dataIDs.map((dataID) => ({
      dataID,
      argFuncs: [aggName],
    })),
  });

  // map by dataIDs
  const dataMap = new Map<string, number[]>();
  dataIDs.forEach((dataID) => {
    dataMap.set(dataID, []);
  });
  // console.log('dataMap ===================', dataMap);

  const timeWindowsOfToday = generateTimeWindows(queryParams.timeStart, queryParams.timeEnd, queryParams.interval, queryParams.intervalUnit);
  const timeWindowsMapOfToday = new Map<string, TimeWindow>();
  timeWindowsOfToday.forEach((timeWindow) => {
    timeWindowsMapOfToday.set(timeWindow.timeStart.toString(), timeWindow);
  });
  // console.log('timeWindowsMapOfToday ===================', timeWindowsMapOfToday);

  dataIDs.forEach((dataID) => {
    timeWindowsMapOfToday.forEach((timeWindow) => {
      const todayIndex = findIndex(todayEpTrendsData.list[0]?.values, (item: any) => {
        return item.timeWindow === timeWindow.timeStart.toString() && item.dataID === dataID;
      });
      if (todayIndex === -1) {
        dataMap.get(dataID)?.push(null as any);
      } else {
        dataMap.get(dataID)?.push((todayEpTrendsData.list[0]?.values[todayIndex]?.values as any)?.[aggName]?.value);
        // todayData.push(
        //   (todayEpTrendsData.list[0]?.values[todayIndex]?.values as any)?.[
        //     aggName
        //   ]?.value,
        // );
      }
    });
  });
  renderEcharts({
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2 %',
    },
    series: [...dataMap.values()].map((item, index) => ({
      data: item,
      smooth: true,
      type: 'line',
      name: dataIDs[index],
    })),
    toolbox: {
      top: 10,
      right: 10,
      show: true,
      feature: {
        dataView: {
          // 数据视图
          show: true,
        },
        // restore: {
        //   //重置
        //   show: true,
        // },
        dataZoom: {
          // 数据缩放视图
          show: true,
        },
        saveAsImage: {
          // 保存图片
          show: true,
        },
        magicType: {
          // 动态类型切换
          type: ['bar', 'line'],
        },
      },
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      },
      trigger: 'axis',
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      boundaryGap: false,
      data: queryParams.xAxisData,
      splitLine: {
        lineStyle: {
          type: 'solid',
          width: 1,
        },
        show: true,
      },
      type: 'category',
    },
    yAxis: [
      {
        axisTick: {
          show: false,
        },
        // max: 8000,
        splitArea: {
          show: true,
        },
        splitNumber: 4,
        type: 'value',
      },
    ],
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
    ],
  });
};

defineExpose({
  getDatas,
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
