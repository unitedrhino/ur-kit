/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type'
import { PackagesCategoryEnum } from '@/packages/index.type'
import DeviceStatusConfig, { BorderDeviceStatusConfig } from '../../Decorates/BorderCharts/BorderDeviceStatus/config'
import { PresetCategoryEnum, PresetCategoryNameEnum } from '../index.type'

export const PresetDeviceStatusConfig: ConfigType = {
  ...(new DeviceStatusConfig()),
  // 补齐组件注册所需的画布/面板 key（Config 类实例不携带这两个字段）
  chartKey: BorderDeviceStatusConfig.chartKey,
  conKey: BorderDeviceStatusConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.productPage.deviceStatus'); },
  category: PresetCategoryEnum.STATUS,
  categoryName: PresetCategoryNameEnum.STATUS,
  package: PackagesCategoryEnum.PRESETS,
  image: 'ChartDataIoTDevice.png',
  redirectComponent: 'Decorates/BorderCharts/BorderDeviceStatus',
}

export default [PresetDeviceStatusConfig]
