<script setup lang="ts">
/**
 * 文件说明：告警管理统一下拉选择器
 * 基于新版 shadcn/Reka Select 封装业务常用的值映射和选项渲染。
 */
import type { HTMLAttributes } from 'vue';

import { computed, useAttrs } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';

defineOptions({ inheritAttrs: false });

/** AlarmSelectOption 描述告警下拉选项及其禁用状态。 */
export interface AlarmSelectOption {
  disabled?: boolean;
  label: string;
  value: number | string;
}

/** 组件属性支持原有数字或字符串枚举值，不改变业务模型。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
  disabled?: boolean;
  modelValue?: number | string;
  options: AlarmSelectOption[];
  placeholder?: string;
}>();

/** update:modelValue 返回选项定义中的原始值类型。 */
const emit = defineEmits<{
  'update:modelValue': [value: number | string];
}>();

/** attrs 透传 data-testid、aria-* 等原生属性到实际触发按钮。 */
const attrs = useAttrs();

/** EMPTY_OPTION_VALUE 避免将业务空字符串直接传给 Reka Select 的保留值。 */
const EMPTY_OPTION_VALUE = '__alarm_select_empty_value__';

/** toSelectValue 将业务值转换为 Reka Select 可接受的非空字符串。 */
function toSelectValue(value: number | string): string {
  return value === '' ? EMPTY_OPTION_VALUE : String(value);
}

/** onValueChange 将 Reka 的字符串值映射回业务选项的原始值。 */
function onValueChange(value: unknown) {
  if (typeof value !== 'string') return;
  const option = props.options.find((item) => toSelectValue(item.value) === value);
  if (option) emit('update:modelValue', option.value);
}

/** selectedLabel 收起态显示文本：始终按当前 options 实时解析。
 *  Reka SelectValue 的收起文本来自已注册选项的内部缓存，options 异步加载完成后不会自动刷新，
 *  会残留加载前的占位文案（如「xx（已失效）」），因此改为受控渲染。 */
const selectedLabel = computed(() => {
  const selectedValue = props.modelValue;
  if (selectedValue === undefined) return '';
  const hit = props.options.find((item) => toSelectValue(item.value) === toSelectValue(selectedValue));
  return hit?.label ?? '';
});
</script>

<template>
  <Select :disabled="disabled" :model-value="modelValue === undefined ? undefined : toSelectValue(modelValue)" @update:model-value="onValueChange">
    <SelectTrigger v-bind="attrs" :class="props.class">
      <SelectValue :placeholder="placeholder">{{ selectedLabel || placeholder }}</SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="String(option.value)" :disabled="option.disabled" :value="toSelectValue(option.value)">
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
