<!--
文件说明：shadcn 提示容器。
统一承载普通提示和错误提示，并保留可访问的 alert 语义。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import type { AlertVariants } from '.';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { alertVariants } from '.';

/** 组件属性定义提示类型和扩展布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
  variant?: AlertVariants['variant'];
}>();
</script>

<template>
  <div :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot />
  </div>
</template>
