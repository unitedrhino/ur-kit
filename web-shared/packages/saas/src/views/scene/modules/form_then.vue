<script setup lang="ts">
import { localizedSceneState } from '../locales';

import { $t } from '@vben/locales';
import { computed, ref, type Ref } from 'vue';
import { useProduct, useArea, useGroup } from '@vben/stores';
import { ThingsApi } from '@vben/api';
import {
  ProFormList,
  ProInput,
  ProSelect,
  ProDigit,
  ProCard,
} from 'pro-naive-ui';

import {
  NConfigProvider,
  NButton,
  NFlex,
  NGrid,
  NGridItem,
} from 'naive-ui';

import { preferences } from '@vben/preferences';
import { zhCN, enUS } from 'pro-naive-ui';

import type { CmpType, Trigger, Action } from '../scene-types';

import { Api } from '../index.api';

const { getProductOptions } = useProduct();
const { getAreaOptions } = useArea();
const { getGroupOptions } = useGroup();

const tokenLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? zhCN : enUS,
);

const actionTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.delay'), value: 'delay' },
    { label: $t('scene.ui.deviceOutput'), value: 'device' },
    { label: $t('orgIotClient.deviceLogs.toneAlert'), value: 'alarm' },
    { label: $t('scene.ui.executeAnotherScene'), value: 'scene' },
  ],
}));

const deviceProductIDProps = computed(() => ({
  options: getProductOptions(),
}));

const deviceAreaIDProps = computed(() => ({
  options: getAreaOptions(),
}));

const deviceGroupIDProps = computed(() => ({
  options: getGroupOptions(),
}));

const deviceNameSelectSearchLoading = ref(false);
const deviceNameSelectSearchOptions = ref<{ label: string; value: string }[]>(
  [],
);
const deviceDeviceNameProps = (row: Trigger) => ({
  filterable: true,
  clearable: true,
  remote: true,
  loading: deviceNameSelectSearchLoading.value,
  options: deviceNameSelectSearchOptions.value,
  onSearch: (query: string) => {
    if (!query.length) {
      deviceNameSelectSearchOptions.value = [];
      return;
    }

    deviceNameSelectSearchLoading.value = true;
    Api.deviceIndex({
      page: { page: 1, size: 1000 },
      productID: row.device?.productID,
      deviceAlias: query,
    })
      .then((res) => {
        deviceNameSelectSearchOptions.value = res.list.map((item: any) => ({
          label: item.deviceAlias + '(' + item.deviceName + ')',
          value: item.deviceName,
        }));
      })
      .finally(() => {
        deviceNameSelectSearchLoading.value = false;
      });
  },
});

const deviceSelectTypeProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.allDevicesUnderTheProduct'), value: 'all' },
    { label: $t('scene.ui.specifiedEquipmentUnderTheProduct'), value: 'fixed' },
    { label: $t('scene.ui.devicesUnderTheArea'), value: 'area' },
    { label: $t('scene.ui.devicesUnderTheDeviceGroup'), value: 'group' },
  ],
}));

const triggerTypeChange = (row: Trigger) => {
  if (row.type === 'weather') {
    row.weather = {
      type: 'temp',
      termType: 'temp' as CmpType,
      values: ['20'],
    };
  }
};

const alarmModeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.triggerAlarm'), value: 'trigger' },
    { label: $t('scene.ui.clearAlarm'), value: 'relieve' },
  ],
}));

const sceneSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.manualControlName1'), value: 'scene_id_1' },
    { label: $t('scene.ui.automationName'), value: 'scene_id_2' },
  ],
}));

const sceneTypeSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('scene.ui.manualControl'), value: 'manual' },
    { label: $t('orgIotClient.routes.automation'), value: 'auto' },
  ],
}));

const sceneStatusSelectProps = localizedSceneState(() => ({
  options: [
    { label: $t('orgIotClient.console.on'), value: '1' },
    { label: $t('orgIotClient.console.off'), value: '0' },
  ],
}));

const delayDigitProps = { min: 0 };

const actionsTitle = (row: Action) => {
  let title = $t('scene.ui.executeAction');
  if (row.type === 'delay') {
    title += ` ${$t('scene.ui.delay')} ` + (row.delay ? row.delay + ` ${$t('orgManage.cloneGroup.unitSeconds')}` : ` `);
  }
  if (row.type === 'alarm') {
    if (row.alarm?.mode === 'trigger') title += ` ${$t('scene.ui.triggerAlarm')}`;
    if (row.alarm?.mode === 'relieve') title += ` ${$t('scene.ui.clearAlarm')}`;
  }
  if (row.type === 'scene') {
    if (row.scene?.sceneType === 'manual') title += ` ${$t('scene.ui.manualControl')}`;
    if (row.scene?.sceneType === 'auto') title += ` ${$t('orgIotClient.routes.automation')}`;
    title +=
      ' ' +
      (row.scene?.sceneID
        ? sceneSelectProps.options.find(
            (item) => item.value === (row.scene?.sceneID || ''),
          )?.label
        : ` `);
    title +=
      ' ' +
      (row.scene?.status
        ? sceneStatusSelectProps.options.find(
            (item) => item.value === (row.scene?.status || ''),
          )?.label
        : ` `);
  }
  if (row.type === 'device') {
    title +=
      ` ${$t('orgIotClient.console.devices')} ` + (row.device?.deviceName ? row.device?.deviceName : ` `);
  }
  return title;
};

const handleProductIDChange = (row: Action) => {
  if (row.device?.selectType) {
    row.device.selectType = undefined!;
  }
  updateSchemaList(row);
};

const handleSelectTypeChange = (row: Action) => {
  if (row.device?.deviceName) row.device.deviceName = undefined!;
  if (row.device?.areaID) row.device.areaID = undefined!;
  if (row.device?.groupID) row.device.groupID = undefined!;

  if (row.device?.selectType === 'fixed' && row.device?.productID) {
    updateDeviceNameSelectOptions(row);
  }
};

function updateDataID_data_Props(_row: Action) {
  dataID_data_Props.value.options = [];
  schemaList.value.forEach((item) => {
    dataID_data_Props.value.options.push({
      label: item.name || '',
      value: item.identifier,
    });
  });
}

const handleDeviceNameChange = (row: Action) => {
  updateSchemaList(row);
};

const schemaList: Ref<
  ThingsApi.DeviceSchema[] | ThingsApi.ProductSchemaInfo[]
> = ref([]);

function updateSchemaList(row: Action) {
  if (row.device?.productID && row.device?.deviceName) {
    Api.deviceSchemaIndex({
      productID: row.device.productID,
      deviceName: row.device.deviceName,
      type: 1,
    })
      .then((res) => {
        schemaList.value = res.list;
        updateDataID_data_Props(row);
      });
  } else if (row.device?.productID) {
    Api.productSchemaIndex({
      productID: row.device.productID,
      type: 1,
    })
      .then((res) => {
        schemaList.value = res.list;
        updateDataID_data_Props(row);
      });
  }
}

const updateDeviceNameSelectOptions = (row: Action) => {
  if (
    row.type === 'device' &&
    row.device?.productID &&
    row.device?.selectType === 'fixed'
  ) {
    Api.deviceIndex({
      page: { page: 1, size: 1000 },
      productID: row.device.productID,
    })
      .then((res) => {
        deviceNameSelectSearchOptions.value = res.list.map((item: any) => ({
          label: item.deviceAlias + '(' + item.deviceName + ')',
          value: item.deviceName,
        }));
      })
      .finally(() => {
        deviceNameSelectSearchLoading.value = false;
      });
  }
};

const dataID_data_Props = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const dataID_data_00_Props = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const dataID_data_00_aa_Props = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});
const dataID_data_aa_Props = ref({
  options: [] as { label: string; value: string }[],
  clearable: true,
  filterable: true,
  loading: false,
});

function updateDataID_data_child_Props(row_value: any) {
  dataID_data_00_Props.value.options = [];
  dataID_data_00_aa_Props.value.options = [];
  dataID_data_aa_Props.value.options = [];

  const identifier = row_value.dataID_data;
  const current_schema = schemaList.value.find(
    (item) => item.identifier === identifier,
  );
  const affordance = JSON.parse(current_schema?.affordance || '{}');

  if (affordance?.define?.type === 'array') {
    const max = affordance?.define?.max || 10;
    for (let i = 0; i < max; i++) {
      dataID_data_00_Props.value.options.push({
        label: $t('scene.ui.index') + i,
        value: i.toString(),
      });
    }
    if (affordance?.define?.arrayInfo?.type === 'struct') {
      affordance?.define?.arrayInfo?.specs?.forEach((item: any) => {
        dataID_data_00_aa_Props.value.options.push({
          label: item.name || '',
          value: item.identifier,
        });
      });
    }
  }

  if (affordance?.define?.type === 'struct') {
    affordance?.define?.specs?.forEach((item: any) => {
      dataID_data_aa_Props.value.options.push({
        label: item.name || '',
        value: item.identifier,
      });
    });
  }
}

function handleDataID_data_Change(row_value: Action) {
  updateDataID_data_child_Props(row_value);
}
</script>

<template>
  <NConfigProvider :locale="tokenLocale">
    <ProFormList
      style="display: flex; flex-flow: column nowrap"
      :title="$t('scene.ui.executeAction')"
      path="then.actions"
      :creator-button-props="{ content: $t('scene.ui.addExecutionAction') }"
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
        <NGrid
          cols="3 s:1 m:1 l:3 xl:4 2xl:4"
          responsive="screen"
          class="pl-4"
        >
          <NGridItem>
            <ProSelect
              :label="$t('scene.ui.actuatorType')"
              path="type"
              :field-props="actionTypeSelectProps"
              style="width: 150px"
              @change="triggerTypeChange(row)"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'delay'">
            <ProDigit
              path="delay"
              :title="$t('scene.ui.delayTime')"
              style="width: 200px"
              :field-props="delayDigitProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'alarm'">
            <ProSelect
              path="alarm.mode"
              :title="$t('scene.ui.alarmMode')"
              style="width: 150px"
              :field-props="alarmModeSelectProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'scene'">
            <ProSelect
              path="scene.sceneType"
              :title="$t('scene.ui.sceneType')"
              style="width: 150px"
              :field-props="sceneTypeSelectProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'scene'">
            <ProSelect
              path="scene.sceneID"
              :title="$t('scene.ui.selectScene')"
              style="width: 150px"
              :field-props="sceneSelectProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.type === 'scene'">
            <ProSelect
              path="scene.status"
              :title="$t('scene.ui.sceneStatus')"
              style="width: 150px"
              :field-props="sceneStatusSelectProps"
              required
            />
          </NGridItem>
        </NGrid>

        <NGrid
          cols="3 s:1 m:1 l:3 xl:4 2xl:4"
          responsive="screen"
          class="pl-4"
          v-if="row.type === 'device'"
        >
          <NGridItem>
            <ProSelect
              :field-props="deviceProductIDProps"
              path="device.productID"
              :title="$t('scene.ui.selectProduct')"
              style="width: 200px"
              @change="handleProductIDChange(row)"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.device?.productID">
            <ProSelect
              :field-props="deviceSelectTypeProps"
              path="device.selectType"
              :title="$t('scene.ui.deviceSelectionMethod')"
              style="width: 200px"
              @change="handleSelectTypeChange(row)"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.device?.selectType === 'fixed'">
            <ProSelect
              :title="$t('scene.ui.selectTheSpecifiedDevice')"
              path="device.deviceName"
              style="width: 200px"
              :field-props="deviceDeviceNameProps(row)"
              required
              @change="handleDeviceNameChange(row)"
            />
          </NGridItem>

          <NGridItem v-if="row.device?.selectType === 'area'">
            <ProSelect
              :title="$t('orgEnergy.ui.selectArea')"
              path="device.areaID"
              style="width: 200px"
              :field-props="deviceAreaIDProps"
              required
            />
          </NGridItem>

          <NGridItem v-if="row.device?.selectType === 'group'">
            <ProSelect
              :title="$t('scene.ui.selectDeviceGroup')"
              path="device.groupID"
              style="width: 200px"
              :field-props="deviceGroupIDProps"
              required
            />
          </NGridItem>
        </NGrid>

        <!-- 设备控制参数 -->
        <div class="pl-4 pr-4">
          <ProFormList
            path="device.values"
            :title="$t('scene.ui.addControlParameters')"
            required
            v-if="
              row.device?.selectType === 'all' ||
              row.device?.deviceName ||
              row.device?.areaID ||
              row.device?.groupID
            "
            :creator-button-props="{ content: $t('scene.ui.addControlParameters') }"
          >
            <template #default="{ row: row_value }">
              <NFlex class="pl-4 pr-4">
                <ProSelect
                  path="dataID_data"
                  :title="$t('scene.ui.generalAttributes')"
                  style="width: 200px"
                  :field-props="dataID_data_Props"
                  @change="handleDataID_data_Change(row_value)"
                  required
                />

                <ProSelect
                  path="dataID_data_00"
                  :title="$t('scene.ui.arrayIndex')"
                  style="width: 200px"
                  :field-props="dataID_data_00_Props"
                  v-if="dataID_data_00_Props.options.length > 0"
                  required
                />

                <ProSelect
                  path="dataID_data_00_aa"
                  :title="$t('scene.ui.indexStructure')"
                  style="width: 200px"
                  :field-props="dataID_data_00_aa_Props"
                  v-if="dataID_data_00_aa_Props.options.length > 0"
                  required
                />

                <ProSelect
                  path="dataID_data_aa"
                  :title="$t('iotApp.schemaForm.dataTypeStruct')"
                  style="width: 200px"
                  :field-props="dataID_data_aa_Props"
                  v-if="dataID_data_aa_Props.options.length > 0"
                  required
                />

                <ProInput
                  path="value"
                  :title="$t('scene.ui.parameterValue')"
                  style="width: 200px"
                  v-if="row_value.dataID_data"
                  required
                />
              </NFlex>
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
            <template #item="{ itemDom, actionDom }">
              <ProCard
                :title="$t('orgIotClient.deviceLogs.params')"
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
        </div>
      </template>

      <template #item="{ itemDom, actionDom, row }">
        <ProCard
          :title="actionsTitle(row)"
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
