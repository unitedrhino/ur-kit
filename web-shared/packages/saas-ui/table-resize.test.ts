/** 列宽交互回归：表头与内容对齐、TanStack 状态、排序隔离、分组和卸载清理。 */
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Table from './src/ui/table/Table.vue';
import DataTable from './src/components/data-table/DataTable.vue';

vi.mock('@vben/locales', async () => {
  const { ref } = await import('vue');
  return { $t: (key: string) => key, i18n: { global: { locale: ref('zh-CN') } } };
});

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; document.body.style.userSelect = ''; });

/** mockWidths 固定布局测量宽度，使无布局引擎的组件测试能验证实际像素变化。 */
function mockWidths() {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { width: Number.parseFloat(this.style.width) || 160, height: 40, x: 0, y: 0, top: 0, bottom: 40, left: 0, right: 160, toJSON: () => ({}) };
  });
}
/** drag 使用真实 DOM 指针监听路径触发列宽调整。 */
async function drag(handle: Element, delta: number) {
  handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, button: 0 }));
  document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100 + delta }));
  document.dispatchEvent(new PointerEvent('pointerup'));
  await nextTick();
}

describe('列宽拖动', () => {
  it('达到最小宽度时松开到表头也不会触发排序，后续普通点击仍可用', async () => {
    vi.useFakeTimers();
    mockWidths();
    const sort = vi.fn();
    const wrapper = mount(Table, { attachTo: document.body, slots: { default: () => h('thead', [h('tr', [h('th', { onClick: sort }, '名称')])]) } });
    await drag(wrapper.get('[data-column-resize-handle]').element, -500);
    await wrapper.get('th').trigger('click');
    expect(sort).not.toHaveBeenCalled();
    expect((wrapper.get('col').element as HTMLElement).style.width).toBe('64px');
    vi.runAllTimers();
    await wrapper.get('th').trigger('click');
    expect(sort).toHaveBeenCalledTimes(1);
    wrapper.unmount();
    vi.useRealTimers();
  });

  it('拖动后仍支持排序、分页、选择、树形展开和列显隐', async () => {
    mockWidths();
    const wrapper = mount(DataTable, { attachTo: document.body, props: {
      columns: [{ accessorKey: 'name', header: '名称' }, { accessorKey: 'status', header: '状态' }],
      data: [{ name: 'B', status: '在线', children: [{ name: 'C', status: '离线' }] }, { name: 'A', status: '在线' }],
      getSubRows: (row: any) => row.children, getRowId: (row: any) => row.name,
      enableRowSelection: true, defaultPageSize: 1, defaultExpandAll: false,
    } });
    const table = (wrapper.vm as any).table;
    await drag(wrapper.get('[data-column-resize-handle]').element, 50);
    expect(table.getState().sorting).toEqual([]);
    table.getRow('B').toggleSelected();
    table.getRow('B').toggleExpanded();
    await nextTick();
    expect(table.getSelectedRowModel().rows[0].original.name).toBe('B');
    expect(table.getExpandedRowModel().rows.map((row: any) => row.id)).toEqual(['B', 'C', 'A']);
    table.getColumn('name').toggleSorting(false);
    await nextTick();
    expect(table.getRowModel().rows[0].id).toBe('A');
    table.nextPage();
    await nextTick();
    expect(table.getState().pagination.pageIndex).toBe(1);
    table.getColumn('status').toggleVisibility(false);
    await nextTick();
    expect(wrapper.findAll('col')).toHaveLength(1);
    expect(wrapper.findAll('[data-column-resize-handle]')).toHaveLength(1);
    expect(table.getColumn('name').getSize()).toBe(210);
    wrapper.unmount();
  });

  it('简单表格整列同步宽度，并且不会触发排序', async () => {
    mockWidths();
    const sort = vi.fn();
    const wrapper = mount(Table, { attachTo: document.body, slots: { default: () => [h('thead', [h('tr', [h('th', { onClick: sort }, '名称'), h('th', '状态')])]), h('tbody', [h('tr', [h('td', '设备'), h('td', '在线')])])] } });
    const handle = wrapper.get('[data-column-resize-handle]');
    await drag(handle.element, 40);
    await handle.trigger('click');
    expect(wrapper.findAll('col').map((col) => (col.element as HTMLElement).style.width)).toEqual(['200px', '160px']);
    expect((wrapper.get('table').element as HTMLElement).style.width).toBe('360px');
    expect(sort).not.toHaveBeenCalled();
    expect(document.body.style.userSelect).toBe('');
    wrapper.unmount();
  });
  it('TanStack 表格将宽度写入状态并遵守列级约束', async () => {
    mockWidths();
    const wrapper = mount(DataTable, { attachTo: document.body, props: { columns: [{ accessorKey: 'name', header: '名称', minSize: 120, maxSize: 200 }, { accessorKey: 'status', header: '状态', enableResizing: false }], data: [{ name: '设备', status: '在线' }], showPagination: false, enableHiding: false } });
    expect(wrapper.findAll('[data-column-resize-handle]')).toHaveLength(1);
    await drag(wrapper.get('[data-column-resize-handle]').element, -100);
    expect((wrapper.vm as any).table.getState().columnSizing.name).toBe(120);
    await drag(wrapper.get('[data-column-resize-handle]').element, 500);
    expect((wrapper.vm as any).table.getState().columnSizing.name).toBe(200);
    wrapper.unmount();
  });
  it('直接 useVueTable 的表格也同步默认内部状态', async () => {
    mockWidths();
    const Host = defineComponent({ setup() {
      const table = useVueTable({ data: [{ name: '设备' }], columns: [{ accessorKey: 'name', header: '名称' }], getCoreRowModel: getCoreRowModel() });
      return () => h(Table, { table }, { default: () => h('thead', [h('tr', [h('th', '名称')])]) });
    } });
    const wrapper = mount(Host, { attachTo: document.body });
    await drag(wrapper.get('[data-column-resize-handle]').element, 30);
    expect((wrapper.get('col').element as HTMLElement).style.width).toBe('190px');
    wrapper.unmount();
  });
  it('分组表头只在叶子列安装手柄，关闭拖动时不安装', () => {
    const slots = { default: () => h('thead', [h('tr', [h('th', { rowspan: 2 }, '名称'), h('th', { colspan: 2 }, '属性')]), h('tr', [h('th', '温度'), h('th', '湿度')])]) };
    const wrapper = mount(Table, { slots });
    expect(wrapper.findAll('[data-column-resize-handle]')).toHaveLength(3);
    wrapper.unmount();
    const disabled = mount(Table, { props: { resizable: false }, slots });
    expect(disabled.findAll('[data-column-resize-handle]')).toHaveLength(0);
    disabled.unmount();
  });
  it('拖动期间卸载会恢复文本选择并移除文档监听器', () => {
    mockWidths();
    const wrapper = mount(Table, { slots: { default: () => h('thead', [h('tr', [h('th', '名称')])]) } });
    wrapper.get('[data-column-resize-handle]').element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    expect(document.body.style.userSelect).toBe('none');
    wrapper.unmount();
    expect(document.body.style.userSelect).toBe('');
  });
});
