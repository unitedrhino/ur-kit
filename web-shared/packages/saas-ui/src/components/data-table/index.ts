/**
 * 新版数据表格组件统一出口，基于 TanStack Table 与当前 Reka UI 组件实现。
 */
export { default as DataTable } from './DataTable.vue';
export type { DataTableProps } from './types';

export type { Column, ColumnDef, ColumnFiltersState, ExpandedState, Row, SortingState, VisibilityState } from '@tanstack/vue-table';
