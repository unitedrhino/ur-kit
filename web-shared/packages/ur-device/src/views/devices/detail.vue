<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ThingsApi } from '@vben/api';
import { Page } from '@vben/common-ui';
import { ykShortcuts } from '@vben/constants';
import { useTabs } from '@vben/hooks';

// import {
//   postThingsDeviceSchemaIndex,
//   postThingsDeviceInfoRead,
// } from '#/api/v1/api';
// import type { DeviceSchema } from '#/api/v1/models/device-schema';
// import type { DeviceInfo } from '#/api/v1/models';
// @ts-ignore
import { get, toNumber } from 'lodash';
import { NButton, NCard, NCollapse, NCollapseItem, NGrid, NGridItem } from 'naive-ui';

import { useVbenForm } from '../../adapter/form';
import Analytics from './analytics.vue';
import { dateRangeToIntervalParams, generateXAxisData } from './date-helper';

type DeviceSchemaWithValue = ThingsApi.DeviceSchema & {
  lastUpdateTime: string;
  lastValue: string;
  unit?: string;
};

const route = useRoute();
const router = useRouter();

const {
  // closeAllTabs,
  // closeCurrentTab,
  // closeLeftTabs,
  // closeOtherTabs,
  // closeRightTabs,
  // closeTabByKey,
  // refreshTab,
  // resetTabTitle,
  setTabTitle,
} = useTabs();

const deviceSchema = ref<DeviceSchemaWithValue[]>([]);

const deviceName = ref('');
const productID = ref('');
const deviceCreateTime = ref('');

const deviceInfo = ref<ThingsApi.DeviceInfo>({
  productID: '',
  deviceName: '',
});

const init = async () => {
  deviceName.value = route.query.deviceName as string;
  productID.value = route.query.productID as string;
  // console.log(deviceName, productID);

  // console.log(route.query);

  if (deviceName.value && productID.value) {
    setTabTitle(`设备${deviceName.value}`);
    const res = await ThingsApi.postApiV1ThingsDeviceSchemaIndex({
      productID: productID.value,
      deviceName: deviceName.value,
      withProductSchema: true,
    });

    deviceSchema.value = res.list.map((item) => ({
      ...item,
      lastValue: '-',
      lastUpdateTime: '-',
      unit: get(JSON.parse(item.affordance || '{}'), 'define.unit', ''),
    }));

    // const propertiesMap = deviceSchema.value
    //   .filter((item) => item.type === 1)
    //   .reduce(
    //     (acc, item) => {
    //       acc[item.identifier] = {
    //         name: item.name,
    //         identifier: item.identifier,
    //         type: item.type,
    //         lastValue: '',
    //         lastUpdateTime: '',
    //       };
    //       return acc;
    //     },
    //     {} as Record<string, any>,
    //   );

    deviceInfo.value = await ThingsApi.postApiV1ThingsDeviceInfoRead({
      productID: productID.value,
      deviceName: deviceName.value,
      withProperties: [],
    });

    deviceCreateTime.value = get(deviceInfo, 'createdTime', '');

    const properties = get(deviceInfo.value, 'withProperties', {});

    deviceSchema.value.forEach((item) => {
      item.lastValue = get(properties, `${item.identifier}.value`, '');
      item.lastUpdateTime = new Date(toNumber(get(properties, `${item.identifier}.timestamp`, ''))).toLocaleTimeString();
      // item.unit = get(properties, `${item.identifier}.unit`, '');
    });
  } else {
    // router push to 404 page
    // router.push('/404');
    // isShowFallback.value = true;
  }

  // 取 deviceSchema first
  // console.log('deviceSchema', deviceSchema.value);
  // console.log('deviceSchema.value.slice(0, 1)', deviceSchema.value.slice(0, 1));
  deviceSchemaSelected.value = deviceSchema.value.slice(0, 1);
  // console.log('deviceSchemaSelected', deviceSchemaSelected.value);

  // const datas = deviceSchemaSelected.value.map((item) => item.identifier);
  // console.log('datas', datas);

  return deviceSchema.value.map((item) => ({
    label: item.name,
    value: item.identifier,
  }));
};

// const handleDetail = (deviceName: string, item: DeviceSchemaWithValue) => {
//   router.push({
//     name: 'DevicesDetailProperties',
//     query: {
//       deviceName,
//       productID: item.productID,
//       identifier: item.identifier,
//       name: item.name,
//     },
//   });
// };

const dateSelected = ref(Date.now());
const aggNameSelected = ref('last');
const deviceSchemaSelected = ref<DeviceSchemaWithValue[]>([]);

const analyticsRef = ref<InstanceType<typeof Analytics>>();

// const shortcuts = {
//   近一天: () => {
//     const cur = new Date();
//     return [startOfDay(cur).getTime(), endOfDay(cur.getTime()).getTime()];
//   },
//   近三天: () => {
//     const cur = new Date();
//     return [
//       startOfDay(subDays(cur, 3 - 1).getTime()).getTime(),
//       endOfDay(cur.getTime()).getTime(),
//     ];
//   },
//   近一周: () => {
//     const cur = new Date();
//     return [
//       startOfDay(subDays(cur, 7 - 1).getTime()).getTime(),
//       endOfDay(cur.getTime()).getTime(),
//     ];
//   },
//   近一月: () => {
//     const cur = new Date();
//     return [
//       startOfDay(subMonths(cur, 1).getTime()).getTime(),
//       endOfDay(cur.getTime()).getTime(),
//     ];
//   },
//   近一年: () => {
//     const cur = new Date();
//     return [
//       startOfDay(subYears(cur, 1).getTime()).getTime(),
//       endOfDay(cur.getTime()).getTime(),
//     ];
//   },
// };

const [QueryForm, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: init,
        autoSelect: (options: any) => {
          return options?.length > 0 ? { value: [options[0].value] } : { value: [] };
        },
        multiple: true,
        params: {
          productID: productID.value,
          deviceName: deviceName.value,
          withProductSchema: true,
        },
        maxTagCount: 'responsive',
      },
      fieldName: 'identifier',
      label: '属性过滤',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'last（最新值）', value: 'last' },
          { label: 'sum（累加值）', value: 'sum' },
          { label: 'avg（平均值）', value: 'avg' },
          { label: 'min（最小值）', value: 'min' },
          { label: 'max（最大值）', value: 'max' },
          // { label: 'first（第一个值）', value: 'first' },
          // { label: 'spread(差值)', value: 'spread' },
        ],
      },
      fieldName: 'aggName',
      label: '聚合函数',
      // labelWidth: 60,
      defaultValue: 'last',
    },
    // {
    //   component: 'DatePicker',
    //   componentProps: {
    //     type: 'date',
    //   },
    //   fieldName: 'date',
    //   label: '日期',
    //   defaultValue: new Date().getTime(),
    // },
    {
      component: 'DatePicker',
      componentProps: {
        type: 'datetimerange',
        clearable: true,
        shortcuts: ykShortcuts,
      },
      fieldName: 'dateRange',
      label: '日期范围',
      defaultValue: ykShortcuts['今天'](),
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '5', value: 5 },
          { label: '15', value: 15 },
          { label: '30', value: 30 },
          { label: '1', value: 1 },
          { label: '24', value: 24 },
        ],
        placeholder: '请选择数值',
        // 'onUpdate:modelValue': (value: number) => {
        //   console.log('intervalNumber ===================', value);
        // },
      },
      fieldName: 'interval',
      label: '间隔数值',
      defaultValue: 1,
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '分钟', value: 'm' },
          { label: '小时', value: 'h' },
          { label: '天', value: 'd' },
          { label: '月', value: 'n' },
        ],
        placeholder: '请选择时间单位',
        // 'onUpdate:modelValue': (value: string) => {
        //   // console.log('intervalUnit ===================', value);
        // },
      },
      fieldName: 'intervalUnit',
      label: '间隔单位',
      defaultValue: 'h',
    },
  ],
  fieldMappingTime: [['dateRange', ['timeStart', 'timeEnd'], null]],
  handleValuesChange: (values, fieldsChanged) => {
    // console.log('handleValuesChange ===================', values);
    // console.log('fieldsChanged ===================', fieldsChanged);

    if (fieldsChanged.includes('dateRange')) {
      const { timeStart, timeEnd } = values;
      const { interval, intervalUnit } = dateRangeToIntervalParams([timeStart, timeEnd]);
      formApi.setValues({
        intervalNumber: interval,
        intervalUnit,
      });
    }
  },
  handleSubmit: (values) => {
    // console.log('handleSubmit =================== ', values);
    const { identifier, aggName, date, timeStart, timeEnd, interval, intervalUnit } = values;

    // console.log('dateRange =================== ', dateRange);
    // console.log('timeStart =================== ', timeStart);
    // console.log('timeEnd =================== ', timeEnd);

    // const { interval, intervalUnit, xAxisData } = dateRangeToIntervalParams([
    //   timeStart,
    //   timeEnd,
    // ]);

    const xAxisData = generateXAxisData(timeStart, timeEnd, interval, intervalUnit);

    // console.log('interval ===================', interval);
    // console.log('intervalUnit ===================', intervalUnit);
    // console.log('xAxisData ===================', xAxisData);

    if (identifier.length === 0) {
      return;
    }
    deviceSchemaSelected.value = deviceSchema.value.filter((item) => identifier.includes(item.identifier));
    dateSelected.value = date;
    aggNameSelected.value = aggName;

    analyticsRef.value?.getDatas(
      deviceSchemaSelected.value.map((item) => item.identifier),
      aggName,
      {
        timeStart,
        timeEnd,
        interval,
        intervalUnit,
        xAxisData,
        projectID: deviceInfo.value.projectID || '',
        productID: deviceInfo.value.productID,
        deviceName: deviceInfo.value.deviceName,
      },
    );
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});

const pageTitle = computed(() => {
  return `设备ID：${deviceName.value}`;
});
const createTimeFormat = computed(() => {
  if (deviceCreateTime.value) {
    return new Date(Number(deviceCreateTime.value)).toLocaleString();
  }
  return '--';
});
const pageDescription = computed(() => {
  return `产品ID：${productID.value} | 设备名称：${deviceName.value} | 创建时间：${createTimeFormat.value}`;
});

function handleAnalyticsMounted() {
  formApi.submitForm(new Event('submit'));
}
</script>

<template>
  <Page :title="pageTitle" :description="pageDescription" auto-content-height>
    <template #extra>
      <NButton @click="router.back()">返回</NButton>
    </template>
    <NCard>
      <NCollapse :default-expanded-names="['1']">
        <NCollapseItem title="属性" name="1">
          <NGrid cols="2 s:2 m:4 l:5 xl:6" :x-gap="12" :y-gap="12" responsive="screen">
            <NGridItem v-for="item in deviceSchema" :key="item.identifier">
              <NCard :title="item.name">
                <div>
                  最新值：{{ item.lastValue }} {{ item.unit }}<br />
                  更新时间：{{ item.lastUpdateTime }}
                </div>
              </NCard>
            </NGridItem>
          </NGrid>
        </NCollapseItem>
      </NCollapse>
    </NCard>

    <NCard class="mt-5">
      <QueryForm />
      <NCard class="mt-5" v-if="deviceSchemaSelected.length > 0">
        <Analytics ref="analyticsRef" @vue:mounted="handleAnalyticsMounted" />
      </NCard>
    </NCard>
  </Page>
</template>
