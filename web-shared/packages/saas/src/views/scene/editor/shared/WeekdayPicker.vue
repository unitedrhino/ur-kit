<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/**
 * 星期选择（基于 shadcn ToggleGroup）。
 * 存储值为位图字符串数组，与旧协议 ProCheckboxGroup 一致。
 */
import { computed } from 'vue';

import { ToggleGroup, ToggleGroupItem } from '@vben-core/shadcn-ui';

const WEEKS: { label: string; value: string }[] = localizedSceneState(() => ([
  { label: $t('iotApp.av.weekday1'), value: '0000001' },
  { label: $t('iotApp.av.weekday2'), value: '0000010' },
  { label: $t('iotApp.av.weekday3'), value: '0000100' },
  { label: $t('iotApp.av.weekday4'), value: '0001000' },
  { label: $t('iotApp.av.weekday5'), value: '0010000' },
  { label: $t('iotApp.av.weekday6'), value: '0100000' },
  { label: $t('orgEnergy.ui.day'), value: '1000000' },
]));

const props = defineProps<{ modelValue?: string | string[] }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void;
}>();

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
    class="flex-wrap justify-start"
    @update:model-value="onUpdate"
  >
    <ToggleGroupItem
      v-for="w in WEEKS"
      :key="w.value"
      :value="w.value"
      class="size-9 px-0"
    >
      {{ w.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
