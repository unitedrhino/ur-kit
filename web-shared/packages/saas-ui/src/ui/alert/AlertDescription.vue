<!--
文件说明：shadcn 提示内容。
用于承载提示的补充说明、列表或其他正文信息。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

/** 组件属性用于向提示正文追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div :class="cn('text-sm [&_p]:leading-relaxed', props.class)">
    <slot />
  </div>
</template>
