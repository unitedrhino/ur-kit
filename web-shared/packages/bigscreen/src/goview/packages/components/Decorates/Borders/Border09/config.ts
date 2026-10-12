import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { Border09Config } from './index'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  colors: ['#3140ad', '#235fa7'],
  backgroundColor: '#00000000'
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = Border09Config.key
  public chartConfig = cloneDeep(Border09Config)
  public option = cloneDeep(option)
}
