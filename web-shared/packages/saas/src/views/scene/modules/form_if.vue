<script setup lang="ts">
import { localizedSceneState } from '../locales';

import { $t } from '@vben/locales';
import { computed, ref, type Ref } from 'vue';
import { useProduct, useArea, useGroup } from '@vben/stores';
import { ThingsApi } from '@vben/api';
import {
  ProFormList,
  ProSelect,
  ProRadioGroup,
  ProTime,
  ProCheckboxGroup,
  useInjectProForm,
  ProCard,
  ProDigit,
} from 'pro-naive-ui';

import {
  NConfigProvider,
  NButton,
  NFlex,
  NSelect,
  NGrid,
  NGridItem,
} from 'naive-ui';

import { preferences } from '@vben/preferences';
import { zhCN, enUS } from 'pro-naive-ui';

import type { CmpType, Trigger } from '../scene-types';

import { Api } from '../index.api';

const { getProductOptions } = useProduct();
const { getAreaOptions } = useArea();
const { getGroupOptions } = useGroup();

useInjectProForm<Trigger>();

const tokenLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? zhCN : enUS,
);

const triggersTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('platformManage.devops.lblCron'), value: 'timer' },
    { label: $t('scene.ui.weather'), value: 'weather' },
    { label: $t('orgIotClient.console.devices'), value: 'device' },
  ],
}));

const nRadioProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('scene.ui.specifiedTimePoint'), value: 'at' },
    { label: $t('scene.ui.sunrise'), value: 'sunRises' },
    { label: $t('scene.ui.sunset'), value: 'sunSet' },
    { label: $t('orgManage.cloneGroup.intervalLabel'), value: 'loop' },
  ],
}));

const timerRepeatTypeProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('scene.ui.executeOnlyOnce'), value: 'once' },
    { label: $t('iotApp.project.scheduleDaily'), value: 'allDay' },
    { label: $t('scene.ui.statutoryWorkingDay'), value: 'workday' },
    { label: $t('scene.ui.weekend'), value: 'weekend' },
    { label: $t('scene.ui.statutoryHolidays'), value: 'holiday' },
    { label: $t('scene.ui.repeatByWeek'), value: 'week' },
    { label: $t('scene.ui.repeatMonthly'), value: 'mount' },
  ],
}));

const triggersTimerExecAddSunRisesProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.text30Minutesbeforesunrise'), value: -1 * 60 * 30 },
    { label: $t('scene.ui.text15Minutesbeforesunrise'), value: -1 * 60 * 15 },
    { label: $t('scene.ui.sunrise'), value: '日出' },
    { label: $t('scene.ui.text15Minutesaftersunrise'), value: 1 * 60 * 15 },
    { label: $t('scene.ui.text30Minutesaftersunrise'), value: 1 * 60 * 30 },
  ],
}));

const triggersTimerExecAddSunSetProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.text30Minutesbeforesunset'), value: -1 * 60 * 30 },
    { label: $t('scene.ui.text15Minutesbeforesunset'), value: -1 * 60 * 15 },
    { label: $t('scene.ui.sunset'), value: '日落' },
    { label: $t('scene.ui.text15Minutesbeforesunset'), value: 1 * 60 * 15 },
    { label: $t('scene.ui.text30Minutesbeforesunset'), value: 1 * 60 * 30 },
  ],
}));

const weatherTypeProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('iotApp.productPage.temperature'), value: 'temp' },
    { label: $t('scene.ui.humidity'), value: 'humidity' },
  ],
}));

const nSelectProps2 = localizedSceneState(() => ([
  { label: $t('orgEnergy.ui.hour_99f690'), value: '小时' },
  { label: $t('orgEnergy.ui.minutes'), value: '分钟' },
  { label: $t('orgManage.cloneGroup.unitSeconds'), value: '秒' },
]));

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

const triggersTimerExecRepeatMonthProps = {
  type: 'button' as const,
  options: Array.from({ length: 31 }, (_, i) => ({
    label: $t('scene.ui.indexNumber', { index: i + 1 }),
    value: '0'.repeat(30 - i) + '1' + '0'.repeat(i),
  })),
};

const deviceProductIDProps = computed(() => ({
  options: getProductOptions(),
}));

const deviceAreaIDProps = computed(() => ({
  options: getAreaOptions(),
}));

const deviceGroupIDProps = computed(() => ({
  options: getGroupOptions(),
}));

const deviceSelectTypeProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.allDevicesUnderTheProduct'), value: 'all' },
    { label: $t('scene.ui.specifiedEquipmentUnderTheProduct'), value: 'fixed' },
    { label: $t('scene.ui.devicesUnderTheArea'), value: 'area' },
    { label: $t('scene.ui.devicesUnderTheDeviceGroup'), value: 'group' },
  ],
}));

const deviceModeProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('scene.ui.edgeTrigger'), value: 'edge' },
    { label: $t('scene.ui.horizontalTrigger'), value: 'level' },
  ],
}));

const value = ref('小时');

const triggerTypeChange = (row: Trigger) => {
  if (row.type === 'weather' && row.weather?.type === 'temp') {
    row.weather = { type: 'temp', termType: 'gt' as CmpType, values: ['20'] };
  }
  if (row.type === 'weather' && row.weather?.type === 'humidity') {
    row.weather = {
      type: 'humidity',
      termType: 'btw' as CmpType,
      values: ['0', '40'],
    };
  }
};

const triggersTitle = (row: Trigger) => {
  let title = '';
  if (row.type === 'timer') {
    title = $t('platformManage.devops.lblCron');
    if (row.timer?.execType === 'at') {
      title += row.timer?.execAt
        ? ` ${$t('scene.ui.executeAtTime', { time: new Date(row.timer?.execAt).toLocaleTimeString(preferences.app.locale) })}`
        : ` ${$t('scene.ui.executeAtTheSpecifiedTimePoint')}`;
    }
    if (row.timer?.execType === 'sunRises') title += ` ${$t('scene.ui.atSunrise')}`;
    if (row.timer?.execType === 'sunSet') title += ` ${$t('scene.ui.atSunset')}`;
    if (row.timer?.execType === 'loop') title += ` ${$t('scene.ui.inIntervalTime')}`;

    const repeatLabels: Record<string, string> = {
      once: ` ${$t('scene.ui.executeOnlyOnce')}`,
      week: ` ${$t('scene.ui.repeatByWeek')}`,
      mount: ` ${$t('scene.ui.repeatMonthly')}`,
      allDay: ` ${$t('scene.ui.repeatEveryDay')}`,
      workday: ` ${$t('scene.ui.duplicateLegalWorkingDays')}`,
      weekend: ` ${$t('scene.ui.repeatOnWeekends')}`,
      holiday: ` ${$t('scene.ui.repeatLegalHolidays')}`,
      customRange: ` ${$t('scene.ui.duplicateCustomRange')}`,
    };
    if (row.timer?.repeatType) {
      title += repeatLabels[row.timer.repeatType] || '';
    }
  }
  if (row.type === 'weather') title = $t('scene.ui.weather');
  if (row.type === 'device') title = $t('orgIotClient.console.devices');
  return title;
};

const execLoopDigitProps = { min: 0 };

const weatherTermTypeProps = localizedSceneState(() => ({
  options: [
    { label: $t('orgManage.flow.opEq'), value: 'eq' },
    { label: $t('orgManage.flow.opNe'), value: 'not' },
    { label: $t('scene.ui.betweenAAndB_945de4'), value: 'btw' },
    { label: $t('orgManage.flow.opGt'), value: 'gt' },
    { label: $t('orgManage.flow.opGte'), value: 'gte' },
    { label: $t('orgManage.flow.opLt'), value: 'lt' },
    { label: $t('orgManage.flow.opLte'), value: 'lte' },
    { label: $t('orgIotClient.console.all'), value: 'all' },
  ],
}));

const deviceDeviceNameOptions = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});

const handleProductSelect = (row: Trigger) => {
  if (row.device?.productID) {
    row.device.selectType = undefined!;
    row.device.groupID = undefined!;
    row.device.areaID = undefined!;
    row.device.deviceName = undefined!;
    row.device.type = undefined!;
    row.device.mode = undefined!;
  }
};

const handleDeviceSelectTypeChange = (row: any) => {
  if (row.device?.selectType) {
    row.device.groupID = undefined!;
    row.device.areaID = undefined!;
    row.device.deviceName = undefined!;
    row.device.type = undefined!;
    row.device.mode = undefined!;

    selectOptions_dataID.value.options = [];
    selectOptions_dataID_00.value.options = [];
    selectOptions_dataID_00_aa.value.options = [];
    selectOptions_dataID_aa.value.options = [];
    selectOptions_dataID_bb.value.options = [];
    selectOptions_dataID_bb_cc.value.options = [];
  }

  if (row.device?.selectType === 'fixed' && row.device.productID) {
    updateDeviceSelectOptions(row);
  }
};

const handleDeviceSelect = (row: Trigger) => {
  if (row.device?.deviceName) {
    row.device.type = undefined!;
    row.device.mode = undefined!;
  }
};

const handleAreaIDChange = (row: Trigger) => {
  if (row.device?.areaID) {
    row.device.type = undefined!;
    row.device.mode = undefined!;
  }
};

const handleGroupIDChange = (row: any) => {
  if (row.device?.groupID) {
    row.device.type = undefined!;
    row.device.mode = undefined!;
  }
};

const schemaList: Ref<
  ThingsApi.DeviceSchema[] | ThingsApi.ProductSchemaInfo[]
> = ref([]);

const deviceTypeRefProps = ref({
  type: 'button' as const,
  options: [
    { label: $t('orgIotClient.deviceLogs.statusOnlineTitle'), value: 'connected', disabled: false },
    { label: $t('orgIotClient.deviceLogs.statusOfflineTitle'), value: 'disConnected', disabled: false },
    { label: $t('iotApp.deviceDetail.msgReport'), value: 'propertyReport', disabled: false },
    { label: $t('iotApp.deviceDetail.eventPost'), value: 'eventReport', disabled: false },
  ],
});

const handleModeChange = (row: any) => {
  selectOptions_dataID.value.options = [];
  selectOptions_dataID_00.value.options = [];
  selectOptions_dataID_00_aa.value.options = [];
  selectOptions_dataID_aa.value.options = [];
  selectOptions_dataID_bb.value.options = [];
  selectOptions_dataID_bb_cc.value.options = [];

  if (row.device?.type) {
    row.device.type = undefined!;
  }

  deviceColumnOptions.value.loading = true;
  if (row.device?.productID && row.device?.deviceName) {
    Api.deviceSchemaIndex({
      productID: row.device.productID,
      deviceName: row.device.deviceName,
    })
      .then((res) => {
        schemaList.value = res.list;
        updateDeviceTypeOptions(schemaList.value);
      })
      .finally(() => {
        deviceColumnOptions.value.loading = false;
      });
  } else if (row.device?.productID) {
    Api.productSchemaIndex({ productID: row.device.productID })
      .then((res) => {
        schemaList.value = res.list;
        updateDeviceTypeOptions(schemaList.value);
      })
      .finally(() => {
        deviceColumnOptions.value.loading = false;
      });
  }
};

function updateDeviceTypeOptions(
  list: ThingsApi.DeviceSchema[] | ThingsApi.ProductSchemaInfo[],
) {
  const hasProperty = list.some((item) => item.type === 1);
  const hasEvent = list.some((item) => item.type === 2);

  deviceTypeRefProps.value.options = deviceTypeRefProps.value.options.map(
    (item) => {
      if (item.value === 'propertyReport') item.disabled = !hasProperty;
      if (item.value === 'eventReport') item.disabled = !hasEvent;
      return item;
    },
  );
}

const selectOptions_dataID = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const selectOptions_dataID_00 = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const selectOptions_dataID_00_aa = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const selectOptions_dataID_aa = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const selectOptions_dataID_bb = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const selectOptions_dataID_bb_cc = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});

const handleDeviceTypeChange = (row: any) => {
  // 清除路径选择
  ['dataID_data', 'dataID_00', 'dataID_00_aa', 'dataID_aa', 'dataID_bb', 'dataID_bb_cc', 'termType'].forEach((key) => {
    if (row.device?.[key]) row.device[key] = '';
  });
  if (row.device?.values) row.device.values = [];
  if (row.device?.terms) row.device.terms = [];

  if (
    row.device?.type &&
    row.device?.productID &&
    (row.device?.type === 'propertyReport' ||
      row.device?.type === 'eventReport')
  ) {
    const schema_type = row.device?.type === 'eventReport' ? 2 : 1;
    const list = schemaList.value.filter((item) => item.type === schema_type);

    // 重置所有路径选项
    [selectOptions_dataID, selectOptions_dataID_00, selectOptions_dataID_00_aa, selectOptions_dataID_aa, selectOptions_dataID_bb, selectOptions_dataID_bb_cc].forEach((opt) => {
      opt.value = { options: [], clearable: true, filterable: true, loading: false };
    });

    list.forEach((item) => {
      selectOptions_dataID.value.options.push({
        label: item.name || '',
        value: item.identifier,
      });
    });
  }
};

function handleColumnDataIDChange(row: any) {
  if (row.device?.dataID_data && row.device?.type) {
    selectOptions_dataID_00.value.options = [];
    selectOptions_dataID_00_aa.value.options = [];
    selectOptions_dataID_aa.value.options = [];
    selectOptions_dataID_bb.value.options = [];
    selectOptions_dataID_bb_cc.value.options = [];

    const schema_type = row.device?.type === 'eventReport' ? 2 : 1;
    const current_schema = schemaList.value.filter(
      (item) =>
        item.type === schema_type &&
        item.identifier === row.device.dataID_data,
    );
    const affordance = JSON.parse(current_schema[0]?.affordance || '{}');

    if (affordance?.define?.type === 'array') {
      const max = affordance?.define?.max || 10;
      for (let i = 0; i < max; i++) {
        selectOptions_dataID_00.value.options.push({
          label: $t('scene.ui.index') + i,
          value: i.toString(),
        });
      }
      if (affordance?.define?.arrayInfo?.type === 'struct') {
        affordance?.define?.arrayInfo?.specs?.forEach((item: any) => {
          selectOptions_dataID_00_aa.value.options.push({
            label: item.name || '',
            value: item.identifier,
          });
        });
      }
    }

    if (affordance?.define?.type === 'struct') {
      affordance?.define?.specs?.forEach((item: any) => {
        selectOptions_dataID_aa.value.options.push({
          label: item.name || '',
          value: item.identifier,
        });
      });
    }

    if (affordance?.params?.length > 0) {
      affordance?.params?.forEach((item: any) => {
        selectOptions_dataID_bb.value.options.push({
          label: item.name || '',
          value: item.identifier,
        });
      });
    }
  }
}

function handleColumnDataID_bb_Change(row: any) {
  selectOptions_dataID_bb_cc.value.options = [];
  const current_schema = schemaList.value.filter(
    (item) => item.type === 2 && item.identifier === row.device.dataID_bb,
  );
  const affordance = JSON.parse(current_schema[0]?.affordance || '{}');

  if (affordance?.params?.length > 0) {
    const current_param = affordance?.params?.find(
      (item: any) => item.identifier === row.device.dataID_bb_cc,
    );
    if (
      current_param &&
      current_param?.define?.type === 'enum' &&
      current_param?.define?.mapping
    ) {
      const mapping = current_param?.define?.mapping;
      Object.keys(mapping).forEach((item: any) => {
        selectOptions_dataID_bb_cc.value.options.push({
          label: mapping[item] || '',
          value: item,
        });
      });
    }
  }
}

const deviceColumnOptions = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});

const deviceTermsTermTypeProps = localizedSceneState(() => ({
  options: [
    { label: $t('orgManage.flow.opEq'), value: 'eq' },
    { label: $t('orgManage.flow.opNe'), value: 'not' },
    { label: $t('scene.ui.betweenAAndB_945de4'), value: 'btw' },
    { label: $t('orgManage.flow.opGt'), value: 'gt' },
    { label: $t('orgManage.flow.opGte'), value: 'gte' },
    { label: $t('orgManage.flow.opLt'), value: 'lt' },
    { label: $t('orgManage.flow.opLte'), value: 'lte' },
    { label: $t('scene.ui.amongAAndBValues'), value: 'in' },
    { label: $t('orgIotClient.console.all'), value: 'all' },
  ],
}));

function updateDeviceSelectOptions(row: Trigger) {
  deviceDeviceNameOptions.value.loading = true;
  Api.deviceIndex({
    page: { page: 1, size: 1000 },
    productID: row.device?.productID,
    ...(row.device?.deviceName
      ? { deviceName: row.device?.deviceName }
      : {}),
  })
    .then((res) => {
      deviceDeviceNameOptions.value.options = res.list.map((item: any) => ({
        label: item.deviceAlias + '(' + item.deviceName + ')',
        value: item.deviceName,
      }));
    })
    .finally(() => {
      deviceDeviceNameOptions.value.loading = false;
    });
}
</script>

<template>
  <NConfigProvider :locale="tokenLocale">
    <ProFormList
      :title="$t('orgManage.cloneGroup.triggerRuleCol')"
      path="if.triggers"
      :creator-initial-value="
        () => ({
          type: 'timer',
          timer: { execType: 'at', repeatType: 'allDay' },
        })
      "
      :creator-button-props="{ content: $t('scene.ui.addTriggerRule') }"
      :action-guard="{ beforeAddRow: () => true }"
    >
      <template #action="{ index, action, actionDom }">
        <NButton text @click="action.moveUp(index)">
          <span class="icon-[mdi--arrow-up]" style="font-size: 20px"></span>
        </NButton>
        <NButton text @click="action.moveDown(index)">
          <span class="icon-[mdi--arrow-down]" style="font-size: 20px"></span>
        </NButton>
        <component :is="actionDom" />
      </template>

      <template #container="{ listDom, creatorButtonDom }">
        <transition-group
          tag="div"
          name="fade"
          move-class="list-move"
          enter-active-class="list-enter-active"
          leave-active-class="list-leave-active"
          enter-from-class="list-enter-from"
          leave-to-class="list-leave-to"
        >
          <template v-for="comp in listDom" :key="comp.key">
            <div>
              <component :is="comp" />
            </div>
          </template>
        </transition-group>
        <component :is="creatorButtonDom" />
      </template>

      <template #default="{ row }">
        <NGrid cols="3 s:1 m:1 l:3 xl:3 2xl:4" responsive="screen" class="pl-4">
          <NGridItem>
            <ProSelect
              :label="$t('scene.ui.ruleType')"
              path="type"
              :field-props="triggersTypeSelectProps"
              style="width: 150px"
              @change="triggerTypeChange(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'timer'">
            <ProRadioGroup
              :title="$t('scene.ui.executionMethod')"
              path="timer.execType"
              :field-props="nRadioProps"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'timer' && row.timer?.execType === 'at'">
            <ProTime :title="$t('scene.ui.timePoint')" path="timer.execAt" required />
          </NGridItem>
          <NGridItem v-if="row.type === 'timer'">
            <ProSelect
              :label="$t('scene.ui.sunriseTime')"
              path="timer.execAdd"
              :field-props="triggersTimerExecAddSunRisesProps"
              style="width: 150px"
              :visible="row.timer?.execType === 'sunRises'"
              required
            />
            <ProSelect
              :label="$t('scene.ui.sunsetTime')"
              path="timer.execAdd"
              :field-props="triggersTimerExecAddSunSetProps"
              style="width: 150px"
              :visible="row.timer?.execType === 'sunSet'"
              required
            />
            <ProDigit
              v-if="row.timer?.execType === 'loop'"
              :title="$t('orgManage.cloneGroup.intervalLabel')"
              path="timer.execLoop"
              :field-props="execLoopDigitProps"
              style="width: 270px"
              required
            >
              <template #prefix>{{ $t('scene.ui.every') }}</template>
              <template #suffix>
                <NSelect
                  :options="nSelectProps2"
                  v-model:value="value"
                  :consistent-menu-width="true"
                  style="width: 80px"
                />
              </template>
            </ProDigit>
          </NGridItem>

          <NGridItem v-if="row.type === 'timer'" span="4">
            <ProRadioGroup
              :title="$t('scene.ui.repeat')"
              path="timer.repeatType"
              :field-props="timerRepeatTypeProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'timer' && row.timer?.repeatType === 'week'">
            <ProCheckboxGroup
              :title="$t('scene.ui.selectTheDayOfTheWeek')"
              path="timer.execRepeat"
              :field-props="triggersTimerExecRepeatWeekProps"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'timer' && row.timer?.repeatType === 'mount'">
            <ProCheckboxGroup
              :title="$t('scene.ui.selectMonth')"
              path="timer.execRepeat"
              :field-props="triggersTimerExecRepeatMonthProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'weather'">
            <ProRadioGroup
              path="weather.type"
              :field-props="weatherTypeProps"
              style="width: 150px"
              :title="$t('scene.ui.weatherType')"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'weather'">
            <ProSelect
              path="weather.termType"
              :title="$t('scene.ui.dynamicConditionType')"
              :field-props="weatherTermTypeProps"
              style="width: 150px"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'weather' && row.weather?.type === 'temp'">
            <ProDigit
              path="weather.values[0]"
              style="width: 180px"
              :title="$t('scene.ui.temperatureValue')"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'weather' && row.weather?.type === 'humidity'">
            <ProDigit
              path="weather.values[0]"
              style="width: 180px"
              :title="$t('scene.ui.humidityValueA')"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.type === 'weather' && row.weather?.type === 'humidity'">
            <ProDigit
              path="weather.values[1]"
              style="width: 180px"
              :title="$t('scene.ui.humidityValueB')"
            />
          </NGridItem>
        </NGrid>

        <!-- 设备触发器 -->
        <NGrid
          cols="3 s:1 m:1 l:3 xl:3 2xl:4"
          responsive="screen"
          v-if="row.type === 'device'"
          class="pl-4"
        >
          <NGridItem>
            <ProSelect
              :field-props="deviceProductIDProps"
              path="device.productID"
              :title="$t('scene.ui.selectProduct')"
              style="width: 200px"
              @change="handleProductSelect(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.device?.productID">
            <ProSelect
              :field-props="deviceSelectTypeProps"
              path="device.selectType"
              :title="$t('scene.ui.deviceSelectionMethod')"
              style="width: 200px"
              @change="handleDeviceSelectTypeChange(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.device?.selectType === 'fixed'">
            <ProSelect
              :title="$t('scene.ui.selectTheSpecifiedDevice')"
              path="device.deviceName"
              style="width: 200px"
              :field-props="deviceDeviceNameOptions"
              @change="handleDeviceSelect(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.device?.selectType === 'area'">
            <ProSelect
              :title="$t('orgEnergy.ui.selectArea')"
              path="device.areaID"
              style="width: 200px"
              :field-props="deviceAreaIDProps"
              @change="handleAreaIDChange(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.device?.selectType === 'group'">
            <ProSelect
              :title="$t('scene.ui.selectDeviceGroup')"
              path="device.groupID"
              style="width: 200px"
              :field-props="deviceGroupIDProps"
              @change="handleGroupIDChange(row)"
              required
            />
          </NGridItem>
          <NGridItem v-if="row.device?.selectType">
            <ProRadioGroup
              :field-props="deviceModeProps"
              path="device.mode"
              :title="$t('scene.ui.triggerMode')"
              required
              @change="handleModeChange(row)"
            />
          </NGridItem>
          <NGridItem v-if="row.device?.mode">
            <ProRadioGroup
              :field-props="deviceTypeRefProps"
              path="device.type"
              :title="$t('orgManage.cloneGroup.triggerTypeLabel')"
              required
              @change="handleDeviceTypeChange(row)"
            />
          </NGridItem>
        </NGrid>

        <!-- 属性/事件路径选择 -->
        <NFlex class="pl-4 pr-4">
          <ProSelect
            path="device.dataID_data"
            :title="$t('scene.ui.propertyEventPath')"
            style="width: 200px"
            :field-props="selectOptions_dataID"
            required
            v-if="selectOptions_dataID.options.length > 0"
            @change="handleColumnDataIDChange(row)"
          />
          <ProSelect
            path="device.dataID_00"
            :title="$t('scene.ui.arrayIndex')"
            style="width: 200px"
            :field-props="selectOptions_dataID_00"
            required
            v-if="selectOptions_dataID_00.options.length > 0"
          />
          <ProSelect
            path="device.dataID_00_aa"
            :title="$t('scene.ui.arrayIndexStructure')"
            style="width: 200px"
            :field-props="selectOptions_dataID_00_aa"
            required
            v-if="selectOptions_dataID_00_aa.options.length > 0"
          />
          <ProSelect
            path="device.dataID_aa"
            :title="$t('iotApp.schemaForm.dataTypeStruct')"
            style="width: 200px"
            :field-props="selectOptions_dataID_aa"
            required
            v-if="selectOptions_dataID_aa.options.length > 0"
          />
          <ProSelect
            path="device.dataID_bb"
            :title="$t('scene.ui.eventPathDataBb')"
            style="width: 200px"
            :field-props="selectOptions_dataID_bb"
            required
            v-if="selectOptions_dataID_bb.options.length > 0"
            @change="handleColumnDataID_bb_Change(row)"
          />
          <ProSelect
            path="device.dataID_bb_cc"
            :title="$t('scene.ui.eventPathDataBbCc')"
            style="width: 200px"
            :field-props="selectOptions_dataID_bb_cc"
            required
            v-if="selectOptions_dataID_bb_cc.options.length > 0"
          />
        </NFlex>

        <!-- 条件值 -->
        <NGrid cols="4 s:1 m:1 l:4 xl:4 2xl:4" responsive="screen" class="pl-4">
          <NGridItem>
            <ProSelect
              path="device.termType"
              :title="$t('scene.ui.conditionType')"
              style="width: 200px"
              :field-props="deviceTermsTermTypeProps"
              required
              v-if="
                row.device?.type === 'propertyReport' ||
                row.device?.type === 'eventReport'
              "
            />
          </NGridItem>
          <NGridItem>
            <ProDigit
              path="device.values[0]"
              :title="$t('scene.ui.conditionValue')"
              style="width: 200px"
              required
              v-if="
                row.device?.type === 'propertyReport' ||
                row.device?.type === 'eventReport'
              "
            />
          </NGridItem>
          <NGridItem>
            <ProDigit
              path="device.values[1]"
              :title="$t('scene.ui.conditionValue')"
              style="width: 200px"
              v-if="
                row.device?.type === 'propertyReport' ||
                row.device?.type === 'eventReport'
              "
            />
          </NGridItem>
        </NGrid>
      </template>

      <template #item="{ itemDom, actionDom, row }">
        <ProCard
          :title="triggersTitle(row)"
          class="mb-4"
          content-style="padding: 0px; margin: 0px;"
        >
          <component :is="itemDom" />
          <template #header-extra>
            <component
              :is="actionDom"
              style="display: flex; margin-right: 20px"
            />
          </template>
        </ProCard>
      </template>
    </ProFormList>
  </NConfigProvider>
</template>

<style>
.list-move {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}
</style>
