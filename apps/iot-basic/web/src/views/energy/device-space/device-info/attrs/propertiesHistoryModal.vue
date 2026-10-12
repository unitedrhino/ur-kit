<!-- 历史属性分析弹窗：按属性、聚合函数和时间窗口查看趋势。 -->
<script lang="ts" setup>
import type { ThingsApi } from '@vben/api';

import { computed, ref } from 'vue';

import { $t } from '@vben/locales';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { ykShortcuts } from '@vben/constants';

import { NCard } from 'naive-ui';

import { useDeviceInfo } from '../useDeviceInfo';
import Analytics from './analytics.vue';
import { dateRangeToIntervalParams, generateXAxisData } from './date-helper';

const { deviceInfo, deviceSchema } = useDeviceInfo();

const propertySchemaOnly = computed(() => deviceSchema?.value?.filter((item: ThingsApi.DeviceSchema) => item.type === 1) ?? []);

const propertyFilterOptions = computed(() =>
  propertySchemaOnly.value.map((item) => ({
    label: item.name,
    value: item.identifier,
  })),
);

const [Modal, modalApi] = useVbenModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData() as { deviceName?: string; identifier?: string; productID?: string };
    const ids = propertySchemaOnly.value.map((item) => item.identifier);
    const defaultIds = data.identifier && ids.includes(data.identifier) ? [data.identifier] : ids.slice(0, 1);
    formApi.setFieldValue('identifier', defaultIds);
  },
});

const dateSelected = ref(Date.now());
const aggNameSelected = ref('last');
const analyticsRef = ref<InstanceType<typeof Analytics>>();

const selectFieldProps = {
  class: 'w-full',
  consistentMenuWidth: false,
};

const [QueryForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'min-w-0 w-full',
    labelWidth: 88,
  },
  fieldMappingTime: [['dateRange', ['timeStart', 'timeEnd'], null]],
  handleSubmit: (values) => {
    const { aggName, identifier, interval, intervalUnit, timeEnd, timeStart } = values;
    if (!Array.isArray(identifier) || identifier.length === 0) return;

    const xAxisData = generateXAxisData(timeStart, timeEnd, interval, intervalUnit);
    dateSelected.value = Date.now();
    aggNameSelected.value = aggName;

    analyticsRef.value?.getDatas(identifier, aggName, {
      deviceName: deviceInfo?.value?.deviceName || '',
      interval,
      intervalUnit,
      productID: deviceInfo?.value?.productID || '',
      projectID: deviceInfo?.value?.projectID,
      timeEnd,
      timeStart,
      xAxisData,
    });
  },
  handleValuesChange: (values, fieldsChanged) => {
    if (!fieldsChanged.includes('dateRange')) return;
    const { timeEnd, timeStart } = values;
    const { interval, intervalUnit } = dateRangeToIntervalParams([timeStart, timeEnd]);
    formApi.setValues({ interval, intervalUnit });
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Select',
      componentProps: {
        ...selectFieldProps,
        clearable: true,
        maxTagCount: 'responsive',
        multiple: true,
        options: propertyFilterOptions,
      },
      defaultValue: [],
      fieldName: 'identifier',
      formItemClass: 'md:col-span-1',
      label: $t('orgIotClient.deviceSpace.propFilter'),
    },
    {
      component: 'Select',
      componentProps: {
        ...selectFieldProps,
        options: [
          { label: $t('orgIotClient.deviceSpace.aggLast'), value: 'last' },
          { label: $t('orgIotClient.deviceSpace.aggSum'), value: 'sum' },
          { label: $t('orgIotClient.deviceSpace.aggAvg'), value: 'avg' },
          { label: $t('orgIotClient.deviceSpace.aggMin'), value: 'min' },
          { label: $t('orgIotClient.deviceSpace.aggMax'), value: 'max' },
        ],
      },
      defaultValue: 'last',
      fieldName: 'aggName',
      label: $t('iotApp.deviceDetail.aggFunc'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        shortcuts: ykShortcuts,
        type: 'datetimerange',
        class: 'w-full',
      },
      defaultValue: ykShortcuts['今天'](),
      fieldName: 'dateRange',
      formItemClass: 'col-span-full',
      label: $t('iotApp.deviceDetail.dateRange'),
    },
    {
      component: 'Select',
      componentProps: {
        ...selectFieldProps,
        options: [
          { label: '5', value: 5 },
          { label: '15', value: 15 },
          { label: '30', value: 30 },
          { label: '1', value: 1 },
          { label: '24', value: 24 },
        ],
      },
      defaultValue: 1,
      fieldName: 'interval',
      label: $t('orgIotClient.deviceSpace.intervalValue'),
    },
    {
      component: 'Select',
      componentProps: {
        ...selectFieldProps,
        options: [
          { label: $t('iotApp.deviceDetail.unitMinute'), value: 'm' },
          { label: $t('iotApp.deviceDetail.unitHour'), value: 'h' },
          { label: $t('iotApp.deviceDetail.unitDay'), value: 'd' },
          { label: $t('iotApp.deviceDetail.unitMonth'), value: 'n' },
        ],
      },
      defaultValue: 'h',
      fieldName: 'intervalUnit',
      label: $t('orgIotClient.deviceSpace.intervalUnit'),
    },
  ],
  submitOnChange: true,
  wrapperClass: 'properties-history-query-form grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2',
});

function handleAnalyticsMounted() {
  formApi.submitForm(new Event('submit'));
}
</script>

<template>
  <Modal :title="$t('orgIotClient.deviceSpace.historyAnalysis')" auto-content-height class="h-[80%] w-[92%] max-w-[1400px]" content-class="overflow-visible">
    <div class="flex flex-col gap-4">
      <QueryForm />
      <NCard v-if="deviceSchema" class="min-h-[320px]">
        <Analytics ref="analyticsRef" @vue:mounted="handleAnalyticsMounted" />
      </NCard>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.properties-history-query-form .flex-auto),
:deep(.properties-history-query-form .n-input),
:deep(.properties-history-query-form .n-base-selection),
:deep(.properties-history-query-form .n-date-picker) {
  width: 100%;
  min-width: 0;
}
</style>
