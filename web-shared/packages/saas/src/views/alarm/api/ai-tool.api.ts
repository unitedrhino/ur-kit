/**
 * 文件说明：告警 AI 判断相关工具 API 封装
 * 统一调用 CoreAi 的 ai/tool 与 ai/clone-group 接口，
 * 供告警规则编辑页「AI 判断」配置块选择/创建工具使用；
 * 另含 things 域告警 AI 工具会话初始化接口（tool-session，项目级 clone）。
 */
import { CoreAi, requestClient } from '@vben/api';

/**
 * 查询 AI 工具分页列表
 * @param page 页码
 * @param pageSize 每页大小
 * @param keyword 名称/编码模糊搜索（可选）
 * @param cloneGroupID 项目级 CloneGroup 过滤（按项目归组列出工具，可选）
 */
export async function getAiToolList(page = 1, pageSize = 100, keyword = '', cloneGroupID?: number | string) {
  return await CoreAi.postApiV1AiToolGetList({
    page: { page, pageSize },
    // 后端字段为 name（名称模糊搜索）与 string 序列化的 cloneGroupID
    ...(keyword ? { name: keyword } : {}),
    ...(cloneGroupID != null && cloneGroupID !== '' ? { cloneGroupID: String(cloneGroupID) } : {}),
  });
}

/**
 * 告警 AI 判断工具的入参契约（结构化 JSON）。
 * 创建工具时写入 ai_tools.input_schema：AI 开发时从系统上下文读取并严格按契约实现；
 * 告警引擎执行工具时也按 input 注入参数。字段与 dmsvr `AiJudgeInputs`
 * （notification.go buildAiJudgeInputs）实际注入的 12 个字段严格对齐。
 * 契约归告警域定义，与 clone/提示词解耦。
 */
export const ALARM_JUDGE_TOOL_SCHEMA = `{
  "input": {
    "type": "object",
    "description": "告警引擎触发工具时注入的入参（argv[2] JSON）",
    "properties": {
      "eventID":        {"type": "string", "description": "告警事件ID"},
      "ruleID":         {"type": "string", "description": "告警规则ID"},
      "ruleName":       {"type": "string", "description": "告警规则名称"},
      "level":          {"type": "string", "description": "告警级别（提醒/次要/重要/紧急）"},
      "targetName":     {"type": "string", "description": "告警目标名称"},
      "productID":      {"type": "string", "description": "产品ID"},
      "deviceName":     {"type": "string", "description": "设备名称（触发设备）"},
      "triggerContent": {"type": "string", "description": "触发内容描述"},
      "triggerValue":   {"type": "string", "description": "触发值"},
      "notification":   {"type": "string", "description": "即将发送的通知正文"},
      "prompt":         {"type": "string", "description": "规则配置的提示内容"},
      "recentAlarms":   {"type": "string", "description": "近期告警信息"}
    },
    "required": ["eventID", "productID"]
  }
}`;

/**
 * 告警 AI 判断工具的出参契约（结构化 JSON）。
 * 创建工具时写入 ai_tools.output_schema：工具 stdout 必须输出的一行 JSON；
 * dmsvr 执行后按 required 做轻校验并落审计（fail-open，不拦截通知）。
 */
export const ALARM_JUDGE_TOOL_OUTPUT_SCHEMA = `{
  "type": "object",
  "description": "工具 stdout 必须输出的一行 JSON",
  "properties": {
    "shouldNotify":  {"type": "boolean", "description": "true=放行通知 false=抑制通知"},
    "recommendText": {"type": "string", "description": "建议/抑制原因文本，用于审计"}
  },
  "required": ["shouldNotify", "recommendText"]
}`;

/**
 * 创建 AI 工具（先建 shell，后续用 AiToolDevPanel 描述生成内容）
 * @param data 创建请求体（name/code/toolType/cloneGroupID 等）
 */
export async function createAiTool(data: {
  name: string;
  code: string;
  toolType?: string;
  description?: string;
  cloneGroupID?: string;
  config?: string;
  inputSchema?: string;
  outputSchema?: string;
}) {
  return await CoreAi.postApiV1AiToolCreate(data);
}

/**
 * 发布 AI 工具（生成内容后调用，保证 tool/run 可运行）
 * @param id 工具 ID
 */
export async function publishAiTool(id: string) {
  return await CoreAi.postApiV1AiToolPublish({ id: Number(id) });
}

/**
 * 初始化告警 AI 工具的项目级会话（things 域 alarm/ai/tool-session）
 * 创建工具成功后调用：为工具绑定项目级告警 clone（persona=告警定制提示词，记忆挂项目 clone），
 * 返回的 cloneID 传给 tool-dev completions，使 AI 判断工具开发会话复用项目级记忆、越用越好用。
 * @param data 初始化参数（工具ID/CloneGroup/规则上下文/项目ID）
 * @returns cloneID 项目级告警 clone ID
 */
export async function alarmAiToolSession(data: {
  /** 工具 ID */
  toolID: number;
  /** 项目级 CloneGroup ID */
  cloneGroupID: number;
  /** 告警规则名称 */
  ruleName: string;
  /** 告警来源/目标摘要（如「电表-全部设备」） */
  sourceLabel: string;
  /** 产品 ID */
  productID: string;
  /** 产品名称 */
  productName: string;
  /** 品类名称 */
  categoryName: string;
  /** 设备范围描述 */
  scopeLabel: string;
  /** 触发条件可读摘要（如「同时满足：Ua的60秒内的最新值>200」），注入 persona 供 AI 理解当前规则配置 */
  triggerCondition?: string;
  /** 评估周期 */
  evalPeriod: string;
  /** 项目 ID */
  projectID: number;
}): Promise<{ cloneID?: number }> {
  return await requestClient.post<{ cloneID?: number }>('/api/v1/things/alarm/ai/tool-session', data);
}

/**
 * 查询租户内 CloneGroup 列表，用于创建工具时归入默认分组
 * @param page 页码
 * @param pageSize 每页大小
 */
export async function getCloneGroupList(page = 1, pageSize = 100) {
  return await CoreAi.postApiV1AiCloneGroupGetList({
    page: { page, pageSize },
  });
}

/**
 * 取告警规则所属项目对应的 CloneGroup（项目创建时自动创建，ThirdID=projectID，与项目同一权限）。
 * @param projectID 当前项目 ID
 * @returns CloneGroupInfo 或 null
 */
export async function getProjectCloneGroup(projectID?: string): Promise<{ id?: number; name?: string; code?: string } | null> {
  try {
    // 优先按项目 ThirdID 定位项目级 CloneGroup（Code=project_<projectID>）
    const resp = await getCloneGroupList(1, 100);
    const list = (resp?.list ?? []) as Array<{
      id?: number;
      name?: string;
      code?: string;
      thirdID?: string;
      isDefault?: string | number;
      status?: string | number;
    }>;
    if (!list.length) return null;
    if (projectID) {
      const projectOne = list.find((item) => String(item.thirdID) === String(projectID));
      if (projectOne) return projectOne;
    }
    // 兜底：没有匹配 / 未传项目时取 isDefault=1 的第一个（default 组 / 用户组）
    const defaultOne = list.find((item) => String(item.isDefault) === '1');
    return defaultOne ?? list[0] ?? null;
  } catch {
    return null;
  }
}
