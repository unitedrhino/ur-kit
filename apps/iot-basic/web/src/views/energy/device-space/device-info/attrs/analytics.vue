<!-- 属性历史趋势图：把聚合接口返回值渲染为 ECharts 折线图。 -->
<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { TimeWindow } from '@vben/ur-hooks';

import { ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { timeHelper } from '@vben/ur-hooks';

import { format } from 'date-fns';

import { DeviceInfoApi } from '../index.api';

const { generateTimeWindows } = timeHelper();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** getDatas 查询属性聚合数据并刷新趋势图。 */
async function getDatas(
  dataIDs: string[],
  aggName: string,
  queryParams: {
    deviceName: string;
    interval: number;
    intervalUnit: string;
    productID: string;
    projectID?: string;
    timeEnd: number;
    timeStart: number;
    xAxisData: string[];
  },
) {
  if (!queryParams.deviceName || !queryParams.productID) return;

  const response = await DeviceInfoApi.getPropertyAggList({
    aggs: dataIDs.map((dataID) => ({ argFuncs: [aggName], dataID })),
    debugText: `${dataIDs.join(',')}--${aggName}`,
    deviceName: queryParams.deviceName,
    interval: queryParams.interval,
    intervalUnit: queryParams.intervalUnit,
    productID: queryParams.productID,
    projectID: queryParams.projectID,
    timeEnd: queryParams.timeEnd.toString(),
    timeEndText: format(queryParams.timeEnd, 'yyyy-MM-dd HH:mm:ss'),
    timeStart: queryParams.timeStart.toString(),
    timeStartText: format(queryParams.timeStart, 'yyyy-MM-dd HH:mm:ss'),
  });

  const dataMap = new Map<string, Array<null | string | number>>();
  dataIDs.forEach((dataID) => dataMap.set(dataID, []));

  const timeWindows = generateTimeWindows(queryParams.timeStart, queryParams.timeEnd, queryParams.interval, queryParams.intervalUnit);
  const timeWindowsMap = new Map<string, TimeWindow>();
  timeWindows.forEach((timeWindow) => {
    const timeStart = timeWindow.timeStart;
    if (timeStart !== null && timeStart !== undefined) {
      timeWindowsMap.set(String(timeStart), timeWindow);
    }
  });

  dataIDs.forEach((dataID) => {
    timeWindowsMap.forEach((timeWindow) => {
      const values = response?.list?.[0]?.values ?? [];
      const matched = values.find((item: any) => item.timeWindow === timeWindow.timeStart.toString() && item.dataID === dataID);
      dataMap.get(dataID)?.push(matched?.values?.[aggName]?.value ?? null);
    });
  });

  renderEcharts({
    dataZoom: [
      {
        end: 100,
        show: true,
        start: 0,
        type: 'slider',
        xAxisIndex: [0],
      },
    ],
    grid: {
      bottom: 0,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: '2%',
    },
    series: [...dataMap.values()].map((item, index) => ({
      data: item,
      name: dataIDs[index],
      smooth: true,
      type: 'line',
    })),
    toolbox: {
      feature: {
        dataView: { show: true },
        dataZoom: { show: true },
        magicType: { type: ['bar', 'line'] },
        saveAsImage: { show: true },
      },
      right: 10,
      show: true,
      top: 10,
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
      axisTick: { show: false },
      boundaryGap: false,
      data: queryParams.xAxisData,
      splitLine: {
        lineStyle: { type: 'solid', width: 1 },
        show: true,
      },
      type: 'category',
    },
    yAxis: [
      {
        axisTick: { show: false },
        splitArea: { show: true },
        splitNumber: 4,
        type: 'value',
      },
    ],
  });
}

defineExpose({ getDatas });
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
