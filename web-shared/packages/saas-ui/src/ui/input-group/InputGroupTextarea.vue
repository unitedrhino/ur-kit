<!--
文件说明：shadcn 输入组合多行文本控件。
复用统一 Textarea 行为，并由输入组合容器负责边框和聚焦样式。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';

/** 组件属性用于向组合多行输入控件追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <Textarea
    data-slot="input-group-control"
    :class="
      cn(
        'flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none ring-offset-transparent focus-visible:ring-0 focus-visible:ring-transparent',
        props.class,
      )
    "
  />
</template>
