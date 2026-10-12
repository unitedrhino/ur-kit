import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { FullScreenConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  border: 6,
  bgColor: '#84a5e9',
  borderColor: '#84a5e9'
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = FullScreenConfig.key
  public override attr = { ...chartInitConfig, w: 150, h: 150, zIndex: -1 }
  public chartConfig = cloneDeep(FullScreenConfig)
  public option = cloneDeep(option)
}
