/**
 * 新版 DataTable 关键交互回归测试，覆盖计算列的显隐状态同步。
 */
import type { ColumnDef } from '@tanstack/vue-table';

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { afterEach, describe, expect, it } from 'vitest';

import DataTable from './src/components/data-table/DataTable.vue';

interface TestRow {
  /** 数据名称。 */
  name: string;
  /** 数据状态。 */
  status: number;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('dataTable', () => {
  it('列菜单展示全部可隐藏列并能切换计算列', async () => {
    /** 测试列同时包含字段列、计算列和固定操作列。 */
    const columns: ColumnDef<TestRow>[] = [
      { accessorKey: 'name', header: '名称', meta: { label: '名称' } },
      {
        cell: ({ row }) => String(row.original.status),
        header: '状态',
        id: 'statusText',
        meta: { label: '状态' },
      },
      {
        cell: () => '查看',
        enableHiding: false,
        header: '操作',
        id: 'actions',
        meta: { label: '操作' },
      },
    ];

    const wrapper = mount(DataTable<TestRow>, {
      attachTo: document.body,
      props: {
        columns,
        data: [{ name: '示例', status: 1 }],
        showPagination: false,
      },
    });

    await wrapper.get('button').trigger('click');
    await nextTick();

    const items = [...document.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')];
    expect(items.map((item) => item.textContent?.trim())).toEqual(['名称', '状态']);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'true']);

    items[1]?.click();
    await nextTick();

    expect(wrapper.findAll('th').map((header) => header.text())).toEqual(['名称', '操作']);
    wrapper.unmount();
  });
});
