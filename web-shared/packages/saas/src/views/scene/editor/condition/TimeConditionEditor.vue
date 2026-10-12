<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 时间条件：sys 用 btw 两个时刻；sunRises/sunSet 用偏移分钟 */
import { computed } from 'vue';
import type { TimeConditionDraft } from '../types';
import type { CmpType, TimeType } from '../../scene-types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import TimeField from '../shared/TimeField.vue';

const props = defineProps<{ modelValue: TimeConditionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const TYPE_OPTIONS: { label: string; value: TimeType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.systemTime'), value: 'sys' },
  { label: $t('scene.ui.sunrise'), value: 'sunRises' },
  { label: $t('scene.ui.sunset'), value: 'sunSet' },
]));

const CMP_OPTIONS: { label: string; value: CmpType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.withinTheRange'), value: 'btw' },
  { label: $t('scene.ui.earlierThan'), value: 'lt' },
  { label: $t('scene.ui.lateThan'), value: 'gt' },
]));

const startTs = computed<number | undefined>({
  get: () => props.modelValue.values?.[0] as number | undefined,
  set: (v) => {
    const arr = [...((props.modelValue.values as any[]) || [])];
    arr[0] = v as any;
    props.modelValue.values = arr;
    emit('change');
  },
});

const endTs = computed<number | undefined>({
  get: () => props.modelValue.values?.[1] as number | undefined,
  set: (v) => {
    const arr = [...((props.modelValue.values as any[]) || [])];
    arr[1] = v as any;
    props.modelValue.values = arr;
    emit('change');
  },
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-3">
      <FieldRow :label="$t('scene.ui.timeType')" width-class="w-40">
        <NativeSelect
          v-model="modelValue.type"
          :options="TYPE_OPTIONS"
          @update:model-value="emit('change')"
        />
      </FieldRow>
      <FieldRow :label="$t('scene.ui.compare')" width-class="w-36">
        <NativeSelect
          v-model="modelValue.termType"
          :options="CMP_OPTIONS"
          @update:model-value="emit('change')"
        />
      </FieldRow>
    </div>

    <div v-if="modelValue.type === 'sys'" class="flex flex-wrap gap-3">
      <FieldRow :label="$t('orgEnergy.ui.startTime')" width-class="w-36">
        <TimeField v-model="startTs" />
      </FieldRow>
      <FieldRow
        v-if="modelValue.termType === 'btw'"
        :label="$t('orgEnergy.ui.endTime_a0bb9f')"
        width-class="w-36"
      >
        <TimeField v-model="endTs" />
      </FieldRow>
    </div>
  </div>
</template>
