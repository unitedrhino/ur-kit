<!--
文件说明：shadcn 输入组合容器。
统一承载输入控件及其前后缀信息，并在组合内部集中处理边框和焦点状态。
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';

/** 组件属性用于向输入组合根容器追加布局类名。 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="input-group"
    role="group"
    :class="
      cn(
        'group/input-group border-input relative flex w-full items-center rounded-md border outline-none',
        'h-9 min-w-0 has-[>textarea]:h-auto',

        // 根据附加区域的位置调整输入控件内边距与排列方向。
        'has-[>[data-align=inline-start]]:[&>input]:pl-2',
        'has-[>[data-align=inline-end]]:[&>input]:pr-2',
        'has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3',
        'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3',

        // 由组合容器统一呈现内部控件的键盘焦点状态。
        'has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1',

        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
