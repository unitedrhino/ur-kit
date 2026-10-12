import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import AiChatMessage from './AiChatMessage.vue';

// ai-elements 组件用桩替身,只保留本组件用到的部分与 data-test 挂点
vi.mock('../ai-elements', () => ({
  Loader: {
    name: 'Loader',
    template: '<span data-test="stub-loader" />',
  },
  Message: {
    props: ['from'],
    template: '<div data-test="stub-message" :data-from="from"><slot /></div>',
  },
  MessageAction: {
    template: '<button data-test="stub-message-action"><slot /></button>',
  },
  MessageActions: {
    template: '<div data-test="stub-message-actions"><slot /></div>',
  },
  MessageContent: {
    template: '<div data-test="stub-message-content"><slot /></div>',
  },
  MessageResponse: {
    props: ['content'],
    template: '<div data-test="stub-response">{{ content }}</div>',
  },
  Reasoning: {
    props: ['defaultOpen', 'isStreaming'],
    template: '<div data-test="stub-reasoning" :data-streaming="String(isStreaming)"><slot /></div>',
  },
  ReasoningContent: {
    props: ['content'],
    template: '<div data-test="stub-reasoning-content">{{ content }}</div>',
  },
  ReasoningTrigger: {
    template: '<button data-test="stub-reasoning-trigger" type="button"><slot /></button>',
  },
  Tool: {
    template: '<div data-test="stub-tool"><slot /></div>',
  },
  ToolContent: {
    template: '<div data-test="stub-tool-content"><slot /></div>',
  },
  ToolHeader: {
    props: ['type', 'state', 'toolName'],
    template: '<div data-test="stub-tool-header">{{ toolName }}:{{ state }}</div>',
  },
  ToolInput: {
    props: ['input'],
    template: '<div data-test="stub-tool-input" />',
  },
  ToolOutput: {
    props: ['output', 'errorText'],
    template: '<div data-test="stub-tool-output" />',
  },
}));

vi.mock('@vben-core/shadcn-ui', () => ({
  VbenIcon: {
    name: 'VbenIcon',
    template: '<span data-test="stub-icon" />',
  },
}));

vi.mock('./EvidenceCitations.vue', () => ({
  default: {
    props: ['citations', 'expandedCitations'],
    template: '<div data-test="stub-evidence" />',
  },
}));

function newMessage(overrides: Record<string, any> = {}) {
  return {
    id: 'm1',
    role: 'assistant' as const,
    contents: [{ type: 'text', text: '你好，**世界**' }],
    ...overrides,
  };
}

describe('aiChatMessage 渲染分支', () => {
  it('aI 消息用流式 Markdown 渲染文本', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage() },
    });

    const md = wrapper.find('[data-test="stub-response"]');
    expect(md.exists()).toBe(true);
    expect(md.text()).toContain('你好，**世界**');
    expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(false);
  });

  it('aI 消息加载中超过 250ms 后才显示加载态', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(AiChatMessage, {
        props: {
          message: newMessage({
            contents: [{ type: 'text', text: '' }],
            isLoading: true,
          }),
        },
      });

      expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(false);
      await vi.advanceTimersByTimeAsync(250);
      expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="stub-response"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="ai-chat-wait"]').text()).not.toContain('响应较慢');
    } finally {
      vi.useRealTimers();
    }
  });

  it('aI 消息等待超过 60 秒无内容提示响应较慢', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(AiChatMessage, {
        props: {
          message: newMessage({
            contents: [{ type: 'text', text: '' }],
            isLoading: true,
          }),
        },
      });

      await vi.advanceTimersByTimeAsync(250);
      await vi.advanceTimersByTimeAsync(60_000);
      expect(wrapper.find('[data-testid="ai-chat-wait"]').text()).toContain('响应较慢');
      expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('观察期内内容到达则不闪现加载态', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(AiChatMessage, {
        props: {
          message: newMessage({
            contents: [{ type: 'text', text: '' }],
            isLoading: true,
          }),
        },
      });

      await wrapper.setProps({
        message: newMessage({ contents: [{ type: 'text', text: '回答内容' }], isLoading: true }),
      });
      await vi.advanceTimersByTimeAsync(1000);
      expect(wrapper.find('[data-test="stub-loader"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="stub-response"]').text()).toBe('回答内容');
    } finally {
      vi.useRealTimers();
    }
  });

  it('用户消息渲染纯文本气泡而非 Markdown', () => {
    const wrapper = mount(AiChatMessage, {
      props: {
        message: newMessage({ role: 'user' }),
      },
    });

    expect(wrapper.find('[data-test="stub-message"]').attributes('data-from')).toBe('user');
    expect(wrapper.find('[data-test="stub-response"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('你好，**世界**');
  });

  it('结构化工具事件渲染为可折叠 Tool 列表', () => {
    const wrapper = mount(AiChatMessage, {
      props: {
        message: newMessage({
          toolEventList: [
            { phase: 'start', toolCallID: 'call_1', name: 'get_device_list' },
            {
              phase: 'execute',
              toolCallID: 'call_1',
              name: 'get_device_list',
              arguments: '{"areaName":"门口"}',
            },
          ],
        }),
      },
    });

    const tools = wrapper.findAll('[data-test="stub-tool"]');
    expect(tools).toHaveLength(1);
    expect(wrapper.find('[data-test="stub-tool-header"]').text()).toBe('get_device_list:input-available');
    expect(wrapper.find('[data-test="stub-tool-input"]').exists()).toBe(true);
  });

  it('clarify 选项点击后向上抛出 clarifySelect', async () => {
    const wrapper = mount(AiChatMessage, {
      props: {
        message: newMessage({
          clarify: {
            question: '要操作哪类设备？',
            options: ['灯', '空调'],
            level: 'medium',
          },
        }),
      },
    });

    const buttons = wrapper.findAll('button');
    const optButton = buttons.find((b) => b.text() === '空调');
    expect(optButton).toBeTruthy();
    await optButton?.trigger('click');

    expect(wrapper.emitted('clarifySelect')?.[0]).toEqual(['空调']);
  });

  it('复制按钮点击后写入剪贴板', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage() },
    });

    await wrapper.find('[data-test="stub-message-action"]').trigger('click');
    expect(writeText).toHaveBeenCalledWith('你好，**世界**');
  });

  it('携带知识库证据的 AI 消息渲染证据列表并透传引用', () => {
    const citations = [{ documentName: '设备接入指南.pdf', content: '接入步骤', sourceType: 'direct' }];
    const expandedCitations = [{ documentName: '报文说明.md', snippet: '响应格式', sourceType: 'related' }];
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage({ citations, expandedCitations }) },
    });

    expect(wrapper.find('[data-test="stub-evidence"]').exists()).toBe(true);
  });

  it('检索空结果默认显示无结果引导文案', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage({ searchStatus: 'empty' }) },
    });

    const empty = wrapper.find('[data-testid="ai-chat-search-empty"]');
    expect(empty.exists()).toBe(true);
    expect(empty.text()).toContain('没有命中知识库相关内容');
    expect(empty.text()).not.toContain('低于');
  });

  it('候选计数大于返回引用数时显示低于阈值文案', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage({ searchStatus: 'empty', searchTotal: 5 }) },
    });

    const empty = wrapper.find('[data-testid="ai-chat-search-empty"]');
    expect(empty.text()).toContain('5 个候选');
    expect(empty.text()).toContain('未达到阈值');
  });

  it('用户消息与无证据消息不渲染证据列表', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage({ role: 'user', citations: [{ documentName: 'x' }] }) },
    });
    expect(wrapper.find('[data-test="stub-evidence"]').exists()).toBe(false);

    const emptyWrapper = mount(AiChatMessage, {
      props: { message: newMessage() },
    });
    expect(emptyWrapper.find('[data-test="stub-evidence"]').exists()).toBe(false);
  });

  it('携带检索改写的消息渲染检索折叠区，完成后文案切换', async () => {
    const wrapper = mount(AiChatMessage, {
      props: {
        message: newMessage({
          contents: [{ type: 'text', text: '' }],
          rewrittenQuery: '门口摄像头离线怎么排查',
          isLoading: true,
        }),
      },
    });

    const collapse = wrapper.find('[data-test="stub-reasoning"]');
    expect(collapse.exists()).toBe(true);
    expect(collapse.attributes('data-streaming')).toBe('true');
    expect(wrapper.find('[data-test="stub-reasoning-trigger"]').text()).toContain('检索知识库中…');
    expect(wrapper.find('[data-test="stub-reasoning-content"]').text()).toContain('门口摄像头离线怎么排查');
  });

  it('无检索改写时不渲染检索折叠区', () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage({ isLoading: true }) },
    });

    expect(wrapper.find('[data-test="stub-reasoning"]').exists()).toBe(false);
  });

  it('末条回复且非只读时提供重新生成并上抛事件', async () => {
    const wrapper = mount(AiChatMessage, {
      props: { message: newMessage(), regenerable: true },
    });

    const actions = wrapper.findAll('[data-test="stub-message-action"]');
    expect(actions).toHaveLength(2);
    await actions[1]?.trigger('click');
    expect(wrapper.emitted('regenerate')).toHaveLength(1);
  });

  it('只读或非末条回复隐藏重新生成按钮', () => {
    const readOnly = mount(AiChatMessage, {
      props: { message: newMessage(), regenerable: true, readOnly: true },
    });
    expect(readOnly.text()).not.toContain('重新生成');

    const notLast = mount(AiChatMessage, {
      props: { message: newMessage() },
    });
    expect(notLast.text()).not.toContain('重新生成');
  });
});
