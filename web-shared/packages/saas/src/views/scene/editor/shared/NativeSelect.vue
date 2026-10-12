<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 选择器（基于 shadcn-ui Select / radix-vue）。
 * 保持原 NativeSelect 的 props API：modelValue / options / placeholder / disabled / widthClass / size。
 */
import { computed } from 'vue';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@vben-core/shadcn-ui';

interface Option {
  label: string;
  value: number | string;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue?: number | string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  /** 尺寸：sm=h-8  md=h-9（默认，与其他控件对齐） */
  size?: 'md' | 'sm';
  widthClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | string | undefined): void;
  (e: 'change', v: number | string | undefined): void;
}>();

/** radix Select 只接受 string，这里把 number 透明转换 */
const innerValue = computed<string | undefined>(() =>
  props.modelValue === undefined || props.modelValue === null
    ? undefined
    : String(props.modelValue),
);

function onUpdate(v: string) {
  const hit = props.options.find((o) => String(o.value) === v);
  const nv = hit ? hit.value : v === '' ? undefined : v;
  emit('update:modelValue', nv);
  emit('change', nv);
}

const sizeCls = computed(() => (props.size === 'sm' ? 'h-8 text-xs' : 'h-9'));

const selectedLabel = computed(() => {
  const hit = props.options.find(
    (o) => String(o.value) === String(props.modelValue),
  );
  return hit?.label || '';
});
</script>

<template>
  <Select
    :model-value="innerValue"
    :disabled="disabled"
    @update:model-value="onUpdate"
  >
    <SelectTrigger :class="[widthClass || 'w-full', sizeCls]">
      <SelectValue :placeholder="placeholder || $t('iotApp.av.pleaseSelect')">
        {{ selectedLabel }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="opt in options"
        :key="String(opt.value)"
        :value="String(opt.value)"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
