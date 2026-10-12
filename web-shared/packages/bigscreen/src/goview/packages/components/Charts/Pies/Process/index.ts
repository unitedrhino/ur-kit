/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
// 公共类型声明
import { type ConfigType, PackagesCategoryEnum } from '@/packages/index.type'
// 当前[信息模块]分类声明
import { ChatCategoryEnum,ChatCategoryEnumName } from '../../index.type'

export const ProcessConfig: ConfigType = {
  // 唯一key
  key: 'Process',
  // 图表组件渲染 Components 格式: V + key
  chartKey: 'VProcess',
  // 配置组件渲染 Components 格式: VC + key
  conKey: 'VCProcess',
  // 名称
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentNaiveUIProgress'); },
  // 子分类目录
  category: ChatCategoryEnum.PIE,
  // 子分类目录
  categoryName: ChatCategoryEnumName.PIE,
  // 包分类
  package: PackagesCategoryEnum.CHARTS,
  // 图片
  image: 'process.png'
}
