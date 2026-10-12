<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
/** 设备控制动作：选产品/设备 → 添加多条参数（每条 = 物模型路径 + value） */
import { watch } from 'vue';
import type { ActionDraft, DeviceActionValueDraft } from '../types';
import type { SelectType, ActionDeviceType } from '../../scene-types';
import { genUid } from '../types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import EntityCombobox from '../shared/EntityCombobox.vue';
import SchemaPathPicker from '../shared/SchemaPathPicker.vue';
import { Input } from '@vben-core/shadcn-ui';
import {
  useSceneOptions,
  useDeviceOptions,
  useSchemaOptions,
} from '../composables/useSceneOptions';

const props = defineProps<{ action: ActionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const { productOptions, areaOptions, groupOptions } = useSceneOptions();
const {
  options: deviceOptions,
  loading: deviceLoading,
  load: loadDevices,
} = useDeviceOptions();
const { list: schemaList, loadForProduct, loadForDevice } = useSchemaOptions();

const SELECT_TYPE_OPTIONS: { label: string; value: SelectType }[] = localizedSceneState(() => ([
  { label: $t('iotApp.ota.scopeAll'), value: 'all' },
  { label: $t('iotApp.alarmRule.scopeDevice'), value: 'fixed' },
  { label: $t('scene.ui.equipmentUnderArea'), value: 'area' },
  { label: $t('iotApp.deviceDetail.groupName'), value: 'group' },
]));

const ACTION_TYPE_OPTIONS: { label: string; value: ActionDeviceType }[] = localizedSceneState(() => ([
  { label: $t('iotApp.deviceDetail.sendTypeProperty'), value: 'propertyControl' },
  { label: $t('scene.ui.actionCall'), value: 'action' },
]));

function ensureDevice() {
  if (!props.action.device) props.action.device = { values: [] };
  if (!props.action.device.values) props.action.device.values = [];
}
ensureDevice();

async function reloadSchema() {
  const dev = props.action.device;
  if (!dev?.productID) {
    schemaList.value = [];
    return;
  }
  const st = dev.type === 'action' ? 4 : 1; // 1=属性，4=动作
  if (dev.selectType === 'fixed' && dev.deviceName) {
    await loadForDevice(dev.productID, dev.deviceName, st);
  } else {
    await loadForProduct(dev.productID, st);
  }
}

watch(
  () => props.action.device?.productID,
  (v) => {
    const hit = productOptions.value.find(
      (p: any) => String(p.value) === String(v),
    );
    if (props.action.device) {
      props.action.device.productName = (hit as any)?.label || '';
      props.action.device.deviceName = undefined;
      props.action.device.deviceAlias = undefined;
      props.action.device.values = [];
    }
    loadDevices(v);
    reloadSchema();
    emit('change');
  },
  { immediate: true },
);

watch(
  () => props.action.device?.deviceName,
  () => {
    if (props.action.device?.selectType === 'fixed') reloadSchema();
    emit('change');
  },
);

watch(
  () => props.action.device?.type,
  () => {
    if (props.action.device) props.action.device.values = [];
    reloadSchema();
    emit('change');
  },
);

function addValue() {
  ensureDevice();
  const v: DeviceActionValueDraft = { uid: genUid('val') };
  props.action.device!.values!.push(v);
  emit('change');
}

function removeValue(i: number) {
  props.action.device?.values?.splice(i, 1);
  emit('change');
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap gap-3">
      <FieldRow :label="$t('iotApp.devicePage.product')" required width-class="w-60">
        <NativeSelect
          v-model="action.device!.productID"
          :options="productOptions as any"
          :placeholder="$t('orgEnergy.ui.pleaseSelectAProduct')"
        />
      </FieldRow>
      <FieldRow :label="$t('iotApp.ota.deviceScopeHeading')" required width-class="w-40">
        <NativeSelect
          v-model="action.device!.selectType"
          :options="SELECT_TYPE_OPTIONS"
          @update:model-value="emit('change')"
        />
      </FieldRow>
      <FieldRow
        v-if="action.device!.selectType === 'fixed'"
        :label="$t('orgIotClient.console.devices')"
        required
        width-class="w-60"
      >
        <EntityCombobox
          v-model="action.device!.deviceName"
          :options="deviceOptions"
          :loading="deviceLoading"
          :placeholder="$t('iotApp.av.searchDevices')"
          @search="(kw) => loadDevices(action.device!.productID, kw)"
          @open="() => loadDevices(action.device!.productID)"
        />
      </FieldRow>
      <FieldRow
        v-if="action.device!.selectType === 'area'"
        :label="$t('orgEnergy.overview.area')"
        required
        width-class="w-52"
      >
        <NativeSelect
          v-model="action.device!.areaID"
          :options="areaOptions as any"
          @update:model-value="emit('change')"
        />
      </FieldRow>
      <FieldRow
        v-if="action.device!.selectType === 'group'"
        :label="$t('iotApp.deviceDetail.groupName')"
        required
        width-class="w-52"
      >
        <NativeSelect
          v-model="action.device!.groupID"
          :options="groupOptions as any"
          @update:model-value="emit('change')"
        />
      </FieldRow>
      <FieldRow :label="$t('scene.ui.executionType')" width-class="w-40">
        <NativeSelect
          v-model="action.device!.type"
          :options="ACTION_TYPE_OPTIONS"
          :placeholder="$t('iotApp.deviceDetail.sendTypeProperty')"
          @update:model-value="emit('change')"
        />
      </FieldRow>
    </div>

    <div class="rounded-md border border-border bg-muted/20 p-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-muted-foreground">{{ $t('scene.ui.controlParameters') }}</span>
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-primary/50 px-2 text-xs text-primary hover:bg-primary/5"
          @click="addValue"
        >
          <span class="icon-[mdi--plus] size-3.5"></span>
          {{ $t('iotApp.schemaForm.addParam') }}
        </button>
      </div>

      <div
        v-if="!action.device!.values!.length"
        class="mt-2 text-xs text-muted-foreground"
      >
        {{ $t('scene.ui.noParametersAddedYet') }}
      </div>

      <div
        v-for="(v, i) in action.device!.values"
        :key="v.uid"
        class="mt-3 rounded border border-border bg-background p-3"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="text-xs text-muted-foreground">{{ $t('scene.ui.parameterIndex', { index: i + 1 }) }}</span>
          <button
            type="button"
            class="size-6 rounded text-destructive hover:bg-destructive/10"
            :title="$t('orgEnergy.ui.delete')"
            @click="removeValue(i)"
          >
            <span class="icon-[mdi--trash-can-outline] size-4"></span>
          </button>
        </div>
        <SchemaPathPicker
          :model-value="v as any"
          :schema-list="schemaList"
          :schema-type="action.device!.type === 'action' ? 4 : 1"
          auto-pick-single
        />
        <FieldRow :label="$t('scene.ui.parameterValue')" required width-class="w-full mt-3">
          <Input
            v-model="v.value"
            type="text"
            class="h-9"
            :placeholder="$t('orgManage.common.phInput')"
            @input="emit('change')"
          />
        </FieldRow>
      </div>
    </div>
  </div>
</template>
