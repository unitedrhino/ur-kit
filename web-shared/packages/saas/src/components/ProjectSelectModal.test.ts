// @vitest-environment happy-dom

/**
 * 文件说明：项目选择弹窗与新建项目弹窗的生命周期回归测试。
 * 确保两个模态弹窗不会同时挂载并争用页面交互锁。
 */
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectSelectModal from './ProjectSelectModal.vue';

const storeMocks = vi.hoisted(() => ({
  projectStore: null as any,
}));

vi.mock('@vben/stores', async () => {
  const { reactive } = await import('vue');
  const projectStore = reactive({
    closeProjectSelectModal: vi.fn(() => {
      projectStore.showProjectSelectModal = false;
    }),
    currentProjectID: null,
    getProjects: vi.fn(),
    projects: [] as Array<{ projectID: string; projectName: string }>,
    setCurrentProjectID: vi.fn(),
    showProjectSelectModal: false,
  });
  storeMocks.projectStore = projectStore;
  return {
    useProjectStore: () => projectStore,
  };
});

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    template: '<span />',
  },
}));

vi.mock('@unitedrhino/saas-ui', () => ({
  Button: {
    template: '<button type="button" @click="$emit(\'click\', $event)"><slot /></button>',
  },
  Dialog: {
    props: ['open'],
    template: '<div data-test="select-dialog" :data-open="String(open)"><slot /></div>',
  },
  DialogContent: {
    template: '<div><slot /></div>',
  },
  DialogDescription: {
    template: '<div><slot /></div>',
  },
  DialogHeader: {
    template: '<div><slot /></div>',
  },
  DialogTitle: {
    template: '<div><slot /></div>',
  },
  Input: {
    template: '<input />',
  },
}));

vi.mock('./ProjectFormDrawer.vue', () => ({
  default: {
    props: ['show'],
    template: '<div v-if="show" data-test="project-form-drawer" />',
  },
}));

describe('projectSelectModal', () => {
  beforeEach(() => {
    storeMocks.projectStore.closeProjectSelectModal.mockClear();
    storeMocks.projectStore.projects = [];
    storeMocks.projectStore.showProjectSelectModal = true;
  });

  it('打开新建项目弹窗前应先卸载项目选择弹窗', async () => {
    const wrapper = mount(ProjectSelectModal);
    const createButton = wrapper.findAll('button').find((button) => button.text().includes('创建项目'));

    expect(createButton).toBeDefined();
    await createButton!.trigger('click');

    expect(wrapper.find('[data-test="project-form-drawer"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="select-dialog"]').exists()).toBe(false);
  });
});
