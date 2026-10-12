import type { Ref } from 'vue';

import type { FieldRenderDecision, FlowFieldPerm, FlowFieldSchema, FlowFormSchema, FlowRenderMode } from './types';

import { computed } from 'vue';

/**
 * 文件说明：FormRenderer — useFormRender 组合式函数。
 * 职责：
 * 1. 由 form_schema.fields 动态生成 Zod 校验 schema（required + rules 桥接）；
 * 2. 接管 vee-validate useForm，提供 values 读写、整体 validate；
 * 3. 计算「模式 × 字段级权限」的渲染决策（visible/editable）。
 * 调用方（form-renderer.vue）在 setup 内使用；fields 变化场景由调用方
 * 通过组件 :key 重建保证（vee-validate 动态字段的最简可靠方案）。
 */
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { z } from 'zod';

/**
 * resolveFieldDecision 计算单个字段的渲染决策。
 * - readonly 模式：全部只读可见（hidden 依旧隐藏，避免敏感字段在只读视图泄露）；
 * - edit 模式：字段权限 editable → 可编辑；readonly/hidden → 不渲染或只读；
 *   未配置权限（无 formPermissions，如发起人填表场景）→ 默认可编辑。
 */
export function resolveFieldDecision(
  field: FlowFieldSchema,
  mode: FlowRenderMode,
  permMap: Map<string, FlowFieldPerm['perm']>,
  fallbackPerm: FlowFieldPerm['perm'] = 'readonly',
): FieldRenderDecision {
  const perm = permMap.get(field.key) ?? fallbackPerm;
  if (perm === 'hidden') {
    return { visible: false, editable: false };
  }
  if (mode === 'readonly') {
    return { visible: true, editable: false };
  }
  return { visible: true, editable: perm === 'editable' };
}

/**
 * buildZodSchema 由字段列表生成 Zod 对象 schema。
 * 规则桥接口径：
 * - required：多值组件（数组）min(1)；数值组件非空且非 NaN；文本组件 trim 后非空；
 * - rules.type=min/max：数值组件约束数值范围；文本组件约束长度；空值跳过（交给 required）。
 */
export function buildZodSchema(fields: FlowFieldSchema[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    const isMultiValue =
      field.component === 'checkbox' ||
      field.component === 'range' ||
      ((field.component === 'user' || field.component === 'dept' || field.component === 'upload') && field.componentProps?.multiple === true);
    const isNumber = field.component === 'number' || field.component === 'rate' || field.component === 'slider';

    let base: z.ZodTypeAny;
    base = isMultiValue ? z.array(z.any()) : z.any();

    const requiredMessage = `${field.label}为必填项`;
    if (field.required) {
      if (isMultiValue) {
        base = z.array(z.any()).min(1, requiredMessage);
      } else if (isNumber) {
        base = z.any().refine((v) => v !== '' && v !== undefined && v !== null && !Number.isNaN(Number(v)), requiredMessage);
      } else {
        base = z.any().refine((v) => String(v ?? '').trim().length > 0, requiredMessage);
      }
    }

    // rules 逐条桥接（仅 min/max 有明确语义；其余类型预留）
    for (const rule of field.rules ?? []) {
      if (rule.type !== 'min' && rule.type !== 'max') continue;
      const bound = Number(rule.value);
      if (Number.isNaN(bound)) continue;
      const message = rule.message ?? `${field.label}${rule.type === 'min' ? '不能小于' : '不能大于'} ${rule.value}`;
      if (isNumber) {
        base = z.any().refine((v) => {
          const n = Number(v);
          if (v === '' || v === undefined || v === null || Number.isNaN(n)) return true; // 空值交给 required
          return rule.type === 'min' ? n >= bound : n <= bound;
        }, message);
      } else if (!isMultiValue) {
        base = z.any().refine((v) => {
          const s = String(v ?? '');
          if (s.length === 0) return true; // 空值交给 required
          return rule.type === 'min' ? s.length >= bound : s.length <= bound;
        }, message);
      }
    }

    shape[field.key] = base;
  }
  // passthrough：表单值可能含 schema 外的历史变量，校验时不丢弃
  return z.object(shape).passthrough();
}

export interface UseFormRenderOptions {
  /** 字段级权限（未配置字段默认 readonly） */
  formPermissions?: FlowFieldPerm[];
  /** 初始值（instance.variable 扁平对象） */
  initialValues?: Record<string, any>;
  /** 渲染模式 */
  mode: FlowRenderMode;
  /** 表单 schema */
  schema: FlowFormSchema;
}

/**
 * useFormRender 创建表单校验与权限决策上下文。
 * @returns form vee-validate 实例 / errors 字段错误 / validate 整体校验 /
 *          setValues 批量赋值 / getValues 读值 / visibleFields 参与渲染的字段
 */
export function useFormRender(options: UseFormRenderOptions) {
  const { schema, mode, formPermissions, initialValues } = options;

  // 字段权限映射（field → perm）
  const permMap = new Map<string, FlowFieldPerm['perm']>();
  for (const item of formPermissions ?? []) {
    permMap.set(item.field, item.perm);
  }

  const validationSchema = computed(() => toTypedSchema(buildZodSchema(schema.fields)));

  const form = useForm({
    validationSchema,
    initialValues: {
      ...Object.fromEntries(
        schema.fields.filter((field) => field.componentProps?.defaultValue !== undefined).map((field) => [field.key, field.componentProps?.defaultValue]),
      ),
      ...initialValues,
    },
    validateOnMount: false,
  });

  /** validate 整体校验，返回是否通过。 */
  async function validate(): Promise<boolean> {
    const { valid } = await form.validate();
    return valid;
  }

  /** setValues 批量赋值（详情回填 instance.variable）。 */
  function setValues(values: Record<string, any>) {
    form.setValues({ ...values });
  }

  /** getValues 读取当前表单值（扁平对象）。 */
  function getValues(): Record<string, any> {
    return { ...form.values };
  }

  /** visibleFields 按权限过滤后的渲染字段列表。 */
  const visibleFields: Ref<FlowFieldSchema[]> = computed(() => schema.fields.filter((f) => resolveFieldDecision(f, mode, permMap).visible));

  /** editable 整体是否可编辑（readonly 模式恒 false）。 */
  const editable = mode === 'edit';

  return {
    form,
    errors: form.errors,
    validate,
    setValues,
    getValues,
    visibleFields,
    editable,
    permMap,
  };
}
