import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { ThreeEarth01Config } from './index'
import dataJson from './data.json'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  dataset: dataJson
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = ThreeEarth01Config.key
  public override attr = { ...chartInitConfig, w: 800, h: 800, zIndex: -1 }
  public chartConfig = cloneDeep(ThreeEarth01Config)
  public option = cloneDeep(option)
}
