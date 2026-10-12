import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { TextCommonConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'

export enum WritingModeEnum {
  HORIZONTAL = '水平',
  VERTICAL = '垂直'
}

export const WritingModeObject = {
  [WritingModeEnum.HORIZONTAL]: 'horizontal-tb',
  [WritingModeEnum.VERTICAL]: 'vertical-rl'
}

export enum FontWeightEnum {
  NORMAL = '常规',
  BOLD = '加粗',
}

export const FontWeightObject = {
  [FontWeightEnum.NORMAL]: 'normal',
  [FontWeightEnum.BOLD]: 'bold',
}

export const option = {
  link: '',
  linkHead: 'http://',
  dataset: '我是文本',
  fontSize: 20,
  fontColor: '#ffffff',
  paddingX: 10,
  paddingY: 10,
  textAlign: 'center', // 水平对齐方式
  fontWeight: 'normal',

  // 边框
  borderWidth: 0,
  borderColor: '#ffffff',
  borderRadius: 5,

  // 字间距
  letterSpacing: 5,
  writingMode: 'horizontal-tb',
  backgroundColor: '#00000000',

  // 数值格式化（组态扩展）
  format: {
    enabled: true,
    prefix: '',
    suffix: '',
    autoUnit: '',
    decimals: -1,        // -1 = 不处理
    useThousands: false, // 千分位开关（旧数据可能缺失该字段，缺失时等价 false）
  },

  // 条件样式（组态扩展）
  conditionalStyles: {
    enabled: false,
    rules: [] as Array<{
      id: string
      operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
      value: number
      color: string
    }>,
  },
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = TextCommonConfig.key
  public chartConfig = cloneDeep(TextCommonConfig)
  public option = cloneDeep(option)
}
