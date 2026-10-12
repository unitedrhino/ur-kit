<script setup lang="ts">
/**
 * 月份日期（1~31）多选，基于 shadcn ToggleGroup。
 */
import { computed } from 'vue';

import { ToggleGroup, ToggleGroupItem } from '@vben-core/shadcn-ui';

const DAYS: { label: string; value: string }[] = Array.from(
  { length: 31 },
  (_, i) => ({
    label: `${i + 1}`,
    value: '0'.repeat(30 - i) + '1' + '0'.repeat(i),
  }),
);

const props = defineProps<{ modelValue?: string | string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const selected = computed<string[]>(() => {
  const v = props.modelValue;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v) return v.split(',').filter(Boolean);
  return [];
});

function onUpdate(v: string[] | string) {
  emit('update:modelValue', Array.isArray(v) ? v : v ? [v] : []);
}
</script>

<template>
  <ToggleGroup
    type="multiple"
    variant="outline"
    size="default"
    :model-value="selected"
    class="grid grid-cols-7 gap-1.5"
    @update:model-value="onUpdate"
  >
    <ToggleGroupItem
      v-for="d in DAYS"
      :key="d.value"
      :value="d.value"
      class="size-9 px-0 text-xs"
    >
      {{ d.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
