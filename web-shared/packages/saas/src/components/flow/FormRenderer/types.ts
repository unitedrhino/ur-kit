/**
 * 文件说明：FormRenderer 通用审批表单渲染器 — 类型定义。
 * form_schema 结构遵循《流程审批中心/设计方案.md》2.6（评审定稿契约），
 * console 侧临时类型层（apps/console/src/api/flow/types.ts）与本文件结构一致，
 * SDK 生成后统一收敛到 codegen 类型。
 */

/** 表单组件枚举（camelCase，与后端 form_schema.component 一致） */
export type FlowFormComponent =
  | 'cascader'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'dept'
  | 'dict'
  | 'input'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'rate'
  | 'select'
  | 'slider'
  | 'switch'
  | 'text'
  | 'textarea'
  | 'time'
  | 'transfer'
  | 'upload'
  | 'user';

/** 校验规则（渲染器经 VeeValidate+Zod 桥接；服务端仅校验 required 级） */
export interface FlowFieldRule {
  /** 提示文案（可选，缺省生成默认文案） */
  message?: string;
  /** 规则类型：min / max（数值或字符串长度按组件类型解释）等 */
  type: string;
  /** 规则值 */
  value?: number | string;
}

/** select/radio/checkbox 的选项 */
export interface FlowFieldOption {
  label: string;
  /** 选项值一律字符串（仓库 Select 值规范） */
  value: string;
}

/** 表单字段 schema（form_schema.fields[] 条目） */
export interface FlowFieldSchema {
  /** 渲染组件 */
  component: FlowFormComponent;
  /** 组件属性（placeholder/options/multiple/min/maxLength 等，按组件类型） */
  componentProps?: {
    /** 其余组件原生属性透传 */
    [key: string]: any;
    max?: number;
    /** 输入类 maxLength */
    maxLength?: number;
    /** number/date 的 min/max */
    min?: number;
    /** user/dept/upload 是否多选（值变数组） */
    multiple?: boolean;
    /** select/radio/checkbox/dict 选项列表 */
    options?: FlowFieldOption[];
    /** 占位文案 */
    placeholder?: string;
  };
  /** 字段帮助说明。 */
  description?: string;
  /** 字段标识：camelCase、模板内唯一；即条件表达式 field 与 instance.variable 的键 */
  key: string;
  /** 字段显示名 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 校验规则 */
  rules?: FlowFieldRule[];
  /** 表单栅格宽度：12 半行 / 24 整行。 */
  span?: 12 | 24;
}

/** 表单 schema（唯一契约格式） */
export interface FlowFormSchema {
  /** 表单说明（设计器"表单配置"维护，渲染在表单顶部） */
  description?: string;
  /** 字段列表（有序） */
  fields: FlowFieldSchema[];
  /** 表单名称（冗余） */
  name?: string;
}

/** 字段级表单权限条目（节点 extendConfig.formPermissions 计算结果） */
export interface FlowFieldPerm {
  /** 字段 key（对应 fields[].key） */
  field: string;
  /** editable 可编辑 / readonly 只读 / hidden 隐藏（未配置字段默认 readonly） */
  perm: 'editable' | 'hidden' | 'readonly';
}

/** 渲染模式：edit 可编辑（按字段权限收敛）/ readonly 全只读（如审批详情只读单据） */
export type FlowRenderMode = 'edit' | 'readonly';

/** 字段的最终渲染决策（权限 × 模式 计算结果） */
export interface FieldRenderDecision {
  /** 是否可编辑 */
  editable: boolean;
  /** 是否渲染（hidden 过滤） */
  visible: boolean;
}
