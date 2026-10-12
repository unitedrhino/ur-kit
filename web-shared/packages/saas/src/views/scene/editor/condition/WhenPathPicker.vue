<script setup lang="ts">
import { $t } from '@vben/locales';
/** When 条件里的物模型路径选择（只支持单层 column_data 根 identifier，已覆盖绝大多数业务场景） */
import { computed, watch } from 'vue';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';

interface SchemaItem {
  identifier: string;
  name?: string;
  type?: number;
}

const props = defineProps<{
  modelValue: Record<string, any>;
  schemaList: SchemaItem[];
}>();

const rootOptions = computed(() =>
  props.schemaList
    .filter((s) => !s.type || s.type === 1)
    .map((s) => ({ label: s.name || s.identifier, value: s.identifier })),
);

watch(
  () => props.modelValue.column_data,
  () => {
    props.modelValue.column_data_00 = '';
    props.modelValue.column_data_00_aa = '';
    props.modelValue.column_data_aa = '';
    props.modelValue.column_data_bb = '';
    props.modelValue.column_data_bb_cc = '';
  },
);
</script>

<template>
  <FieldRow :label="$t('iotApp.dataFlow.propLabel')" required width-class="w-60">
    <NativeSelect
      v-model="modelValue.column_data"
      :options="rootOptions"
      :placeholder="$t('scene.ui.pleaseSelectAttributes')"
    />
  </FieldRow>
</template>
