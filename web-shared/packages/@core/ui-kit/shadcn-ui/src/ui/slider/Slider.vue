<!--
  Slider 是 shadcn 风格的单值滑块，用于在不引入额外 UI 库的情况下控制数值输入。
-->
<script setup lang="ts">
import { computed } from 'vue';

import { cn } from '@vben-core/shared/utils';

const props = withDefaults(
  defineProps<{
    /** class 允许业务侧追加布局类名。 */
    class?: any;
    /** defaultValue 未受控时的默认数值。 */
    defaultValue?: number;
    /** disabled 控制滑块是否禁用。 */
    disabled?: boolean;
    /** max 控制滑块最大值。 */
    max?: number;
    /** min 控制滑块最小值。 */
    min?: number;
    /** modelValue 当前受控数值。 */
    modelValue?: number;
    /** step 控制滑块步长。 */
    step?: number;
  }>(),
  {
    defaultValue: 0,
    max: 100,
    min: 0,
    step: 1,
  },
);

const emit = defineEmits<{
  /** update:modelValue 在拖动滑块时同步最新数值。 */
  'update:modelValue': [value: number];
}>();

const currentValue = computed(() => Number(props.modelValue ?? props.defaultValue ?? props.min));
const progress = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) {
    return '0%';
  }
  const percent = ((currentValue.value - props.min) / range) * 100;
  return `${Math.min(100, Math.max(0, percent))}%`;
});

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) {
    emit('update:modelValue', value);
  }
}
</script>

<template>
  <div :class="cn('relative flex w-full touch-none select-none items-center', props.class)">
    <input
      type="range"
      class="shadcn-slider h-5 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
      :aria-valuemax="max"
      :aria-valuemin="min"
      :aria-valuenow="currentValue"
      :disabled="disabled"
      :max="max"
      :min="min"
      :step="step"
      :style="{ '--slider-progress': progress }"
      :value="currentValue"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.shadcn-slider::-webkit-slider-runnable-track {
  height: 0.5rem;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    hsl(var(--primary)) 0%,
    hsl(var(--primary)) var(--slider-progress),
    hsl(var(--muted)) var(--slider-progress),
    hsl(var(--muted)) 100%
  );
}

.shadcn-slider::-webkit-slider-thumb {
  width: 1rem;
  height: 1rem;
  margin-top: -0.25rem;
  appearance: none;
  border: 2px solid hsl(var(--primary));
  border-radius: 9999px;
  background: hsl(var(--background));
  box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
}

.shadcn-slider:focus-visible {
  outline: none;
}

.shadcn-slider:focus-visible::-webkit-slider-thumb {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.shadcn-slider::-moz-range-track {
  height: 0.5rem;
  border-radius: 9999px;
  background: hsl(var(--muted));
}

.shadcn-slider::-moz-range-progress {
  height: 0.5rem;
  border-radius: 9999px;
  background: hsl(var(--primary));
}

.shadcn-slider::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: 2px solid hsl(var(--primary));
  border-radius: 9999px;
  background: hsl(var(--background));
  box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
}
</style>
