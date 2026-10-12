import { CoreAi } from '@vben/api';
import { useAccessStore } from '@vben/stores';
import { useSessionStore } from '../../store/session';

export interface TodoItem {
  id: string;
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface TaskUpdateData {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** 完成事件可以只更新状态，不重复发送标题。 */
  label?: string;
}

// 新版的动态任务计划事件（由 todos 工具驱动）
export interface TaskPlanData {
  todos: TodoItem[];
}

// 新版的动态任务更新事件（由 todos 工具驱动）
export interface TaskUpdateEventData {
  todos: TodoItem[];
  metadata?: {
    isNew?: boolean;
    justCompleted?: string[];
    justStarted?: string;
    completed: number;
    total: number;
  };
}

export interface ThinkingData {
  type: 'search' | 'read' | 'decide';
  description: string;
}

/** ToolDevToolEvent 表示工具开发过程中可实时展示的工具调用事件。 */
export interface ToolDevToolEvent {
  arguments?: string;
  isFrontend?: boolean;
  name: string;
  phase: 'execute' | 'result' | 'start';
  result?: string;
  toolCallID: string;
}

/** resolveToolEventPhase 将后端 SSE 类型映射为前端工具调用阶段。 */
function resolveToolEventPhase(type: string): ToolDevToolEvent['phase'] {
  if (type === 'tool_call_start') return 'start';
  if (type === 'tool_call_execute') return 'execute';
  return 'result';
}

export interface FileChangeData {
  action: 'modified' | 'saved';
  filename: string;
  toolName: string;
}

export interface ClarifyData {
  question: string;
  options: string[];
  level: string;
}

export interface ToolDevMessage {
  id: string;
  /** brief：系统任务简报（自动发起的初始化指令不作为用户气泡展示） */
  role: 'user' | 'assistant' | 'brief';
  content: string;
  thinking?: ThinkingData[];
  toolEvents?: ToolDevToolEvent[];
  status?: 'running' | 'waiting' | 'completed' | 'failed';
  isLoading?: boolean;
}

/** 会话历史消息（由 /ai/session/messages 映射而来，用于面板回显，不含流式扩展字段） */
/** brief 消息统一文案：自动发起的初始化指令不在对话里展示原文，仅显示一条系统简报。 */
export const TOOL_DEV_BRIEF_TEXT = '已根据规则上下文自动发起创建任务，AI 正在按预置契约开发。';

/** 判定历史里的 user 消息是否为自动发起的初始化指令（buildInitialToolPrompt 固定开头）。 */
export function isAutoInitialPrompt(text: string): boolean {
  return text.startsWith('请创建一个告警AI判断工具');
}

export interface ToolDevHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/** 工具开发历史响应：包含后端实际命中的会话 ID 与已映射消息。 */
export interface ToolDevHistory {
  sessionID: string;
  messages: ToolDevHistoryMessage[];
}

export interface StreamEvent {
  type: string;
  token?: string;
  content?: string;
}

/** 将 ID 规范为 JSON 数字，后端 int64 字段不接受字符串 */
function normalizeNumberParam(id?: number | string): number | undefined {
  if (id == null || id === '') return undefined;
  const n = typeof id === 'number' ? id : Number(id);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * 拉取工具开发会话历史消息（POST /api/v1/ai/session/messages）
 * 按确定性 sessionID（如 alarm-tooldev-<toolID>）查询后端会话记录，映射为面板可回显的消息列表；
 * 接口失败时抛错，由调用方静默降级为空历史。
 * @param sessionID 首选会话 ID
 * @param toolID 工具 ID；首选会话为空时用于恢复旧随机会话
 * @returns 实际命中的会话 ID 与按对话轮次升序排列的历史消息
 */
export async function fetchToolDevHistory(sessionID: string, toolID?: number): Promise<ToolDevHistory> {
  if (!sessionID) return { sessionID: '', messages: [] };
  const resp = await CoreAi.postApiV1AiSessionMessages({
    page: { page: 1, pageSize: 100 },
    sessionID,
    ...(toolID != null ? { toolID } : {}),
  });
  const list = (resp?.list ?? []) as Array<{ turnIndex?: number; userInput?: string; aiResponse?: string }>;
  const history: ToolDevHistoryMessage[] = [];
  // 每轮会话含用户输入与 AI 回复，依次映射为两条消息；空内容（如中断轮次）跳过
  for (const item of list) {
    if (item.userInput) {
      history.push({ id: `h-${item.turnIndex ?? history.length}-u`, role: 'user', content: item.userInput });
    }
    if (item.aiResponse) {
      history.push({ id: `h-${item.turnIndex ?? history.length}-a`, role: 'assistant', content: item.aiResponse });
    }
  }
  return {
    sessionID: resp?.sessionID || sessionID,
    messages: history,
  };
}

/**
 * 工具开发流式对话（SSE）
 * 复用 /api/v1/ai/user/completions 接口，支持 assistantCode 自动定位助手
 * @param options 请求参数（cloneID 指定项目级 clone 时，AI 记忆挂该 clone 复用）
 * @param callbacks 事件回调
 * @returns sessionID
 */
export async function toolDevStream(
  options: {
    assistantCode?: string;
    sessionID?: string;
    userInput: string;
    toolID?: number | string;
    cloneID?: number | string;
  },
  callbacks: {
    onToken: (token: string) => void;
    onTaskUpdate: (data: TaskUpdateData) => void;
    onTaskPlan: (data: TaskPlanData) => void;
    onTaskUpdateEvent: (data: TaskUpdateEventData) => void;
    onThinking: (data: ThinkingData) => void;
    onToolEvent?: (data: ToolDevToolEvent) => void;
    onFileChange: (data: FileChangeData) => void;
    onClarify: (data: ClarifyData & { toolCallID: string }) => void;
    onArtifactsSaved?: () => void;
    onDone: () => void;
    onError: (err: Error) => void;
  },
): Promise<string> {
  const accessStore = useAccessStore();
  const sessionStore = useSessionStore();
  // 与 axios 拦截器（request.ts）的租户头兜底链对齐：store 租户缺失（如「记住密码」直登
  // 未写租户 cookie）时回退应用级默认租户，避免 SSE 请求缺 tenant-code 被判无权访问应用
  const orgID = sessionStore.tenantCode || ((import.meta.env.VITE_GLOB_TENANT_CODE as string | undefined)?.trim() ?? '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'app-id': import.meta.env.VITE_GLOB_APPID ?? '77',
  };
  if (accessStore.accessToken) {
    headers['token'] = accessStore.accessToken;
  }
  if (orgID) {
    headers['tenant-code'] = orgID;
  }

  const resp = await fetch('/api/v1/ai/tool-dev/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionID: options.sessionID,
      toolID: normalizeNumberParam(options.toolID),
      cloneID: options.cloneID == null ? undefined : String(options.cloneID),
      messages: [{ role: 'user', contents: [{ type: 'text', text: options.userInput }] }],
      stream: true,
    }),
  });

  const contentType = resp.headers.get('content-type') || '';

  // 后端业务错误常返回 HTTP 200 + JSON（非 SSE），需解析后结束 loading
  if (!contentType.includes('text/event-stream')) {
    const text = await resp.text();
    let errMsg = `HTTP ${resp.status}`;
    try {
      const json = JSON.parse(text) as { code?: number; msg?: string };
      if (json.msg) {
        errMsg = json.msg;
      } else if (json.code && json.code !== 200) {
        errMsg = `错误码 ${json.code}`;
      }
    } catch {
      if (text) errMsg = text.slice(0, 300);
    }
    const err = new Error(errMsg);
    callbacks.onError(err);
    throw err;
  }

  if (!resp.body) {
    const err = new Error(`HTTP ${resp.status}: empty body`);
    callbacks.onError(err);
    throw err;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let sessionID = '';
  let streamFinished = false;

  const finishStream = () => {
    if (streamFinished) return;
    streamFinished = true;
    callbacks.onDone();
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.sessionID && !sessionID) {
            sessionID = payload.sessionID;
          }
          if (payload.token) {
            callbacks.onToken(payload.token);
          }
          if (payload.type === 'task_plan' && payload.content) {
            callbacks.onTaskPlan(JSON.parse(payload.content));
          }
          if (payload.type === 'task_update' && payload.content) {
            const data = JSON.parse(payload.content);
            // 兼容旧版固定步骤事件（taskId + status + label）
            if (data.taskId) {
              callbacks.onTaskUpdate(data);
            } else {
              // 新版动态任务事件（todos + metadata）
              callbacks.onTaskUpdateEvent(data);
            }
          }
          if (payload.type === 'thinking' && payload.content) {
            callbacks.onThinking(JSON.parse(payload.content));
          }
          if ((payload.type === 'tool_call_start' || payload.type === 'tool_call_execute' || payload.type === 'tool_call_result') && payload.content) {
            const content = JSON.parse(payload.content);
            callbacks.onToolEvent?.({
              phase: resolveToolEventPhase(payload.type),
              toolCallID: content.toolCallID || '',
              name: content.name || '',
              arguments: payload.type === 'tool_call_start' || payload.type === 'tool_call_execute' ? content.arguments : undefined,
              result: payload.type === 'tool_call_result' ? content.result : undefined,
              isFrontend: content.isFrontend,
            });
          }
          if (payload.type === 'file_change' && payload.content) {
            const fc = JSON.parse(payload.content);
            callbacks.onFileChange(fc);
            // save_artifacts 完成后后端会发送 file_change 事件，此时才是真正保存完毕
            if (fc.toolName === 'save_artifacts' && fc.action === 'saved' && callbacks.onArtifactsSaved) {
              callbacks.onArtifactsSaved();
            }
          }
          if (payload.type === 'tool_call_execute' && payload.content) {
            const content = JSON.parse(payload.content);
            if (content.interactionType === 'clarify' || content.name === 'clarify') {
              let clarify: ClarifyData | undefined;
              try {
                const args = typeof content.arguments === 'string' ? JSON.parse(content.arguments) : content.arguments;
                clarify = {
                  question: args.question || '',
                  options: args.options || [],
                  level: args.level || 'medium',
                };
              } catch {
                /* ignore */
              }
              if (clarify) {
                callbacks.onClarify({ ...clarify, toolCallID: content.toolCallID || '' });
              }
            }
          }
          // 检测 save_artifacts 工具调用，通知外部刷新
          if ((payload.type === 'tool_call_start' || payload.type === 'tool_call_execute') && payload.content) {
            const content = JSON.parse(payload.content);
            if (content.name === 'save_artifacts' && callbacks.onArtifactsSaved) {
              callbacks.onArtifactsSaved();
            }
          }
          if (payload.done) {
            finishStream();
            return sessionID;
          }
        } catch {
          // 跳过无效行
        }
      }
    }
    // 正常流必须以 done 事件收尾；网关超时或上游断流只会关闭连接，不能误报完成。
    if (!streamFinished) {
      throw new Error('AI 生成连接已中断，当前内容尚未保存，请重新发送重试');
    }
  } catch (err) {
    callbacks.onError(err as Error);
    throw err;
  }
  return sessionID;
}

/** 提交 clarify 工具的选择结果 */
export async function resolveClarify(sessionID: string, toolCallID: string, feedback: string): Promise<void> {
  const accessStore = useAccessStore();
  const sessionStore = useSessionStore();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'app-id': import.meta.env.VITE_GLOB_APPID ?? '77',
  };
  if (accessStore.accessToken) {
    headers['token'] = accessStore.accessToken;
  }
  if (sessionStore.tenantCode) {
    headers['tenant-code'] = sessionStore.tenantCode;
  }

  await fetch('/api/v1/ai/chat/tool-result', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionID,
      toolCallID,
      result: feedback,
    }),
  });
}
