/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

export const IconConfig: ConfigType = {
  key: 'Icon',
  chartKey: 'VIcon',
  conKey: 'VCIcon',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('iotApp.menu.icon'); },
  category: ChatCategoryEnum.DEFAULT,
  categoryName: ChatCategoryEnumName.DEFAULT,
  package: PackagesCategoryEnum.ICONS,
  chartFrame: ChartFrameEnum.STATIC,
  image: 'icon.png'
}
