import type { createProForm } from 'pro-naive-ui';

import type { PropertyAffordance, EventAffordance, ActionAffordance } from './schema-types';

/**
 * 物模型表单数据结构
 *
 * 与 API 结构对应，affordance 在表单中为对象形态，提交时由 utils.transformFormData 转为 JSON 字符串
 */
export interface AffordanceFormData {
  type: number; // 1 属性 2 事件 3 行为
  name: string;
  identifier: string;
  desc: string;
  order: number;
  extendConfig: string;
  funcGroup: number; // 1 普通功能 2 系统功能
  isCanSceneLinkage: number; // 1 是 2 否
  affordance?: PropertyAffordance | EventAffordance | ActionAffordance;
}

/** ProForm 实例类型，用于 AffordanceForm 的 form prop */
export type AffordanceFormInstance = ReturnType<typeof createProForm<AffordanceFormData>>;

/** 从参数生成 API 返回的 schema 项 */
export interface SchemaGenItem {
  affordance: string;
  identifier: string;
  /** 功能名称，用户可在预览编辑阶段修改，未填写时回退到 identifier */
  name?: string;
}
