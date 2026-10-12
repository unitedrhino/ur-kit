/**
 * 文件说明：告警事件页面状态统计回归测试。
 * 确保页面只展示后端实际支持的状态统计，不伪造“恢复中”状态。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AlarmSelect from '../components/AlarmSelect.vue';
import AlarmEventPage from './index.vue';

const apiMocks = vi.hoisted(() => ({
  getList: vi.fn(),
  getStat: vi.fn(),
}));

vi.mock('../api/alarm-event.api', () => ({
  getAlarmEventList: apiMocks.getList,
  getAlarmEventStat: apiMocks.getStat,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => ({ currentProjectID: null }),
}));

vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));

vi.mock('@unitedrhino/saas-ui/ui/empty', () => ({
  Empty: { template: '<div><slot /></div>' },
  EmptyDescription: { template: '<div><slot /></div>' },
  EmptyHeader: { template: '<div><slot /></div>' },
  EmptyTitle: { template: '<div><slot /></div>' },
}));

vi.mock('../components/AlarmProjectFilter.vue', () => ({
  default: {
    emits: ['change'],
    template: '<button data-testid="alarm-project-filter" @click="$emit(\'change\', \'project-1\')" />',
  },
}));

describe('alarmEventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getList.mockResolvedValue({ list: [], total: 0 });
    apiMocks.getStat.mockResolvedValue({ list: [] });
  });

  it('项目查询栏应位于四张事件统计卡片上方', async () => {
    const wrapper = mount(AlarmEventPage);
    await flushPromises();

    const content = wrapper.get('[data-testid="alarm-event-content"]');
    const children = [...content.element.children];
    const toolbarIndex = children.findIndex((item) => (item as HTMLElement).dataset.testid === 'alarm-filter-toolbar');
    const statsIndex = children.findIndex((item) => (item as HTMLElement).dataset.testid === 'alarm-event-stats');
    expect(toolbarIndex).toBeGreaterThanOrEqual(0);
    expect(statsIndex).toBeGreaterThan(toolbarIndex);
    expect((children[toolbarIndex]?.firstElementChild as HTMLElement | null)?.dataset.testid).toBe('alarm-project-filter');
  });

  it('不应展示后端不存在的恢复中统计和筛选项', async () => {
    const wrapper = mount(AlarmEventPage);
    await flushPromises();

    expect(wrapper.text()).not.toContain('恢复中');
  });

  it('项目尚未就绪时不应查询告警事件', async () => {
    const wrapper = mount(AlarmEventPage);
    await flushPromises();

    expect(apiMocks.getList).not.toHaveBeenCalled();
    expect(apiMocks.getStat).not.toHaveBeenCalled();

    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();
    expect(apiMocks.getList).toHaveBeenCalledOnce();
    expect(apiMocks.getStat).toHaveBeenCalledOnce();
  });

  it('应将规则名称和状态交给后端查询', async () => {
    const wrapper = mount(AlarmEventPage);
    await flushPromises();
    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();

    const keywordInput = wrapper.find('input[placeholder="规则名称"]');
    await keywordInput.setValue('温度告警');
    await keywordInput.trigger('keyup.enter');
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenLastCalledWith({
      keyword: '温度告警',
      page: { page: 1, size: 20 },
    });

    const statusSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((select) => select.props('options').some((option: { value: number | string }) => option.value === 'alarmActive'));
    expect(statusSelect).toBeDefined();
    statusSelect?.vm.$emit('update:modelValue', 'alarmActive');
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenLastCalledWith({
      keyword: '温度告警',
      page: { page: 1, size: 20 },
      status: ['alarmActive'],
    });
  });

  it('应根据后端总数请求下一页', async () => {
    apiMocks.getList.mockResolvedValue({ list: [{ alarmName: '温度告警', id: '1' }], total: 21 });
    const wrapper = mount(AlarmEventPage);
    await flushPromises();
    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();

    const nextButton = wrapper.findAll('button').find((button) => button.text() === '下一页');
    expect(nextButton).toBeDefined();
    if (!nextButton) throw new Error('未找到下一页按钮');
    await nextButton.trigger('click');
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenLastCalledWith({ page: { page: 2, size: 20 } });
  });
});
