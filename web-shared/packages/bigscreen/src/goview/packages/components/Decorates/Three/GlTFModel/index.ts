/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type'

/** 3D 模型组件注册配置（GLTF/GLB 导入 + 节点点位绑定实时物模型数据） */
export const GlTFModelConfig: ConfigType = {
  key: 'GlTFModel',
  chartKey: 'VGlTFModel',
  conKey: 'VCGlTFModel',
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.component3DModel'); },
  category: ChatCategoryEnum.THREE,
  categoryName: ChatCategoryEnumName.THREE,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMMON,
  image: 'glTFModel.png'
}
