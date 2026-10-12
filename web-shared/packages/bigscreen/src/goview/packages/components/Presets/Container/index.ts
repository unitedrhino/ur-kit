/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { ConfigType } from '@/packages/index.type'
import { PackagesCategoryEnum } from '@/packages/index.type'
import BorderContainerConfig from './BorderContainer/config'
import { PresetCategoryEnum, PresetCategoryNameEnum } from '../index.type'

const containerInstance = new BorderContainerConfig()

export const PresetBorderContainerConfig: ConfigType = {
  ...containerInstance,
  // Config 类实例的 chartKey/conKey 位于 chartConfig 上，此处提升到顶层以满足组件注册
  chartKey: containerInstance.chartConfig.chartKey,
  conKey: containerInstance.chartConfig.conKey,
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentEmptyBorderContainer'); },
  category: PresetCategoryEnum.CONTAINER,
  categoryName: PresetCategoryNameEnum.CONTAINER,
  package: PackagesCategoryEnum.PRESETS,
  image: 'border01.png',
  redirectComponent: 'Presets/Container/BorderContainer',
}

export default [PresetBorderContainerConfig]
