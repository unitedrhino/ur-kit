<script lang="ts" setup>
import { VbenIconButton } from '@vben-core/shadcn-ui';

defineOptions({ name: 'AiToolDevHeader' });

const emit = defineEmits<{
  minimize: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex items-center justify-between border-b px-4 py-3">
    <div class="flex items-center gap-2">
      <span class="text-lg">🛠️</span>
      <span class="font-medium">工具编辑助手</span>
    </div>
    <div class="flex items-center gap-1">
      <VbenIconButton
        class="h-8 w-8"
        title="最小化"
        @click="emit('minimize')"
      >
        <span class="text-sm">▼</span>
      </VbenIconButton>
      <VbenIconButton
        class="h-8 w-8"
        title="更多"
      >
        <span class="text-lg leading-none">⋮</span>
      </VbenIconButton>
    </div>
  </div>
</template>
