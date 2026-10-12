/**
 * 文件说明：告警规则列表 showProjectFilter=false 模式测试。
 * 能源中心等宿主不渲染项目选择器，直接以全局 currentProjectID 为就绪信号，
 * 并在侧边栏切换项目时自动重新查询。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { nextTick, reactive } from 'vue';

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

// 模块级响应式项目状态：reactive 属性访问自动解包且可被 watch 追踪；
// vi.mock 工厂在组件 mount 时才执行，届时已初始化。
const projectState = reactive<{ currentProjectID: null | string }>({ currentProjectID: null });

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
  useProjectStore: () => ({
    // 用 getter 保持与 projectState 的实时关联，模拟真实 store 的响应式属性
    get currentProjectID() {
      return projectState.currentProjectID;
    },
  }),
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

// showProjectFilter=false 时不渲染项目选择器，无需 mock AlarmProjectFilter。

let wrapper: ReturnType<typeof mount> | undefined;

describe('alarmRulePage showProjectFilter=false', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getList.mockResolvedValue({ list: [], total: 0 });
    projectState.currentProjectID = null;
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('不渲染项目选择器', async () => {
    projectState.currentProjectID = 'project-1';
    wrapper = mount(AlarmRulePage, {
      props: { showProjectFilter: false, routePrefix: '/energy/alarm' },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="alarm-project-filter"]').exists()).toBe(false);
  });

  it('全局项目就绪后应自动发起查询', async () => {
    projectState.currentProjectID = 'project-1';
    wrapper = mount(AlarmRulePage, {
      props: { showProjectFilter: false, routePrefix: '/energy/alarm' },
    });
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenCalledOnce();
  });

  it('全局项目尚未就绪时不应查询', async () => {
    wrapper = mount(AlarmRulePage, {
      props: { showProjectFilter: false, routePrefix: '/energy/alarm' },
    });
    await flushPromises();

    expect(apiMocks.getList).not.toHaveBeenCalled();
  });

  it('切换全局项目后应自动重新查询', async () => {
    projectState.currentProjectID = 'project-1';
    wrapper = mount(AlarmRulePage, {
      props: { showProjectFilter: false, routePrefix: '/energy/alarm' },
    });
    await flushPromises();
    expect(apiMocks.getList).toHaveBeenCalledTimes(1);

    projectState.currentProjectID = 'project-2';
    await nextTick();
    await flushPromises();

    expect(apiMocks.getList).toHaveBeenCalledTimes(2);
  });

  it('routePrefix 用于拼接规则编辑跳转路径', async () => {
    projectState.currentProjectID = 'project-1';
    wrapper = mount(AlarmRulePage, {
      props: { showProjectFilter: false, routePrefix: '/energy/alarm' },
    });
    await flushPromises();

    const addButton = wrapper.findAll('button').find((button) => button.text().includes('新增规则'));
    expect(addButton).toBeDefined();
    await addButton!.trigger('click');

    expect(routerMocks.push).toHaveBeenCalledWith('/energy/alarm/rule/edit');
  });
});
