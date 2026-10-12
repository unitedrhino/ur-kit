/**
 * 文件说明：ListPagination 列表分页器单元测试
 * 验证页码展示、上一页/下一页禁用逻辑与事件派发。
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import ListPagination from './ListPagination.vue';

describe('listPagination 列表分页器', () => {
  it('展示当前页 / 总页数 / 总数', () => {
    const wrapper = mount(ListPagination, {
      props: { page: 2, totalPages: 5, total: 100 },
    });
    expect(wrapper.text()).toContain('第 2 / 5 页');
    expect(wrapper.text()).toContain('共 100 条');
  });

  it('首页时上一页按钮禁用', () => {
    const wrapper = mount(ListPagination, {
      props: { page: 1, totalPages: 5, total: 100 },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons[0]!.attributes('disabled')).toBeDefined();
    expect(buttons[1]!.attributes('disabled')).toBeUndefined();
  });

  it('末页时下一页按钮禁用', () => {
    const wrapper = mount(ListPagination, {
      props: { page: 5, totalPages: 5, total: 100 },
    });
    const buttons = wrapper.findAll('button');
    expect(buttons[0]!.attributes('disabled')).toBeUndefined();
    expect(buttons[1]!.attributes('disabled')).toBeDefined();
  });

  it('点击下一页派发 next 事件', async () => {
    const wrapper = mount(ListPagination, {
      props: { page: 2, totalPages: 5, total: 100 },
    });
    await wrapper.findAll('button')[1]!.trigger('click');
    expect(wrapper.emitted('next')).toBeTruthy();
  });
});
