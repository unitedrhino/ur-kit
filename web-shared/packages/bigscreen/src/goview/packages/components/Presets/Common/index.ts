/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type'
import { PackagesCategoryEnum } from '@/packages/index.type'
import BarChartConfig, { BorderBarChartConfig } from '../../Decorates/BorderCharts/BorderBarChart/config'
import { PresetCategoryEnum, PresetCategoryNameEnum } from '../index.type'

export const PresetBarChartConfig: ConfigType = {
  ...(new BarChartConfig()),
  // 补齐组件注册所需的画布/面板 key（Config 类实例不携带这两个字段）
  chartKey: BorderBarChartConfig.chartKey,
  conKey: BorderBarChartConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentGeneralChart'); },
  category: PresetCategoryEnum.COMMON,
  categoryName: PresetCategoryNameEnum.COMMON,
  package: PackagesCategoryEnum.PRESETS,
  image: 'border01.png',
  redirectComponent: 'Decorates/BorderCharts/BorderBarChart',
}

export default [PresetBarChartConfig]
