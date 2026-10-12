<script lang="ts" setup>
import { computed } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

defineOptions({ name: 'StepsRenderer' });

interface StepItem {
  title: string;
  description?: string;
  status?: string;
}

interface Props {
  data: StepItem[];
  direction?: string;
  current?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'horizontal',
  current: 0,
});

const isHorizontal = computed(() => props.direction !== 'vertical');

function stepStatusClass(index: number): string {
  const item = props.data[index];
  if (item?.status === 'error') return 'step-error';
  if (item?.status === 'finish' || index < props.current) return 'step-done';
  if (index === props.current) return 'step-active';
  return 'step-pending';
}

function stepIcon(index: number): string {
  const item = props.data[index];
  if (item?.status === 'error') return 'lucide:x';
  if (item?.status === 'finish' || index < props.current) return 'lucide:check';
  if (index === props.current) return 'lucide:loader';
  return '';
}

function connectorActive(index: number): boolean {
  // The connector at position 'index' joins step (index-1) to step (index)
  return index <= props.current;
}
</script>

<template>
  <div
    class="steps-renderer"
    :class="isHorizontal ? 'steps-horizontal' : 'steps-vertical'"
  >
    <div
      v-for="(step, index) in data"
      :key="index"
      class="step-item"
      :class="[stepStatusClass(index), isHorizontal ? 'flex-col' : 'flex-row']"
    >
      <!-- Connector: left-half (horizontal) or top-half (vertical) for items after first -->
      <div
        v-if="index > 0"
        class="step-connector step-connector-start"
        :class="[
          isHorizontal ? 'connector-h-start' : 'connector-v-start',
          connectorActive(index) ? 'bg-primary' : 'bg-border',
        ]"
      />

      <!-- Connector: right-half (horizontal) or bottom-half (vertical) for items before last -->
      <div
        v-if="index < data.length - 1"
        class="step-connector step-connector-end"
        :class="[
          isHorizontal ? 'connector-h-end' : 'connector-v-end',
          connectorActive(index + 1) ? 'bg-primary' : 'bg-border',
        ]"
      />

      <div
        :class="isHorizontal ? 'flex-col items-center' : 'flex-row items-start'"
        class="step-content-wrapper flex gap-2"
      >
        <!-- Circle indicator -->
        <div
          class="step-indicator flex shrink-0 items-center justify-center rounded-full"
          :class="{
            'bg-primary text-primary-foreground': stepStatusClass(index) === 'step-active',
            'bg-green-500 text-white': stepStatusClass(index) === 'step-done',
            'bg-destructive text-destructive-foreground': stepStatusClass(index) === 'step-error',
            'bg-muted text-muted-foreground': stepStatusClass(index) === 'step-pending',
          }"
        >
          <VbenIcon
            v-if="stepIcon(index)"
            :icon="stepIcon(index)"
            class="size-3"
          />
          <span v-else class="text-xs font-medium">{{ index + 1 }}</span>
        </div>

        <!-- Text -->
        <div :class="isHorizontal ? 'text-center' : 'text-left'">
          <p
            class="text-sm font-medium"
            :class="{
              'text-foreground': index <= props.current,
              'text-muted-foreground': index > props.current,
            }"
          >
            {{ step.title }}
          </p>
          <p
            v-if="step.description"
            class="text-muted-foreground mt-0.5 text-xs"
          >
            {{ step.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.steps-renderer {
  display: flex;
}

.steps-horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.steps-vertical {
  flex-direction: column;
}

.step-item {
  display: flex;
  position: relative;
}

.steps-horizontal .step-item {
  flex: 1;
  align-items: center;
}

.steps-vertical .step-item {
  align-items: flex-start;
}

.step-connector {
  position: absolute;
}

/* Horizontal connectors */
.connector-h-start {
  left: 0;
  right: 50%;
  top: 12px;
  height: 2px;
  transform: translateY(-50%);
}

.connector-h-end {
  left: 50%;
  right: 0;
  top: 12px;
  height: 2px;
  transform: translateY(-50%);
}

/* Vertical connectors */
.connector-v-start {
  left: 12px;
  top: 0;
  bottom: 50%;
  width: 2px;
  transform: translateX(-50%);
}

.connector-v-end {
  left: 12px;
  top: 50%;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
}

.step-indicator {
  width: 24px;
  height: 24px;
  position: relative;
  z-index: 1;
}

.steps-horizontal .step-content-wrapper {
  padding-top: 4px;
}
</style>
