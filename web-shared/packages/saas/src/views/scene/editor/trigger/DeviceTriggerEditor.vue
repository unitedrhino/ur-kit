<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 设备触发编辑器：productID → selectType → (device|area|group) → type → 物模型 → 值条件 */
import { computed, watch } from 'vue';
import type { DeviceTriggerDraft } from '../types';
import type {
  CmpType,
  SelectType,
  TriggerDeviceMode,
  TriggerDeviceType,
} from '../../scene-types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import EntityCombobox from '../shared/EntityCombobox.vue';
import SchemaPathPicker from '../shared/SchemaPathPicker.vue';
import CompareValueEditor from '../shared/CompareValueEditor.vue';
import {
  useSceneOptions,
  useDeviceOptions,
  useSchemaOptions,
} from '../composables/useSceneOptions';

const props = defineProps<{ modelValue: DeviceTriggerDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const { productOptions, areaOptions, groupOptions } = useSceneOptions();
const {
  options: deviceOptions,
  loading: deviceLoading,
  load: loadDevices,
} = useDeviceOptions();
const {
  list: schemaList,
  loadForProduct,
  loadForDevice,
} = useSchemaOptions();

const SELECT_TYPE_OPTIONS: { label: string; value: SelectType }[] = localizedSceneState(() => ([
  { label: $t('iotApp.ota.scopeAll'), value: 'all' },
  { label: $t('iotApp.alarmRule.scopeDevice'), value: 'fixed' },
  { label: $t('scene.ui.equipmentUnderArea'), value: 'area' },
  { label: $t('iotApp.deviceDetail.groupName'), value: 'group' },
]));

const MODE_OPTIONS: { label: string; value: TriggerDeviceMode }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.edgeTriggerFirstTimeOnly'), value: 'edge' },
  { label: $t('scene.ui.levelTriggerContinuous'), value: 'level' },
]));

const TYPE_OPTIONS: { label: string; value: TriggerDeviceType }[] = localizedSceneState(() => ([
  { label: $t('iotApp.deviceDetail.msgReport'), value: 'propertyReport' },
  { label: $t('iotApp.deviceDetail.eventPost'), value: 'eventReport' },
  { label: $t('orgIotClient.deviceLogs.hubConnected'), value: 'connected' },
  { label: $t('orgIotClient.deviceLogs.hubDisconnected'), value: 'disConnected' },
]));

const schemaType = computed(() =>
  props.modelValue.type === 'eventReport' ? 2 : 1,
);

const needCondition = computed(
  () =>
    props.modelValue.type === 'propertyReport' ||
    props.modelValue.type === 'eventReport',
);

function pickProductName() {
  const hit = productOptions.value.find(
    (p: any) => String(p.value) === String(props.modelValue.productID),
  );
  props.modelValue.productName = (hit as any)?.label || '';
}

async function reloadSchema() {
  if (!needCondition.value) {
    schemaList.value = [];
    return;
  }
  if (props.modelValue.selectType === 'fixed' && props.modelValue.deviceName) {
    await loadForDevice(
      props.modelValue.productID,
      props.modelValue.deviceName,
      schemaType.value,
    );
  } else {
    await loadForProduct(props.modelValue.productID, schemaType.value);
  }
}

watch(
  () => props.modelValue.productID,
  () => {
    pickProductName();
    props.modelValue.deviceName = undefined;
    props.modelValue.deviceAlias = undefined;
    props.modelValue.dataID_data = undefined;
    loadDevices(props.modelValue.productID);
    reloadSchema();
    emit('change');
  },
  { immediate: true },
);

watch(
  () => props.modelValue.type,
  () => {
    reloadSchema();
    emit('change');
  },
);

watch(
  () => props.modelValue.deviceName,
  () => {
    if (props.modelValue.selectType === 'fixed') reloadSchema();
    emit('change');
  },
);

function onTerm(v: CmpType | undefined) {
  props.modelValue.termType = v;
  emit('change');
}
function onValues(v: string[]) {
  props.modelValue.values = v;
  emit('change');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-3">
      <FieldRow :label="$t('iotApp.devicePage.product')" required width-class="w-60">
        <NativeSelect
          v-model="modelValue.productID"
          :options="productOptions as any"
          :placeholder="$t('orgEnergy.ui.pleaseSelectAProduct')"
        />
      </FieldRow>

      <FieldRow :label="$t('iotApp.ota.deviceScopeHeading')" required width-class="w-40">
        <NativeSelect
          v-model="modelValue.selectType"
          :options="SELECT_TYPE_OPTIONS"
          @update:model-value="emit('change')"
        />
      </FieldRow>

      <FieldRow
        v-if="modelValue.selectType === 'fixed'"
        :label="$t('orgIotClient.console.devices')"
        required
        width-class="w-60"
      >
        <EntityCombobox
          v-model="modelValue.deviceName"
          :options="deviceOptions"
          :loading="deviceLoading"
          :placeholder="$t('iotApp.av.searchDevices')"
          @search="(kw) => loadDevices(modelValue.productID, kw)"
          @open="() => loadDevices(modelValue.productID)"
        />
      </FieldRow>

      <FieldRow
        v-if="modelValue.selectType === 'area'"
        :label="$t('orgEnergy.overview.area')"
        required
        width-class="w-52"
      >
        <NativeSelect
          v-model="modelValue.areaID"
          :options="areaOptions as any"
          :placeholder="$t('orgEnergy.ui.pleaseSelectARegion')"
          @update:model-value="emit('change')"
        />
      </FieldRow>

      <FieldRow
        v-if="modelValue.selectType === 'group'"
        :label="$t('iotApp.deviceDetail.groupName')"
        required
        width-class="w-52"
      >
        <NativeSelect
          v-model="modelValue.groupID"
          :options="groupOptions as any"
          :placeholder="$t('scene.ui.pleaseSelectADeviceGroup')"
          @update:model-value="emit('change')"
        />
      </FieldRow>
    </div>

    <div class="flex flex-wrap gap-3">
      <FieldRow :label="$t('scene.ui.triggerEvent')" required width-class="w-40">
        <NativeSelect
          v-model="modelValue.type"
          :options="TYPE_OPTIONS"
          :placeholder="$t('iotApp.av.pleaseSelect')"
          @update:model-value="emit('change')"
        />
      </FieldRow>
      <FieldRow :label="$t('orgManage.memory.triggerCol')" width-class="w-44">
        <NativeSelect
          v-model="modelValue.mode"
          :options="MODE_OPTIONS"
          :placeholder="$t('scene.ui.defaultEdge')"
          @update:model-value="emit('change')"
        />
      </FieldRow>
    </div>

    <template v-if="needCondition">
      <SchemaPathPicker
        :model-value="modelValue as any"
        :schema-list="schemaList"
        :schema-type="schemaType"
      />
      <CompareValueEditor
        :term-type="modelValue.termType"
        :values="modelValue.values"
        enable-in
        enable-all
        @update:term-type="onTerm"
        @update:values="onValues"
      />
    </template>
  </div>
</template>
