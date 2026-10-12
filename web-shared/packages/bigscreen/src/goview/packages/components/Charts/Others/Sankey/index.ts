/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

export const SankeyConfig: ConfigType = {
  key: 'Sankey',
  chartKey: 'VSankey',
  conKey: 'VCSankey',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentSankeyChart'); },
  category: ChatCategoryEnum.OTHER,
  categoryName: ChatCategoryEnumName.OTHER,
  package: PackagesCategoryEnum.CHARTS,
  chartFrame: ChartFrameEnum.COMMON,
  image: 'sankey.png'
}
