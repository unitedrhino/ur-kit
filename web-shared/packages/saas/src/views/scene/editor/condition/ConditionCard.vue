<script setup lang="ts">
import { $t } from '@vben/locales';
import { computed } from 'vue';
import type { ConditionTermDraft, ValidationIssue } from '../types';
import RuleCard from '../shared/RuleCard.vue';
import { conditionSummary } from '../composables/useSceneSummary';
import PropertyConditionEditor from './PropertyConditionEditor.vue';
import WeatherConditionEditor from './WeatherConditionEditor.vue';
import TimeConditionEditor from './TimeConditionEditor.vue';

const props = defineProps<{
  modelValue: ConditionTermDraft;
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

const summary = computed(() => conditionSummary(props.modelValue));
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
    :title="`${$t('orgManage.cloneGroup.conditionPlaceholder')} ${index + 1}`"
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
    <PropertyConditionEditor
      v-if="modelValue.columnType === 'property' && modelValue.property"
      :model-value="modelValue.property"
      @change="emit('change')"
    />
    <WeatherConditionEditor
      v-else-if="modelValue.columnType === 'weather' && modelValue.weather"
      :model-value="modelValue.weather"
      @change="emit('change')"
    />
    <TimeConditionEditor
      v-else-if="modelValue.columnType === 'time' && modelValue.time"
      :model-value="modelValue.time"
      @change="emit('change')"
    />
    <div v-else class="text-sm text-muted-foreground">{{ $t('scene.ui.conditionTypeNotSupportedYet') }}</div>

    <div v-if="errors.length" class="mt-3 space-y-1 rounded bg-destructive/5 p-2">
      <p v-for="(err, i) in errors" :key="i" class="text-xs text-destructive">
        · {{ err.message }}
      </p>
    </div>
  </RuleCard>
</template>
