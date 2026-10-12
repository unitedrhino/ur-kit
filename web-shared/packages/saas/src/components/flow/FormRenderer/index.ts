/**
 * 文件说明：FormRenderer 通用审批表单渲染器导出入口。
 * 提供 FormRenderer 组件与配套类型；校验由内部 useFormRender（VeeValidate+Zod）承担。
 */
export { default as FormRenderer } from './form-renderer.vue';
export { default as DeptPickerField } from './pickers/dept-picker-field.vue';
export { default as UserPickerField } from './pickers/user-picker-field.vue';
export * from './types';
export { buildZodSchema, resolveFieldDecision, useFormRender } from './use-form-render';
export type { UseFormRenderOptions } from './use-form-render';
