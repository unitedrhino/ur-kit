import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import AiToolDevMessage from './AiToolDevMessage.vue';

// ai-elements 组件用桩替身,验证本组件的渲染分支
vi.mock('../ai-elements', () => ({
  Loader: {
    name: 'Loader',
    template: '<span data-test="stub-loader" />',
  },
  Message: {
    props: ['from'],
    template: '<div data-test="stub-message" :data-from="from"><slot /></div>',
  },
  MessageContent: {
    template: '<div data-test="stub-content"><slot /></div>',
  },
  MessageResponse: {
    props: ['content'],
    template: '<div data-test="stub-response">{{ content }}</div>',
  },
  Reasoning: {
    props: ['defaultOpen'],
    template: '<div data-test="stub-reasoning"><slot /></div>',
  },
  ReasoningContent: {
    props: ['content'],
    template: '<div data-test="stub-reasoning-content">{{ content }}</div>',
  },
  ReasoningTrigger: {
    template: '<button data-test="stub-reasoning-trigger"><slot /></button>',
  },
  Tool: {
    template: '<section data-test="stub-tool"><slot /></section>',
  },
  ToolContent: {
    template: '<div data-test="stub-tool-content"><slot /></div>',
  },
  ToolHeader: {
    props: ['state', 'title'],
    template: '<button data-test="stub-tool-header" :data-state="state">{{ title }}</button>',
  },
  ToolInput: {
    name: 'ToolInput',
    props: ['input'],
    template: '<pre data-test="stub-tool-input">{{ JSON.stringify(input) }}</pre>',
  },
  ToolOutput: {
    name: 'ToolOutput',
    props: ['output', 'errorText'],
    template: '<pre data-test="stub-tool-output">{{ errorText || JSON.stringify(output) }}</pre>',
  },
}));

vi.mock('@vben-core/shadcn-ui', () => ({
  VbenIcon: {
    name: 'VbenIcon',
    template: '<span data-test="stub-icon" />',
  },
}));

function newMessage(overrides: Record<string, any> = {}) {
  return {
    id: 'm1',
    role: 'assistant',
    content: '',
    ...overrides,
  };
}

describe('aiToolDevMessage 渲染分支', () => {
  it('助手消息用流式 Markdown 渲染内容', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({ content: '生成 executor.js 完成' }),
      },
    });

    const md = wrapper.find('[data-test="stub-response"]');
    expect(md.exists()).toBe(true);
    expect(md.text()).toContain('生成 executor.js 完成');
  });

  it('用户消息渲染纯文本而非 Markdown', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({ role: 'user', content: '帮我写个工具' }),
      },
    });

    expect(wrapper.find('[data-test="stub-message"]').attributes('data-from')).toBe('user');
    expect(wrapper.find('[data-test="stub-response"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('帮我写个工具');
  });

  it('思考条目去重计数并显示实时状态', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({
          thinking: [
            { type: 'search', description: '检索规范' },
            { type: 'read', description: '阅读示例' },
            { type: 'read', description: '阅读示例' },
          ],
          status: 'running',
        }),
      },
    });

    const reasoningContent = wrapper.find('[data-test="stub-reasoning-content"]');
    expect(reasoningContent.exists()).toBe(true);
    expect(reasoningContent.text()).toContain('- 检索规范');
    expect(reasoningContent.text()).toContain('- 阅读示例 × 2');
    expect(reasoningContent.text().match(/阅读示例/g)).toHaveLength(1);
    expect(wrapper.find('[data-test="stub-reasoning-trigger"]').text()).toContain('思考过程 · 执行中');
    expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(true);
  });

  it('默认只展示当前调用并折叠历史调用', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({
          status: 'running',
          toolEvents: [
            {
              phase: 'result',
              toolCallID: 'call-1',
              name: 'read_file',
              arguments: '{"path":"executor.js"}',
              result: '{"content":"export default {}"}',
            },
            {
              phase: 'start',
              toolCallID: 'call-0',
              name: 'list_files',
              arguments: '{}',
            },
          ],
        }),
      },
    });

    const headers = wrapper.findAll('[data-test="stub-tool-header"]');
    expect(headers).toHaveLength(1);
    expect(headers[0]?.text()).toContain('查看工作区文件');
    expect(headers[0]?.attributes('data-state')).toBe('input-available');
    expect(wrapper.find('[data-testid="ai-tool-dev-current-tool"]').text()).toContain('当前操作');
    expect(wrapper.find('[data-testid="ai-tool-dev-tool-history"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="ai-tool-dev-tool-history-toggle"]').text()).toContain('调用历史（1）');
  });

  it('用户展开后可以查看历史调用的入参与结果', async () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({
          status: 'running',
          toolEvents: [
            {
              phase: 'result',
              toolCallID: 'call-0',
              name: 'read_file',
              arguments: '{"path":"executor.js"}',
              result: '{"content":"export default {}"}',
            },
            {
              phase: 'start',
              toolCallID: 'call-1',
              name: 'write_file',
              arguments: '{"path":"manifest.json"}',
            },
          ],
        }),
      },
    });

    await wrapper.find('[data-testid="ai-tool-dev-tool-history-toggle"]').trigger('click');

    const history = wrapper.find('[data-testid="ai-tool-dev-tool-history"]');
    expect(history.exists()).toBe(true);
    expect(history.find('[data-test="stub-tool-header"]').text()).toContain('读取文件');
    expect(history.find('[data-test="stub-tool-input"]').text()).toContain('executor.js');
    expect(history.findComponent({ name: 'ToolOutput' }).props('output')).toEqual({
      content: 'export default {}',
    });
  });

  it('消息结束后将最后一次调用归入默认折叠的历史', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({
          status: 'completed',
          toolEvents: [
            {
              phase: 'result',
              toolCallID: 'call-0',
              name: 'save_artifacts',
              result: '{"saved":true}',
            },
          ],
        }),
      },
    });

    expect(wrapper.find('[data-testid="ai-tool-dev-current-tool"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="ai-tool-dev-tool-history"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="ai-tool-dev-tool-history-toggle"]').text()).toContain('调用历史（1）');
  });

  it('加载中且无内容时展示 Loader', () => {
    const wrapper = mount(AiToolDevMessage, {
      props: {
        message: newMessage({ isLoading: true }),
      },
    });

    expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(true);
  });
});
