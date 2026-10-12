export { default as DataTable } from './DataTable.vue';
export { default as DataTableColumnHeader } from './DataTableColumnHeader.vue';
export { default as DataTablePagination } from './DataTablePagination.vue';
export { default as DataTableViewOptions } from './DataTableViewOptions.vue';
export { valueUpdater } from './utils';

// Re-export TanStack Table 常用类型和函数，方便业务代码使用
export type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/vue-table';
export {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table';
