<!-- 按钮组文本节点:组内展示非交互文本 -->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@vben-core/shared/utils';

interface Props {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <div
    data-slot="button-group-text"
    :class="
      cn(
        'flex items-center gap-2 bg-muted px-3 text-sm font-medium',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
