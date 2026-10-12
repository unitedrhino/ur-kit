<!--
文件说明：shadcn 输入组合辅助文本。
用于展示单位、协议前缀、结果数量等不可编辑信息。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

/** 组件属性用于向辅助文本追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span :class="cn('text-muted-foreground flex items-center gap-2 text-sm [&_svg:not([class*=\'size-\'])]:size-4 [&_svg]:pointer-events-none', props.class)">
    <slot />
  </span>
</template>
