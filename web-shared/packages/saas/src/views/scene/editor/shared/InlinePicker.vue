<script setup lang="ts">
import { $t } from '@vben/locales';
/**
 * InlinePicker —— 面包屑里的"选择器按钮"。
 * 用法：展示一段文字（当前选值或 placeholder），点击由父组件弹出选择面板（通过 slot 或事件）。
 * 本身不含下拉，纯按钮 + 插槽样式，保持 inline 风格。
 */
import { computed } from 'vue';

const props = defineProps<{
  /** 当前展示文本（已选值的人类可读字符串） */
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** 图标（可选，例如下拉箭头） */
  icon?: string;
}>();

const emit = defineEmits<{
  (e: 'click', ev: MouseEvent): void;
}>();

const isEmpty = computed(() => !props.label);

function onClick(e: MouseEvent) {
  if (props.disabled) return;
  emit('click', e);
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[
      'inline-flex items-center gap-0.5',
      'border-0 border-b border-dotted bg-transparent',
      'px-0.5 py-0 text-[13px]',
      'focus:outline-none focus:ring-0',
      'transition-colors',
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      invalid
        ? 'border-destructive text-destructive'
        : isEmpty
          ? 'border-muted-foreground/50 text-muted-foreground hover:text-foreground'
          : 'border-primary/30 text-primary hover:border-primary',
    ]"
    @click="onClick"
  >
    <span>{{ label || placeholder || $t('iotApp.av.pleaseSelect') }}</span>
    <span
      v-if="icon"
      :class="[icon, 'size-3 opacity-60']"
    ></span>
  </button>
</template>
