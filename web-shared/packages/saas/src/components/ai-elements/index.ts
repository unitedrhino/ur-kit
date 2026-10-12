/**
 * AI 元素组件库统一出口
 *
 * 组件源码取自 ai-elements-vue(Apache-2.0)registry 并做了本地化适配:
 * 基础件对齐 @vben-core/shadcn-ui,图标对齐 lucide-vue-next,cn 对齐 @vben-core/shared/utils。
 * 按需导出,未在业务中引用的组件不参与打包(tree-shaking)。
 */

export * from './code-block';
export * from './conversation';
export * from './loader';
export * from './message';
export * from './reasoning';
export * from './shimmer';
export * from './sources';
export * from './task';
export * from './tool';
export * from './types';
