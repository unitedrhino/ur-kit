<script setup lang="ts">
import { localizedSceneState } from '../locales';

import { $t } from '@vben/locales';
import { computed, ref, type Ref } from 'vue';
import { useProduct } from '@vben/stores';
import { ThingsApi } from '@vben/api';
import {
  ProFormList,
  ProInput,
  ProSelect,
  useInjectProForm,
  ProCard,
  ProTime,
  ProDigit,
} from 'pro-naive-ui';

import {
  NConfigProvider,
  NFlex,
  NGrid,
  NGridItem,
} from 'naive-ui';

import { preferences } from '@vben/preferences';
import { zhCN, enUS } from 'pro-naive-ui';

import type {
  CmpType,
  SceneInfo,
  Term,
} from '../scene-types';

import { Api } from '../index.api';
import CustomRange from './custom_range.vue';

const { getProductOptions } = useProduct();

const { values } = useInjectProForm<SceneInfo>()!;

const tokenLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? zhCN : enUS,
);

const weatherTypeProps = localizedSceneState(() => ({
  type: 'button' as const,
  options: [
    { label: $t('iotApp.productPage.temperature'), value: 'temp' },
    { label: $t('scene.ui.humidity'), value: 'humidity' },
  ],
}));

const deviceProductIDProps = computed(() => ({
  options: getProductOptions(),
}));

const deviceNameSelectOptions = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});

function handleProductIDChange(row: any) {
  if (row.property?.deviceName) {
    row.property.deviceName = undefined!;
  }

  if (row.property?.productID) {
    deviceNameSelectOptions.value.loading = true;
    Api.deviceIndex({
      page: { page: 1, size: 1000 },
      productID: row.property?.productID,
    })
      .then((res) => {
        deviceNameSelectOptions.value.options = res.list.map((item: any) => ({
          label: item.deviceAlias + '(' + item.deviceName + ')',
          value: item.deviceName,
        }));
      })
      .finally(() => {
        deviceNameSelectOptions.value.loading = false;
      });
  }
}

const whenConditionsTypeSelectProps = localizedSceneState(() => ({
  clearable: true,
  options: [
    { label: $t('scene.ui.any'), value: 'or' },
    { label: $t('scene.ui.all'), value: 'and' },
  ],
}));

const whenConditionsColumnTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('iotApp.dataFlow.propLabel'), value: 'property' },
    { label: $t('scene.ui.weather'), value: 'weather' },
    { label: $t('orgEnergy.ui.time'), value: 'time' },
  ],
}));

const whenConditionsTermTypeSelectProps = localizedSceneState(() => ({
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

const timeTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.systemTime'), value: 'sys' },
    { label: $t('scene.ui.sunrise'), value: 'sunRises' },
    { label: $t('scene.ui.sunset'), value: 'sunSet' },
  ],
}));

const whenTitle = () => {
  return $t('scene.ui.executionConditions');
};

const whenConditionsTermTypeChange = (row: Term) => {
  if (row.weather?.type === 'humidity') {
    row.weather.termType = 'btw' as CmpType;
    row.weather.values = ['0', '40'];
  }
  if (row.weather?.type === 'temp') {
    row.weather.termType = 'gt' as CmpType;
    row.weather.values = ['20'];
  }
};

const cardShow = ref(false);

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

const schemaList: Ref<
  ThingsApi.DeviceSchema[] | ThingsApi.ProductSchemaInfo[]
> = ref([]);

function updateSchemaList(row: any) {
  if (row.property?.deviceName && row.property?.productID) {
    Api.deviceSchemaIndex({
      productID: row.property.productID,
      deviceName: row.property.deviceName,
      type: 1,
    }).then((res) => {
      schemaList.value = res.list;

      // reset all path options
      [
        selectOptions_dataID,
        selectOptions_dataID_00,
        selectOptions_dataID_00_aa,
        selectOptions_dataID_aa,
        selectOptions_dataID_bb,
        selectOptions_dataID_bb_cc,
      ].forEach((opt) => {
        opt.value.options = [];
      });

      [
        'column_data',
        'column_data_00',
        'column_data_00_aa',
        'column_data_aa',
        'column_data_bb',
        'column_data_bb_cc',
      ].forEach((key) => {
        if (row?.[key]) row[key] = '';
      });

      schemaList.value.forEach((item) => {
        selectOptions_dataID.value.options.push({
          label: item.name || '',
          value: item.identifier,
        });
      });
    });
  }
}

function handleDeviceNameChange(row: any) {
  if (row.property?.productID) {
    updateSchemaList(row);
  }
}

function handleColumnDataIDChange(_row: any, row_cmp: any) {
  [
    selectOptions_dataID_00,
    selectOptions_dataID_00_aa,
    selectOptions_dataID_aa,
    selectOptions_dataID_bb,
    selectOptions_dataID_bb_cc,
  ].forEach((opt) => {
    opt.value.options = [];
  });

  const current_schema = schemaList.value.find(
    (item) => item.identifier === row_cmp.column_data,
  );
  const affordance = JSON.parse(current_schema?.affordance || '{}');

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
    affordance?.params?.forEach((item: any) => {
      selectOptions_dataID_bb_cc.value.options.push({
        label: item.name || '',
        value: item.identifier,
      });
    });
  }
}

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
</script>

<template>
  <NConfigProvider :locale="tokenLocale">
    <div class="mb-2">{{ $t('scene.ui.executionConditions') }}</div>
    <ProCard
      :title="whenTitle"
      class="mb-4"
      content-style="padding: 0px; margin: 0px;"
      :show="cardShow"
    >
      <NGrid
        cols="1 s:1 m:2 l:3 xl:3 2xl:4"
        responsive="screen"
        class="pl-4 pr-4"
      >
        <NGridItem>
          <ProSelect
            path="when.conditions.type"
            :title="$t('scene.ui.conditionType')"
            :field-props="whenConditionsTypeSelectProps"
            style="width: 150px"
          />
        </NGridItem>

        <NGridItem span="4" v-if="values?.when?.conditions?.type">
          <ProFormList
            :title="$t('scene.ui.whatConditionsAreMetForExecution')"
            path="when.conditions.terms"
            :creator-button-props="{ content: $t('scene.ui.addConditions') }"
            required
          >
            <template
              #default="{
                row: conditions_row,
              }"
            >
              <NGrid
                cols="1 s:1 m:3 l:3 xl:4 2xl:4"
                responsive="screen"
                class="pl-4"
              >
                <NGridItem>
                  <ProSelect
                    path="columnType"
                    :title="$t('scene.ui.conditionType')"
                    :field-props="whenConditionsColumnTypeSelectProps"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'property'">
                  <ProSelect
                    :field-props="deviceProductIDProps"
                    path="property.productID"
                    :title="$t('scene.ui.selectProduct')"
                    style="width: 200px"
                    @change="handleProductIDChange(conditions_row)"
                    required
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'property'">
                  <ProSelect
                    :title="$t('scene.ui.selectTheSpecifiedDevice')"
                    path="property.deviceName"
                    style="width: 200px"
                    :field-props="deviceNameSelectOptions"
                    required
                    @change="handleDeviceNameChange(conditions_row)"
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'weather'">
                  <ProSelect
                    path="weather.type"
                    :title="$t('scene.ui.typeOfWeather')"
                    :field-props="weatherTypeProps"
                    style="width: 150px"
                    @change="
                      whenConditionsTermTypeChange(conditions_row)
                    "
                    required
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'weather'">
                  <ProSelect
                    path="weather.termType"
                    :title="$t('scene.ui.dynamicConditionType')"
                    :field-props="whenConditionsTermTypeSelectProps"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'weather' &&
                    conditions_row?.weather?.type === 'temp'
                  "
                >
                  <ProInput
                    path="weather.values[0]"
                    :title="$t('scene.ui.conditionValueA')"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'weather' &&
                    conditions_row?.weather?.type === 'humidity'
                  "
                >
                  <ProInput
                    path="weather.values[0]"
                    :title="$t('scene.ui.conditionValueA')"
                    style="width: 160px"
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'weather' &&
                    conditions_row?.weather?.type === 'humidity'
                  "
                >
                  <ProInput
                    path="weather.values[1]"
                    :title="$t('scene.ui.conditionValueB')"
                    style="width: 160px"
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'time'">
                  <ProSelect
                    path="time.type"
                    :title="$t('scene.ui.typeOfTime')"
                    :field-props="timeTypeSelectProps"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem v-if="conditions_row.columnType === 'time'">
                  <ProSelect
                    path="time.termType"
                    :title="$t('scene.ui.dynamicConditionType')"
                    :field-props="whenConditionsTermTypeSelectProps"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'time' &&
                    conditions_row?.time?.type === 'sys'
                  "
                >
                  <ProTime
                    path="time.values[0]"
                    :title="$t('scene.ui.conditionValueA')"
                    style="width: 150px"
                    required
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'time' &&
                    conditions_row?.time?.type === 'sys'
                  "
                >
                  <ProTime
                    path="time.values[1]"
                    :title="$t('scene.ui.conditionValueB')"
                    style="width: 150px"
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'time' &&
                    conditions_row?.time?.type !== 'sys'
                  "
                >
                  <ProDigit
                    path="time.values[0]"
                    :title="$t('scene.ui.conditionValueA')"
                    style="width: 180px"
                    required
                  />
                </NGridItem>

                <NGridItem
                  v-if="
                    conditions_row.columnType === 'time' &&
                    conditions_row?.time?.type !== 'sys'
                  "
                >
                  <ProDigit
                    path="time.values[1]"
                    :title="$t('scene.ui.conditionValueB')"
                    style="width: 180px"
                  />
                </NGridItem>
              </NGrid>

              <!-- 属性路径选择 -->
              <NFlex class="pl-4 pr-4">
                <ProSelect
                  path="property.column_data"
                  :title="$t('scene.ui.propertyEventPath')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID"
                  required
                  v-if="selectOptions_dataID.options.length > 0"
                  @change="
                    handleColumnDataIDChange(values, conditions_row)
                  "
                />
                <ProSelect
                  path="property.column_data_00"
                  :title="$t('scene.ui.arrayIndex')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID_00"
                  required
                  v-if="selectOptions_dataID_00.options.length > 0"
                />
                <ProSelect
                  path="property.column_data_00_aa"
                  :title="$t('scene.ui.arrayIndexStructure')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID_00_aa"
                  required
                  v-if="selectOptions_dataID_00_aa.options.length > 0"
                />
                <ProSelect
                  path="property.column_data_aa"
                  :title="$t('iotApp.schemaForm.dataTypeStruct')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID_aa"
                  required
                  v-if="selectOptions_dataID_aa.options.length > 0"
                />
                <ProSelect
                  path="property.column_data_bb"
                  :title="$t('scene.ui.eventPathDataBb')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID_bb"
                  required
                  v-if="selectOptions_dataID_bb.options.length > 0"
                  @change="
                    handleColumnDataIDChange(values, conditions_row)
                  "
                />
                <ProSelect
                  path="property.column_data_bb_cc"
                  :title="$t('scene.ui.eventPathDataBbCc')"
                  style="width: 200px"
                  :field-props="selectOptions_dataID_bb_cc"
                  required
                  v-if="selectOptions_dataID_bb_cc.options.length > 0"
                />
              </NFlex>

              <!-- 条件值 -->
              <NGrid
                cols="4 s:1 m:1 l:4 xl:4 2xl:4"
                responsive="screen"
                class="pl-4"
              >
                <NGridItem>
                  <ProSelect
                    path="property.termType"
                    :title="$t('scene.ui.conditionType')"
                    style="width: 200px"
                    :field-props="deviceTermsTermTypeProps"
                    required
                  />
                </NGridItem>
                <NGridItem>
                  <ProDigit
                    path="property.values[0]"
                    :title="$t('scene.ui.conditionValue')"
                    style="width: 200px"
                    required
                  />
                </NGridItem>
                <NGridItem>
                  <ProDigit
                    path="property.values[1]"
                    :title="$t('scene.ui.conditionValue')"
                    style="width: 200px"
                  />
                </NGridItem>
              </NGrid>
            </template>

            <template #item="{ itemDom, actionDom }">
              <ProCard
                :title="$t('orgManage.cloneGroup.conditionPlaceholder')"
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
        </NGridItem>

        <!-- 生效时间段 -->
        <NGridItem span="4" v-if="values?.when?.conditions?.type">
          <ProFormList
            :title="$t('scene.ui.effectiveTimePeriod')"
            path="when.validRanges"
            :creator-button-props="{ content: $t('scene.ui.addEffectiveTimePeriod') }"
          >
            <template
              #default="{
                row: validRanges_row,
              }"
            >
              <CustomRange
                :row="validRanges_row"
                :row_name="$t('scene.ui.effectiveTimePeriod')"
              />
            </template>

            <template #item="{ itemDom, actionDom }">
              <ProCard
                :title="$t('scene.ui.effectiveTimePeriod')"
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
        </NGridItem>

        <!-- 无效时间段 -->
        <NGridItem span="4" v-if="values?.when?.conditions?.type">
          <ProFormList
            :title="$t('scene.ui.invalidTimePeriod')"
            path="when.invalidRanges"
            :creator-button-props="{ content: $t('scene.ui.addInvalidTimePeriod') }"
          >
            <template
              #default="{
                row: invalidRanges_row,
              }"
            >
              <CustomRange
                :row="invalidRanges_row"
                :row_name="$t('scene.ui.invalidTimePeriod')"
              />
            </template>

            <template #item="{ itemDom, actionDom }">
              <ProCard
                :title="$t('scene.ui.invalidTimePeriod')"
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
        </NGridItem>
      </NGrid>
    </ProCard>
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
