<!-- 通用 Table 展示原语，默认支持列宽拖动，可关联 TanStack 状态实例。 -->
<script setup lang="ts">
import type { Table as TanStackTable } from '@tanstack/vue-table';
import type { HTMLAttributes } from 'vue';
import { ref } from 'vue';
import { cn } from '@unitedrhino/saas-ui/lib/utils';
import { useTableColumnResize } from '../../lib/table-column-resize';

/** class 为表格样式；resizable 控制拖动；table 可同步 TanStack 列宽状态。 */
const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class'];
  resizable?: boolean;
  table?: TanStackTable<any>;
}>(), { resizable: true });
/** 表格 DOM 引用用于对齐整列宽度和安装拖动交互。 */
const tableElement = ref<HTMLTableElement>();
useTableColumnResize(tableElement, () => ({ resizable: props.resizable, table: props.table }));
</script>

<template>
  <div class="relative w-full overflow-auto">
    <table ref="tableElement" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
