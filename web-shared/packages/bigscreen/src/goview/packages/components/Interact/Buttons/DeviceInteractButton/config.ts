import { PublicConfigClass } from '@/packages/public'
import type { CreateComponentType } from '@/packages/index.type'
import { chartInitConfig } from '@/settings/designSetting'
import { DeviceInteractBtnConfig } from './index'
import cloneDeep from 'lodash/cloneDeep'

export const option = {
  // 基础设备绑定
  productID: '',
  deviceName: '',
  deviceScope: 'single' as 'single' | 'area' | 'group' | 'all',
  areaID: '',
  groupID: '',
  interactType: 'property' as 'property' | 'action',
  dataIdentifier: '',

  // UI 形态
  uiMode: 'button' as 'button' | 'switch',

  // Button 形态
  btnText: '发送指令',
  params: '{}',

  // Switch 形态
  onText: '开',
  offText: '关',
  paramsOn: '{"switch": 1}',
  paramsOff: '{"switch": 0}',

  // 高级控制
  isAsync: false,
  shadowControl: 0,
}

export default class Config extends PublicConfigClass implements CreateComponentType {
  public key = DeviceInteractBtnConfig.key
  public override attr = { ...chartInitConfig, w: 150, h: 50, zIndex: -1 }
  public chartConfig = cloneDeep(DeviceInteractBtnConfig)
  public option = cloneDeep(option)
}
