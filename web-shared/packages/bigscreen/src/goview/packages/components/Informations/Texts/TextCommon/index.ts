/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum,ChatCategoryEnumName } from '../../index.type'

export const TextCommonConfig: ConfigType = {
  key: 'TextCommon',
  chartKey: 'VTextCommon',
  conKey: 'VCTextCommon',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('orgManage.session.chText'); },
  category: ChatCategoryEnum.TEXT,
  categoryName: ChatCategoryEnumName.TEXT,
  package: PackagesCategoryEnum.INFORMATIONS,
  chartFrame: ChartFrameEnum.COMMON,
  image: 'text_static.png'
}
