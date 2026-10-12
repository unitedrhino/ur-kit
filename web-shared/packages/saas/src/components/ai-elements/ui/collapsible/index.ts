/**
 * collapsible 基础件垫片
 *
 * vben 的 shadcn-ui 未移植 collapsible,radix-vue 已内置同款无头组件,
 * 此处按 shadcn 命名约定再导出,供 ai-elements 各折叠组件(Reasoning/Tool/Task/Sources)使用。
 */
export {
  CollapsibleContent,
  CollapsibleRoot as Collapsible,
  CollapsibleTrigger,
} from 'radix-vue';
