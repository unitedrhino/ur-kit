import { echartOptionProfixHandle, PublicConfigClass } from '@/packages/public'
import { LineCommonConfig } from './index'
import type { CreateComponentType } from '@/packages/index.type'
import cloneDeep from 'lodash/cloneDeep'
import dataJson from './data.json'

export const includes = ['legend', 'xAxis', 'yAxis', 'grid']
export const seriesItem = {
  type: 'line',
  // 维度映射：dataset 维度变化时由组件按需写入
  encode: undefined as { x: string; y: string } | undefined,
  label: {
    show: true,
    position: 'top',
    color: '#fff',
    fontSize: 12
  },
  symbolSize: 5, //设定实心点的大小
  itemStyle: {
    color: null,
    borderRadius: 0
  },
  lineStyle: {
    type: 'solid',
    width: 3,
    color: null
  }
}

export const option = {
  tooltip: {
    show: true,
    trigger: 'axis',
    axisPointer: {
      type: 'line'
    }
  },
  xAxis: {
    show: true,
    type: 'category'
  },
  yAxis: {
    show: true,
    type: 'value'
  },
  dataset: { ...dataJson },
  series: [seriesItem, seriesItem]
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key: string = LineCommonConfig.key
  public chartConfig = cloneDeep(LineCommonConfig)
  // 图表配置项
  public option = echartOptionProfixHandle(option, includes)
}
