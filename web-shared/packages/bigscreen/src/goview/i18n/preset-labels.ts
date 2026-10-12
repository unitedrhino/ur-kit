/** 文件说明：预置组件分类的展示翻译，分类标识与用户自定义名称保持原值。 */
import { $t } from '@vben/saas/locales';

/** 分类枚举的展示键；仅用于组件选择器，不参与数据序列化。 */
const categoryLocaleKeys: Record<string, string> = {
  "柱状图": "aiChat.ui.barChart",
  "饼图": "aiChat.ui.pieChart",
  "折线图": "aiChat.ui.lineChart",
  "散点图": "bigscreenEditor.ui.componentScatterChart",
  "地图": "bigscreenManagement.ui.definitionMaps",
  "组合图": "bigscreenEditor.ui.combinedCharts",
  "更多": "console.common.more",
  "其他": "orgManage.opLog.actionOther",
  "边框": "bigscreenEditor.ui.componentBorder",
  "装饰": "bigscreenManagement.ui.definitionDecorations",
  "流程": "orgManage.flow.process",
  "三维": "bigscreenEditor.ui.threeDimensional",
  "复合组件": "bigscreenEditor.ui.compositeComponents",
  "动画": "bigscreenEditor.ui.animation",
  "通用": "iotApp.dataFlow.scopeCommon",
  "天气": "scene.ui.weather",
  "默认": "orgManage.flow.defaultBadge",
  "文本": "bigscreenManagement.ui.text",
  "标题": "orgManage.approve.colTitle",
  "控件": "bigscreenEditor.ui.controls",
  "按钮": "iotApp.menu.typeButton",
  "资源库": "bigscreenEditor.ui.assetLibrary",
  "本地": "orgPark.ui.local",
  "表格": "orgManage.memory.viewTable"
};

/** presetCategoryLabel 将预置分类名映射为当前语言；未知名称原样返回。 */
export function presetCategoryLabel(name: string): string {
  const key = categoryLocaleKeys[name];
  return key ? $t(key) : name;
}
