<!--
文件说明：shadcn 输入组合文本输入控件。
复用统一 Input 行为，并由输入组合容器负责边框和聚焦样式。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { Input } from '@unitedrhino/saas-ui/ui/input';

/** 组件属性用于向组合输入控件追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <Input
    data-slot="input-group-control"
    :class="
      cn(
        'flex-1 rounded-none border-0 bg-transparent ring-offset-transparent focus-visible:ring-0 focus-visible:ring-transparent',
        props.class,
      )
    "
  />
</template>
