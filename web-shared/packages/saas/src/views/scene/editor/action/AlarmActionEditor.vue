<script setup lang="ts">
import { localizedSceneState } from '../../locales';

import { $t } from '@vben/locales';
import type { AlarmActionDraft } from '../types';
import FieldRow from '../shared/FieldRow.vue';
import NativeSelect from '../shared/NativeSelect.vue';
import type { ActionAlarmMode } from '../../scene-types';

defineProps<{ modelValue: AlarmActionDraft }>();
const emit = defineEmits<{ (e: 'change'): void }>();

const OPTIONS: { label: string; value: ActionAlarmMode }[] = localizedSceneState(() => ([
  { label: $t('scene.ui.triggerAlarm'), value: 'trigger' },
  { label: $t('scene.ui.clearAlarm'), value: 'relieve' },
]));
</script>

<template>
  <FieldRow :label="$t('scene.ui.alarmMode')" required width-class="w-40">
    <NativeSelect
      v-model="modelValue.mode"
      :options="OPTIONS"
      @update:model-value="emit('change')"
    />
  </FieldRow>
</template>
