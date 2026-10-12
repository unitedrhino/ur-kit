/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type'
import { PackagesCategoryEnum } from '@/packages/index.type'
import DualChartConfig, { BorderDualChartConfig } from '../../Decorates/BorderCharts/BorderDualChart/config'
import { PresetCategoryEnum, PresetCategoryNameEnum } from '../index.type'

export const PresetDualChartConfig: ConfigType = {
  ...(new DualChartConfig()),
  // 补齐组件注册所需的画布/面板 key（Config 类实例不携带这两个字段）
  chartKey: BorderDualChartConfig.chartKey,
  conKey: BorderDualChartConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentDeviceComparisonAnalysis'); },
  category: PresetCategoryEnum.COMPARE,
  categoryName: PresetCategoryNameEnum.COMPARE,
  package: PackagesCategoryEnum.PRESETS,
  image: 'border04.png',
  redirectComponent: 'Decorates/BorderCharts/BorderDualChart',
}

export default [PresetDualChartConfig]
