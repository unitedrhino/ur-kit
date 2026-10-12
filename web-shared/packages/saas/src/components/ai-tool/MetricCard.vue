<script lang="ts" setup>
import { computed } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

defineOptions({ name: 'MetricCard' });

interface Props {
  title: string;
  value: any;
  unit?: string;
  icon?: string;
  color?: string;
  trend?: string;
}

const props = defineProps<Props>();

const displayValue = computed(() => {
  const v = props.value;
  if (v === null || v === undefined) return '--';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(2);
  }
  return String(v);
});

const trendClass = computed(() => {
  if (props.trend === 'up') return 'text-green-500';
  if (props.trend === 'down') return 'text-red-500';
  return '';
});

const trendIcon = computed(() => {
  if (props.trend === 'up') return 'lucide:trending-up';
  if (props.trend === 'down') return 'lucide:trending-down';
  return '';
});

const valueColorStyle = computed(() => {
  if (props.color) return { color: props.color };
  return {};
});
</script>

<template>
  <div class="metric-card bg-card border-border rounded-lg border p-4">
    <div class="mb-2 flex items-center gap-2">
      <VbenIcon v-if="icon" :icon="icon" class="text-muted-foreground size-4" />
      <span class="text-muted-foreground text-sm font-medium">{{ title }}</span>
    </div>
    <div class="flex items-baseline gap-1.5">
      <span
        class="text-2xl font-semibold tracking-tight"
        :class="props.color ? '' : 'text-foreground'"
        :style="valueColorStyle"
      >
        {{ displayValue }}
      </span>
      <span v-if="unit" class="text-muted-foreground text-sm">{{ unit }}</span>
    </div>
    <div v-if="trend" class="mt-1.5 flex items-center gap-1" :class="trendClass">
      <VbenIcon v-if="trendIcon" :icon="trendIcon" class="size-3.5" />
      <span class="text-xs font-medium">{{ trend === 'up' ? '+' : '-' }}</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  transition: box-shadow 0.2s ease;
}

.metric-card:hover {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.06);
}
</style>
