<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
import type { WeatherConditionDraft } from '../types';
import type { CmpType } from '../../scene-types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import CompareValueEditor from '../shared/CompareValueEditor.vue';

const props = defineProps<{ modelValue: WeatherConditionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const TYPE_OPTIONS = localizedSceneState(() => ([
  { label: $t('iotApp.productPage.temperature'), value: 'temp' },
  { label: $t('scene.ui.humidity'), value: 'humidity' },
]));

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
    <FieldRow :label="$t('scene.ui.monitoringIndicators')" width-class="w-40">
      <NativeSelect
        v-model="modelValue.type"
        :options="TYPE_OPTIONS"
        @update:model-value="emit('change')"
      />
    </FieldRow>
    <CompareValueEditor
      :term-type="modelValue.termType"
      :values="modelValue.values"
      value-type="number"
      @update:term-type="onTerm"
      @update:values="onValues"
    />
  </div>
</template>
