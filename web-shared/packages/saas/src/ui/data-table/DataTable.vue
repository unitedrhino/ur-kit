<script setup lang="ts" generic="TData">
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  ExpandedState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unitedrhino/saas-ui/ui/table';
import { computed, onMounted, ref } from 'vue';

import DataTablePagination from './DataTablePagination.vue';
import { valueUpdater } from './utils';
import DataTableViewOptions from './DataTableViewOptions.vue';

interface Props {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  // 服务端分页
  manualPagination?: boolean;
  pageCount?: number;
  total?: number;
  defaultPageSize?: number;
  // 功能开关
  enableRowSelection?: boolean;
  enableSorting?: boolean;
  enableHiding?: boolean;
  /** 是否允许拖动列宽，默认启用；列级 enableResizing 可关闭特定列。 */
  enableColumnResizing?: boolean;
  // 树形子行支持
  getSubRows?: (row: TData) => TData[] | undefined;
  // 默认全部展开（有子行时生效）
  defaultExpandAll?: boolean;
  // 是否显示底部分页（默认 true，树形表格通常设为 false）
  showPagination?: boolean;
  // 是否撑满父容器高度（用于 Page auto-content-height 场景）
  fullHeight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  manualPagination: false,
  defaultPageSize: 20,
  enableRowSelection: false,
  enableSorting: true,
  enableHiding: true,
  enableColumnResizing: true,
  getSubRows: undefined,
  defaultExpandAll: true,
  showPagination: true,
  fullHeight: false,
  pageCount: undefined,
  total: undefined,
});

const emit = defineEmits<{
  paginationChange: [{ pageIndex: number; pageSize: number }];
  sortingChange: [SortingState];
  rowSelectionChange: [TData[]];
}>();

/** 当前列宽状态，表头与内容由同一状态控制。 */
const columnSizing = ref<ColumnSizingState>({});
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});
const rowSelection = ref({});
const expanded = ref<ExpandedState>({});
const pagination = ref({
  pageIndex: 0,
  pageSize: props.defaultPageSize,
});

// 计算总页数（服务端分页时使用）
const resolvedPageCount = computed(() => {
  if (props.pageCount !== undefined) return props.pageCount;
  if (props.total !== undefined) {
    return Math.ceil(props.total / pagination.value.pageSize);
  }
  return undefined;
});

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  get pageCount() {
    return resolvedPageCount.value;
  },
  state: {
    get columnSizing() { return columnSizing.value; },
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get expanded() {
      return expanded.value;
    },
    get pagination() {
      return pagination.value;
    },
  },
  enableColumnResizing: props.enableColumnResizing,
  onColumnSizingChange: (updater) => valueUpdater(updater, columnSizing),
  enableRowSelection: props.enableRowSelection,
  manualPagination: props.manualPagination,
  onSortingChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, sorting);
    emit('sortingChange', sorting.value);
  },
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, rowSelection);
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    emit('rowSelectionChange', selectedRows);
  },
  onExpandedChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, expanded),
  onPaginationChange: (updaterOrValue) => {
    valueUpdater(updaterOrValue, pagination);
    if (props.manualPagination) {
      emit('paginationChange', { ...pagination.value });
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getSubRows: props.getSubRows,
});

// 初始化时默认展开所有行
onMounted(() => {
  if (props.getSubRows && props.defaultExpandAll) {
    table.toggleAllRowsExpanded(true);
  }
});

defineExpose({ table });
</script>

<template>
  <div :class="fullHeight ? 'flex h-full flex-col space-y-3' : 'space-y-3'">
    <!-- 工具栏 -->
    <div
      v-if="$slots['toolbar-left'] || $slots['toolbar-right'] || $slots['toolbar-after'] || enableHiding"
      class="flex shrink-0 items-center justify-between gap-2"
    >
      <div class="flex flex-1 items-center gap-2">
        <slot name="toolbar-left" :table="table" />
      </div>
      <div class="flex items-center gap-2">
        <DataTableViewOptions v-if="enableHiding" :table="table" />
        <slot name="toolbar-right" :table="table" />
        <slot name="toolbar-after" :table="table" />
      </div>
    </div>

    <!-- 表格 -->
    <div
      :class="
        fullHeight
          ? 'min-h-0 flex-1 overflow-auto rounded-md border bg-card'
          : 'rounded-md border bg-card overflow-hidden'
      "
    >
      <Table :table="table" :resizable="enableColumnResizing">
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="(header.column.columnDef.meta as any)?.headerStyle"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <!-- 加载中 -->
          <TableRow v-if="loading">
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center text-muted-foreground"
            >
              <slot name="loading">{{ $t('ui.dataTable.loading') }}</slot>
            </TableCell>
          </TableRow>

          <!-- 有数据 -->
          <template v-else-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :style="(cell.column.columnDef.meta as any)?.cellStyle"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <!-- 空数据 -->
          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center text-muted-foreground"
            >
              <slot name="empty">{{ $t('ui.dataTable.empty') }}</slot>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页 -->
    <DataTablePagination
      v-if="showPagination"
      :table="table"
      :total="total"
      :class="fullHeight ? 'shrink-0' : ''"
    />
  </div>
</template>
