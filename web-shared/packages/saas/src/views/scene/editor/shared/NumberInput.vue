<script setup lang="ts">
/**
 * 数字输入（基于 shadcn-ui NumberField / radix-vue）。
 * 对外保留简单的 v-model<number | undefined> + min/max/step/widthClass 接口。
 */
import { computed } from 'vue';

import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@vben-core/shadcn-ui';

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    widthClass?: string;
    disabled?: boolean;
  }>(),
  {
    step: 1,
    widthClass: 'w-full',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | undefined): void;
  (e: 'change'): void;
}>();

/** radix NumberField 使用 number | undefined，null 要转 undefined */
const innerValue = computed<number | undefined>(() =>
  props.modelValue === null ? undefined : (props.modelValue ?? undefined),
);

function onUpdate(v: number | undefined) {
  emit('update:modelValue', v);
  emit('change');
}
</script>

<template>
  <NumberField
    :model-value="innerValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :class="widthClass"
    @update:model-value="onUpdate"
  >
    <NumberFieldContent>
      <NumberFieldDecrement />
      <NumberFieldInput :placeholder="placeholder" />
      <NumberFieldIncrement />
    </NumberFieldContent>
  </NumberField>
</template>
