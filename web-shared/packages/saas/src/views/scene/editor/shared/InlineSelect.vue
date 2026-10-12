<script setup lang="ts">
/**
 * InlineSelect —— 面包屑内联下拉选择。
 * 样式：无边框、下划线、宽度贴合内容；未选中时用 placeholder 样式提示。
 * 与 NativeSelect 一样基于原生 <select>，确保与已有 option 列表兼容。
 */
import { computed, ref, watch } from 'vue';

interface Option {
  label: string;
  value: number | string;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue?: number | string;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  /** 标红：用于必填未选中提示 */
  invalid?: boolean;
  /** 最小宽度（ch 字符单位），默认 4 */
  minCh?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | string | undefined): void;
  (e: 'change', v: number | string | undefined): void;
}>();

const inner = computed({
  get: () => (props.modelValue === undefined ? '' : String(props.modelValue)),
  set: (v: string) => {
    const found = props.options.find((o) => String(o.value) === v);
    const nv = found ? found.value : v === '' ? undefined : v;
    emit('update:modelValue', nv);
    emit('change', nv);
  },
});

const currentLabel = computed(() => {
  const hit = props.options.find(
    (o) => String(o.value) === String(props.modelValue),
  );
  return hit?.label ?? '';
});

/** 根据当前 label / placeholder 动态计算宽度（ch 为字符宽度单位） */
const widthStyle = computed(() => {
  const text = currentLabel.value || props.placeholder || '';
  const ch = Math.max(props.minCh ?? 4, text.length + 1);
  return { width: `${ch}ch` };
});

const isEmpty = computed(
  () => props.modelValue === undefined || props.modelValue === '',
);

const rootRef = ref<HTMLSelectElement>();
watch(
  () => props.invalid,
  (v) => {
    if (v && rootRef.value) {
      // 可选：必填标红时抖一下，略过，避免喧宾夺主
    }
  },
);
</script>

<template>
  <select
    ref="rootRef"
    v-model="inner"
    :disabled="disabled"
    :style="widthStyle"
    :class="[
      'inline-block appearance-none bg-transparent',
      'border-0 border-b border-dotted',
      'px-0.5 py-0 text-[13px]',
      'focus:outline-none focus:ring-0',
      'transition-colors cursor-pointer',
      disabled ? 'opacity-60 cursor-not-allowed' : '',
      invalid
        ? 'border-destructive text-destructive'
        : isEmpty
          ? 'border-muted-foreground/50 text-muted-foreground'
          : 'border-primary/30 text-primary hover:border-primary',
    ]"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option
      v-for="opt in options"
      :key="String(opt.value)"
      :value="String(opt.value)"
      :disabled="opt.disabled"
    >
      {{ opt.label }}
    </option>
  </select>
</template>
