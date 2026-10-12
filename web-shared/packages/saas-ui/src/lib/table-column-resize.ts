/** 原生表格列宽拖动：共享表格使用同一交互，TanStack 表格同步其列宽状态。 */
import type { Table } from '@tanstack/vue-table';
import type { Ref } from 'vue';
import { onBeforeUnmount, onMounted, onUpdated, watch } from 'vue';
import { $t, i18n } from '@vben/locales';
import { useResizeClickGuard } from './resize-click-guard';

/** useTableColumnResize 为表头叶子列安装拖动手柄；卸载时回收全部监听器与临时样式。 */
export function useTableColumnResize(element: Ref<HTMLTableElement | undefined>, options: () => { resizable: boolean; table?: Table<any> }) {
  /** 达到列宽边界后，手柄与鼠标位置会分离，需隔离整次 Pointer 手势的点击。 */
  const guardResizeClick = useResizeClickGuard('[data-column-resize-handle]', 'pointer');
  /** 已安装手柄的表头及其清理方法。 */
  const handles = new Map<HTMLTableCellElement, () => void>();
  /** 普通表格的列宽；TanStack 表格从实例读取受控宽度。 */
  const widths = new Map<string, number>();
  /** 当前拖动的清理方法，避免组件卸载后残留文档监听器。 */
  let finishDrag: (() => void) | undefined;
  /** 共享 colgroup 对齐整列，避免只调整表头而内容不跟随。 */
  let colgroup: HTMLTableColElement | undefined;

  /** leafHeaders 选择最底层表头，含 rowspan 的叶子列按物理列顺序返回。 */
  function leafHeaders(): HTMLTableCellElement[] {
    const table = element.value;
    const head = table?.querySelector('thead');
    if (!head) return [];
    const rows = Array.from(head.children).filter((row) => row.tagName === 'TR');
    const headers: HTMLTableCellElement[] = [];
    const positions = new Map<HTMLTableCellElement, number>();
    const occupied: number[] = [];
    for (const [rowIndex, row] of rows.entries()) {
      let index = 0;
      for (const cell of Array.from(row.children) as HTMLTableCellElement[]) {
        const colSpan = Number(cell.getAttribute('colspan') || 1);
        const rowSpan = Number(cell.getAttribute('rowspan') || 1);
        while ((occupied[index] ?? 0) > rowIndex) index++;
        positions.set(cell, index);
        for (let offset = 0; offset < colSpan; offset++) occupied[index + offset] = rowIndex + rowSpan;
        if (colSpan === 1 && rowIndex + rowSpan >= rows.length) headers.push(cell);
        index += colSpan;
      }
    }
    return headers.sort((a, b) => positions.get(a)! - positions.get(b)!);
  }

  /** applyWidths 将像素宽度应用到所有单元格；有状态实例时使用可见列顺序。 */
  function applyWidths() {
    const table = element.value;
    if (!table || widths.size === 0) return;
    const columns = options().table?.getVisibleLeafColumns();
    const headers = leafHeaders();
    const sizes = headers.map((header, index) => {
      const column = columns?.[index];
      return column ? column.getSize() : widths.get(String(index)) ?? header.getBoundingClientRect().width;
    });
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      colgroup.dataset.columnResize = '';
      table.insertBefore(colgroup, table.tHead);
    }
    while (colgroup.children.length > sizes.length) colgroup.lastElementChild?.remove();
    sizes.forEach((size, index) => {
      const col = colgroup!.children[index] ?? colgroup!.appendChild(document.createElement('col'));
      (col as HTMLElement).style.width = `${size}px`;
    });
    table.style.tableLayout = 'fixed';
    table.style.width = `${sizes.reduce((sum, size) => sum + size, 0)}px`;
  }

  /** setWidth 按列约束调整宽度，同时更新 TanStack 状态；普通表格保存在组件内存。 */
  function setWidth(index: number, width: number) {
    const model = options().table;
    const column = model?.getVisibleLeafColumns()[index];
    const bounded = Math.min(column?.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER, Math.max(column?.columnDef.minSize ?? 64, width));
    if (model && column) model.setColumnSizing((current) => ({ ...current, [column.id]: bounded }));
    else widths.set(String(index), bounded);
    applyWidths();
  }

  /** prepareWidths 在首次拖动时锁定实际渲染宽度，避免默认宽度造成整表跳动。 */
  function prepareWidths() {
    if (widths.size > 0) return;
    const columns = options().table?.getVisibleLeafColumns();
    const initial: Record<string, number> = {};
    leafHeaders().forEach((header, index) => {
      const width = header.getBoundingClientRect().width || columns?.[index]?.getSize() || 160;
      widths.set(String(index), width);
      if (columns?.[index]) initial[columns[index]!.id] = width;
    });
    if (columns) options().table!.setColumnSizing(initial);
  }

  /** syncHandles 只更新变动的表头；数据翻页不重复安装监听器。 */
  function syncHandles() {
    const headers = options().resizable ? leafHeaders() : [];
    for (const [header, cleanup] of handles) {
      if (!headers.includes(header)) { cleanup(); handles.delete(header); }
    }
    headers.forEach((header, index) => {
      const column = options().table?.getVisibleLeafColumns()[index];
      if (column?.getCanResize() === false || header.dataset.resizable === 'false') {
        handles.get(header)?.(); handles.delete(header); return;
      }
      if (handles.has(header) && header.querySelector('[data-column-resize-handle]')) return;
      // Vue 更新表头文字时可能替换子节点，已移除的手柄需重新安装。
      handles.get(header)?.(); handles.delete(header);
      const handle = document.createElement('button');
      handle.type = 'button';
      handle.dataset.columnResizeHandle = '';
      handle.setAttribute('aria-label', $t('ui.dataTable.resizeColumn'));
      handle.title = $t('ui.dataTable.resizeColumn');
      handle.style.cssText = 'position:absolute;inset-block:0;inset-inline-end:-3px;width:8px;cursor:col-resize;touch-action:none;z-index:1;background:transparent;border:0;padding:0;';
      const previousPosition = header.style.position;
      if (!header.style.position) header.style.position = 'relative';
      header.appendChild(handle);
      /** stopActivation 防止点击手柄触发表头排序或祖先行操作。 */
      const stopActivation = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
      /** startDrag 仅处理主指针，拖动时停止文本选择，结束后恢复。 */
      const startDrag = (event: PointerEvent) => {
        if (event.button !== 0) return;
        guardResizeClick(event);
        stopActivation(event);
        finishDrag?.();
        prepareWidths();
        const activeIndex = leafHeaders().indexOf(header);
        const startWidth = header.getBoundingClientRect().width || 160;
        const direction = getComputedStyle(header).direction === 'rtl' ? -1 : 1;
        const previousSelection = document.body.style.userSelect;
        document.body.style.userSelect = 'none';
        const move = (next: PointerEvent) => setWidth(activeIndex, startWidth + (next.clientX - event.clientX) * direction);
        const end = () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', end);
          document.removeEventListener('pointercancel', end);
          document.body.style.userSelect = previousSelection;
          finishDrag = undefined;
        };
        finishDrag = end;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', end);
        document.addEventListener('pointercancel', end);
      };
      /** keyResize 允许键盘左右键调整列宽。 */
      const keyResize = (event: KeyboardEvent) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        stopActivation(event); prepareWidths();
        const activeIndex = leafHeaders().indexOf(header);
        const direction = getComputedStyle(header).direction === 'rtl' ? -1 : 1;
        setWidth(activeIndex, header.getBoundingClientRect().width + (event.key === 'ArrowRight' ? 10 : -10) * direction);
      };
      handle.addEventListener('pointerdown', startDrag);
      handle.addEventListener('click', stopActivation);
      handle.addEventListener('keydown', keyResize);
      handles.set(header, () => {
        handle.removeEventListener('pointerdown', startDrag);
        handle.removeEventListener('click', stopActivation);
        handle.removeEventListener('keydown', keyResize);
        handle.remove(); header.style.position = previousPosition;
      });
    });
    // 已有手柄的文案也随运行时语言切换刷新。
    for (const header of handles.keys()) {
      const handle = header.querySelector<HTMLButtonElement>('[data-column-resize-handle]');
      handle?.setAttribute('aria-label', $t('ui.dataTable.resizeColumn'));
      if (handle) handle.title = $t('ui.dataTable.resizeColumn');
    }
    applyWidths();
  }

  // 实例状态及语言可独立变化，不能依赖业务数据重新渲染才同步宽度或标签。
  watch(() => [options().resizable, options().table?.getState().columnSizing, options().table?.getState().columnVisibility, i18n.global.locale.value], syncHandles, { flush: 'post' });
  onMounted(syncHandles);
  onUpdated(syncHandles);
  onBeforeUnmount(() => { finishDrag?.(); for (const cleanup of handles.values()) cleanup(); colgroup?.remove(); });
}
