/** 文件说明：验证共享聊天消息混排、账号切换与迟到网络回调隔离。 */
import { flushPromises, mount } from '@vue/test-utils';

import { useUserStore } from '@vben/stores';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import AiChatPanel from './AiChatPanel.vue';
import { aiBusinessToolsKey } from './business-tools';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  update: vi.fn(),
  fork: vi.fn(),
  sessions: vi.fn(),
  stream: vi.fn(),
  history: vi.fn(),
  submit: vi.fn(),
  fetchOss: vi.fn(),
}));
vi.mock('@vben/stores', async () => {
  const { reactive } = await import('vue');
  const user = reactive({ userInfo: { userID: '125' }, userRoles: ['admin'] });
  return { useUserStore: () => user };
});
vi.mock('../../store/session', () => ({ useSessionStore: () => ({ tenantCode: 'test' }) }));
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {}, path: '/' }) }));
vi.mock('./api', () => ({
  getChatSession: mocks.getSession,
  updateChatSession: mocks.update,
  forkChatSession: mocks.fork,
  getChatSessions: mocks.sessions,
  userAiCompletionsStream: mocks.stream,
  getInteractionHistory: mocks.history,
  resolveClarify: vi.fn(),
  submitChatToolResult: mocks.submit,
  getChatProjectID: () => '',
  fetchChatOssFileBlob: mocks.fetchOss,
  isInlinePreviewableFile: (fileUri: string) => /\.(png|jpe?g|gif|webp|bmp|svg|pdf)$/i.test(fileUri),
}));
vi.mock('@vben-core/shadcn-ui', () => ({ VbenIcon: { template: '<span />' }, VbenIconButton: { template: '<button><slot /></button>' } }));
vi.mock('./AiChatInput.vue', () => ({
  default: { name: 'AiChatInput', template: '<div />', emits: ['send', 'stop', 'draftChange'], methods: { focus() {} } },
}));
vi.mock('./AiChatMessages.vue', () => ({ default: { name: 'AiChatMessages', props: ['messages'], template: '<pre>{{ JSON.stringify(messages) }}</pre>' } }));

beforeEach(() => {
  localStorage.clear();
  useUserStore().userInfo!.userID = '125';
  mocks.getSession.mockReset();
  mocks.update.mockReset();
  mocks.fork.mockReset();
  mocks.sessions.mockReset();
  mocks.stream.mockReset();
  mocks.submit.mockReset();
  mocks.fetchOss.mockReset();
  mocks.history.mockResolvedValue({ results: [] });
});

describe('共享聊天会话隔离', () => {
  it('图表引用和知识来源在后续文本片段到达后仍然保留', async () => {
    const result = { schemaVersion: '1.0', resultID: 'result', sessionID: 'session', messageID: 'message', toolCallID: 'tool', turnIndex: 1 };
    mocks.stream.mockImplementation(async (_request, token, meta) => {
      meta({ sessionID: 'session', citations: [{ content: '查询依据' }] });
      meta({ sessionID: 'session', interactionResults: [result] });
      token('统计结果');
      return 'session';
    });
    const wrapper = mount(AiChatPanel, { props: { currentAppID: '100' } });
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '统计人数' }]);
    await flushPromises();
    const messages = wrapper.getComponent({ name: 'AiChatMessages' }).props('messages');
    expect(messages[1]).toMatchObject({
      interactionResults: [result],
      citations: [{ content: '查询依据' }],
      contents: [{ text: '统计结果' }],
      isLoading: false,
    });
    wrapper.unmount();
  });

  it('切换账号中止旧请求，迟到回调不能写入新账号缓存', async () => {
    let resolve!: (session: string) => void;
    mocks.stream.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const wrapper = mount(AiChatPanel, { props: { currentAppID: '100' } });
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '账号一的数据' }]);
    await flushPromises();
    const [, token, meta, , , options] = mocks.stream.mock.calls[0]!;
    useUserStore().userInfo!.userID = '126';
    await flushPromises();
    expect(options.signal.aborted).toBe(true);
    token('旧回复');
    meta({ sessionID: 'old-session' });
    resolve('old-session');
    await flushPromises();
    expect(wrapper.getComponent({ name: 'AiChatMessages' }).props('messages')).toEqual([]);
    const currentKey = Object.keys(localStorage).find((key) => key.includes('["126",'));
    expect(currentKey).toBeDefined();
    expect(localStorage.getItem(currentKey!)).not.toContain('账号一的数据');
    expect(localStorage.getItem(currentKey!)).not.toContain('old-session');
    wrapper.unmount();
  });
  it('应用注入的业务工具才会执行，实际结果回传并携带可取消信号', async () => {
    const execute = vi.fn().mockResolvedValue({ summary: '真实查询结果', interaction: { schemaVersion: '1.0' } });
    mocks.submit.mockResolvedValue({ status: 'accepted' });
    mocks.stream.mockImplementation(async (_request, _token, _meta, tool) => {
      tool({ sessionID: 'session', toolCallID: 'call', name: 'query_business', arguments: '{}' });
      await flushPromises();
      return 'session';
    });
    const wrapper = mount(AiChatPanel, {
      props: { currentAppID: '100' },
      global: { provide: { [aiBusinessToolsKey as symbol]: [{ definition: { name: 'query_business', description: '查询业务' }, execute }] } },
    });
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '查询并画图' }]);
    await flushPromises();
    expect(mocks.stream.mock.calls[0]![0].tools[0].name).toBe('query_business');
    expect(execute).toHaveBeenCalledWith('{}', expect.any(AbortSignal));
    expect(mocks.submit).toHaveBeenCalledWith(
      'session',
      'call',
      JSON.stringify({ summary: '真实查询结果', interaction: { schemaVersion: '1.0' } }),
      '',
      expect.any(AbortSignal),
    );
    wrapper.unmount();
  });

  it('仅有会话 ID 的缓存也能恢复服务端文本、附件与同轮图表', async () => {
    const key = `ai_chat_v2_${JSON.stringify(['125', '100', 'test', '', '', '', ['admin']])}`;
    localStorage.setItem(key, JSON.stringify({ sid: 'session', msgs: [] }));
    const result = { schemaVersion: '1.0', resultID: 'result', sessionID: 'session', messageID: 'remote-message', turnIndex: 1, toolCallID: 'call' };
    mocks.history.mockResolvedValue({
      results: [result],
      turns: [
        {
          turnIndex: 1,
          userContents: [
            { type: 'text', text: '看图片' },
            { type: 'file', artifactID: 'private-image' },
          ],
          aiResponse: '图片描述',
        },
      ],
    });
    const wrapper = mount(AiChatPanel, { props: { currentAppID: '100' } });
    await flushPromises();
    const messages = wrapper.getComponent({ name: 'AiChatMessages' }).props('messages');
    expect(messages).toHaveLength(2);
    expect(messages[0].contents[1]).toEqual({ type: 'file', artifactID: 'private-image' });
    expect(messages[1]).toMatchObject({ contents: [{ type: 'text', text: '图片描述' }], interactionResults: [result] });
    wrapper.unmount();
  });

  it('重新生成截断最后回复并重放最近一条用户消息', async () => {
    mocks.stream.mockImplementation(async (_request, token) => {
      token('当轮回答');
      return 'session';
    });
    const wrapper = mount(AiChatPanel, { props: { currentAppID: '100' } });
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '第一问' }]);
    await flushPromises();
    const messagesComp = wrapper.getComponent({ name: 'AiChatMessages' });
    expect(messagesComp.props('messages')).toHaveLength(2);

    messagesComp.vm.$emit('regenerate', messagesComp.props('messages')[1]);
    await flushPromises();
    expect(mocks.stream).toHaveBeenCalledTimes(2);
    const request = mocks.stream.mock.calls[1]?.[0];
    expect(request?.messages).toEqual([{ role: 'user', contents: [{ type: 'text', text: '第一问' }] }]);
    const after = messagesComp.props('messages');
    expect(after).toHaveLength(2);
    expect(after[1]).toMatchObject({ contents: [{ text: '当轮回答' }], isLoading: false });
    wrapper.unmount();
  });
});

// 工作台以服务端为准，覆盖全新浏览器、恢复失败、关闭保留与停止隔离。
describe('工作台历史与生命周期', () => {
  it('没有本地缓存也自动恢复最新会话的文字和结果', async () => {
    mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'latest', title: '设备电压', status: 1, lastActiveAt: 100 }], total: 1 });
    mocks.history.mockResolvedValue({ results: [], turns: [{ turnIndex: 1, userContents: [{ type: 'text', text: '查询电压' }], aiResponse: '六个数据点' }] });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    expect(mocks.sessions).toHaveBeenCalledWith(1, expect.any(AbortSignal), 'inProgress');
    expect(mocks.history).toHaveBeenCalledWith('latest', expect.any(AbortSignal));
    expect(wrapper.text()).toContain('六个数据点');
    wrapper.unmount();
  });
  it('列表失败不伪装为空历史，消息失败提供独立重试', async () => {
    mocks.sessions.mockRejectedValueOnce(new Error('列表网络错误'));
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    expect(wrapper.text()).toContain('列表网络错误');
    expect(wrapper.text()).not.toContain('还没有历史会话');
    mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'latest', title: '电压', status: 1, lastActiveAt: 100 }], total: 1 });
    mocks.history.mockRejectedValueOnce(new Error('消息网络错误'));
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重试加载')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('消息网络错误');
    expect(wrapper.text()).toContain('重新加载消息');
    wrapper.unmount();
  });
  it('关闭再打开保留草稿，不用服务端最新会话覆盖当前输入', async () => {
    mocks.sessions.mockResolvedValue({ list: [], total: 0 });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('draftChange', true);
    await wrapper.setProps({ open: false });
    mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'remote', status: 1, lastActiveAt: 100 }], total: 1 });
    mocks.history.mockClear();
    await wrapper.setProps({ open: true });
    await flushPromises();
    expect(mocks.history).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('停止后保留正文且迟到的 token、会话ID和完成回调不能回写', async () => {
    let finish!: (session: string) => void;
    mocks.stream.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const wrapper = mount(AiChatPanel);
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '分析' }]);
    await flushPromises();
    const [, token, meta, , , options] = mocks.stream.mock.calls[0]!;
    token('已生成内容');
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('stop');
    token('迟到内容');
    meta({ sessionID: 'late-session' });
    finish('late-session');
    await flushPromises();
    expect(options.signal.aborted).toBe(true);
    expect(wrapper.text()).toContain('已生成内容');
    expect(wrapper.text()).not.toContain('迟到内容');
    expect(wrapper.getComponent({ name: 'AiChatMessages' }).props('messages')[1].isLoading).toBe(false);
    wrapper.unmount();
  });
  it('分页追加且归档会话只读，不创建空的新对话记录', async () => {
    mocks.sessions
      .mockResolvedValueOnce({ list: [{ sessionID: 'archived', title: '只读历史', status: 3, lastActiveAt: 100 }], total: 2 })
      .mockResolvedValueOnce({ list: [{ sessionID: 'older', title: '较早会话', status: 1, lastActiveAt: 90 }], total: 2 });
    mocks.history.mockResolvedValue({ results: [], turns: [] });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'AiChatInput' }).exists()).toBe(false);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '加载更多')!
      .trigger('click');
    await flushPromises();
    expect(mocks.sessions).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), undefined);
    expect(wrapper.text()).toContain('较早会话');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '新对话')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.findComponent({ name: 'AiChatInput' }).exists()).toBe(true);
    expect(mocks.stream).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

it('切换账号取消列表请求，迟到的会话列表不能进入新账号', async () => {
  let finish!: (value: unknown) => void;
  mocks.sessions
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ list: [], total: 0 });
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  const signal = mocks.sessions.mock.calls[0]![1];
  useUserStore().userInfo!.userID = '126';
  await flushPromises();
  finish({ list: [{ sessionID: 'private-old', title: '旧账号秘密会话', status: 1, lastActiveAt: 100 }], total: 1 });
  await flushPromises();
  expect(signal.aborted).toBe(true);
  expect(wrapper.text()).not.toContain('旧账号秘密会话');
  wrapper.unmount();
});

it('生成中关闭再打开不停止，切换与新建禁用，回复继续追加', async () => {
  let finish!: (session: string) => void;
  mocks.sessions.mockResolvedValue({ list: [], total: 0 });
  mocks.stream.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '保持生成' }]);
  await flushPromises();
  const [, token, , , , options] = mocks.stream.mock.calls[0]!;
  expect(
    wrapper
      .findAll('button')
      .find((button) => button.text() === '新对话')!
      .attributes('disabled'),
  ).toBeDefined();
  await wrapper.setProps({ open: false });
  token('关闭期间的回答');
  await wrapper.setProps({ open: true });
  await flushPromises();
  expect(options.signal.aborted).toBe(false);
  expect(wrapper.text()).toContain('关闭期间的回答');
  finish('same-session');
  await flushPromises();
  wrapper.unmount();
});

/** 分类、分支与整理操作覆盖自动刷新及身份切换竞态。 */
describe('会话分类与来源交互', () => {
  const active = { sessionID: 'active', title: '当前话题', status: 1, completionState: 'inProgress', lastActiveAt: 100 };
  const completed = { ...active, completionState: 'completed' };
  it('分类变更重置分页且保留右侧草稿，不加载其他会话', async () => {
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('draftChange', true);
    mocks.history.mockClear();
    await wrapper.get('button[aria-pressed="false"]').trigger('click');
    await flushPromises();
    expect(mocks.sessions).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 'completed');
    expect(mocks.history).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('标记完成后自动刷新列表且右栏可恢复，完成不等同于已结束', async () => {
    mocks.sessions
      .mockResolvedValueOnce({ list: [active], total: 1 })
      .mockResolvedValueOnce({ list: [active], total: 1 })
      .mockResolvedValue({ list: [], total: 0 });
    mocks.update.mockResolvedValue(completed);
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '标记完成')!
      .trigger('click');
    await flushPromises();
    expect(mocks.update).toHaveBeenCalledWith('active', { completionState: 'completed' }, expect.any(AbortSignal));
    expect(mocks.sessions).toHaveBeenCalledTimes(3);
    expect(wrapper.text()).toContain('此话题已标记完成');
    expect(wrapper.findComponent({ name: 'AiChatInput' }).exists()).toBe(false);
    mocks.update.mockResolvedValue(active);
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '恢复进行中')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.findComponent({ name: 'AiChatInput' }).exists()).toBe(true);
    wrapper.unmount();
  });
  it('结束会话可分支，不把来源历史伪装为新会话消息', async () => {
    const old = { ...active, status: 2 };
    const fork = { ...active, sessionID: 'fork', parentSessionID: 'active', parentTurnIndex: 3 };
    mocks.sessions.mockResolvedValueOnce({ list: [old], total: 1 }).mockResolvedValue({ list: [fork], total: 1 });
    mocks.fork.mockResolvedValue(fork);
    mocks.history.mockResolvedValue({ results: [], turns: [] });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    expect(wrapper.findAll('button').some((button) => button.text() === '重命名')).toBe(false);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '基于此新建')!
      .trigger('click');
    await flushPromises();
    expect(mocks.fork).toHaveBeenCalledWith('active', expect.any(String), expect.any(AbortSignal));
    expect(mocks.history).toHaveBeenLastCalledWith('fork', expect.any(AbortSignal));
    expect(wrapper.text()).toContain('继承截至第 3 轮');
    expect(wrapper.getComponent({ name: 'AiChatMessages' }).props('messages')).toEqual([]);
    expect(mocks.stream).not.toHaveBeenCalled();
    mocks.getSession.mockResolvedValue(old);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '查看来源会话')!
      .trigger('click');
    await flushPromises();
    expect(mocks.getSession).toHaveBeenCalledWith('active', expect.any(AbortSignal));
    expect(wrapper.text()).toContain('此会话已结束或归档');
    wrapper.unmount();
  });
  it('重命名失败显示错误，成功后自动刷新可见标题', async () => {
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    mocks.update.mockRejectedValueOnce(new Error('名称保存失败'));
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '重命名')!
      .trigger('click');
    expect(wrapper.get('input[aria-label="会话名称"]').attributes('maxlength')).toBe('100');
    await wrapper.get('input[aria-label="会话名称"]').setValue('新的名称');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('名称保存失败');
    const renamed = { ...active, title: '新的名称' };
    mocks.update.mockResolvedValue(renamed);
    mocks.sessions.mockResolvedValue({ list: [renamed], total: 1 });
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('新的名称');
    expect(wrapper.find('form').exists()).toBe(false);
    wrapper.unmount();
  });
  it('切换身份取消变更，迟到结果不能覆盖新账号', async () => {
    let finish!: (value: unknown) => void;
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    mocks.update.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '标记完成')!
      .trigger('click');
    const signal = mocks.update.mock.calls[0]![2];
    mocks.sessions.mockResolvedValue({ list: [], total: 0 });
    useUserStore().userInfo!.userID = '126';
    await flushPromises();
    finish(completed);
    await flushPromises();
    expect(signal.aborted).toBe(true);
    expect(wrapper.text()).not.toContain('当前话题');
    expect(wrapper.findComponent({ name: 'AiChatInput' }).exists()).toBe(true);
    wrapper.unmount();
  });
  it('引用其他会话作为用户请求发送，并且不提前调用模型', async () => {
    const other = { ...active, sessionID: 'other', title: '另一个分析' };
    mocks.sessions.mockResolvedValue({ list: [active, other], total: 2 });
    mocks.stream.mockResolvedValue('active');
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '引用此会话')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('引用会话：另一个分析');
    expect(mocks.stream).not.toHaveBeenCalled();
    wrapper.getComponent({ name: 'AiChatInput' }).vm.$emit('send', [{ type: 'text', text: '对比差异' }]);
    await flushPromises();
    expect(mocks.stream.mock.calls[0]![0].messages[0].contents[1].text).toContain('会话ID：other');
    wrapper.unmount();
  });
  it('模型把来源片段改写成绝对链接时仍在当前工作台鉴权打开', async () => {
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    mocks.getSession.mockResolvedValue({ ...active, sessionID: 'source', title: '来源会话' });
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    const link = document.createElement('a');
    link.href = 'https://chat-ai.uspeedo.com/chat/ai-session?sessionID=source&turn=2';
    link.textContent = '来源';
    wrapper.get('section').element.append(link);
    link.click();
    await flushPromises();
    expect(mocks.getSession).toHaveBeenCalledWith('source', expect.any(AbortSignal));
    expect(wrapper.text()).toContain('来源会话');
    mocks.getSession.mockClear();
    link.href = 'https://chat.bytedance.net/ai-session=source&turn=2';
    link.click();
    await flushPromises();
    expect(mocks.getSession).toHaveBeenCalledWith('source', expect.any(AbortSignal));
    mocks.getSession.mockClear();
    link.removeAttribute('href');
    link.textContent = '#ai-session=source&turn=2';
    link.click();
    await flushPromises();
    expect(mocks.getSession).toHaveBeenCalledWith('source', expect.any(AbortSignal));
    wrapper.unmount();
  });
  it('AI 生成的 /oss/ 文件链接经 file-proxy 代理下载，预览类型走新标签', async () => {
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    mocks.getSession.mockResolvedValue({ ...active, sessionID: 'source', title: '来源会话' });
    mocks.fetchOss.mockResolvedValue(new Blob(['xlsx-bytes']));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    const link = document.createElement('a');
    link.href = '/oss/temporary/report.xlsx';
    link.textContent = '统计报表.xlsx';
    wrapper.get('section').element.append(link);
    link.click();
    await flushPromises();
    // 非预览类型不弹新标签，走隐藏锚点下载；代理调用收到原始对象 URI。
    expect(mocks.fetchOss).toHaveBeenCalledWith('/oss/temporary/report.xlsx');
    expect(openSpy).not.toHaveBeenCalled();
    mocks.fetchOss.mockClear();
    // 会话链接逻辑不受文件分支影响。
    mocks.getSession.mockClear();
    const sessionLink = document.createElement('a');
    sessionLink.href = '#ai-session=source&turn=2';
    sessionLink.textContent = '#ai-session=source&turn=2';
    wrapper.get('section').element.append(sessionLink);
    sessionLink.click();
    await flushPromises();
    expect(mocks.fetchOss).not.toHaveBeenCalled();
    expect(mocks.getSession).toHaveBeenCalledWith('source', expect.any(AbortSignal));
    openSpy.mockRestore();
    wrapper.unmount();
  });
  it('渲染器未生成 href 的 /oss/ 文字链接（中文文件名）也走代理下载', async () => {
    mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
    mocks.fetchOss.mockResolvedValue(new Blob(['xlsx-bytes']));
    const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
    await flushPromises();
    // 中文文件名等链接 vue-streammarkdown 可能不生成 href，只渲染文字；拦截逻辑需回退用文字作为对象 URI。
    const link = document.createElement('a');
    link.textContent = '/oss/temporary/设备统计测试.xlsx';
    wrapper.get('section').element.append(link);
    link.click();
    await flushPromises();
    expect(mocks.fetchOss).toHaveBeenCalledWith('/oss/temporary/设备统计测试.xlsx');
    expect(mocks.getSession).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

it('分支请求失败可重试且沿用幂等标识，失败不丢原会话', async () => {
  const old = { sessionID: 'source', title: '原会话', status: 2, lastActiveAt: 100 };
  mocks.sessions.mockResolvedValue({ list: [old], total: 1 });
  mocks.fork.mockRejectedValueOnce(new Error('网络超时')).mockRejectedValueOnce(new Error('暂不可用'));
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  await wrapper
    .findAll('button')
    .find((button) => button.text() === '基于此新建')!
    .trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('网络超时');
  expect(wrapper.text()).toContain('原会话');
  await wrapper
    .findAll('button')
    .find((button) => button.text() === '基于此新建')!
    .trigger('click');
  await flushPromises();
  expect(mocks.fork.mock.calls[1]![1]).toBe(mocks.fork.mock.calls[0]![1]);
  wrapper.unmount();
});

it('标记完成前取消确认时保留未发送草稿', async () => {
  mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'active', title: '草稿会话', status: 1, lastActiveAt: 100 }], total: 1 });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  const editor = wrapper.getComponent({ name: 'AiChatInput' });
  editor.vm.$emit('draftChange', true);
  await wrapper
    .findAll('button')
    .find((button) => button.text() === '标记完成')!
    .trigger('click');
  await flushPromises();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(wrapper.getComponent({ name: 'AiChatInput' }).vm).toBe(editor.vm);
  confirm.mockRestore();
  wrapper.unmount();
});

it('剪贴板不可用时显示失败，不误报已复制', async () => {
  mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'active', title: '复制测试', status: 1, lastActiveAt: 100 }], total: 1 });
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('permission'));
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  await wrapper
    .findAll('button')
    .find((button) => button.text() === '复制会话 ID')!
    .trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('复制失败');
  expect(wrapper.text()).not.toContain('会话 ID 已复制');
  copy.mockRestore();
  wrapper.unmount();
});

it('账号只有旧结束会话时打开全部分类并恢复最新记录', async () => {
  mocks.sessions.mockResolvedValue({ list: [{ sessionID: 'old-ended', title: '旧电压分析', status: 2, lastActiveAt: 100 }], total: 1 });
  mocks.history.mockResolvedValue({ results: [], turns: [{ turnIndex: 1, userContents: [{ type: 'text', text: '历史电压请求' }], aiResponse: '历史曲线' }] });
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  expect(mocks.sessions).toHaveBeenCalledWith(1, expect.any(AbortSignal), undefined);
  expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('全部');
  expect(wrapper.text()).toContain('历史电压请求');
  expect(wrapper.text()).toContain('已结束');
  wrapper.unmount();
});

it('最近真实交互已完成时默认恢复该会话并选择已完成分类', async () => {
  const completed = { sessionID: 'done-latest', title: '最新完成话题', status: 1, completionState: 'completed', lastActiveAt: 100 };
  mocks.sessions.mockResolvedValue({ list: [completed], total: 1 });
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  expect(mocks.sessions.mock.calls[0]![2]).toBeUndefined();
  expect(mocks.sessions.mock.calls[1]![2]).toBe('completed');
  expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('已完成');
  expect(mocks.history).toHaveBeenCalledWith('done-latest', expect.any(AbortSignal));
  wrapper.unmount();
});

it('AI 贴出沙箱内视角绝对地址（allinone:7777）也按 pathname 拦截走代理下载', async () => {
  const active = { sessionID: 'active', title: '文件交付', status: 1, lastActiveAt: 100 };
  mocks.sessions.mockResolvedValue({ list: [active], total: 1 });
  mocks.fetchOss.mockResolvedValue(new Blob(['xlsx-bytes']));
  const wrapper = mount(AiChatPanel, { props: { workspace: true, open: true } });
  await flushPromises();
  const link = document.createElement('a');
  link.href = 'http://allinone:7777/oss/temporary/2026-10-10/platform/core/1/2/设备统计_2026-10-10.xlsx';
  link.textContent = '设备统计_2026-10-10.xlsx';
  wrapper.get('section').element.append(link);
  link.click();
  await flushPromises();
  expect(mocks.fetchOss).toHaveBeenCalledWith('/oss/temporary/2026-10-10/platform/core/1/2/设备统计_2026-10-10.xlsx');
  wrapper.unmount();
});

