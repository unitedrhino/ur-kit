/**
 * 文件说明：AI 工具开发面板会话恢复测试。
 * 覆盖按工具恢复旧随机会话后，历史回显及后续会话 ID 持久化。
 */
import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiToolDevPanel from './AiToolDevPanel.vue';

const mocks = vi.hoisted(() => ({
  fetchToolDevHistory: vi.fn(),
  toolDevStream: vi.fn(),
}));

vi.mock('../../store/session', () => ({
  useSessionStore: () => ({ tenantCode: 't1' }),
}));

vi.mock('./api', () => ({
  fetchToolDevHistory: mocks.fetchToolDevHistory,
  isAutoInitialPrompt: (text: string) => text.startsWith('请创建一个告警AI判断工具'),
  resolveClarify: vi.fn(),
  TOOL_DEV_BRIEF_TEXT: '已自动发起创建任务',
  toolDevStream: mocks.toolDevStream,
}));

vi.mock('../ai-elements', () => ({
  Conversation: { template: '<div><slot /></div>' },
  ConversationContent: { template: '<div><slot /></div>' },
  ConversationScrollButton: { template: '<button />' },
}));

vi.mock('./AiToolDevHeader.vue', () => ({ default: { template: '<header />' } }));
vi.mock('./AiToolDevInput.vue', () => ({
  default: {
    emits: ['send'],
    template: '<button data-test="send" @click="$emit(\'send\', \'生成工具\')">发送</button>',
  },
}));
vi.mock('./AiToolDevWelcome.vue', () => ({ default: { template: '<div>欢迎</div>' } }));
vi.mock('./AiToolDevConfirmation.vue', () => ({ default: { template: '<div />' } }));
vi.mock('./AiToolDevMessage.vue', () => ({
  default: {
    props: ['message'],
    template: '<div data-test="history-message">{{ message.content }}</div>',
  },
}));

describe('AiToolDevPanel 会话恢复', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.fetchToolDevHistory.mockReset();
    mocks.toolDevStream.mockReset();
    mocks.toolDevStream.mockResolvedValue('alarm-tooldev-12');
  });

  it('固定会话为空时采用后端返回的旧会话并回显历史', async () => {
    mocks.fetchToolDevHistory.mockResolvedValue({
      sessionID: 'chat-legacy-12',
      messages: [
        { id: 'h-1-u', role: 'user', content: '把判断阈值改成 220V' },
        { id: 'h-1-a', role: 'assistant', content: '已修改并保存' },
      ],
    });

    const wrapper = mount(AiToolDevPanel, {
      props: { toolID: 12, sessionKey: 'tool' },
    });
    await flushPromises();

    expect(mocks.fetchToolDevHistory).toHaveBeenCalledWith('alarm-tooldev-12', 12);
    expect(wrapper.text()).toContain('把判断阈值改成 220V');
    expect(wrapper.text()).toContain('已修改并保存');
    expect(JSON.parse(localStorage.getItem('ai_tool_dev_panel_session_t1_tool') || '{}')).toEqual({
      sid: 'chat-legacy-12',
    });
  });
  it('发送时把项目级分身 ID 交给流式接口', async () => {
    mocks.fetchToolDevHistory.mockResolvedValue({ sessionID: 'alarm-tooldev-12', messages: [] });
    const wrapper = mount(AiToolDevPanel, {
      props: { toolID: 12, sessionKey: 'tool', cloneId: '9007199254740997' },
    });
    await flushPromises();

    await wrapper.get('[data-test="send"]').trigger('click');
    await flushPromises();

    expect(mocks.toolDevStream).toHaveBeenCalledWith(
      expect.objectContaining({
        cloneID: '9007199254740997',
        toolID: 12,
        userInput: '生成工具',
      }),
      expect.any(Object),
    );
  });
  it('规则引擎开发消息附带已选订阅合同，AI 实际接收 eventPayload 约定', async () => {
    mocks.fetchToolDevHistory.mockResolvedValue({ sessionID: 'alarm-tooldev-12', messages: [] });
    const wrapper = mount(AiToolDevPanel, {
      props: { toolID: 12, instruction: '订阅故障事件；读取 eventPayload，不要轮询设备列表' },
    });
    await flushPromises();
    await wrapper.get('[data-test="send"]').trigger('click');
    await flushPromises();
    expect(mocks.toolDevStream).toHaveBeenCalledWith(
      expect.objectContaining({ userInput: '订阅故障事件；读取 eventPayload，不要轮询设备列表\n\n用户需求：生成工具' }),
      expect.any(Object),
    );
  });

  it('完成事件不带 label 时保留任务标题，未知任务明确提示描述缺失', async () => {
    mocks.fetchToolDevHistory.mockResolvedValue({ sessionID: 's1', messages: [] });
    mocks.toolDevStream.mockImplementation(async (_request, callbacks) => {
      callbacks.onTaskUpdate({ taskId: 'code', status: 'in_progress', label: '编码' });
      callbacks.onTaskUpdate({ taskId: 'code', status: 'completed' });
      callbacks.onTaskUpdate({ taskId: 'unknown', status: 'completed' });
      callbacks.onDone();
      return 's1';
    });
    const wrapper = mount(AiToolDevPanel, { props: { toolID: 12 } });
    await flushPromises();
    await wrapper.get('[data-test="send"]').trigger('click');
    await flushPromises();
    await wrapper.get('[data-testid="ai-tool-task-summary"]').trigger('click');
    const details = wrapper.get('[data-testid="ai-tool-task-details"]');
    expect(details.text()).toContain('编码');
    expect(details.text()).toContain('任务描述未提供');
  });
});
