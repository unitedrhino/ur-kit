/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

export const Border12Config: ConfigType = {
  key: 'Border12',
  chartKey: 'VBorder12',
  conKey: 'VCBorder12',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentBorder12'); },
  category: ChatCategoryEnum.BORDER,
  categoryName: ChatCategoryEnumName.BORDER,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.STATIC,
  image: 'border12.png'
}
