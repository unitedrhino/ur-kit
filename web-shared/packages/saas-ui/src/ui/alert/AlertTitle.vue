<!--
文件说明：shadcn 提示标题。
用于展示提示的主结论或需要用户关注的状态。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

/** 组件属性用于向提示标题追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <h5 :class="cn('mb-1 font-medium leading-none tracking-tight', props.class)">
    <slot />
  </h5>
</template>
