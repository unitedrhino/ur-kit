<script setup lang="ts">
import { $t } from '@vben/locales';
/** 设备属性条件 */
import { watch } from 'vue';
import type { PropertyConditionDraft } from '../types';
import type { CmpType } from '../../scene-types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import EntityCombobox from '../shared/EntityCombobox.vue';
import CompareValueEditor from '../shared/CompareValueEditor.vue';
import {
  useSceneOptions,
  useDeviceOptions,
  useSchemaOptions,
} from '../composables/useSceneOptions';
import WhenPathPicker from './WhenPathPicker.vue';

const props = defineProps<{ modelValue: PropertyConditionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const { productOptions } = useSceneOptions();
const {
  options: deviceOptions,
  loading: deviceLoading,
  load: loadDevices,
} = useDeviceOptions();
const { list: schemaList, loadForDevice } = useSchemaOptions();

watch(
  () => props.modelValue.productID,
  (v) => {
    const hit = productOptions.value.find(
      (p: any) => String(p.value) === String(v),
    );
    props.modelValue.productName = (hit as any)?.label || '';
    props.modelValue.deviceName = undefined;
    props.modelValue.deviceAlias = undefined;
    loadDevices(v);
    emit('change');
  },
  { immediate: true },
);

watch(
  () => props.modelValue.deviceName,
  (v) => {
    if (props.modelValue.productID && v) {
      loadForDevice(props.modelValue.productID, v, 1);
    } else {
      schemaList.value = [];
    }
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
      <FieldRow :label="$t('orgIotClient.console.devices')" required width-class="w-60">
        <EntityCombobox
          v-model="modelValue.deviceName"
          :options="deviceOptions"
          :loading="deviceLoading"
          :placeholder="$t('iotApp.av.searchDevices')"
          @search="(kw) => loadDevices(modelValue.productID, kw)"
          @open="() => loadDevices(modelValue.productID)"
        />
      </FieldRow>
    </div>
    <WhenPathPicker
      :model-value="modelValue as any"
      :schema-list="schemaList"
    />
    <CompareValueEditor
      :term-type="modelValue.termType"
      :values="modelValue.values"
      enable-in
      @update:term-type="onTerm"
      @update:values="onValues"
    />
  </div>
</template>
