/** 规则引擎任务创建状态机测试：失败关闭、产物门槛、调度映射与草稿清理。 */
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

import { config, flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CreateDialog from './aitask-create.vue';

/** 网络请求与通知边界，组件内的状态变更和保存编排保持真实。 */
const mocks = vi.hoisted(() => ({ session: vi.fn(), group: vi.fn(), shell: vi.fn(), publish: vi.fn(), validate: vi.fn(), create: vi.fn(), remove: vi.fn(), getDraft: vi.fn(), updateDraft: vi.fn(), error: vi.fn() }));
vi.mock('../aitask.api', () => ({ AiTaskApi: { create: mocks.create }, aiTaskDevSession: mocks.session, getProjectCloneGroupID: mocks.group, createAiToolShell: mocks.shell, publishAiTool: mocks.publish, validateAiToolArtifacts: mocks.validate, deleteAiTool: mocks.remove, getAiToolTriggerDraft: mocks.getDraft, updateAiToolTriggerDraft: mocks.updateDraft }));
vi.mock('@vben/saas', () => ({ message: { error: mocks.error, success: vi.fn(), warning: vi.fn() } }));
vi.mock('@vben/saas/ai-tool-detail', () => ({ AiToolDetail: { props: ['compact'], template: '<div data-test="ai-tool-detail-stub">{{ compact }}</div>' } }));
vi.mock('@vben-core/shadcn-ui', () => ({ VbenIcon: { template: '<i />' } }));

/** openDialog 默认走完先配置规则、再初始化工具的真实步骤。 */
async function openDialog(extraProps: { resumeToolID?: string } = {}, enterDev = true) {
  const wrapper = shallowMount(CreateDialog, { props: { projectID: '9007199254740993', open: false, ...extraProps } });
  await wrapper.setProps({ open: true });
  await flushPromises();
  const state = (wrapper.vm.$ as any).setupState;
  if (enterDev) {
    state.scheduleForm.name = '巡检';
    await state.gotoDev();
    await flushPromises();
  }
  return { wrapper, state };
}

describe('AI 任务两步创建', () => {
  afterEach(() => vi.useRealTimers());
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.group.mockResolvedValue('9007199254740995');
    mocks.session.mockResolvedValue({ cloneID: '9007199254740997' });
    mocks.shell.mockResolvedValue({ id: '42' });
    mocks.getDraft.mockResolvedValue(undefined);
  });
  it('先定义触发规则，再初始化开发会话与工具', async () => {
    const { wrapper, state } = await openDialog({}, false);
    expect(state.step).toBe('schedule');
    expect(mocks.group).not.toHaveBeenCalled();
    expect(mocks.shell).not.toHaveBeenCalled();
    state.scheduleForm.name = '巡检';
    await state.gotoDev();
    expect(state.step).toBe('dev');
    expect(mocks.shell).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ name: '巡检', scheduleType: 'interval' }) }));
    wrapper.unmount();
  });
  it('选择物模型事件后，开发会话、工具输入及发布请求都使用订阅合同', async () => {
    const { wrapper, state } = await openDialog({}, false);
    const event = {
      triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event',
      subscribePayloadFilter: '{"logic":"and","rules":[],"topicMatch":{"identifier":"fault"}}',
      scopeProjectID: '9007199254740993', scheduleType: 'none',
    };
    state.scheduleForm.name = '故障处理';
    state.eventConfig = { triggerType: 'subscribe_message', subscribeTopic: event.subscribeTopic, topicMatch: { identifier: 'fault' }, logic: 'and', rules: [] };
    await wrapper.vm.$nextTick();
    state.triggerEditor = { serialize: () => event };
    await state.gotoDev();
    expect(state.triggerInstruction).toContain('eventPayload');
    expect(state.triggerInstruction).toContain('不要轮询设备列表');
    expect(mocks.session).toHaveBeenCalledWith(expect.objectContaining({ projectID: '9007199254740993' }));
    expect(mocks.shell).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ subscribeTopic: event.subscribeTopic, scopeProjectID: event.scopeProjectID }) }));
    state.artifactsSaved = true;
    await state.onSaveTask();
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ triggerType: 'subscribe_message', subscribeTopic: event.subscribeTopic }));
    wrapper.unmount();
  });
  it('会话失败不创建工具，不允许越过代码步骤', async () => {
    mocks.session.mockRejectedValue(new Error('会话失败'));
    const { wrapper, state } = await openDialog();
    expect(mocks.shell).not.toHaveBeenCalled();
    expect(state.step).toBe('dev');
    await state.onSaveTask();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(state.open).toBe(true);
    expect(state.initializationError).toContain('会话失败');
    await state.initialize();
    expect(mocks.session).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
  it('开发工作台使用紧凑头部与紧凑工具详情', async () => {
    config.global.renderStubDefaultSlot = true;
    try {
      const { wrapper } = await openDialog();
      const header = wrapper.get('[data-testid="aitask-compact-header"]');
      expect(header.text()).toContain('1. 定义触发规则');
      expect(header.text()).toContain('2. 对话编辑代码');
      expect(wrapper.find('anonymous-stub[compact]').exists()).toBe(true);
      wrapper.unmount();
    } finally {
      config.global.renderStubDefaultSlot = false;
    }
  });
  it('配置调度限制弹窗高度以保留内部滚动并按用途分组', async () => {
    config.global.renderStubDefaultSlot = true;
    try {
      const { wrapper, state } = await openDialog({}, false);
      await wrapper.vm.$nextTick();
      const dialog = wrapper.get('[data-testid="aitask-dialog"]');
      expect(dialog.classes()).toContain('max-w-5xl');
      expect(dialog.classes()).toContain('h-[calc(100dvh-2rem)]');
      expect(dialog.classes()).toContain('max-h-[860px]');
      const panel = wrapper.get('[data-testid="aitask-schedule-panel"]');
      expect(panel.text()).toContain('任务信息');
      expect(panel.text()).toContain('触发配置');
      expect(panel.text()).toContain('执行控制');
      wrapper.unmount();
    } finally {
      config.global.renderStubDefaultSlot = false;
    }
  });
  it('从列表恢复原草稿，先回显已选规则，再复用工具进入代码步骤', async () => {
    mocks.validate.mockResolvedValue({ status: 1 });
    mocks.getDraft.mockResolvedValue({ name: '事件巡检', scheduleType: 'interval', scheduleInterval: 5, repeatTimes: 0, timeoutSeconds: 300 });
    const { wrapper, state } = await openDialog({ resumeToolID: '46' }, false);
    expect(state.step).toBe('schedule');
    expect(state.scheduleForm.name).toBe('事件巡检');
    expect(mocks.shell).not.toHaveBeenCalled();
    await state.gotoDev();
    expect(state.toolID).toBe('46');
    expect(state.artifactsSaved).toBe(true);
    expect(state.step).toBe('dev');
    wrapper.unmount();
  });
  it('草稿规则回读未完成时不能创建开发会话，迟到结果不会覆盖关闭后的表单', async () => {
    let releaseDraft!: (value: { name: string; scheduleType: string }) => void;
    mocks.getDraft.mockImplementation(() => new Promise((resolve) => { releaseDraft = resolve; }));
    const { wrapper, state } = await openDialog({ resumeToolID: '46' }, false);
    expect(state.restoringDraft).toBe(true);
    await state.gotoDev();
    expect(mocks.group).not.toHaveBeenCalled();
    state.requestClose();
    expect(state.open).toBe(false);
    releaseDraft({ name: '迟到的旧规则', scheduleType: 'interval' });
    await flushPromises();
    expect(state.scheduleForm.name).toBe('');
    wrapper.unmount();
  });
  it('返回修改消息订阅范围后同步草稿契约，并要求重新保存代码', async () => {
    const { wrapper, state } = await openDialog();
    state.artifactsSaved = true;
    state.step = 'schedule';
    state.eventConfig = { triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event', topicMatch: { identifier: 'fault' }, logic: 'and', rules: [] };
    await wrapper.vm.$nextTick();
    state.triggerEditor = { serialize: () => ({ triggerType: 'subscribe_message', subscribeTopic: 'device.report.thing.event', subscribePayloadFilter: '{"logic":"and","rules":[],"topicMatch":{"identifier":"fault"}}', scopeProjectID: '9007199254740993', scheduleType: 'none' }) };
    await state.gotoDev();
    expect(mocks.updateDraft).toHaveBeenCalledWith('42', expect.objectContaining({ subscribeTopic: 'device.report.thing.event' }));
    expect(state.artifactsSaved).toBe(false);
    await state.onSaveTask();
    expect(mocks.create).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('分阶段显示进度，超时停止转圈且未决请求不能重复创建', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    /** releaseShell 模拟服务器迟到返回已创建的草稿。 */
    let releaseShell!: (value: { id: string }) => void;
    mocks.shell.mockImplementation(() => new Promise((resolve) => { releaseShell = resolve; }));
    const { wrapper, state } = await openDialog({}, false);
    state.scheduleForm.name = '巡检';
    void state.gotoDev();
    await flushPromises();
    expect(state.initializationStage).toContain('创建工具草稿');
    await vi.advanceTimersByTimeAsync(30_000);
    expect(state.initializing).toBe(false);
    expect(state.initializationError).toContain('等待超时');
    expect(state.initializationPending).toBe(true);
    await state.initialize();
    expect(mocks.shell).toHaveBeenCalledTimes(1);
    releaseShell({ id: '42' });
    await flushPromises();
    expect(state.toolID).toBe('42');
    expect(state.initializationError).toBe('');
    expect(state.initializationPending).toBe(false);
    wrapper.unmount();
  });
  it('初始化时可关闭，重新打开不重复请求并清理迟到草稿', async () => {
    /** releaseShell 控制关闭后的迟到响应。 */
    let releaseShell!: (value: { id: string }) => void;
    mocks.shell.mockImplementation(() => new Promise((resolve) => { releaseShell = resolve; }));
    const { wrapper, state } = await openDialog({}, false);
    state.scheduleForm.name = '巡检';
    void state.gotoDev();
    await flushPromises();
    state.requestClose();
    expect(state.open).toBe(false);
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    expect(mocks.shell).toHaveBeenCalledTimes(1);
    releaseShell({ id: '43' });
    await flushPromises();
    expect(mocks.remove).toHaveBeenCalledWith('43');
    expect(state.toolID).toBeNull();
    expect(state.initializationPending).toBe(false);
    wrapper.unmount();
  });
  it('查询项目期间关闭后不会继续创建会话或工具', async () => {
    /** releaseGroup 模拟迟到的项目权限查询响应。 */
    let releaseGroup!: (value: string) => void;
    mocks.group.mockImplementation(() => new Promise((resolve) => { releaseGroup = resolve; }));
    const { wrapper, state } = await openDialog({}, false);
    state.scheduleForm.name = '巡检';
    void state.gotoDev();
    await flushPromises();
    expect(state.initializationStage).toContain('校验项目分身组');
    state.requestClose();
    releaseGroup('9007199254740995');
    await flushPromises();
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.shell).not.toHaveBeenCalled();
    wrapper.unmount();
  });
  it('卸载时清除等待计时器，仍回收迟到草稿', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    /** releaseShell 控制组件销毁后的创建结果。 */
    let releaseShell!: (value: { id: string }) => void;
    mocks.shell.mockImplementation(() => new Promise((resolve) => { releaseShell = resolve; }));
    const { wrapper, state } = await openDialog({}, false);
    state.scheduleForm.name = '巡检';
    void state.gotoDev();
    await flushPromises();
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
    releaseShell({ id: '44' });
    await flushPromises();
    expect(mocks.remove).toHaveBeenCalledWith('44');
  });
  it('迟到草稿清理失败保留 ID，可再次确认清理，不能重建', async () => {
    /** releaseShell 控制被取消的工具创建请求。 */
    let releaseShell!: (value: { id: string }) => void;
    mocks.shell.mockImplementation(() => new Promise((resolve) => { releaseShell = resolve; }));
    mocks.remove.mockRejectedValueOnce(new Error('清理暂时失败'));
    const { wrapper, state } = await openDialog({}, false);
    state.scheduleForm.name = '巡检';
    void state.gotoDev();
    await flushPromises();
    state.requestClose();
    releaseShell({ id: '45' });
    await flushPromises();
    expect(state.toolID).toBe('45');
    expect(state.initializationError).toContain('草稿自动清理失败');
    await state.initialize();
    expect(mocks.shell).toHaveBeenCalledTimes(1);
    state.requestClose();
    expect(state.discardOpen).toBe(true);
    await state.discardDraft();
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(state.toolID).toBeNull();
    expect(state.initializationError).toBe('');
    expect(state.initializationStage).toBe('');
    wrapper.unmount();
  });
  it('没有保存产物不能提交，发布后创建失败保留当前工具重试', async () => {
    const { wrapper, state } = await openDialog();
    state.scheduleForm.name = '巡检';
    await state.onSaveTask();
    expect(mocks.publish).not.toHaveBeenCalled();
    mocks.validate.mockRejectedValueOnce(new Error('缺少代码'));
    await state.onArtifactsSaved();
    expect(state.artifactsSaved).toBe(false);
    await state.onArtifactsSaved();
    mocks.create.mockRejectedValueOnce(new Error('创建失败'));
    await state.onSaveTask();
    expect(state.toolID).toBe('42');
    expect(state.step).toBe('dev');
    expect(state.artifactsSaved).toBe(true);
    await state.onSaveTask();
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({ cloneGroupID: '9007199254740995', cloneID: '9007199254740997' }));
    wrapper.unmount();
  });
  it('完整映射五种调度、重复次数和超时', async () => {
    const { wrapper, state } = await openDialog();
    Object.assign(state.scheduleForm, { name: '测试', repeatTimes: 3, timeoutSeconds: 90, intervalMin: 1, dailyTime: '00:00', weeklyDay: 0, weeklyTime: '00:00', onceTime: '2099-01-01T08:00' });
    for (const scheduleType of ['none', 'once', 'interval', 'daily', 'weekly']) {
      state.scheduleForm.scheduleType = scheduleType;
      const result = state.buildScheduleReq();
      expect(result).toMatchObject({ scheduleType, repeatTimes: 3, timeoutSeconds: 90 });
      if (scheduleType === 'once') expect(result.scheduleTime).toBe(new Date('2099-01-01T08:00').toISOString());
      if (scheduleType === 'interval') expect(result.scheduleInterval).toBe(1);
      if (scheduleType === 'daily') expect(result.scheduleDailyTimeSec).toBe(0);
      if (scheduleType === 'weekly') expect(result).toMatchObject({ scheduleWeeklyDay: 0, scheduleWeeklyTimeSec: 0 });
    }
    wrapper.unmount();
  });
  it('放弃草稿必须确认，清理失败保留状态', async () => {
    const { wrapper, state } = await openDialog();
    state.requestClose();
    expect(state.discardOpen).toBe(true);
    expect(mocks.remove).not.toHaveBeenCalled();
    mocks.remove.mockRejectedValueOnce(new Error('清理失败'));
    await state.discardDraft();
    expect(state.toolID).toBe('42');
    await state.discardDraft();
    expect(mocks.remove).toHaveBeenLastCalledWith('42');
    expect(state.toolID).toBeNull();
    wrapper.unmount();
  });
  it('保存草稿退出不删除工具，并通知列表提供恢复入口', async () => {
    const { wrapper, state } = await openDialog();
    state.requestClose();
    expect(state.discardOpen).toBe(true);
    state.keepDraftAndClose();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(state.open).toBe(false);
    expect(wrapper.emitted('draftSaved')).toHaveLength(1);
    wrapper.unmount();
  });
});
