import { $t as editorT } from '@vben/saas/locales';
/**
 * 自定义组件分类选项
 * 用于组件保存弹窗（EncapsulationModal）和组件编辑模式右侧面板
 */
export const COMPONENT_CATEGORY_OPTIONS = [
  { /** 当前语言的分类名称，分类标识保持原值。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.metricCategory'); }, value: 'Metrics' },
  { /** 当前语言的分类名称，分类标识保持原值。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.statusCategory'); }, value: 'Status' },
  { /** 当前语言的分类名称，分类标识保持原值。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.comparisonCategory'); }, value: 'Compare' },
  { /** 当前语言的分类名称，分类标识保持原值。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.generalCategory'); }, value: 'Common' },
  { /** 当前语言的分类名称，分类标识保持原值。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.containerLayout'); }, value: 'Container' },
  { /** 当前语言的自定义分类名称。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('iotApp.productPage.custom'); }, value: 'custom' },
] as const;
