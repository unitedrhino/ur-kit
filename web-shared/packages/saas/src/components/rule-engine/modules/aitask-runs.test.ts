/** 执行记录弹窗合同测试：沿用父页面 task-id 绑定，确保真实请求携带字符串任务标识。 */
// 测试环境未装载异步语言包：mock $t 直查真实语言包 JSON，断言保持中文语义。
vi.mock('@vben/saas/locales', async () => {
  const messages = (await import('../../../locales/langs/zh-CN/iotApp.json')).default;
  const all = { iotApp: messages };
  return {
    $t: (key: string, args?: Record<string, unknown>) => {
      let text: string = key;
      {
        const parts = key.split('.');
        let cursor: any = all[parts[0]!];
        for (const p of parts.slice(1)) cursor = cursor?.[p];
        if (typeof cursor === 'string') text = cursor;
      }
      if (args) {
        for (const [k, v] of Object.entries(args)) text = text.replaceAll(`{${k}}`, String(v));
      }
      return text;
    },
  };
});

import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RunsDialog from './aitask-runs.vue';

/** mocks 隔离网络和通知，保留组件属性归一化与打开监听。 */
const mocks = vi.hoisted(() => ({ getRuns: vi.fn(), error: vi.fn() }));
vi.mock('../aitask.api', () => ({ AiTaskApi: { getRuns: mocks.getRuns } }));
vi.mock('@vben/saas', () => ({ message: { error: mocks.error } }));
vi.mock('@vben-core/shadcn-ui', () => ({ VbenIcon: { template: '<i />' } }));

describe('任务执行记录', () => {
  beforeEach(() => vi.resetAllMocks());
  it('父页面 task-id 绑定触发查询并展示手动、调度和事件记录', async () => {
    /** records 模拟接口返回的三种真实执行来源。 */
    const records = [
      { runID: 'manual-run', triggerType: 'manual', status: 'success' },
      { runID: 'schedule-run', triggerType: 'schedule', status: 'success' },
      { runID: 'event-run', triggerType: 'subscribe_message', status: 'success' },
    ];
    mocks.getRuns.mockResolvedValue({ list: records, total: 3 });
    /** wrapper 使用父组件模板编译后的连字符属性名，防止直接传 taskID 掩盖问题。 */
    const wrapper = shallowMount(RunsDialog, { props: { open: false, taskName: '验收任务' } as any, attrs: { 'task-id': '9007199254740993' } });
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(mocks.getRuns).toHaveBeenCalledWith('9007199254740993', 1, 20);
    /** state 回读真实组件状态，不通过伪造 DOM 代替加载结果。 */
    const state = (wrapper.vm.$ as any).setupState;
    expect(state.runs).toEqual(records);
    expect(state.total).toBe(3);
    expect(state.triggerMeta('subscribe_message')).toBe('事件触发');
    wrapper.unmount();
  });
});
