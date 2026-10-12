<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * 比较符 + 1~2 个值的编辑器。
 * btw / in 展示两个值，其他只展示一个。
 */
import { computed } from 'vue';
import { Input } from '@vben-core/shadcn-ui';
import NativeSelect from './NativeSelect.vue';
import FieldRow from './FieldRow.vue';
import type { CmpType } from '../../scene-types';

const props = defineProps<{
  termType?: CmpType;
  values?: string[];
  /** 是否展示 in（多值） */
  enableIn?: boolean;
  /** 是否展示 all（全部触发） */
  enableAll?: boolean;
  /** 值类型 */
  valueType?: 'text' | 'number';
}>();

const emit = defineEmits<{
  (e: 'update:termType', v: CmpType | undefined): void;
  (e: 'update:values', v: string[]): void;
}>();

const options = computed(() => {
  const base = [
    { label: $t('orgManage.flow.opEq'), value: 'eq' },
    { label: $t('orgManage.flow.opNe'), value: 'not' },
    { label: $t('orgManage.flow.opGt'), value: 'gt' },
    { label: $t('orgManage.flow.opGte'), value: 'gte' },
    { label: $t('orgManage.flow.opLt'), value: 'lt' },
    { label: $t('orgManage.flow.opLte'), value: 'lte' },
    { label: $t('scene.ui.betweenAAndB'), value: 'btw' },
  ];
  if (props.enableIn) base.push({ label: $t('scene.ui.amongMultipleValues'), value: 'in' });
  if (props.enableAll) base.push({ label: $t('scene.ui.triggerAll'), value: 'all' });
  return base;
});

function setValue(idx: number, v: string) {
  const next = [...(props.values || [])];
  next[idx] = v;
  emit('update:values', next);
}

const showSecond = computed(
  () => props.termType === 'btw' || props.termType === 'in',
);
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <FieldRow :label="$t('orgManage.cloneGroup.conditionPlaceholder')" required width-class="w-40">
      <NativeSelect
        :model-value="termType"
        :options="options"
        :placeholder="$t('scene.ui.selectComparisonOperator')"
        @update:model-value="(v) => emit('update:termType', v as CmpType)"
      />
    </FieldRow>
    <FieldRow v-if="termType !== 'all'" :label="$t('scene.ui.valueA')" required width-class="w-36">
      <Input
        :model-value="values?.[0] ?? ''"
        :type="valueType === 'number' ? 'number' : 'text'"
        class="h-9"
        @update:model-value="(v: any) => setValue(0, String(v ?? ''))"
      />
    </FieldRow>
    <FieldRow v-if="showSecond" :label="$t('scene.ui.valueB')" width-class="w-36">
      <Input
        :model-value="values?.[1] ?? ''"
        :type="valueType === 'number' ? 'number' : 'text'"
        class="h-9"
        @update:model-value="(v: any) => setValue(1, String(v ?? ''))"
      />
    </FieldRow>
  </div>
</template>
