import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { PipelineHConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  color_type: 1,
  o_color: '#0a7ae2',
  i_color: '#119bfa',
  line_class: 'svg_ani_flow'
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = PipelineHConfig.key
  public override attr = { ...chartInitConfig, w: 500, h: 15, zIndex: -1 }
  public chartConfig = cloneDeep(PipelineHConfig)
  public option = cloneDeep(option)
}
