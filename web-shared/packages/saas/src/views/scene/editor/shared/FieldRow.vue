<script setup lang="ts">
/** 标签 + 控件的成行布局（label 在上，控件在下）。 */
defineProps<{
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  widthClass?: string;
}>();
</script>

<template>
  <div :class="['flex flex-col gap-1', widthClass || 'min-w-[140px]']">
    <label
      class="text-muted-foreground flex h-[14px] items-center text-[11px] font-medium leading-none"
    >
      <template v-if="label">
        {{ label }}
        <span v-if="required" class="text-destructive ml-0.5">*</span>
      </template>
    </label>
    <slot />
    <p
      v-if="error"
      class="text-destructive min-h-[14px] text-[11px] leading-[14px]"
    >
      {{ error }}
    </p>
    <p
      v-else
      class="text-muted-foreground min-h-[14px] text-[11px] leading-[14px]"
    >
      {{ hint || '\u00a0' }}
    </p>
  </div>
</template>
