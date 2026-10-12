<script setup lang="ts">
/** InlineDateField —— 下划线日期输入。modelValue 可接受字符串 YYYY-MM-DD */
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: string | number;
  invalid?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | undefined): void;
  (e: 'change'): void;
}>();

function toDateStr(v?: string | number): string {
  if (v == null || v === '') return '';
  if (typeof v === 'number') {
    const d = new Date(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(v).slice(0, 10);
}

const internal = computed(() => toDateStr(props.modelValue));

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value || undefined;
  emit('update:modelValue', v);
  emit('change');
}

const klass = computed(() => [
  'h-6 border-0 border-b border-dotted bg-transparent px-0.5 text-[13px] focus:outline-none focus:ring-0',
  props.invalid
    ? 'border-destructive text-destructive'
    : internal.value
      ? 'border-primary/60 text-primary'
      : 'border-muted-foreground/50 text-muted-foreground',
]);
</script>

<template>
  <input
    type="date"
    :value="internal"
    :class="klass"
    :placeholder="placeholder"
    @change="onInput"
  />
</template>
