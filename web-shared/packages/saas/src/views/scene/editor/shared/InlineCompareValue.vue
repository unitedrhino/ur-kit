<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * InlineCompareValue —— 面包屑内联的"比较符 + 值"组合。
 * 语句示意：
 *   - 大于 [50]
 *   - 在 [10] 和 [20] 之间
 *   - 等于 [on] / 等于 [off]
 *   - 在 [a,b,c] 之中（in）—— 使用逗号分隔文本输入
 *   - 任意值（all —— 无值）
 */
import { computed } from 'vue';

import type { CmpType } from '../../scene-types';
import InlineInput from './InlineInput.vue';
import InlineSelect from './InlineSelect.vue';

const props = defineProps<{
  termType?: CmpType;
  values?: string[];
  enableIn?: boolean;
  enableAll?: boolean;
  /** 值类型 */
  valueType?: 'number' | 'text';
  /** 单位，如 '°C' / '%' */
  suffix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:termType', v: CmpType | undefined): void;
  (e: 'update:values', v: string[]): void;
}>();

const cmpOptions = computed(() => {
  const base = [
    { label: $t('orgManage.flow.opEq'), value: 'eq' },
    { label: '≠', value: 'not' },
    { label: '>', value: 'gt' },
    { label: '≥', value: 'gte' },
    { label: '<', value: 'lt' },
    { label: '≤', value: 'lte' },
    { label: '∈[A,B]', value: 'btw' },
  ];
  if (props.enableIn) base.push({ label: '∈{…}', value: 'in' });
  if (props.enableAll) base.push({ label: $t('scene.ui.any'), value: 'all' });
  return base;
});

const v0 = computed({
  get: () => props.values?.[0] ?? '',
  set: (v) => {
    const next = [...(props.values || [])];
    next[0] = String(v ?? '');
    emit('update:values', next);
  },
});

const v1 = computed({
  get: () => props.values?.[1] ?? '',
  set: (v) => {
    const next = [...(props.values || [])];
    next[1] = String(v ?? '');
    emit('update:values', next);
  },
});

const showTwo = computed(() => props.termType === 'btw');
const showList = computed(() => props.termType === 'in');
const showAny = computed(() => props.termType === 'all');
const showOne = computed(
  () => !showTwo.value && !showList.value && !showAny.value,
);

/** in 模式用逗号分隔文本：['1','2','3'] ↔ '1,2,3' */
const inText = computed({
  get: () => (props.values || []).join(','),
  set: (v: number | string | undefined) => {
    const list = String(v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    emit('update:values', list);
  },
});
</script>

<template>
  <span class="inline-flex flex-wrap items-baseline gap-x-1 gap-y-1">
    <InlineSelect
      :model-value="termType"
      :options="cmpOptions as any"
      :placeholder="$t('scene.ui.compare')"
      :invalid="!termType"
      @change="(v) => emit('update:termType', (v as any) || undefined)"
    />
    <template v-if="showOne">
      <InlineInput
        v-model="v0"
        :type="valueType === 'number' ? 'number' : 'text'"
        :suffix="suffix"
        :placeholder="$t('iotApp.productPage.valuePlaceholder')"
        :invalid="!v0"
      />
    </template>
    <template v-else-if="showTwo">
      <InlineInput
        v-model="v0"
        :type="valueType === 'number' ? 'number' : 'text'"
        :suffix="suffix"
        placeholder="A"
        :invalid="!v0"
      />
      <span class="text-muted-foreground">{{ $t('scene.ui.and') }}</span>
      <InlineInput
        v-model="v1"
        :type="valueType === 'number' ? 'number' : 'text'"
        :suffix="suffix"
        placeholder="B"
        :invalid="!v1"
      />
      <span class="text-muted-foreground">{{ $t('scene.ui.between') }}</span>
    </template>
    <template v-else-if="showList">
      <span class="text-muted-foreground">{{ $t('scene.ui.among') }}</span>
      <InlineInput
        v-model="inText"
        :placeholder="$t('scene.ui.commaSeparated')"
        :max-ch="30"
        :invalid="!(props.values && props.values.length)"
      />
    </template>
    <template v-else-if="showAny">
      <span class="text-muted-foreground">{{ $t('scene.ui.anyValue') }}</span>
    </template>
  </span>
</template>
