/**
 * 新版 DataTable 公共属性定义。
 */
import type { ColumnDef } from '@tanstack/vue-table';

/** DataTableProps 描述通用数据表格输入。 */
export interface DataTableProps<TData> {
  /** TanStack 列定义。 */
  columns: ColumnDef<TData, any>[];
  /** 当前页数据。 */
  data: TData[];
  /** 树形表格是否默认全部展开。 */
  defaultExpandAll?: boolean;
  /** 初始每页条数。 */
  defaultPageSize?: number;
  /** 是否展示列显隐菜单。 */
  enableHiding?: boolean;
  /** 是否允许拖动列宽，默认启用。 */
  enableColumnResizing?: boolean;
  /** 是否允许选择行。 */
  enableRowSelection?: boolean;
  /** 是否启用排序状态。 */
  enableSorting?: boolean;
  /** 是否撑满父容器可用高度。 */
  fullHeight?: boolean;
  /** 返回树形行的子数据。 */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** 业务稳定行标识，服务端分页时不复用数组下标。 */
  getRowId?: (row: TData, index: number) => string;
  /** 可选列偏好存储键；未设置时维持原有仅内存行为。 */
  columnPreferenceKey?: string;
  /** 是否正在加载。 */
  loading?: boolean;
  /** 是否由服务端处理分页。 */
  manualPagination?: boolean;
  /** 明确指定的总页数。 */
  pageCount?: number;
  /** 是否展示分页栏。 */
  showPagination?: boolean;
  /** 数据总条数。 */
  total?: number;
}
