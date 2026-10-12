/** Naive 表格列宽兼容回归：业务列、辅助列、原有约束与配置隔离。 */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { NDataTable as NativeDataTable } from 'naive-ui';
import { NDataTable, withResizableColumns } from './resizable-naive-table';

describe('Naive 列宽默认配置', () => {
  it('兼容入口挂载原生组件并透传属性，避免误引用自身', () => {
    const wrapper = mount(NDataTable, { props: { columns: [{ key: 'name', title: '名称' }] }, attrs: { data: [{ name: '设备' }], pagination: false, rowKey: (row: { name: string }) => row.name } });
    const native = wrapper.findComponent(NativeDataTable);
    expect(native.exists()).toBe(true);
    expect(native.props('columns')[0]).toMatchObject({ resizable: true, minWidth: 64 });
    expect(native.props('data')).toEqual([{ name: '设备' }]);
    expect(typeof (wrapper.vm as any).sort).toBe('function');
    expect(typeof (wrapper.vm as any).scrollTo).toBe('function');
    wrapper.unmount();
  });
  it('业务列默认启用，保留显式关闭和宽度约束', () => {
    const original = [{ key: 'name', title: '名称', width: 200 }, { key: 'status', title: '状态', resizable: false, minWidth: 90, maxWidth: 220 }];
    const result = withResizableColumns(original);
    expect(result[0]).toMatchObject({ resizable: true, width: 200, minWidth: 64 });
    expect(result[1]).toMatchObject({ resizable: false, minWidth: 90, maxWidth: 220 });
    expect(original[0]).not.toHaveProperty('resizable');
  });
  it('递归分组，选择与展开辅助列保留原配置', () => {
    const selection = { type: 'selection' as const };
    const expand = { type: 'expand' as const, expandable: () => true, renderExpand: () => '' };
    const result = withResizableColumns([selection, expand, { title: '属性', key: 'attributes', children: [{ key: 'temperature', title: '温度' }] }]);
    expect(result[0]).toBe(selection);
    expect(result[1]).toBe(expand);
    expect(result[2]).toMatchObject({ children: [{ key: 'temperature', resizable: true }] });
  });
});
