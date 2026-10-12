<script setup lang="ts">
import type { FormFieldDef, SimplifiedDataType } from '@/packages/custom/types';
import type { CreateComponentType } from '@/packages/index.type';

import { computed } from 'vue';

import { get, set } from 'lodash-es';
import { NColorPicker, NInput, NInputNumber, NSelect } from 'naive-ui';

const props = defineProps<{
  simplifiedData: SimplifiedDataType | undefined;
  targetData: CreateComponentType;
}>();

const fields = computed(() => props.simplifiedData?.fields ?? []);
const values = computed(() => props.simplifiedData?.values ?? {});

/** 更新单个字段值，同时写入 option 深层路径和 _simplifiedData.values */
const updateField = (field: FormFieldDef, val: any) => {
  set(props.targetData.option, field.key, val);
  if (props.targetData.option._simplifiedData) {
    if (!props.targetData.option._simplifiedData.values) {
      props.targetData.option._simplifiedData.values = {};
    }
    props.targetData.option._simplifiedData.values[field.key] = val;
  }
};

/** 获取字段当前值 */
const getFieldValue = (field: FormFieldDef) => {
  return values.value[field.key] ?? get(props.targetData.option, field.key) ?? field.defaultValue;
};
</script>

<template>
  <div class="form-editor">
    <n-form label-placement="left" label-width="80" size="small">
      <n-form-item v-for="field in fields" :key="field.key" :label="field.label">
        <NInput v-if="field.type === 'text'" :value="getFieldValue(field)" @update:value="(val: string) => updateField(field, val)" />
        <NInputNumber
          v-else-if="field.type === 'number'"
          :value="getFieldValue(field)"
          @update:value="(val: number | null) => updateField(field, val)"
          style="width: 100%"
        />
        <NColorPicker v-else-if="field.type === 'color'" :value="getFieldValue(field)" @update:value="(val: string) => updateField(field, val)" />
        <NSelect
          v-else-if="field.type === 'select'"
          :value="getFieldValue(field)"
          :options="field.options"
          @update:value="(val: any) => updateField(field, val)"
        />
      </n-form-item>
    </n-form>
  </div>
</template>
