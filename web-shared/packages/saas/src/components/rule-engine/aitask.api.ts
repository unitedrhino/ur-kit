/**
 * 文件说明：规则引擎「规则引擎 AI 任务」API 封装（TASK-124 v3）。
 *
 * 规则引擎 AI 任务 = AI 工具（aisvr ai_tools，executor.js 存 S3）+ 定时或消息调度（aisvr ai_clone_task，
 * taskType=tool_run，沙箱执行 + 执行记录 ai_clone_task_runs）。本文件只做薄封装：
 * - clone-task / tool 全部走 CoreAi codegen 方法；
 * - 会话初始化走 things 域 rule-engine/ai-task/tool-session（幂等返回项目级开发助手 cloneID）。
 *
 * 类型口径：项目、cloneGroupID、cloneID 始终字符串；页面任务/工具 ID 统一字符串，
 * 调用既有数值 ID 接口时先校验安全整数；更新与记录查询仍按源定义传字符串。
 * enabled：'1' 启用 / '2' 停用；scheduleInterval 单位为分钟；scheduleTime 为 ISO 时间字符串。
 */
import { CoreAi, requestClient } from '@vben/api';
import { $t } from '@vben/saas/locales';

/** RuleEngineScope 标识规则所属范围，非项目范围使用专属分身组。 */
export type RuleEngineScope = 'project' | 'tenant' | 'common';

/** scopeGroupCode 与后端非项目分身组编码保持一致。 */
const scopeGroupCode = { tenant: 'iot_rule_engine_tenant', common: 'iot_rule_engine_common' } as const;

/** clone-task 返回的任务信息（仅本页消费字段，完整定义见 aisvr http/cloneTask.api） */
export interface AiTaskInfo {
  id: string;
  cloneGroupID: string;
  cloneID: string;
  toolID?: string;
  name: string;
  desc?: string;
  taskType: string;
  /** 工具输入 JSON 模板（创建请求体字段为 toolInputs，出参为 toolInputsTemplate） */
  toolInputsTemplate?: string;
  /** 自动触发类型：定时或订阅事件。 */
  triggerType?: 'schedule' | 'subscribe_message';
  /** 后端已注册的事件主题编码。 */
  subscribeTopic?: string;
  /** 消息字段比较条件 JSON。 */
  subscribePayloadFilter?: string;
  /** 项目事件归属范围，必须与当前项目分身组一致。 */
  scopeProjectID?: string;
  scheduleType: 'daily' | 'interval' | 'none' | 'once' | 'weekly';
  /** interval 调度的间隔分钟数 */
  scheduleInterval?: number;
  /** once 调度的单次执行时间（ISO 字符串） */
  scheduleTime?: string;
  /** daily 调度的当天秒偏移（0-86399） */
  scheduleDailyTimeSec?: number;
  /** weekly 调度的周几（0 周日 ~ 6 周六） */
  scheduleWeeklyDay?: number;
  /** weekly 调度的当天秒偏移 */
  scheduleWeeklyTimeSec?: number;
  /** 启用状态：'1' 启用 / '2' 停用 */
  enabled?: string;
  /** 状态：scheduled 调度中 / paused 已暂停 / completed 已完成（once 终局） */
  state?: string;
  lastStatus?: string;
  lastError?: string;
  /** 毫秒时间戳 */
  lastRunAt?: number;
  /** 毫秒时间戳 */
  nextRunAt?: number;
  repeatTimes?: number;
  timeoutSeconds?: number;
}

/** clone-task 执行记录（ai_clone_task_runs） */
export interface AiTaskRunInfo {
  id?: string;
  taskID?: string;
  runID?: string;
  /** 触发方式：schedule 调度 / manual 手动 / subscribe_message 订阅 */
  triggerType?: string;
  /** running / success / failed */
  status?: string;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  /** 工具 stdout 最后一行 JSON */
  output?: string;
  errorMsg?: string;
  logs?: string;
}

/** 未绑定任务的规则引擎工具，可继续开发或继续创建调度任务。 */
export interface AiTaskDraftInfo {
  id: string;
  name: string;
  code: string;
  /** 1=开发中，2=代码已发布但任务创建尚未完成。 */
  status: '1' | '2';
  createdTime?: number;
}

/** 调度配置保存请求（create/update 共用，空值字段后端忽略） */
export interface AiTaskScheduleReq {
  /** 工具草稿记录规则范围，防止恢复到其他入口。 */
  ruleScope?: RuleEngineScope;
  name: string;
  desc?: string;
  scheduleType: AiTaskInfo['scheduleType'];
  triggerType?: AiTaskInfo['triggerType'];
  subscribeTopic?: string;
  subscribePayloadFilter?: string;
  scopeProjectID?: string;
  scheduleInterval?: number;
  scheduleTime?: string;
  scheduleDailyTimeSec?: number;
  scheduleWeeklyDay?: number;
  scheduleWeeklyTimeSec?: number;
  /** 工具输入 JSON 字符串（含 projectID/prompt 等任务上下文） */
  toolInputs?: string;
  /** 最大执行次数，0 表示不限。 */
  repeatTimes?: number;
  timeoutSeconds?: number;
}

const withPage = (page: number, size: number) => ({ page: { page, pageSize: size } });

/** 数值 ID 接口的边界校验；绝不用于项目或分身组 ID。 */
function numericResourceID(id: string): number {
  const value = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error($t('iotApp.project.toolIdNotSafeInt'));
  }
  return value;
}

export const AiTaskApi = {
  /** 分页查询项目级 AI 任务（cloneGroupID 过滤项目，taskType 固定 tool_run） */
  getList: async (projectCloneGroupID: string, page = 1, size = 50): Promise<{ list?: AiTaskInfo[]; total?: number }> => {
    const result = await CoreAi.postApiV1AiCloneTaskGetList({
      ...withPage(page, size),
      cloneGroupID: projectCloneGroupID,
      taskType: 'tool_run',
    });
    return {
      ...result,
      list: result?.list?.map((task) => ({
        ...task,
        id: String(task.id),
        toolID: task.toolID == null ? undefined : String(task.toolID),
      })) as AiTaskInfo[] | undefined,
    };
  },

  /** 创建任务：绑定工具与项目开发助手 clone，按调度配置自动计算首次执行时间 */
  create: async (params: {
    cloneGroupID: string;
    cloneID: string;
    toolID: string;
    name: string;
    desc?: string;
    toolInputs?: string;
  } & Omit<AiTaskScheduleReq, 'name' | 'desc' | 'toolInputs'>) => {
    return await CoreAi.postApiV1AiCloneTaskCreate({
      cloneGroupID: params.cloneGroupID,
      cloneID: params.cloneID,
      toolID: numericResourceID(params.toolID),
      name: params.name,
      desc: params.desc,
      taskType: 'tool_run',
      toolInputs: params.toolInputs,
      triggerType: params.triggerType,
      subscribeTopic: params.subscribeTopic,
      subscribePayloadFilter: params.subscribePayloadFilter,
      scopeProjectID: params.scopeProjectID,
      scheduleType: params.scheduleType,
      scheduleInterval: params.scheduleInterval,
      scheduleTime: params.scheduleTime,
      scheduleDailyTimeSec: params.scheduleDailyTimeSec,
      scheduleWeeklyDay: params.scheduleWeeklyDay,
      scheduleWeeklyTimeSec: params.scheduleWeeklyTimeSec,
      timeoutSeconds: params.timeoutSeconds,
      repeatTimes: params.repeatTimes,
    });
  },

  /** 更新任务调度/名称/输入模板（部分更新，空值忽略） */
  update: async (id: string, data: AiTaskScheduleReq) => {
    return await CoreAi.postApiV1AiCloneTaskUpdate({ id, ...data });
  },

  /** 删除任务（执行记录保留） */
  delete: async (id: string) => {
    return await CoreAi.postApiV1AiCloneTaskDelete({ id: numericResourceID(id) });
  },

  /** 启用任务（重新计算下次执行时间） */
  start: async (id: string) => {
    return await CoreAi.postApiV1AiCloneTaskStart({ id: numericResourceID(id) });
  },

  /** 停用任务（不再自动触发，仍可手动执行） */
  stop: async (id: string) => {
    return await CoreAi.postApiV1AiCloneTaskStop({ id: numericResourceID(id) });
  },

  /** 手动立即执行一次（异步沙箱执行，结果进执行记录） */
  run: async (id: string) => {
    return await CoreAi.postApiV1AiCloneTaskRun({ id: numericResourceID(id) });
  },

  /** 分页查询任务执行记录（按执行时间倒序） */
  getRuns: async (taskID: string, page = 1, size = 20): Promise<{ list?: AiTaskRunInfo[]; total?: number }> => {
    const result = await CoreAi.postApiV1AiCloneTaskGetRuns({
      ...withPage(page, size),
      taskID,
    });
    return {
      ...result,
      list: result?.list?.map((run) => ({
        ...run,
        id: run.id == null ? undefined : String(run.id),
        taskID: run.taskID == null ? undefined : String(run.taskID),
      })),
    };
  },
};

/**
 * 初始化规则引擎 AI 任务开发会话。
 * 后端幂等创建项目级「规则引擎 AI 任务助手」clone（persona 注入沙箱运行时约定与平台 API 调用方式），
 * 返回 cloneID 供会话与任务绑定；失败必须阻止创建工具与任务。
 */
export async function aiTaskDevSession(params: {
  projectID?: string;
  cloneGroupID: string;
  prompt?: string;
}): Promise<{ cloneID: string; persona: string }> {
  return await requestClient.post(
    '/api/v1/things/rule-engine/ai-task/tool-session', params,
    params.projectID ? { headers: { 'project-id': params.projectID } } : undefined,
  );
}

/** getRuleCloneGroupID 定位非项目规则专属组，仅用户明确新建时幂等创建。 */
export async function getRuleCloneGroupID(scope: 'common' | 'tenant', tenantCode: string, ensure = false): Promise<string | undefined> {
  if (!tenantCode || scope === 'common' && tenantCode !== 'platform') throw new Error('当前企业不允许使用该规则范围');
  const code = scopeGroupCode[scope];
  const findGroup = async () => {
    for (let page = 1; ; page++) {
      const result = await CoreAi.postApiV1AiCloneGroupGetList({ page: { page, pageSize: 100 } });
      const found = (result?.list || []).find((group) => group.code === code && group.tenantCode === tenantCode);
      if (found?.id) return String(found.id);
      if ((result?.list?.length || 0) < 100 || page * 100 >= Number(result?.total || 0)) return undefined;
    }
  };
  const existing = await findGroup();
  if (existing || !ensure) return existing;
  try {
    const created = await CoreAi.postApiV1AiCloneGroupCreate({
      tenantCode, agentGroupID: 0, code,
      name: scope === 'common' ? '物联网公共规则引擎' : '物联网企业规则引擎',
    });
    if (created?.id) return String(created.id);
  } catch (error) {
    const raced = await findGroup();
    if (raced) return raced;
    throw error;
  }
  return await findGroup();
}

/**
 * 创建 AI 工具外壳（aisvr ai_tools，status=草稿）。
 * 入参契约固定为任务上下文（projectID/prompt），出参自由（stdout JSON 进执行记录）。
 */
export async function createAiToolShell(params: {
  name: string;
  description: string;
  cloneGroupID: string;
  trigger: AiTaskScheduleReq;
}) {
  return await CoreAi.postApiV1AiToolCreate({
    name: params.name,
    code: `iot_task_${Date.now()}`,
    toolType: 'script',
    description: params.description,
    ...(params.cloneGroupID ? { cloneGroupID: params.cloneGroupID } : {}),
    inputSchema: aiTaskInputSchema(params.trigger),
  });
}

/** aiTaskInputSchema 把触发配置持久化在工具输入契约中，使草稿恢复仍能先展示规则。 */
export function aiTaskInputSchema(trigger: AiTaskScheduleReq): string {
  const event = trigger.triggerType === 'subscribe_message';
  const project = !trigger.ruleScope || trigger.ruleScope === 'project';
  return JSON.stringify({
    input: {
      type: 'object',
      description: `${event ? '消息订阅' : '定时或手动'}执行时注入的工具入参（argv[2] JSON）`,
      properties: {
        ...(project ? { projectID: { type: 'string', description: '当前项目 ID' } } : { tenantCode: { type: 'string', description: '当前执行企业编码' } }),
        prompt: { type: 'string', description: '任务说明' },
        ...(event ? { eventPayload: { type: 'object', description: '本次触发的完整原始消息；仅消息触发时存在，手动运行时不存在' } } : {}),
      },
      required: [project ? 'projectID' : 'tenantCode'],
    },
    'x-rule-engine-trigger': trigger,
  });
}

/** getAiToolTriggerDraft 回读草稿触发配置；旧草稿无配置时由用户重新选择。 */
export async function getAiToolTriggerDraft(id: string): Promise<AiTaskScheduleReq | undefined> {
  numericResourceID(id);
  const result = await CoreAi.postApiV1AiToolGetOne({ id });
  try {
    const schema = JSON.parse(result?.info?.inputSchema || '{}');
    const trigger = schema['x-rule-engine-trigger'];
    return trigger && typeof trigger === 'object' && typeof trigger.name === 'string' ? trigger as AiTaskScheduleReq : undefined;
  } catch {
    return undefined;
  }
}

/** updateAiToolTriggerDraft 在返回规则步骤修改后，同步工具输入契约与草稿触发配置。 */
export async function updateAiToolTriggerDraft(id: string, trigger: AiTaskScheduleReq) {
  return await CoreAi.postApiV1AiToolUpdate({ id, inputSchema: aiTaskInputSchema(trigger) });
}

/**
 * 查询当前项目可恢复的规则引擎工具。
 * 草稿与“已发布但建任务失败”的工具都必须可恢复；已绑定任务与其他业务工具不得混入。
 */
export async function getRecoverableAiTaskDrafts(projectCloneGroupID: string, boundToolIDs: string[] = []): Promise<AiTaskDraftInfo[]> {
  const pageSize = 100;
  const tools: any[] = [];
  for (let page = 1; ; page++) {
    const result = await CoreAi.postApiV1AiToolGetList({
      ...withPage(page, pageSize),
      cloneGroupID: projectCloneGroupID,
      toolType: 'script',
    });
    const pageList = result?.list ?? [];
    tools.push(...pageList);
    if (pageList.length === 0 || tools.length >= Number(result?.total ?? tools.length)) break;
  }
  const bound = new Set(boundToolIDs.map(String));
  return tools
    .filter((tool) => {
      const status = String(tool.status);
      return String(tool.code ?? '').startsWith('iot_task_')
        && (status === '1' || status === '2')
        && !bound.has(String(tool.id));
    })
    .map((tool) => ({
      id: String(tool.id),
      name: String(tool.name || $t('iotApp.project.aiTaskDefaultName', { code: '----' })),
      code: String(tool.code),
      status: String(tool.status) as AiTaskDraftInfo['status'],
      createdTime: tool.createdTime,
    }));
}

/** 发布 AI 工具（AI 保存产物后调用，保证 clone-task 执行可用） */
/** 校验真实保存的三件套，不能将仅保存文档视为可执行任务。 */
export async function validateAiToolArtifacts(id: string) {
  const result = await requestClient.post<{ info: { status: number }; artifact: { executorJs: string; documentMd: string; manifestJson: string } }>('/api/v1/ai/tool/get-one', {
    id: Number(id), artifactFiles: ['executor.js', 'skill.md', 'manifest.json'],
  });
  const artifact = result?.artifact;
  if (!artifact?.executorJs?.trim() || !artifact.documentMd?.trim() || !artifact.manifestJson?.trim()) {
    throw new Error($t('iotApp.project.saveExecutorFirst'));
  }
  const manifest = JSON.parse(artifact.manifestJson);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error($t('iotApp.project.manifestInvalid'));
  return result.info;
}

/** 发布前回读产物；已发布的工具编辑即时生效，创建任务失败重试时不可再次发布。 */
export async function publishAiTool(id: string) {
  const info = await validateAiToolArtifacts(id);
  if (Number(info.status) === 2) return;
  return await CoreAi.postApiV1AiToolPublish({ id: Number(id) });
}

/** 精确解析项目分身组；禁止用默认组或第一项替代，ID 始终保留字符串。 */
export async function getProjectCloneGroupID(projectID: string): Promise<string> {
  if (!projectID) throw new Error($t('iotApp.project.missingProjectId'));
  const resp = await CoreAi.postApiV1AiCloneGroupGetList({
    page: { page: 1, pageSize: 100 }, thirdID: projectID,
  }, { headers: { 'project-id': projectID } });
  const matched = (resp?.list ?? []).filter((item) => item.thirdID === projectID);
  if (matched.length !== 1 || !matched[0]?.id) throw new Error($t('iotApp.project.noAvatarGroup'));
  return String(matched[0].id);
}

/** 清理尚未绑定任务的工具；发布失败或任务创建失败时由用户确认后调用。 */
export async function deleteAiTool(id: string) {
  return await CoreAi.postApiV1AiToolDelete({ id: Number(id) });
}
