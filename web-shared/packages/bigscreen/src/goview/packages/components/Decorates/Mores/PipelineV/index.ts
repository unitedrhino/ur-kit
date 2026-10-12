/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

export const PipelineVConfig: ConfigType = {
  key: 'PipelineV',
  chartKey: 'VPipelineV',
  conKey: 'VCPipelineV',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentPipeVertical'); },
  category: ChatCategoryEnum.MORE,
  categoryName: ChatCategoryEnumName.MORE,
  package: PackagesCategoryEnum.DECORATES,
  image: 'Pipeline_V.png'
}

