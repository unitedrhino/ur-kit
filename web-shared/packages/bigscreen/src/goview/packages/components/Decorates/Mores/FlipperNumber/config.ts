import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { FlipperNumberConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'
import { chartInitConfig } from '@/settings/designSetting'

export type FlipType = 'down' | 'up'

export interface OptionType {
  dataset: number | string
  displayDecimals: number
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

export const option: OptionType = {
  dataset: 3234,
  displayDecimals: 0,
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

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = FlipperNumberConfig.key
  public override attr = { ...chartInitConfig, w: 300, h: 100, zIndex: -1 }
  public chartConfig = cloneDeep(FlipperNumberConfig)
  public option = cloneDeep(option)
}
