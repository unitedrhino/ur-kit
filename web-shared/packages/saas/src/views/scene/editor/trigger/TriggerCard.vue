<script setup lang="ts">
import { $t } from '@vben/locales';
/** 单条触发器卡片：根据 type 分发给具体编辑器。 */
import { computed } from 'vue';
import type { TriggerDraft } from '../types';
import type { ValidationIssue } from '../types';
import RuleCard from '../shared/RuleCard.vue';
import { triggerSummary } from '../composables/useSceneSummary';
import TimerTriggerEditor from './TimerTriggerEditor.vue';
import WeatherTriggerEditor from './WeatherTriggerEditor.vue';
import DeviceTriggerEditor from './DeviceTriggerEditor.vue';

const props = defineProps<{
  modelValue: TriggerDraft;
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

const summary = computed(() => triggerSummary(props.modelValue));
const errors = computed(() =>
  props.issues.filter(
    (i) => i.uid === props.modelValue.uid && i.level === 'error',
  ),
);
const hasError = computed(() => errors.value.length > 0);

function toggle() {
  props.modelValue._collapsed = !props.modelValue._collapsed;
}
</script>

<template>
  <RuleCard
    :title="`${$t('scene.ui.trigger')} ${index + 1}`"
    :summary="summary"
    :collapsed="modelValue._collapsed"
    :has-error="hasError"
    :can-move-up="index > 0"
    :can-move-down="index < total - 1"
    @toggle="toggle"
    @copy="emit('copy')"
    @delete="emit('delete')"
    @move-up="emit('moveUp')"
    @move-down="emit('moveDown')"
  >
    <TimerTriggerEditor
      v-if="modelValue.type === 'timer' && modelValue.timer"
      :model-value="modelValue.timer"
      @change="emit('change')"
    />
    <WeatherTriggerEditor
      v-else-if="modelValue.type === 'weather' && modelValue.weather"
      :model-value="modelValue.weather"
      @change="emit('change')"
    />
    <DeviceTriggerEditor
      v-else-if="modelValue.type === 'device' && modelValue.device"
      :model-value="modelValue.device"
      @change="emit('change')"
    />
    <div v-else class="text-sm text-muted-foreground">{{ $t('scene.ui.triggerTypeNotSupportedYet') }}</div>

    <div v-if="errors.length" class="mt-3 space-y-1 rounded bg-destructive/5 p-2">
      <p
        v-for="(err, i) in errors"
        :key="i"
        class="text-xs text-destructive"
      >
        · {{ err.message }}
      </p>
    </div>
  </RuleCard>
</template>
