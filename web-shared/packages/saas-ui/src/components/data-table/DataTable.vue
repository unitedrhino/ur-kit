<!--
  新版通用数据表格：组合 TanStack Table 与当前 @unitedrhino/saas-ui 组件，
  支持服务端分页、行选择、树形展开、列显隐和自定义加载/空态。
-->
<script setup lang="ts" generic="TData">
import type { ColumnFiltersState, ColumnSizingState, ExpandedState, SortingState, VisibilityState } from '@tanstack/vue-table';

import type { DataTableProps } from './types';

import { computed, onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui';
import DataTablePagination from './DataTablePagination.vue';
import DataTableViewOptions from './DataTableViewOptions.vue';
import { valueUpdater } from './utils';

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  defaultExpandAll: true,
  defaultPageSize: 20,
  enableHiding: true,
  enableColumnResizing: true,
  enableRowSelection: false,
  enableSorting: true,
  fullHeight: false,
  loading: false,
  manualPagination: false,
  pageCount: undefined,
  showPagination: true,
  total: undefined,
});

/** DataTable 交互事件。 */
const emit = defineEmits<{
  /** 分页状态变化。 */
  paginationChange: [{ pageIndex: number; pageSize: number }];
  /** 当前选中业务行变化。 */
  rowSelectionChange: [TData[]];
  /** 排序状态变化。 */
  sortingChange: [SortingState];
}>();

/** 当前列宽状态，表头与内容由同一状态控制。 */
const columnSizing = ref<ColumnSizingState>({});
/** 当前排序状态。 */
const sorting = ref<SortingState>([]);
/** 当前列筛选状态。 */
const columnFilters = ref<ColumnFiltersState>([]);
/** 当前列显隐状态。 */
const columnVisibility = ref<VisibilityState>({});
/** readColumnPreferences 存储不可用或过期时回到默认列，不阻断业务表格。 */
function readColumnPreferences() {
  if (!props.columnPreferenceKey) return;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(props.columnPreferenceKey) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      columnVisibility.value = Object.fromEntries(
        Object.entries(stored).filter(
          ([key, value]) =>
            typeof value === 'boolean' &&
            props.columns.some((column) => (column.id || ('accessorKey' in column ? column.accessorKey : '')) === key && column.enableHiding !== false),
        ),
      );
    }
  } catch {
    /* 列偏好不是业务数据，读取失败保留默认布局。 */
  }
}
readColumnPreferences();
/** 当前行选择状态。 */
const rowSelection = ref<Record<string, boolean>>({});
/** 当前树形展开状态。 */
const expanded = ref<ExpandedState>({});
/** 当前分页状态。 */
const pagination = ref({ pageIndex: 0, pageSize: props.defaultPageSize });

/** 服务端分页场景的有效总页数。 */
const resolvedPageCount = computed(() => {
  if (props.pageCount !== undefined) return props.pageCount;
  if (props.total !== undefined) {
    return Math.ceil(props.total / pagination.value.pageSize);
  }
  return undefined;
});

/** 是否展示撑满高度的空态。 */
const showFullHeightEmpty = computed(() => props.fullHeight && !props.loading && props.data.length === 0);

/** 当前表格实例。 */
const table = useVueTable({
  get columns() {
    return props.columns;
  },
  get data() {
    return props.data;
  },
  get pageCount() {
    return resolvedPageCount.value;
  },
  state: {
    get columnSizing() { return columnSizing.value; },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return pagination.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get sorting() {
      return sorting.value;
    },
  },
  enableColumnResizing: props.enableColumnResizing,
  onColumnSizingChange: (updater) => valueUpdater(updater, columnSizing),
  enableRowSelection: props.enableRowSelection,
  enableSorting: props.enableSorting,
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getSubRows: props.getSubRows,
  getRowId: props.getRowId,
  manualPagination: props.manualPagination,
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, columnVisibility);
    if (props.columnPreferenceKey) {
      try {
        localStorage.setItem(props.columnPreferenceKey, JSON.stringify(columnVisibility.value));
      } catch {
        /* 无存储权限仍允许本次调整。 */
      }
    }
  },
  onExpandedChange: (updaterOrValue) => valueUpdater(updaterOrValue, expanded),
  onPaginationChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, pagination);
    if (props.manualPagination) emit('paginationChange', { ...pagination.value });
  },
  onRowSelectionChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, rowSelection);
    emit(
      'rowSelectionChange',
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  },
  onSortingChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, sorting);
    emit('sortingChange', sorting.value);
  },
});

onMounted(() => {
  if (props.getSubRows && props.defaultExpandAll) table.toggleAllRowsExpanded(true);
});

defineExpose({ table });
</script>

<template>
  <div :class="fullHeight ? 'flex min-h-0 flex-1 flex-col gap-3' : 'space-y-3'">
    <div
      v-if="$slots['toolbar-left'] || $slots['toolbar-right'] || $slots['toolbar-after'] || enableHiding"
      class="flex shrink-0 items-center justify-between gap-2"
    >
      <div class="flex flex-1 items-center gap-2">
        <slot name="toolbar-left" :table="table"></slot>
      </div>
      <div class="flex items-center gap-2">
        <DataTableViewOptions v-if="enableHiding" :table="table" />
        <slot name="toolbar-right" :table="table"></slot>
        <slot name="toolbar-after" :table="table"></slot>
      </div>
    </div>

    <div class="bg-card rounded-md border" :class="fullHeight ? 'relative flex min-h-0 flex-1 flex-col overflow-hidden' : 'overflow-hidden'">
      <div :class="fullHeight ? 'min-h-0 flex-1 overflow-auto' : ''">
        <Table :table="table" :resizable="enableColumnResizing">
          <TableHeader :class="fullHeight ? 'bg-card sticky top-0 z-10' : ''">
            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <TableHead v-for="header in headerGroup.headers" :key="header.id" :style="(header.column.columnDef.meta as any)?.headerStyle">
                <FlexRender v-if="!header.isPlaceholder" :props="header.getContext()" :render="header.column.columnDef.header" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading">
              <TableCell :colspan="table.getVisibleLeafColumns().length" class="text-muted-foreground h-24 text-center">
                <slot name="loading">{{ $t('ui.dataTable.loading') }}</slot>
              </TableCell>
            </TableRow>
            <template v-else-if="table.getRowModel().rows.length > 0">
              <TableRow v-for="row in table.getRowModel().rows" :key="row.id" :data-state="row.getIsSelected() ? 'selected' : undefined">
                <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" :style="(cell.column.columnDef.meta as any)?.cellStyle">
                  <FlexRender :props="cell.getContext()" :render="cell.column.columnDef.cell" />
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-else-if="!showFullHeightEmpty">
              <TableCell :colspan="table.getVisibleLeafColumns().length" class="text-muted-foreground h-24 text-center">
                <slot name="empty">{{ $t('ui.dataTable.empty') }}</slot>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div v-if="showFullHeightEmpty" class="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-0 top-10 flex items-center justify-center">
        <slot name="empty">{{ $t('ui.dataTable.empty') }}</slot>
      </div>
    </div>

    <DataTablePagination v-if="showPagination" :class="fullHeight ? 'shrink-0' : ''" :table="table" :total="total" />
  </div>
</template>
