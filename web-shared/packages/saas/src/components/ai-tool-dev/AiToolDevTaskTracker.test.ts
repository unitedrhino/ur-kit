/**
 * 文件说明：AI 工具开发任务进度组件测试。
 * 覆盖进行中与失败状态文案，以及窄容器布局所需的结构标记。
 */
import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import AiToolDevTaskTracker from './AiToolDevTaskTracker.vue';

const tasks = [
  { id: 'understand', content: '理解用户需求', activeForm: '理解用户需求', status: 'completed' as const },
  { id: 'write-executor', content: '编写 executor.js', activeForm: '编写 executor.js', status: 'in_progress' as const },
];

describe('AiToolDevTaskTracker', () => {
  it('默认收起，点击摘要展开和收起任务明细', async () => {
    const wrapper = mount(AiToolDevTaskTracker, {
      props: { tasks, executionStatus: 'running' },
    });

    expect(wrapper.get('[data-testid="ai-tool-task-summary"]').text()).toContain('1/2 · 编写 executor.js');
    expect(wrapper.find('[data-testid="ai-tool-task-details"]').exists()).toBe(false);
    const trigger = wrapper.get('[data-testid="ai-tool-task-summary"]');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    await trigger.trigger('click');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-testid="ai-tool-task-details"]').text()).toContain('理解用户需求');
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="ai-tool-task-details"]').exists()).toBe(false);
  });

  it('连接中断后不再把当前任务显示为运行中', () => {
    const wrapper = mount(AiToolDevTaskTracker, {
      props: { tasks, executionStatus: 'failed' },
    });

    expect(wrapper.get('[data-testid="ai-tool-task-summary"]').text()).toContain('生成已中断 · 编写 executor.js');
    expect(wrapper.attributes('data-status')).toBe('failed');
  });
  it('任务更新不自动展开，也不打乱原计划顺序', async () => {
    const wrapper = mount(AiToolDevTaskTracker, { props: { tasks, executionStatus: 'running' } });
    await wrapper.setProps({ tasks: [...tasks].reverse() });
    expect(wrapper.find('[data-testid="ai-tool-task-details"]').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(wrapper.findAll('[role="listitem"]')[0]?.text()).toContain('编写 executor.js');
    await wrapper.setProps({ executionStatus: 'completed', tasks: tasks.map((task) => ({ ...task, status: 'completed' })) });
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
    expect(wrapper.text()).toContain('2/2 · 已完成所有任务');
  });

  it('没有计划时不占位；缺失描述时明确提示', async () => {
    const wrapper = mount(AiToolDevTaskTracker, { props: { tasks: [] } });
    expect(wrapper.find('button').exists()).toBe(false);
    await wrapper.setProps({ tasks: [{ id: 'missing', content: '', activeForm: '', status: 'completed' }] });
    await wrapper.get('button').trigger('click');
    expect(wrapper.get('[role="listitem"]').text()).toContain('任务描述未提供');
  });

});
