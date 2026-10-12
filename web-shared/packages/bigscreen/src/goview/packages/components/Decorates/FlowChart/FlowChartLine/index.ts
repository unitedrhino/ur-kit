/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { type ConfigType, PackagesCategoryEnum, ChartFrameEnum } from '@/packages/index.type'
import { ChatCategoryEnum,ChatCategoryEnumName } from '../../index.type'

export const FlowChartLineConfig: ConfigType = {
    key: 'FlowChartLine',
    chartKey: 'VFlowChartLine',
    conKey: 'VCFlowChartLine',
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.componentFlowLine'); },
    category: ChatCategoryEnum.FlowChart,
    categoryName: ChatCategoryEnumName.FlowChart,
    package: PackagesCategoryEnum.DECORATES,
    chartFrame: ChartFrameEnum.STATIC,
    image: 'flow-zhexian.png'
}
