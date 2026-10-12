<script setup lang="ts">
/**
 * InlineTimeField —— 面包屑内联时间输入（毫秒时间戳）。
 * 基于原生 input type=time；样式统一下划线风格。
 */
import { computed } from 'vue';

const props = defineProps<{
  modelValue?: number;
  invalid?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: number | undefined): void;
  (e: 'change', v: number | undefined): void;
}>();

const inner = computed({
  get: () => {
    if (!props.modelValue) return '';
    const d = new Date(props.modelValue);
    return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
  },
  set: (v: string) => {
    if (!v) {
      emit('update:modelValue', undefined);
      emit('change', undefined);
      return;
    }
    const [h, m] = v.split(':').map((x) => Number(x));
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    emit('update:modelValue', d.getTime());
    emit('change', d.getTime());
  },
});

const isEmpty = computed(() => !inner.value);
</script>

<template>
  <input
    v-model="inner"
    type="time"
    :disabled="disabled"
    :class="[
      'inline-block w-[5.5ch] bg-transparent',
      'border-0 border-b border-dotted',
      'px-0.5 py-0 text-[13px]',
      'focus:outline-none focus:ring-0',
      disabled ? 'opacity-60 cursor-not-allowed' : '',
      invalid
        ? 'border-destructive text-destructive'
        : isEmpty
          ? 'border-muted-foreground/50 text-muted-foreground'
          : 'border-primary/30 text-primary hover:border-primary',
    ]"
  />
</template>
