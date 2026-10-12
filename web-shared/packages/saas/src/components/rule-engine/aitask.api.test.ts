/** 规则引擎任务请求合同测试：精确项目组、无默认回退、超大 ID 保真。 */
// 测试环境未装载异步语言包：mock $t 直查真实语言包 JSON，断言保持中文语义。
vi.mock('@vben/saas/locales', async () => {
  const messages = (await import('../../locales/langs/zh-CN/iotApp.json')).default;
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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiTaskApi, aiTaskDevSession, createAiToolShell, getAiToolTriggerDraft, getProjectCloneGroupID, getRecoverableAiTaskDrafts, getRuleCloneGroupID, publishAiTool, updateAiToolTriggerDraft, validateAiToolArtifacts } from './aitask.api';

/** 仅替换网络边界，保留真实 API 编排。 */
const api = vi.hoisted(() => ({
  postApiV1AiCloneGroupGetList: vi.fn(),
  postApiV1AiCloneGroupCreate: vi.fn(),
  postApiV1AiAgentInfoGetList: vi.fn(),
  postApiV1AiCloneTaskGetList: vi.fn(),
  postApiV1AiCloneTaskCreate: vi.fn(),
  postApiV1AiCloneTaskUpdate: vi.fn(),
  postApiV1AiCloneTaskDelete: vi.fn(),
  postApiV1AiCloneTaskStart: vi.fn(),
  postApiV1AiCloneTaskStop: vi.fn(),
  postApiV1AiCloneTaskRun: vi.fn(),
  postApiV1AiCloneTaskGetRuns: vi.fn(),
  postApiV1AiToolCreate: vi.fn(),
  postApiV1AiToolGetOne: vi.fn(),
  postApiV1AiToolGetList: vi.fn(),
  postApiV1AiToolUpdate: vi.fn(),
  postApiV1AiToolPublish: vi.fn(),
  post: vi.fn(),
}));
vi.mock('@vben/api', () => ({ CoreAi: api, requestClient: api }));

describe('规则引擎 AI 任务 API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('三件套缺失拒绝继续，已发布工具重试不会再次发布', async () => {
    api.post.mockResolvedValueOnce({ info: { status: 1 }, artifact: { documentMd: '只有文档' } });
    await expect(validateAiToolArtifacts('42')).rejects.toThrow('完整保存');
    api.post.mockResolvedValueOnce({ info: { status: 2 }, artifact: { executorJs: 'export function main() {}', documentMd: '# 任务', manifestJson: '{}' } });
    await publishAiTool('42');
    expect(api.postApiV1AiToolPublish).not.toHaveBeenCalled();
  });
  it('精确 thirdID 查询且使用真实分身组 ID，不丢失超大 ID', async () => {
    const projectID = '9007199254740993';
    const groupID = '9007199254740995';
    api.postApiV1AiCloneGroupGetList.mockResolvedValue({ list: [{ id: '1', thirdID: 'other', isDefault: '1' }, { id: groupID, thirdID: projectID }] });
    const resolved = await getProjectCloneGroupID(projectID);
    expect(resolved).toBe(groupID);
    expect(api.postApiV1AiCloneGroupGetList).toHaveBeenCalledWith(expect.objectContaining({ thirdID: projectID }), { headers: { 'project-id': projectID } });
    await AiTaskApi.getList(resolved);
    expect(api.postApiV1AiCloneTaskGetList).toHaveBeenCalledWith(expect.objectContaining({ cloneGroupID: groupID }));
  });
  it('无精确组时拒绝默认组和首项', async () => {
    api.postApiV1AiCloneGroupGetList.mockResolvedValue({ list: [{ id: '1', thirdID: 'other', isDefault: '1' }] });
    await expect(getProjectCloneGroupID('201')).rejects.toThrow('唯一分身组');
  });
  it('会话使用通用接口且失败向上抛出', async () => {
    api.post.mockRejectedValue(new Error('会话失败'));
    await expect(aiTaskDevSession({ projectID: '201', cloneGroupID: '12' })).rejects.toThrow('会话失败');
    expect(api.post).toHaveBeenCalledWith('/api/v1/things/rule-engine/ai-task/tool-session', { projectID: '201', cloneGroupID: '12' }, { headers: { 'project-id': '201' } });
  });
  it('企业规则只复用当前企业专属组，新建时才创建组', async () => {
    api.postApiV1AiCloneGroupGetList.mockResolvedValueOnce({ list: [], total: 0 }).mockResolvedValueOnce({ list: [], total: 0 });
    api.postApiV1AiAgentInfoGetList.mockResolvedValue({ list: [{ code: '', name: '工具编辑助手', tenantCode: 'org_a', groupID: 77 }] });
    api.postApiV1AiCloneGroupCreate.mockResolvedValue({ id: '9007199254740995' });
    expect(await getRuleCloneGroupID('tenant', 'org_a')).toBeUndefined();
    expect(api.postApiV1AiCloneGroupCreate).not.toHaveBeenCalled();
    expect(await getRuleCloneGroupID('tenant', 'org_a', true)).toBe('9007199254740995');
    expect(api.postApiV1AiCloneGroupCreate).toHaveBeenCalledWith(expect.objectContaining({ tenantCode: 'org_a', code: 'iot_rule_engine_tenant', agentGroupID: 0 }));
  });
  it('公共规则限制在平台并以非项目会话和输入契约运行', async () => {
    await expect(getRuleCloneGroupID('common', 'org_a')).rejects.toThrow();
    api.postApiV1AiCloneGroupGetList.mockResolvedValue({ list: [{ id: '12', tenantCode: 'platform', code: 'iot_rule_engine_common' }], total: 1 });
    expect(await getRuleCloneGroupID('common', 'platform')).toBe('12');
    api.post.mockResolvedValue({ cloneID: '21', persona: '公共规则' });
    await aiTaskDevSession({ cloneGroupID: '12' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/things/rule-engine/ai-task/tool-session', { cloneGroupID: '12' }, undefined);
    await createAiToolShell({ name: '公共规则', description: '', cloneGroupID: '12', trigger: { ruleScope: 'common', name: '公共规则', scheduleType: 'none', triggerType: 'subscribe_message' } });
    const schema = JSON.parse(api.postApiV1AiToolCreate.mock.calls[0]![0].inputSchema);
    expect(schema.input.required).toEqual(['tenantCode']);
    expect(schema.input.properties.eventPayload.type).toBe('object');
  });
  it('工具输入不固定产品和设备，任务保留重复次数与超时', async () => {
    await createAiToolShell({ name: '巡检', description: '', cloneGroupID: '12', trigger: { name: '巡检', scheduleType: 'interval', scheduleInterval: 1 } });
    const schema = JSON.parse(api.postApiV1AiToolCreate.mock.calls[0]![0].inputSchema);
    expect(Object.keys(schema.input.properties)).toEqual(['projectID', 'prompt']);
    expect(schema['x-rule-engine-trigger']).toMatchObject({ name: '巡检', scheduleType: 'interval' });
    await AiTaskApi.create({ name: '巡检', cloneGroupID: '12', cloneID: '21', toolID: '22', scheduleType: 'interval', scheduleInterval: 1, repeatTimes: 3, timeoutSeconds: 120 });
    expect(api.postApiV1AiCloneTaskCreate).toHaveBeenCalledWith(expect.objectContaining({ cloneGroupID: '12', toolID: 22, repeatTimes: 3, timeoutSeconds: 120, scheduleInterval: 1 }));
  });
  it('消息任务工具声明原始 eventPayload，草稿回读与更新保留规则', async () => {
    const trigger = { name: '故障处理', scheduleType: 'none' as const, triggerType: 'subscribe_message' as const, subscribeTopic: 'device.report.thing.event', subscribePayloadFilter: '{"topicMatch":{"identifier":"fault"}}', scopeProjectID: '9007199254740993' };
    await createAiToolShell({ name: '故障处理', description: '', cloneGroupID: '12', trigger });
    const schema = JSON.parse(api.postApiV1AiToolCreate.mock.calls[0]![0].inputSchema);
    expect(schema.input.properties.eventPayload).toMatchObject({ type: 'object' });
    expect(schema.input.required).not.toContain('eventPayload');
    api.postApiV1AiToolGetOne.mockResolvedValue({ info: { inputSchema: JSON.stringify(schema) } });
    expect(await getAiToolTriggerDraft('42')).toEqual(trigger);
    await updateAiToolTriggerDraft('42', trigger);
    expect(api.postApiV1AiToolUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '42', inputSchema: expect.stringContaining('eventPayload') }));
  });
  it('任务操作按源接口区分数值 ID 与字符串 ID', async () => {
    api.postApiV1AiCloneTaskGetList.mockResolvedValue({ list: [{ id: 22, toolID: 23, cloneGroupID: '12', cloneID: '21' }], total: 1 });
    expect((await AiTaskApi.getList('12')).list?.[0]).toEqual(expect.objectContaining({ id: '22', toolID: '23', cloneGroupID: '12' }));
    await AiTaskApi.start('22');
    await AiTaskApi.stop('22');
    await AiTaskApi.run('22');
    await AiTaskApi.delete('22');
    for (const call of [api.postApiV1AiCloneTaskStart, api.postApiV1AiCloneTaskStop, api.postApiV1AiCloneTaskRun, api.postApiV1AiCloneTaskDelete]) {
      expect(call).toHaveBeenCalledWith({ id: 22 });
    }
    await AiTaskApi.update('22', { name: '巡检', scheduleType: 'none' });
    expect(api.postApiV1AiCloneTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: '22' }));
    await AiTaskApi.getRuns('22');
    expect(api.postApiV1AiCloneTaskGetRuns).toHaveBeenCalledWith(expect.objectContaining({ taskID: '22' }));
  });
  it('只恢复当前规则引擎未绑定草稿，并包含发布后建任务失败的工具', async () => {
    api.postApiV1AiToolGetList.mockResolvedValue({
      total: 5,
      list: [
        { id: '41', code: 'iot_task_1', name: '开发中', status: '1' },
        { id: '42', code: 'iot_task_2', name: '待建任务', status: '2' },
        { id: '43', code: 'iot_task_3', name: '已绑定', status: '2' },
        { id: '44', code: 'other_tool', name: '其他工具', status: '1' },
        { id: '45', code: 'iot_task_4', name: '已停用', status: '3' },
      ],
    });
    const drafts = await getRecoverableAiTaskDrafts('9007199254740995', ['43']);
    expect(drafts.map((draft) => draft.id)).toEqual(['41', '42']);
    expect(api.postApiV1AiToolGetList).toHaveBeenCalledWith(expect.objectContaining({
      cloneGroupID: '9007199254740995',
      toolType: 'script',
    }));
  });
  it('数值工具 ID 超出安全整数时拒绝发送，不能悄悄丢失精度', async () => {
    await expect(AiTaskApi.create({ name: '巡检', cloneGroupID: '12', cloneID: '21', toolID: '9007199254740993', scheduleType: 'none' })).rejects.toThrow('安全整数');
    expect(api.postApiV1AiCloneTaskCreate).not.toHaveBeenCalled();
  });
});
