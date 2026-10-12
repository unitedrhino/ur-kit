import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { ImageConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'
import logo from '@/assets/logo.png'

export const option = {
  // 图片路径
  dataset: logo,
  // 适应方式
  fit: 'contain',
  // 圆角
  borderRadius: 10,
  // 资源库 ID
  assetId: undefined,
  // 资源名称
  assetName: undefined,
  // 来源标识
  assetSource: undefined
}

export default class Config extends PublicConfigClass implements CreateComponentType
{
  public key = ImageConfig.key
  public chartConfig = cloneDeep(ImageConfig)
  public option = cloneDeep(option)
}
