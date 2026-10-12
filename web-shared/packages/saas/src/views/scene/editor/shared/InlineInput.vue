<script setup lang="ts">
/**
 * InlineInput —— 面包屑内联文本/数字输入。
 * 样式：无边框、下划线、宽度贴合内容。
 */
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue?: number | string;
  placeholder?: string;
  type?: 'number' | 'text';
  disabled?: boolean;
  invalid?: boolean;
  /** 最小字符宽度 */
  minCh?: number;
  /** 最大字符宽度（避免超长输入撑爆） */
  maxCh?: number;
  /** number 专用 */
  min?: number;
  max?: number;
  step?: number;
  /** 追加后缀（例如单位："秒" / "%"），纯展示，不计入 value */
  suffix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | string | undefined): void;
  (e: 'change', v: number | string | undefined): void;
}>();

const inner = computed({
  get: () =>
    props.modelValue === undefined || props.modelValue === null
      ? ''
      : String(props.modelValue),
  set: (v: string) => {
    let nv: number | string | undefined = v;
    if (props.type === 'number') {
      if (v === '') nv = undefined;
      else {
        const n = Number(v);
        nv = Number.isNaN(n) ? undefined : n;
      }
    } else {
      nv = v === '' ? undefined : v;
    }
    emit('update:modelValue', nv);
    emit('change', nv);
  },
});

const textWidth = computed(() => {
  const text = inner.value || props.placeholder || '';
  const min = props.minCh ?? 4;
  const max = props.maxCh ?? 24;
  const ch = Math.min(max, Math.max(min, text.length + 1));
  return { width: `${ch}ch` };
});

const isEmpty = computed(() => !inner.value);
const rootRef = ref<HTMLInputElement>();
</script>

<template>
  <span class="inline-flex items-baseline">
    <input
      ref="rootRef"
      v-model="inner"
      :type="type || 'text'"
      :disabled="disabled"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      :style="textWidth"
      :class="[
        'inline-block bg-transparent',
        'border-0 border-b border-dotted',
        'px-0.5 py-0 text-[13px]',
        'focus:outline-none focus:ring-0',
        'transition-colors',
        disabled ? 'opacity-60 cursor-not-allowed' : '',
        invalid
          ? 'border-destructive text-destructive placeholder:text-destructive/70'
          : isEmpty
            ? 'border-muted-foreground/50 text-muted-foreground placeholder:text-muted-foreground/70'
            : 'border-primary/30 text-primary hover:border-primary',
      ]"
    />
    <span
      v-if="suffix"
      class="text-muted-foreground ml-0.5 text-[13px]"
    >{{ suffix }}</span>
  </span>
</template>
