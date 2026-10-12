<template>
  <n-tooltip trigger="hover" placement="top" :keep-alive-on-hover="false">
    <template #trigger>
      <n-icon size="16" :depth="3" style="cursor: help">
        <HelpOutlineIcon />
      </n-icon>
    </template>
    <div style="max-width: 280px; white-space: normal; line-height: 1.5">
      {{ text }}
    </div>
  </n-tooltip>
</template>

<script setup lang="ts">
import { icon } from '@/plugins';

const { HelpOutlineIcon } = icon.ionicons5;

defineProps<{
  text: string;
}>();
</script>
