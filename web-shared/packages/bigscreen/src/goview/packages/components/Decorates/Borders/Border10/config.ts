import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { Border10Config } from './index'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  colors: ['#1089ff', '#0000ff'],
  backgroundColor: '#00000000'
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = Border10Config.key
  public chartConfig = cloneDeep(Border10Config)
  public option = cloneDeep(option)
}
