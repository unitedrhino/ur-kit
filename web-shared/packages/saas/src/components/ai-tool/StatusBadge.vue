<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: 'StatusBadge' });

interface Props {
  value: any;
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
});

const typeClassMap: Record<string, string> = {
  success:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  default:
    'bg-muted text-muted-foreground',
};

const badgeClass = computed(() => {
  return typeClassMap[props.type] ?? typeClassMap.default;
});

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '--';
  return String(props.value);
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="badgeClass"
  >
    {{ displayValue }}
  </span>
</template>
