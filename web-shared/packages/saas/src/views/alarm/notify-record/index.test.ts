/**
 * 文件说明：通知记录列表项目筛选布局测试。
 * 验证轻量项目选择器位于通知记录查询条件最前面。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import NotifyRecordPage from './index.vue';

const apiMocks = vi.hoisted(() => ({
  getEvent: vi.fn().mockResolvedValue({}),
  getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
  resend: vi.fn(),
}));

vi.mock('../api/alarm-event.api', () => ({
  getAlarmEventOne: apiMocks.getEvent,
}));

vi.mock('../api/alarm-notify-record.api', () => ({
  getAlarmNotifyRecordList: apiMocks.getList,
  resendAlarmNotifyRecord: apiMocks.resend,
}));

vi.mock('../components/AlarmProjectFilter.vue', () => ({
  default: {
    emits: ['change'],
    template: '<button data-testid="alarm-project-filter" @click="$emit(\'change\', \'project-1\')" />',
  },
}));

vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => ({ currentProjectID: null }),
}));

vi.mock('lucide-vue-next', () => ({
  Minus: { template: '<span>-</span>' },
  Plus: { template: '<span>+</span>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/button', () => ({
  Button: { template: '<button><slot /></button>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/dialog', () => ({
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/empty', () => ({
  Empty: { template: '<div><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyTitle: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/input', () => ({
  Input: { template: '<input />' },
}));

vi.mock('@unitedrhino/saas-ui/ui/select', () => ({
  Select: { template: '<div><slot /></div>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<div />' },
}));

describe('notifyRecordPage', () => {
  it('项目筛选器应位于通知记录查询条件最前面', async () => {
    const wrapper = mount(NotifyRecordPage);
    await flushPromises();

    const primaryRow = wrapper.get('[data-testid="alarm-filter-primary"]');
    expect((primaryRow.element.firstElementChild as HTMLElement | null)?.dataset.testid).toBe('alarm-project-filter');
  });

  it('高级查询条件默认折叠并可通过加号展开和收起', async () => {
    const wrapper = mount(NotifyRecordPage);
    await flushPromises();

    expect(wrapper.find('[data-testid="alarm-filter-advanced"]').exists()).toBe(false);

    const toggle = wrapper.get('[data-testid="alarm-filter-toggle"]');
    expect(toggle.attributes('aria-label')).toBe('展开更多查询条件');

    await toggle.trigger('click');
    expect(wrapper.find('[data-testid="alarm-filter-advanced"]').exists()).toBe(true);
    expect(toggle.attributes('aria-label')).toBe('收起更多查询条件');

    await toggle.trigger('click');
    expect(wrapper.find('[data-testid="alarm-filter-advanced"]').exists()).toBe(false);
  });

  it('项目尚未就绪时不应查询通知记录', async () => {
    const wrapper = mount(NotifyRecordPage);
    await flushPromises();

    expect(apiMocks.getList).not.toHaveBeenCalled();

    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();
    expect(apiMocks.getList).toHaveBeenCalledOnce();
  });
});
