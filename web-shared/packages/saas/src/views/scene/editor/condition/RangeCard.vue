<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 单条时间/日期段 */
import { computed } from 'vue';
import type { RangeDraft } from '../types';
import type { DateRangeType, TimeRangeType } from '../../scene-types';
import RuleCard from '../shared/RuleCard.vue';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import TimeField from '../shared/TimeField.vue';
import DateField from '../shared/DateField.vue';
import WeekdayPicker from '../shared/WeekdayPicker.vue';
import { rangeSummary } from '../composables/useSceneSummary';

const props = defineProps<{
  modelValue: RangeDraft;
  index: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'copy'): void;
  (e: 'delete'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
}>();

const TIME_OPTIONS: { label: string; value: TimeRangeType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.allDay'), value: 'allDay' },
  { label: $t('scene.ui.daytime'), value: 'light' },
  { label: $t('scene.ui.night'), value: 'night' },
  { label: $t('orgIotClient.deviceLogs.presetCustom'), value: 'customRange' },
]));

const DATE_OPTIONS: { label: string; value: DateRangeType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.allDates'), value: 'allDay' },
  { label: $t('scene.ui.workingDays'), value: 'workday' },
  { label: $t('scene.ui.weekend'), value: 'weekend' },
  { label: $t('scene.ui.statutoryHolidays'), value: 'holiday' },
  { label: $t('console.token.expireCustom'), value: 'customRange' },
  { label: $t('scene.ui.customizedWeek'), value: 'customWeek' },
]));

const summary = computed(() => rangeSummary(props.modelValue));

function toggle() {
  props.modelValue._collapsed = !props.modelValue._collapsed;
}
</script>

<template>
  <RuleCard
    :title="`${$t(modelValue.type === 'time' ? 'scene.ui.timePeriod' : 'scene.ui.dateSegment')} ${index + 1}`"
    :summary="summary"
    :collapsed="modelValue._collapsed"
    :can-move-up="index > 0"
    :can-move-down="index < total - 1"
    @toggle="toggle"
    @copy="emit('copy')"
    @delete="emit('delete')"
    @move-up="emit('moveUp')"
    @move-down="emit('moveDown')"
  >
    <template v-if="modelValue.type === 'time' && modelValue.timeRange">
      <div class="flex flex-wrap gap-3">
        <FieldRow :label="$t('scene.ui.timePeriod')" width-class="w-40">
          <NativeSelect
            v-model="modelValue.timeRange.type"
            :options="TIME_OPTIONS"
            @update:model-value="emit('change')"
          />
        </FieldRow>
        <template v-if="modelValue.timeRange.type === 'customRange'">
          <FieldRow :label="$t('orgEnergy.ui.startTime_e8868a')" width-class="w-36">
            <TimeField
              v-model="modelValue.timeRange.startTime"
              @update:model-value="emit('change')"
            />
          </FieldRow>
          <FieldRow :label="$t('orgEnergy.ui.endTime_a0bb9f')" width-class="w-36">
            <TimeField
              v-model="modelValue.timeRange.endTime"
              @update:model-value="emit('change')"
            />
          </FieldRow>
        </template>
      </div>
    </template>

    <template v-if="modelValue.type === 'date' && modelValue.dateRange">
      <div class="flex flex-wrap gap-3">
        <FieldRow :label="$t('scene.ui.dateSegment')" width-class="w-40">
          <NativeSelect
            v-model="modelValue.dateRange.type"
            :options="DATE_OPTIONS"
            @update:model-value="emit('change')"
          />
        </FieldRow>
        <template v-if="modelValue.dateRange.type === 'customRange'">
          <FieldRow :label="$t('scene.ui.startDate')" width-class="w-40">
            <DateField
              v-model="modelValue.dateRange.startDate"
              @update:model-value="emit('change')"
            />
          </FieldRow>
          <FieldRow :label="$t('orgEnergy.ui.endDate')" width-class="w-40">
            <DateField
              v-model="modelValue.dateRange.endDate"
              @update:model-value="emit('change')"
            />
          </FieldRow>
        </template>
        <FieldRow
          v-if="modelValue.dateRange.type === 'customWeek'"
          :label="$t('orgManage.cloneGroup.weekdayLabel')"
          width-class="w-full"
        >
          <WeekdayPicker
            v-model="modelValue.dateRange.repeat"
            @update:model-value="emit('change')"
          />
        </FieldRow>
      </div>
    </template>
  </RuleCard>
</template>
