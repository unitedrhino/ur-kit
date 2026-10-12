/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
// 公共类型声明
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
// 当前[信息模块]分类声明
import { ChatCategoryEnum,ChatCategoryEnumName } from '../../index.type'

export const BarLineConfig: ConfigType = {
  key: 'BarLine',
  chartKey: 'VBarLine',
  conKey: 'VCBarLine',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentBarLineChart'); },
  category: ChatCategoryEnum.BAR,
  categoryName: ChatCategoryEnumName.BAR,
  package: PackagesCategoryEnum.CHARTS,
  chartFrame: ChartFrameEnum.ECHARTS,
  image: 'bar_line.png'
}