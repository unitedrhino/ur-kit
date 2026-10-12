<script setup lang="ts">
import { $t } from '@vben/locales';
import { computed } from 'vue';
import type { ActionDraft, ValidationIssue } from '../types';
import RuleCard from '../shared/RuleCard.vue';
import { actionSummary } from '../composables/useSceneSummary';
import DelayActionEditor from './DelayActionEditor.vue';
import AlarmActionEditor from './AlarmActionEditor.vue';
import SceneActionEditor from './SceneActionEditor.vue';
import DeviceActionEditor from './DeviceActionEditor.vue';

const props = defineProps<{
  modelValue: ActionDraft;
  index: number;
  total: number;
  issues: ValidationIssue[];
}>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'copy'): void;
  (e: 'delete'): void;
  (e: 'moveUp'): void;
  (e: 'moveDown'): void;
}>();

const summary = computed(() => actionSummary(props.modelValue));
const errors = computed(() =>
  props.issues.filter(
    (i) => i.uid === props.modelValue.uid && i.level === 'error',
  ),
);

function toggle() {
  props.modelValue._collapsed = !props.modelValue._collapsed;
}
</script>

<template>
  <RuleCard
    :title="`${$t('iotApp.deviceDetail.action')} ${index + 1}`"
    :summary="summary"
    :collapsed="modelValue._collapsed"
    :has-error="errors.length > 0"
    :can-move-up="index > 0"
    :can-move-down="index < total - 1"
    @toggle="toggle"
    @copy="emit('copy')"
    @delete="emit('delete')"
    @move-up="emit('moveUp')"
    @move-down="emit('moveDown')"
  >
    <DelayActionEditor
      v-if="modelValue.type === 'delay'"
      :model-value="modelValue"
      @change="emit('change')"
    />
    <AlarmActionEditor
      v-else-if="modelValue.type === 'alarm' && modelValue.alarm"
      :model-value="modelValue.alarm"
      @change="emit('change')"
    />
    <SceneActionEditor
      v-else-if="modelValue.type === 'scene' && modelValue.scene"
      :model-value="modelValue.scene"
      @change="emit('change')"
    />
    <DeviceActionEditor
      v-else-if="modelValue.type === 'device'"
      :action="modelValue"
      @change="emit('change')"
    />
    <div v-else class="text-sm text-muted-foreground">{{ $t('scene.ui.actionTypeNotSupportedYet') }}</div>

    <div v-if="errors.length" class="mt-3 space-y-1 rounded bg-destructive/5 p-2">
      <p v-for="(err, i) in errors" :key="i" class="text-xs text-destructive">
        · {{ err.message }}
      </p>
    </div>
  </RuleCard>
</template>
