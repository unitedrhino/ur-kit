/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type'
import { PackagesCategoryEnum } from '@/packages/index.type'
import RunningTimerConfig, { BorderRunningTimerConfig } from '../../Decorates/BorderCharts/BorderRunningTimer/config'
import MetricFlipperConfig, { BorderMetricFlipperConfig } from '../../Decorates/BorderCharts/BorderMetricFlipper/config'
import { PresetCategoryEnum, PresetCategoryNameEnum } from '../index.type'

export const PresetRunningTimerConfig: ConfigType = {
  ...(new RunningTimerConfig()),
  // 补齐组件注册所需的画布/面板 key（Config 类实例不携带这两个字段）
  chartKey: BorderRunningTimerConfig.chartKey,
  conKey: BorderRunningTimerConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.totalRuntime'); },
  category: PresetCategoryEnum.METRICS,
  categoryName: PresetCategoryNameEnum.METRICS,
  package: PackagesCategoryEnum.PRESETS,
  image: 'BorderRunningTimer01.png',
  redirectComponent: 'Decorates/BorderCharts/BorderRunningTimer',
}

export const PresetMetricFlipperConfig: ConfigType = {
  ...(new MetricFlipperConfig()),
  // 补齐组件注册所需的画布/面板 key（Config 类实例不携带这两个字段）
  chartKey: BorderMetricFlipperConfig.chartKey,
  conKey: BorderMetricFlipperConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.metricFlipCard'); },
  category: PresetCategoryEnum.METRICS,
  categoryName: PresetCategoryNameEnum.METRICS,
  package: PackagesCategoryEnum.PRESETS,
  image: 'BorderRunningTimer02.png',
  redirectComponent: 'Decorates/BorderCharts/BorderMetricFlipper',
}

export default [PresetRunningTimerConfig, PresetMetricFlipperConfig]
