/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

export const Decorates03Config: ConfigType = {
  key: 'Decorates03',
  chartKey: 'VDecorates03',
  conKey: 'VCDecorates03',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentDecoration03'); },
  category: ChatCategoryEnum.DECORATE,
  categoryName: ChatCategoryEnumName.DECORATE,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.STATIC,
  image: 'decorates03.png'
}
