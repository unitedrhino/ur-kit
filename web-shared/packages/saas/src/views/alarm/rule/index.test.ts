/**
 * 文件说明：告警规则列表的后端筛选和分页回归测试。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AlarmSelect from '../components/AlarmSelect.vue';
import AlarmRulePage from './index.vue';

const apiMocks = vi.hoisted(() => ({
  deleteInfo: vi.fn(),
  evaluateInfo: vi.fn(),
  getList: vi.fn(),
  updateStatus: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const projectStoreMocks = vi.hoisted(() => ({
  currentProjectID: null as null | string,
  openProjectSelectModal: vi.fn(),
}));

vi.mock('../api/alarm-info.api', () => ({
  deleteAlarmInfo: apiMocks.deleteInfo,
  evaluateAlarmInfo: apiMocks.evaluateInfo,
  getAlarmInfoList: apiMocks.getList,
  updateAlarmInfoStatus: apiMocks.updateStatus,
}));

vi.mock('../composables/useAlarmObjectTree', () => ({
  getAlarmTargetDisplay: () => '全部设备',
  useAlarmObjectTree: () => ({
    loadSources: vi.fn().mockResolvedValue(undefined),
    treeData: { value: [] },
  }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerMocks.push }),
}));

vi.mock('@vben/saas', () => ({
  message: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => projectStoreMocks,
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

describe('alarmRulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectStoreMocks.currentProjectID = null;
    apiMocks.getList.mockResolvedValue({ list: [], total: 0 });
  });

  it('项目筛选器应位于规则查询条件最前面', async () => {
    const wrapper = mount(AlarmRulePage);
    await flushPromises();

    const toolbar = wrapper.get('[data-testid="alarm-filter-toolbar"]');
    expect((toolbar.element.firstElementChild as HTMLElement | null)?.dataset.testid).toBe('alarm-project-filter');
  });

  it('项目尚未就绪时不应查询告警规则', async () => {
    const wrapper = mount(AlarmRulePage);
    await flushPromises();

    expect(apiMocks.getList).not.toHaveBeenCalled();

    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();
    expect(apiMocks.getList).toHaveBeenCalledOnce();
  });

  it('项目尚未选择时点击新增应打开项目选择弹窗', async () => {
    const wrapper = mount(AlarmRulePage);
    await flushPromises();

    const addButton = wrapper.findAll('button').find((button) => button.text().includes('新增规则'));
    expect(addButton).toBeDefined();
    await addButton!.trigger('click');

    expect(projectStoreMocks.openProjectSelectModal).toHaveBeenCalledOnce();
    expect(routerMocks.push).not.toHaveBeenCalled();
  });

  it('应将规则名称和状态交给后端查询', async () => {
    const wrapper = mount(AlarmRulePage);
    await flushPromises();
    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');
    await flushPromises();

    const keywordInput = wrapper.find('input[placeholder="规则名称"]');
    await keywordInput.setValue('位移告警');
    await keywordInput.trigger('keyup.enter');
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenLastCalledWith({
      keyword: '位移告警',
      page: { page: 1, size: 20 },
    });

    const statusSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((select) => select.props('options').some((option: { value: number | string }) => option.value === '1'));
    expect(statusSelect).toBeDefined();
    statusSelect?.vm.$emit('update:modelValue', '1');
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenLastCalledWith({
      keyword: '位移告警',
      page: { page: 1, size: 20 },
      status: 1,
    });
  });

  it('应根据后端总数请求下一页', async () => {
    apiMocks.getList.mockResolvedValue({ list: [{ id: '1', name: '位移告警' }], total: 21 });
    const wrapper = mount(AlarmRulePage);
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
