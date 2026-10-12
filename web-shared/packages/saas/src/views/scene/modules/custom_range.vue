<script lang="ts" setup>
import { localizedSceneState } from '../locales';

import { $t } from '@vben/locales';
import { NGrid, NGridItem } from 'naive-ui';
import {
  ProSelect,
  ProRadioGroup,
  ProDate,
  ProTime,
  ProCheckboxGroup,
} from 'pro-naive-ui';

import type { WhenRange } from '../scene-types';

const whenRangeTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('iotApp.deviceDetail.dateRange'), value: 'date' },
    { label: $t('orgEnergy.ui.timeRange'), value: 'time' },
  ],
}));

const dateRangeTypeSelectProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('scene.ui.allDay'), value: 'allDay' },
    { label: $t('scene.ui.workingDays'), value: 'workday' },
    { label: $t('scene.ui.weekend'), value: 'weekend' },
    { label: $t('scene.ui.holidays'), value: 'holiday' },
    { label: $t('scene.ui.customDateRange'), value: 'customRange' },
    { label: $t('scene.ui.customizedWeekend'), value: 'customWeek' },
  ],
}));

const timeRangeTypeSelectProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('scene.ui.allDay'), value: 'allDay' },
    { label: $t('scene.ui.daytime'), value: 'light' },
    { label: $t('scene.ui.evening'), value: 'night' },
    { label: $t('orgIotClient.deviceLogs.customTimeRange'), value: 'customRange' },
  ],
}));

const triggersTimerExecRepeatWeekProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('orgEnergy.ui.monday'), value: '0000001' },
    { label: $t('orgEnergy.ui.tuesday'), value: '0000010' },
    { label: $t('orgEnergy.ui.wednesday'), value: '0000100' },
    { label: $t('orgEnergy.ui.thursday'), value: '0001000' },
    { label: $t('orgEnergy.ui.friday'), value: '0010000' },
    { label: $t('orgEnergy.ui.saturday'), value: '0100000' },
    { label: $t('orgEnergy.ui.sunday'), value: '1000000' },
  ],
}));

defineProps<{
  row: WhenRange;
  row_name: string;
}>();
</script>

<template>
  <div>
    <NGrid
      cols="1 s:1 m:2 l:3 xl:3 2xl:3"
      responsive="screen"
      class="pl-4 pr-4"
    >
      <NGridItem>
        <ProSelect
          path="type"
          :title="`${row_name} ${$t('orgManage.role.type')}`"
          style="width: 150px"
          :field-props="whenRangeTypeSelectProps"
          required
        />
      </NGridItem>

      <NGridItem :span="2" v-if="row.type === 'date'">
        <ProRadioGroup
          path="dateRange.type"
          :title="$t('scene.ui.dateType')"
          style="width: 150px"
          :field-props="dateRangeTypeSelectProps"
          required
        />
      </NGridItem>

      <NGridItem :span="2" v-if="row.type === 'time'">
        <ProRadioGroup
          path="timeRange.type"
          :title="$t('scene.ui.timeType')"
          style="width: 150px"
          :field-props="timeRangeTypeSelectProps"
          required
        />
      </NGridItem>

      <NGridItem
        v-if="row.type === 'date' && row.dateRange?.type === 'customRange'"
      >
        <ProDate
          path="dateRange.startDate"
          :title="$t('orgEnergy.ui.startDate')"
          style="width: 150px"
          required
        />
      </NGridItem>

      <NGridItem
        v-if="row.type === 'date' && row.dateRange?.type === 'customRange'"
      >
        <ProDate
          path="dateRange.endDate"
          :title="$t('orgEnergy.ui.endDate')"
          style="width: 150px"
          required
        />
      </NGridItem>

      <NGridItem
        v-if="row.type === 'date' && row.dateRange?.type === 'customWeek'"
      >
        <ProCheckboxGroup
          path="dateRange.repeat"
          :title="$t('scene.ui.customizedWeekend')"
          style="width: 150px"
          :field-props="triggersTimerExecRepeatWeekProps"
          required
        />
      </NGridItem>

      <NGridItem
        v-if="row.type === 'time' && row.timeRange?.type === 'customRange'"
      >
        <ProTime
          path="timeRange.startTime"
          :title="$t('orgEnergy.ui.startTime_e8868a')"
          style="width: 150px"
          required
        />
      </NGridItem>

      <NGridItem
        v-if="row.type === 'time' && row.timeRange?.type === 'customRange'"
      >
        <ProTime
          path="timeRange.endTime"
          :title="$t('orgEnergy.ui.endTime_a0bb9f')"
          style="width: 150px"
          required
        />
      </NGridItem>
    </NGrid>
  </div>
</template>
