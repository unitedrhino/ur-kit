/** Naive 数据表格兼容入口：保留原有属性、事件、插槽与实例，默认启用业务列宽调整。 */
import type { DataTableBaseColumn, DataTableColumns, DataTableInst } from 'naive-ui';
import type { PropType } from 'vue';
import { NDataTable as NativeDataTable } from 'naive-ui';

import { computed, defineComponent, h, ref } from 'vue';
import { useResizeClickGuard } from '../hooks/use-resize-click-guard';

/** withResizableColumns 复制列配置并递归启用业务叶子列；选择、展开列维持原配置。 */
/** 业务子列保持原生分组要求的基础列类型。 */
export function withResizableColumns(columns: DataTableBaseColumn<any>[]): DataTableBaseColumn<any>[];
/** 完整列数组保留选择、展开与分组类型。 */
export function withResizableColumns(columns: DataTableColumns<any>): DataTableColumns<any>;
export function withResizableColumns(columns: DataTableColumns<any>): DataTableColumns<any> {
  return columns.map((column) => {
    if ('children' in column) return { ...column, children: withResizableColumns(column.children) };
    if ('type' in column && ['selection', 'expand'].includes(column.type ?? '')) return column;
    const businessColumn = column as DataTableBaseColumn<any>;
    return { ...businessColumn, minWidth: businessColumn.minWidth ?? 64, resizable: businessColumn.resizable ?? true };
  });
}

/** NDataTable 为存量表格补默认列宽拖动，不改变分页、选择和虚拟滚动行为。 */
export const NDataTable = defineComponent({
  name: 'ResizableNaiveDataTable',
  inheritAttrs: false,
  /** columns 为原 Naive 列定义；其余属性、事件和插槽透传至原组件。 */
  props: { columns: { type: Array as PropType<DataTableColumns<any>>, default: () => [] } },
  setup(props, { attrs, expose, slots }) {
    /** 原生实例，代理保留 scrollTo、sort、page 等调用能力。 */
    const native = ref<DataTableInst>();
    /** 手柄移动后产生的表头点击也必须隔离。 */
    const guardResizeClick = useResizeClickGuard('[data-data-table-resizable]');
    /** 派生列配置，不污染调用方共用的列数组。 */
    const columns = computed(() => withResizableColumns(props.columns));
    // Vue 的公开实例先检查成员是否存在，需同时代理 has，才能保留原生方法。
    expose(new Proxy({}, {
      get: (_, key) => native.value?.[key as keyof DataTableInst],
      // $ 是包装组件的内部身份，不能转交给子组件，否则事件观测会指向错误实例。
      has: (_, key) => key !== '$' && !!native.value && key in native.value,
    }));
    return () => h(NativeDataTable, { ...attrs, columns: columns.value, ref: native, onMousedownCapture: [guardResizeClick, attrs.onMousedownCapture].filter(Boolean) }, slots);
  },
});
