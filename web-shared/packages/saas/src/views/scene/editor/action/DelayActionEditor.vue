<script setup lang="ts">
import { $t } from '@vben/locales';
import type { ActionDraft } from '../types';
import FieldRow from '../shared/FieldRow.vue';
import NumberInput from '../shared/NumberInput.vue';

defineProps<{ modelValue: ActionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();
</script>

<template>
  <FieldRow :label="$t('scene.ui.delaySeconds')" required width-class="w-40">
    <NumberInput
      v-model="modelValue.delay"
      :min="0"
      :step="1"
      @change="emit('change')"
    />
  </FieldRow>
</template>
