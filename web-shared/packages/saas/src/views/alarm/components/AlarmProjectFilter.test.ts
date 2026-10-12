/**
 * 文件说明：告警列表项目管理器测试。
 * 验证项目必选，并通过共享项目管理器提供完整项目操作入口。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import AlarmProjectFilter from './AlarmProjectFilter.vue';

const storeMocks = vi.hoisted(() => ({
  projectStore: null as any,
}));

vi.mock('@vben/stores', async () => {
  const { reactive } = await import('vue');
  const projectStore = reactive({
    clearCurrentProjectID: vi.fn(() => {
      projectStore.currentProjectID = null;
    }),
    currentProjectID: null as null | string,
    getProjects: vi.fn(),
    loading: false,
    openProjectSelectModal: vi.fn(),
    projects: [
      { projectID: 'project-1', projectName: '一号项目' },
      { projectID: 'project-2', projectName: '二号项目' },
    ],
    setCurrentProjectID: vi.fn((projectID: string) => {
      projectStore.currentProjectID = projectID;
    }),
  });
  storeMocks.projectStore = projectStore;
  return { useProjectStore: () => projectStore };
});

vi.mock('@vben/saas', () => ({
  ProjectManagerSelector: {
    emits: ['change'],
    template: '<button data-testid="project-manager-filter" @click="$emit(\'change\', \'project-2\')">项目 一号项目</button>',
  },
  ProjectSelectModal: {
    template: '<div data-testid="project-select-modal" />',
  },
}));

describe('alarmProjectFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.projectStore.currentProjectID = null;
    storeMocks.projectStore.projects = [
      { projectID: 'project-1', projectName: '一号项目' },
      { projectID: 'project-2', projectName: '二号项目' },
    ];
    storeMocks.projectStore.getProjects.mockResolvedValue({ list: storeMocks.projectStore.projects });
  });

  it('存在多个项目且尚未选择时应先打开项目选择弹窗', async () => {
    const wrapper = mount(AlarmProjectFilter);
    await flushPromises();

    expect(storeMocks.projectStore.setCurrentProjectID).not.toHaveBeenCalled();
    expect(storeMocks.projectStore.openProjectSelectModal).toHaveBeenCalledOnce();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(wrapper.get('[data-testid="project-select-modal"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('全部项目');
  });

  it('只有一个项目且尚未选择时也应先打开项目选择弹窗', async () => {
    storeMocks.projectStore.projects = [{ projectID: 'project-1', projectName: '一号项目' }];
    const wrapper = mount(AlarmProjectFilter);
    await flushPromises();

    expect(storeMocks.projectStore.setCurrentProjectID).not.toHaveBeenCalled();
    expect(wrapper.emitted('change')).toBeUndefined();
    expect(storeMocks.projectStore.openProjectSelectModal).toHaveBeenCalledOnce();
  });

  it('选择项目后应更新项目上下文并通知列表查询', async () => {
    storeMocks.projectStore.currentProjectID = 'project-1';
    const wrapper = mount(AlarmProjectFilter);
    await flushPromises();

    await wrapper.get('[data-testid="alarm-project-filter"]').trigger('click');

    expect(storeMocks.projectStore.setCurrentProjectID).toHaveBeenCalledWith('project-2');
    expect(wrapper.emitted('change')).toEqual([['project-1'], ['project-2']]);
  });

  it('从前置选择弹窗选中项目后应通知列表查询', async () => {
    const wrapper = mount(AlarmProjectFilter);
    await flushPromises();

    storeMocks.projectStore.currentProjectID = 'project-2';
    await nextTick();

    expect(wrapper.emitted('change')).toEqual([['project-2']]);
  });
});
