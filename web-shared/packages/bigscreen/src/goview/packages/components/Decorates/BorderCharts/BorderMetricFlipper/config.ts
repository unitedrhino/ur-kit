import type { CreateComponentType } from '@/packages/index.type'
import { type ConfigType, ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type'
import { PublicConfigClass } from '@/packages/public'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'
import cloneDeep from 'lodash/cloneDeep'

export const BorderMetricFlipperConfig: ConfigType = {
  key: 'BorderMetricFlipper',
  chartKey: 'VBorderMetricFlipper',
  conKey: 'VCBorderMetricFlipper',
  title: '边框-指标翻牌器',
  category: ChatCategoryEnum.BORDER_CHART,
  categoryName: ChatCategoryEnumName.BORDER_CHART,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMPOSITE,
  image: 'border04.png',
}

// 翻牌器类型
export type FlipType = 'down' | 'up'

// 字重类型
export type FontWeightType = 'normal' | 'bold'

// 主数字翻牌器配置
export interface MainValueOptionType {
  dataset: number | string
  flipperLength: number
  flipperBgColor: string
  flipperTextColor: string
  flipperWidth: number
  flipperHeight: number
  flipperRadius: number
  flipperGap: number
  flipperType: FlipType
  flipperSpeed: number
  flipperBorderWidth: number
}

// 完整文字属性接口
export interface FontStyleOption {
  fontSize: number
  fontColor: string
  fontWeight: FontWeightType
  letterSpacing: number
  showShadow: boolean
  hShadow: number
  vShadow: number
  blurShadow: number
  colorShadow: string
}

// 单位配置（完整文字属性 + 文本内容）
export interface UnitOptionType extends FontStyleOption {
  text: string
}

// 子指标数据类型
export interface SubMetricType {
  label: string
  value: number | string
  unit?: string
}

// 聚合数据源配置
export interface AggDataSourceConfig {
  enabled: boolean
  productCategoryID: number
  productID: string               // 产品ID（如 "66"），优先于品类
  deviceName: string              // 设备名称（如 "1AL1"）
  areaIDs: string[]               // 字符串数组
  dataID: string                  // 物模型属性标识符
  interval: number                // 聚合间隔
  intervalUnit: string            // 'd'|'h'|'m'|'s'|'n'|'w'|'y'
  timeRange: string               // '1d'|'7d'|'30d'
  aggFuncs: string[]              // ['avg','min','max','last']
  pollingInterval: number         // 秒
}

// 边框04专用配置
export interface Border04OptionType {
  borderTitle: string
  borderTitleWidth: number
  borderTitleHeight: number
  borderTitleSize: number
  borderTitleColor: string
  colors: string[]
  backgroundColor: string
  dur?: number
}

// 默认主数字翻牌器配置
const mainValueOption: MainValueOptionType = {
  dataset: 0,
  flipperLength: 6,
  flipperBgColor: '#16293E',
  flipperTextColor: '#4A9EF8FF',
  flipperWidth: 30,
  flipperHeight: 50,
  flipperRadius: 5,
  flipperGap: 10,
  flipperType: 'down',
  flipperSpeed: 450,
  flipperBorderWidth: 0,
}

// 默认单位配置（完整文字属性）
const unitOption: UnitOptionType = {
  text: 'Kw',
  fontSize: 18,
  fontColor: '#4A9EF8FF',
  fontWeight: 'normal',
  letterSpacing: 0,
  showShadow: false,
  hShadow: 0,
  vShadow: 0,
  blurShadow: 8,
  colorShadow: '#0075ff',
}

// 默认子指标标签配置（完整文字属性）
const subMetricLabelOption: FontStyleOption = {
  fontSize: 16,
  fontColor: '#aaa',
  fontWeight: 'normal',
  letterSpacing: 0,
  showShadow: false,
  hShadow: 0,
  vShadow: 0,
  blurShadow: 8,
  colorShadow: '#0075ff',
}

// 默认子指标数值配置（完整文字属性）
const subMetricValueOption: FontStyleOption = {
  fontSize: 24,
  fontColor: '#4A9EF8FF',
  fontWeight: 'bold',
  letterSpacing: 0,
  showShadow: false,
  hShadow: 0,
  vShadow: 0,
  blurShadow: 8,
  colorShadow: '#0075ff',
}

// 默认子指标数据
const subMetrics: SubMetricType[] = [
  { label: '最大', value: 0, unit: '' },
  { label: '最小', value: 0, unit: '' },
  { label: '平均', value: 0, unit: '' },
]

// 默认边框配置（Border04 专用）
const borderOption: Border04OptionType = {
  borderTitle: '日均统计',
  borderTitleWidth: 250,
  borderTitleHeight: 32,
  borderTitleSize: 18,
  borderTitleColor: '#fff',
  colors: ['#8aaafb', '#1f33a2'],
  backgroundColor: '#00000000',
  dur: 0.5,
}

// 默认聚合数据源配置
const aggDataSource: AggDataSourceConfig = {
  enabled: false,
  productCategoryID: 7,
  productID: '',
  deviceName: '',
  areaIDs: [],
  dataID: 'Ps',
  interval: 1,
  intervalUnit: 'd',
  timeRange: '1d',
  aggFuncs: ['avg', 'min', 'max', 'last'],
  pollingInterval: 60,
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = BorderMetricFlipperConfig.key
  public chartConfig = cloneDeep(BorderMetricFlipperConfig)
  public option = {
    // 聚合数据源
    aggDataSource: cloneDeep(aggDataSource),
    // 边框配置（固定 Border04）
    borderKey: 'Border04',
    borderOption: cloneDeep(borderOption),
    // 主数字翻牌器配置
    mainValueOption: cloneDeep(mainValueOption),
    // 单位配置（完整文字属性）
    unitOption: cloneDeep(unitOption),
    // 子指标数据
    subMetrics: cloneDeep(subMetrics),
    // 子指标标签配置（完整文字属性）
    subMetricLabelOption: cloneDeep(subMetricLabelOption),
    // 子指标数值配置（完整文字属性）
    subMetricValueOption: cloneDeep(subMetricValueOption),
    // 布局配置
    padding: 20,
  }
}
