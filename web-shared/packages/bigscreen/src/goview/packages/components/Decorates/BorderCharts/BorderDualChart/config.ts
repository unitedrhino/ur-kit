import type { ConfigType, CreateComponentType } from '@/packages/index.type';

import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';
import { PublicConfigClass } from '@/packages/public';
import { chartInitConfig } from '@/settings/designSetting';
import cloneDeep from 'lodash/cloneDeep';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type';

export const BorderDualChartConfig: ConfigType = {
  key: 'BorderDualChart',
  chartKey: 'VBorderDualChart',
  conKey: 'VCBorderDualChart',
  title: '边框-双图表',
  category: ChatCategoryEnum.BORDER_CHART,
  categoryName: ChatCategoryEnumName.BORDER_CHART,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMPOSITE,
  image: 'border04.png',
};

// 字重类型
export type FontWeightType = 'bold' | 'normal';

// 完整文字属性接口
export interface FontStyleOption {
  blurShadow: number;
  colorShadow: string;
  fontColor: string;
  fontSize: number;
  fontWeight: FontWeightType;
  hShadow: number;
  letterSpacing: number;
  showShadow: boolean;
  vShadow: number;
}

// 边框04专用配置
export interface Border04OptionType {
  backgroundColor: string;
  borderTitle: string;
  borderTitleColor: string;
  borderTitleHeight: number;
  borderTitleSize: number;
  borderTitleWidth: number;
  colors: string[];
  dur?: number;
}

// 单个图表配置
export interface SingleChartOptionType {
  chartType: 'bar' | 'line';
  color: string;
  dataset: {
    dimensions: string[];
    source: any[];
  };
  grid?: any;
  series: any[];
  title: string;
  xAxis?: any;
  yAxis?: any;
}

// 双图表字段映射配置
export interface DualChartFieldMappingType {
  bottomField: string; // 底部图表指标
  topField: string; // 顶部图表指标（name-value 格式时为 name 值，多列格式时为 dimension key）
}

// 双图表布局配置
export interface DualChartLayoutOptionType {
  bottomHeightPercent: number; // 底部图表高度百分比（默认50）
  showChartTitles: boolean; // 显示标题
  titleOption: FontStyleOption; // 标题样式
  topHeightPercent: number; // 顶部图表高度百分比（默认50）
  verticalGap: number; // 图表间距（默认20px）
}

// 默认顶部图表配置
const topChartOption: SingleChartOptionType = {
  chartType: 'bar',
  title: '进线功率 (kW)',
  color: '#4A9EF8FF',
  dataset: {
    dimensions: ['_timestamp', 'power'],
    source: [],
  },
  series: [
    {
      type: 'bar',
      encode: { x: '_timestamp', y: 'power' },
      itemStyle: { color: '#4A9EF8FF' },
    },
  ],
  xAxis: {
    type: 'time',
    axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
    axisLabel: { color: '#999' },
    axisTick: { show: true },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
    axisLabel: { color: '#999' },
    axisTick: { show: true },
    splitLine: { lineStyle: { color: '#333' } },
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '15%',
    bottom: '15%',
  },
};

// 默认底部图表配置
const bottomChartOption: SingleChartOptionType = {
  chartType: 'line',
  title: '功率趋势',
  color: '#52c41a',
  dataset: {
    dimensions: ['_timestamp', 'trend'],
    source: [],
  },
  series: [
    {
      type: 'line',
      encode: { x: '_timestamp', y: 'trend' },
      itemStyle: { color: '#52c41a' },
      smooth: true,
    },
  ],
  xAxis: {
    type: 'time',
    axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
    axisLabel: { color: '#999' },
    axisTick: { show: true },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: true, lineStyle: { color: '#B9B8CE', width: 1 } },
    axisLabel: { color: '#999' },
    axisTick: { show: true },
    splitLine: { lineStyle: { color: '#333' } },
  },
  grid: {
    left: '10%',
    right: '10%',
    top: '15%',
    bottom: '15%',
  },
};

// 默认布局配置
const layoutOption: DualChartLayoutOptionType = {
  topHeightPercent: 50,
  bottomHeightPercent: 50,
  verticalGap: 20,
  showChartTitles: true,
  titleOption: {
    fontSize: 16,
    fontColor: '#fff',
    fontWeight: 'normal',
    letterSpacing: 0,
    showShadow: false,
    hShadow: 0,
    vShadow: 0,
    blurShadow: 8,
    colorShadow: '#0075ff',
  },
};

// 默认边框配置
const borderOption: Border04OptionType = {
  borderTitle: '72小时进线功率',
  borderTitleWidth: 250,
  borderTitleHeight: 32,
  borderTitleSize: 18,
  borderTitleColor: '#fff',
  colors: ['#8aaafb', '#1f33a2'],
  backgroundColor: '#00000000',
  dur: 0.5,
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  // 设置更大的默认尺寸，双图表需要更多垂直空间
  public override attr = { ...chartInitConfig, w: 600, h: 500, zIndex: -1 };
  public chartConfig = cloneDeep(BorderDualChartConfig);
  public key = BorderDualChartConfig.key;
  public option = {
    // 边框配置（固定 Border04）
    borderKey: 'Border04',
    borderOption: cloneDeep(borderOption),
    // 顶部图表配置
    topChartOption: cloneDeep(topChartOption),
    // 底部图表配置
    bottomChartOption: cloneDeep(bottomChartOption),
    // 布局配置
    layoutOption: cloneDeep(layoutOption),
    // 字段映射配置（数据映射器使用）
    fieldMapping: {
      topField: '',
      bottomField: '',
    } as DualChartFieldMappingType,
    // 原始数据集占位（供映射器读取字段列表）
    dataset: {
      dimensions: [] as string[],
      source: [] as any[],
    },
    // 内边距
    padding: 20,
  };
}
