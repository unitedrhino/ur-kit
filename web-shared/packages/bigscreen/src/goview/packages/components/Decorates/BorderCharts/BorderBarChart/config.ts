import type { CreateComponentType } from '@/packages/index.type'
import { type ConfigType, ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type'
import { echartOptionProfixHandle, PublicConfigClass } from '@/packages/public'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'
import cloneDeep from 'lodash/cloneDeep'

export const BorderBarChartConfig: ConfigType = {
  key: 'BorderBarChart',
  chartKey: 'VBorderChartBase',
  conKey: 'VCBorderChartBase',
  title: '边框-柱状图',
  category: ChatCategoryEnum.BORDER_CHART,
  categoryName: ChatCategoryEnumName.BORDER_CHART,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMPOSITE,
  image: 'border01.png',
}

// 基础 chartOption（与基础组件 BarCommon 保持一致）
const seriesItem = {
  type: 'bar',
  barWidth: 15,
  label: {
    show: true,
    position: 'top',
    color: '#fff',
    fontSize: 12
  },
  itemStyle: {
    color: null,
    borderRadius: 2
  }
}

const chartOptionBase = {
  tooltip: {
    show: true,
    trigger: 'axis',
    axisPointer: {
      show: true,
      type: 'shadow'
    }
  },
  grid: {
    left: '5%',
    right: '5%',
    top: '15%',
    bottom: '5%',
    containLabel: true
  },
  xAxis: {
    show: true,
    type: 'category',
    axisLine: {
      show: true,
      lineStyle: {
        color: '#B9B8CE',
        width: 1
      },
      onZero: false
    },
    axisTick: {
      show: true,
      length: 5
    },
    splitLine: {
      show: false
    }
  },
  yAxis: {
    show: true,
    type: 'value',
    axisLine: {
      show: true,
      lineStyle: {
        color: '#B9B8CE',
        width: 1
      }
    },
    axisTick: {
      show: true,
      length: 5
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#484753',
        width: 1,
        type: 'solid'
      }
    }
  },
  dataset: {
    dimensions: ['product', 'data1', 'data2'],
    source: [
      { product: 'Mon', data1: 120, data2: 130 },
      { product: 'Tue', data1: 200, data2: 210 },
      { product: 'Wed', data1: 150, data2: 160 },
      { product: 'Thu', data1: 80, data2: 90 },
      { product: 'Fri', data1: 70, data2: 75 },
      { product: 'Sat', data1: 110, data2: 120 },
      { product: 'Sun', data1: 130, data2: 135 },
    ],
  },
  series: [seriesItem, seriesItem],
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = BorderBarChartConfig.key
  public chartConfig = cloneDeep(BorderBarChartConfig)
  public option = {
    borderKey: 'Border01',
    borderOption: {
      dur: 0.5,
      colors: ['#4fd2dd', '#235fa7'],
      backgroundColor: '#00000000',
      // 标题配置
      borderTitle: {
        show: false,
        text: '标题',
        position: 'center',  // left/center/right
        fontSize: 18,
        fontColor: '#fff',
        fontWeight: 'normal',
        letterSpacing: 0,
        top: 20,        // 距离顶部距离(px)
        sideOffset: 20, // 左/右偏移量(px)
      },
    },
    chartKey: 'BarCommon',
    chartFrame: ChartFrameEnum.ECHARTS,
    // 使用 echartOptionProfixHandle，includes 与 BarCommon 一致，确保 grid/legend 等属性完整
    chartOption: echartOptionProfixHandle(chartOptionBase, ['legend', 'xAxis', 'yAxis', 'grid']),
    padding: 16,
  }
}
