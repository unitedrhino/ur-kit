/** 文件说明：验证共用项目查询、变更后自动刷新及缓存入口再次激活时的数据更新。 */
import { flushPromises, shallowMount, mount } from '@vue/test-utils';
import { defineComponent, KeepAlive, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** mocks 只替换网络与重量级编辑器；列表、表格状态和刷新流程保持真实。 */
const mocks = vi.hoisted(() => ({ group: vi.fn(), list: vi.fn(), drafts: vi.fn(), stop: vi.fn(), start: vi.fn() }));
vi.mock('../aitask.api', () => ({
  getProjectCloneGroupID: mocks.group,
  getRecoverableAiTaskDrafts: mocks.drafts,
  AiTaskApi: { getList: mocks.list, stop: mocks.stop, start: mocks.start },
}));
vi.mock('@vben/saas', async () => ({
  ...(await import('@tanstack/vue-table')),
  message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('@vben/saas/locales', () => ({ $t: (key: string) => key }));
vi.mock('@vben/saas/ai-tool-detail', () => ({ AiToolDetail: { template: '<div />' } }));
vi.mock('./aitask-create.vue', () => ({ default: { name: 'AiTaskCreateDialog', template: '<div />' } }));
vi.mock('./aitask-runs.vue', () => ({ default: { name: 'AiTaskRunsDialog', template: '<div />' } }));
vi.mock('./event-trigger-editor.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@vben-core/shadcn-ui', () => ({ VbenIcon: { template: '<i />' } }));
import List from './aitask-list.vue';

/** task 为当前项目的接口记录，启停状态由测试中的模拟服务更新。 */
const task = { id: '11', name: '规则一', enabled: '1', cloneGroupID: 'group-A', cloneID: '22', taskType: 'tool_run', scheduleType: 'interval' };

describe('共享规则列表', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.group.mockImplementation(async (id: string) => `group-${id}`);
    mocks.list.mockImplementation(async (id: string) => ({ list: id === 'group-A' ? [{ ...task }] : [] }));
    mocks.drafts.mockResolvedValue([]);
  });
  it('两应用相同项目查询同一组，其他项目不会混入', async () => {
    const iot = shallowMount(List, { props: { projectID: 'A' } });
    const energy = shallowMount(List, { props: { projectID: 'A', scope: 'project', fillHeight: true } });
    const other = shallowMount(List, { props: { projectID: 'B' } });
    await flushPromises();
    expect((iot.vm.$ as any).setupState.rows).toEqual((energy.vm.$ as any).setupState.rows);
    expect((energy.vm.$ as any).setupState.rows).toHaveLength(1);
    expect((other.vm.$ as any).setupState.rows).toEqual([]);
    expect(mocks.list.mock.calls.map(([group]) => group)).toEqual(['group-A', 'group-A', 'group-B']);
    iot.unmount();
    energy.unmount();
    other.unmount();
  });
  it('停用成功后等待刷新，创建与草稿保存成功也触发刷新', async () => {
    const wrapper = shallowMount(List, { props: { projectID: 'A' } });
    await flushPromises();
    mocks.stop.mockResolvedValue({});
    mocks.list.mockResolvedValue({ list: [{ ...task, enabled: '2' }] });
    (wrapper.vm.$ as any).setupState.toggleEnabled(task);
    await flushPromises();
    expect(mocks.stop).toHaveBeenCalledWith('11');
    expect((wrapper.vm.$ as any).setupState.rows[0].enabled).toBe('2');
    const create = wrapper.findComponent({ name: 'AiTaskCreateDialog' });
    create.vm.$emit('success');
    await flushPromises();
    create.vm.$emit('draft-saved');
    await flushPromises();
    expect(mocks.list).toHaveBeenCalledTimes(4);
    wrapper.unmount();
  });
  it('缓存页面重新激活后读取另一个入口修改的最新记录', async () => {
    /** visible 模拟应用页签离开和重新激活。 */
    const visible = ref(true);
    const Host = defineComponent({ setup: () => () => h(KeepAlive, null, { default: () => (visible.value ? h(List, { projectID: 'A' }) : null) }) });
    const wrapper = mount(Host, { global: { stubs: { AiTaskCreateDialog: true, AiTaskRunsDialog: true, EventTriggerEditor: true } } });
    await flushPromises();
    expect(mocks.list).toHaveBeenCalledTimes(1);
    visible.value = false;
    await flushPromises();
    mocks.list.mockResolvedValue({ list: [{ ...task, name: '另一个入口修改后' }] });
    visible.value = true;
    await flushPromises();
    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('另一个入口修改后');
    wrapper.unmount();
  });
});
