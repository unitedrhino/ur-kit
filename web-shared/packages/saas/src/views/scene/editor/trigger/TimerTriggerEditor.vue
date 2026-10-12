<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 定时触发编辑器。支持 execType: at/sunRises/sunSet/loop，及 repeatType */
import { computed } from 'vue';
import type { TimerTriggerDraft } from '../types';
import type { ExecType, RepeatType } from '../../scene-types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import NumberInput from '../shared/NumberInput.vue';
import TimeField from '../shared/TimeField.vue';
import WeekdayPicker from '../shared/WeekdayPicker.vue';
import MonthDayPicker from '../shared/MonthDayPicker.vue';

const props = defineProps<{ modelValue: TimerTriggerDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const EXEC_OPTIONS: { label: string; value: ExecType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.specifiedTime'), value: 'at' },
  { label: $t('scene.ui.sunrise'), value: 'sunRises' },
  { label: $t('scene.ui.sunset'), value: 'sunSet' },
  { label: $t('scene.ui.loopExecution'), value: 'loop' },
]));

const REPEAT_OPTIONS: { label: string; value: RepeatType }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.executeOnlyOnce'), value: 'once' },
  { label: $t('iotApp.project.scheduleDaily'), value: 'allDay' },
  { label: $t('scene.ui.workingDays'), value: 'workday' },
  { label: $t('scene.ui.weekend'), value: 'weekend' },
  { label: $t('scene.ui.statutoryHolidays'), value: 'holiday' },
  { label: $t('scene.ui.repeatByWeek'), value: 'week' },
  { label: $t('scene.ui.repeatMonthly'), value: 'mount' },
]));

const LOOP_UNITS = localizedSceneState(() => ([
  { label: $t('orgEnergy.ui.hour_99f690'), value: 'hour' },
  { label: $t('orgEnergy.ui.minutes'), value: 'minute' },
  { label: $t('orgManage.cloneGroup.unitSeconds'), value: 'second' },
]));

const offsetMinutes = computed<number>({
  get: () => Math.round((props.modelValue.execAdd ?? 0) / 60),
  set: (v) => {
    props.modelValue.execAdd = (Number(v) || 0) * 60;
    emit('change');
  },
});

function onInput() {
  emit('change');
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-x-4 gap-y-3">
    <FieldRow :label="$t('scene.ui.executionMethod')" width-class="w-40">
      <NativeSelect
        v-model="modelValue.execType"
        :options="EXEC_OPTIONS"
        @update:model-value="onInput"
      />
    </FieldRow>

    <FieldRow v-if="modelValue.execType === 'at'" :label="$t('iotApp.ota.reviewExecTime')" width-class="w-40">
      <TimeField v-model="modelValue.execAt" @update:model-value="onInput" />
    </FieldRow>

    <FieldRow
      v-if="modelValue.execType === 'sunRises' || modelValue.execType === 'sunSet'"
      :label="$t('scene.ui.offsetMinutes')"
      :hint="$t('scene.ui.positiveNumbersAreAfterNegativeNumbersAreBefore')"
      width-class="w-40"
    >
      <NumberInput v-model="offsetMinutes" :step="5" />
    </FieldRow>

    <FieldRow v-if="modelValue.execType === 'loop'" :label="$t('scene.ui.loopInterval')" width-class="w-52">
      <div class="flex items-center gap-2">
        <NumberInput
          v-model="modelValue.execLoop"
          :min="1"
          :step="1"
          width-class="w-28"
          @change="onInput"
        />
        <NativeSelect
          v-model="modelValue.execLoopUnit"
          :options="LOOP_UNITS"
          width-class="w-24"
          @update:model-value="onInput"
        />
      </div>
    </FieldRow>

    <FieldRow :label="$t('scene.ui.repeatMode')" width-class="w-40">
      <NativeSelect
        v-model="modelValue.repeatType"
        :options="REPEAT_OPTIONS"
        @update:model-value="onInput"
      />
    </FieldRow>

    <FieldRow
      v-if="modelValue.repeatType === 'week'"
      :label="$t('orgManage.cloneGroup.weekdayLabel')"
      width-class="min-w-[280px] flex-1"
    >
      <WeekdayPicker
        v-model="modelValue.execRepeat"
        @update:model-value="onInput"
      />
    </FieldRow>
    <FieldRow
      v-if="modelValue.repeatType === 'mount'"
      :label="$t('iotApp.av.dateLabel')"
      width-class="min-w-[320px] flex-1"
    >
      <MonthDayPicker
        v-model="modelValue.execRepeat"
        @update:model-value="onInput"
      />
    </FieldRow>
  </div>
</template>
