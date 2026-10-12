/**
 * 文件说明：项目管理器查询栏模式回归测试。
 * 验证左侧项目管理器可在查询表单中复用，并保持当前项目入口。
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import SidebarProjectSelector from './SidebarProjectSelector.vue';

const storeMocks = vi.hoisted(() => ({
  projectStore: {
    clearCurrentProjectID: vi.fn(),
    closeProjectCreateModal: vi.fn(),
    createProject: vi.fn(),
    currentProject: { projectID: 'project-1', projectName: '一号项目' },
    currentProjectID: 'project-1',
    deleteProject: vi.fn(),
    getProjects: vi.fn(),
    isCreateRequired: false,
    loading: false,
    projectOptions: [{ label: '一号项目', value: 'project-1' }],
    projects: [{ projectID: 'project-1', projectName: '一号项目' }],
    setCurrentProjectID: vi.fn(),
    showProjectCreateModal: false,
  },
}));

vi.mock('@vben/preferences', () => ({
  preferences: { sidebar: { collapsed: false } },
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => storeMocks.projectStore,
}));

vi.mock('@vben-core/shadcn-ui', () => {
  const Slot = { template: '<div><slot /></div>' };
  return {
    AlertDialog: Slot,
    AlertDialogAction: Slot,
    AlertDialogCancel: Slot,
    AlertDialogContent: Slot,
    AlertDialogDescription: Slot,
    AlertDialogTitle: Slot,
    Button: { template: '<button><slot /></button>' },
    Input: { template: '<input />' },
    Popover: Slot,
    PopoverContent: Slot,
    PopoverTrigger: Slot,
    Tooltip: Slot,
    TooltipContent: Slot,
    TooltipProvider: Slot,
    TooltipTrigger: Slot,
    VbenIcon: { template: '<span />' },
  };
});

vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('./ProjectFormDrawer.vue', () => ({
  default: { template: '<div />' },
}));

describe('sidebarProjectSelector', () => {
  it('查询栏模式应展示与表单控件对齐的当前项目入口', () => {
    const wrapper = mount(SidebarProjectSelector, {
      props: { variant: 'filter' },
    });

    const trigger = wrapper.get('[data-testid="project-manager-filter"]');
    expect(trigger.text()).toContain('项目');
    expect(trigger.text()).toContain('一号项目');
  });
});
