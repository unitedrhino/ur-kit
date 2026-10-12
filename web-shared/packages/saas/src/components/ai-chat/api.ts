/** 文件说明：封装共享 AI 对话请求、SSE 事件及媒体上传接口。 */
import type { ChatInteractionResult, InteractionReference, Cell } from './interaction';
import { parseInteractionReference } from './interaction';

import { CoreAi, requestClient } from '@vben/api';
import { useProjectStore } from '@vben/stores';
import { $t } from '@vben/saas/locales';
import { useSessionStore } from '../../store/session';

/** 返回当前页面的明确项目范围，管理应用不继承其他应用的项目 cookie。 */
export function getChatProjectID(path = window.location.hash.replace(/^#/, '') || window.location.pathname) {
  // 项目详情页本身已经给出项目 ID，此时即使没有开启侧边栏项目选择器也必须带上该范围。
  const routeProject = path.match(/^\/iot\/project-manage\/info\/(\d+)(?:\/|$|\?)/)?.[1];
  if (routeProject) return routeProject;
  const project = useProjectStore();
  return project.sidebarSelectorEnabled && project.isProjectScopeEnabled(path) ? project.currentProjectID ?? '' : '';
}

/** 结果请求使用与 SSE 相同的鉴权范围；null 显式禁止注入残留项目。 */
function interactionHeaders() { return { 'project-id': getChatProjectID() || null }; }

export interface ContentPart {
  /** 私有附件长期引用；签名链接不进入持久化消息。 */
  artifactID?: string;
  type: string; // text | image_url | audio | video_url | file
  text?: string;
  imageUrl?: string;
  audioData?: string;
  audioFormat?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileMime?: string;
  fileName?: string;
}

export interface ChatMessage {
  /** 服务端持久化的交互结果引用。 */
  interactionResults?: InteractionReference[];
  role: 'user' | 'assistant' | 'system';
  contents: ContentPart[];
  searchStatus?: string;
  /** 检索候选总数，用于空结果时区分"低于阈值"与"无结果"；旧载荷未携带时缺省。 */
  searchTotal?: number;
  rewrittenQuery?: string;
  matchedDocuments?: KnowledgeSearchDocument[];
  citations?: KnowledgeCitation[];
  expandedCitations?: KnowledgeCitation[];
  answerPolicy?: string;
  confidenceBand?: string;
  toolEvents?: string[];
}

export interface ToolParameter {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters?: Record<string, ToolParameter>;
  available?: string;
  interactionType?: string;
  formSchema?: any;
}

export interface ClarifyData {
  question: string;
  options: string[];
  level: string;
}

/** 结构化工具调用事件(从 tool_call_* SSE 事件解析,供 Tool 组件渲染) */
export interface AiToolEvent {
  /** 事件阶段:开始 / 执行 / 返回 */
  phase: 'start' | 'execute' | 'result';
  toolCallID: string;
  name: string;
  /** 工具入参 JSON 字符串(仅 execute 阶段携带) */
  arguments?: string;
  /** 工具实际返回值；与调用入参独立，空字符串也是有效结果。 */
  result?: string;
  /** 是否前端工具 */
  isFrontend?: boolean;
}

export interface UserCompletionsReq {
  resultContext?: { resultID: string; blockID: string; selection: string };
  sessionID?: string;
  messages: ChatMessage[];
  stream?: boolean;
  outputModalities?: string[];
  currentAppID?: string;
  currentAppName?: string;
  currentRoute?: string;
  assistantCode?: string;
  toolID?: number;
  tools?: ToolDef[];
}

export interface CheckAvailableResp {
  available: boolean;
  reason?: string;
}

export interface ChatCompletionsResp {
  sessionID: string;
  content: string;
  role: string;
  rewrittenQuery?: string;
  matchedDocuments?: KnowledgeSearchDocument[];
  citations?: KnowledgeCitation[];
  expandedCitations?: KnowledgeCitation[];
  answerPolicy?: string;
  confidenceBand?: string;
}

export interface KnowledgeSearchDocument {
  knowledgeID?: number;
  documentID?: number;
  documentName?: string;
  path?: string;
  score?: number;
  snippet?: string;
  chunkCount?: number;
}

export interface KnowledgeCitation {
  knowledgeID?: number;
  documentID?: number;
  artifactID?: number;
  sourceArtifactID?: number;
  documentName?: string;
  path?: string;
  chunkIndex?: number;
  charStart?: number;
  charEnd?: number;
  /** 来源页码（0 基）；证据 chip 打开文档时作为 PDF 定位先验透传。 */
  pageIdx?: number;
  score?: number;
  content?: string;
  snippet?: string;
  sourceType?: string;
  relationType?: string;
  /** 关联补充切片的关系判定依据（关系生成时记录的证据文案）；直接命中为空。 */
  relationEvidence?: string;
  /** 关联补充切片的关系综合分；直接命中缺省，展示时回退 score。 */
  relationScore?: number;
}

/** 检测 AI 对话功能是否可用 */
export async function checkAiAvailable(): Promise<CheckAvailableResp> {
  const sessionStore = useSessionStore();
  return requestClient.post<CheckAvailableResp>(
    '/api/v1/ai/chat/check-available',
    {},
    { headers: { 'tenant-code': sessionStore.tenantCode || '' } },
  );
}

/** 用户 AI 对话（自动查找/创建专属 Clone） */
export async function userAiCompletions(
  data: UserCompletionsReq,
): Promise<ChatCompletionsResp> {
  const sessionStore = useSessionStore();
  return requestClient.post<ChatCompletionsResp>(
    '/api/v1/ai/user/completions',
    data,
    { headers: { 'tenant-code': sessionStore.tenantCode || '' } },
  );
}

/**
 * 用户 AI 流式对话（SSE）
 * @param data 请求体
 * @param onToken 每收到一个 token 调用一次
 * @param onMeta 元数据回调（搜索状态、引用等）
 * @param onToolCallExecute 前端工具执行回调（当 AI 调用前端工具时触发）
 * @param onToolEvent 结构化工具事件回调（tool_call_start/execute/result，供 Tool 组件渲染调用过程）
 * @returns sessionID
 */
export async function userAiCompletionsStream(
  data: UserCompletionsReq,
  onToken: (token: string) => void,
  onMeta?: (payload: {
    answerPolicy?: string;
    citations?: KnowledgeCitation[];
    confidenceBand?: string;
    expandedCitations?: KnowledgeCitation[];
    interactionResults?: InteractionReference[];
    matchedDocuments?: KnowledgeSearchDocument[];
    rewrittenQuery?: string;
    searchStatus?: string;
    /** 检索候选总数；载荷携带时用于空结果区分"低于阈值"与"无结果"。 */
    searchTotal?: number;
    sessionID?: string;
    toolEvents?: string[];
  }) => void,
  onToolCallExecute?: (payload: {
    sessionID: string;
    toolCallID: string;
    name: string;
    arguments: string;
    clarify?: ClarifyData;
  }) => void,
  onToolEvent?: (event: AiToolEvent) => void,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const url = '/api/v1/ai/user/completions';
  // 流式请求也必须经过统一请求拦截器，确保账号、企业和应用范围与列表/历史接口一致。
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const projectID = getChatProjectID();
  if (projectID) headers['project-id'] = projectID;
  let sessionID = '';
  let buf = '';
  let finished = false;
  const toolEvents: string[] = [];

  /** 消费已解码的 SSE 文本分片，网络层可在任意字符位置拆包。 */
  const consumeChunk = (chunk: string, flush = false) => {
    if (finished) return;
    buf += chunk;
    const lines = buf.split('\n');
    buf = flush ? '' : lines.pop() ?? '';
    if (flush && lines.at(-1)) lines.push('');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.sessionID && !sessionID) sessionID = payload.sessionID;
        if (payload.token) onToken(payload.token);
        if (payload.type === 'interaction_result') {
          const ref = parseInteractionReference(JSON.parse(payload.content));
          if (ref && (!sessionID || ref.sessionID === sessionID)) {
            onMeta?.({ sessionID: ref.sessionID, interactionResults: [ref] });
          }
        }
        if (payload.type === 'search_result') {
          onMeta?.({
            sessionID,
            searchStatus: payload.status,
            searchTotal: payload.total,
            rewrittenQuery: payload.rewrittenQuery,
            matchedDocuments: payload.matchedDocuments,
            citations: payload.citations,
            expandedCitations: payload.expandedCitations,
            confidenceBand: payload.confidenceBand,
            toolEvents: toolEvents.length > 0 ? [...toolEvents] : undefined,
          });
        }
        if (payload.type === 'tool_call_start' || payload.type === 'tool_call_execute' || payload.type === 'tool_call_result') {
          const content = payload.content ? JSON.parse(payload.content) : {};
          // 结构化事件同步抛出,供 Tool 组件渲染调用过程
          onToolEvent?.({
            phase:
              payload.type === 'tool_call_start'
                ? 'start'
                : payload.type === 'tool_call_execute'
                  ? 'execute'
                  : 'result',
            toolCallID: content.toolCallID || '',
            name: content.name || '',
            arguments:
              payload.type === 'tool_call_execute'
                ? content.arguments || '{}'
                : undefined,
            result:
              payload.type === 'tool_call_result' && typeof content.result === 'string'
                ? content.result
                : undefined,
            isFrontend: content.isFrontend,
          });
          let eventText = '';
          if (payload.type === 'tool_call_start') {
            eventText = $t('aiChat.ui.callingTool', { name: content.name || $t('aiChat.ui.unknownTool') });
          } else if (payload.type === 'tool_call_execute') {
            eventText = $t('aiChat.ui.executingTool', { name: content.name || $t('aiChat.ui.unknownTool') });
            // 前端工具：触发外部回调
            if (content.isFrontend && onToolCallExecute && sessionID) {
              // 解析 clarify 工具的结构化数据
              let clarify: ClarifyData | undefined;
              if (content.name === 'clarify') {
                try {
                  const args = typeof content.arguments === 'string'
                    ? JSON.parse(content.arguments)
                    : content.arguments;
                  clarify = {
                    question: args.question || '',
                    options: args.options || [],
                    level: args.level || 'medium',
                  };
                } catch { /* ignore */ }
              }
              onToolCallExecute({
                sessionID,
                toolCallID: content.toolCallID || '',
                name: content.name || '',
                arguments: content.arguments || '{}',
                clarify,
              });
            }
          } else if (payload.type === 'tool_call_result') {
            eventText = $t('aiChat.ui.toolReturned', { name: content.name || $t('aiChat.ui.unknownTool') });
          }
          if (eventText) {
            toolEvents.push(eventText);
            onMeta?.({
              sessionID,
              toolEvents: [...toolEvents],
            });
          }
        }
        if (payload.done) {
          onMeta?.({
            sessionID,
            searchStatus: payload.status,
            searchTotal: payload.total,
            rewrittenQuery: payload.rewrittenQuery,
            matchedDocuments: payload.matchedDocuments,
            citations: payload.citations,
            expandedCitations: payload.expandedCitations,
            answerPolicy: payload.answerPolicy,
            confidenceBand: payload.confidenceBand,
            toolEvents: toolEvents.length > 0 ? [...toolEvents] : undefined,
          });
          finished = true;
          return;
        }
      } catch {
        // 跳过无效行
      }
    }
  };

  await requestClient.postSSE(
    url,
    { ...data, stream: true },
    {
      headers,
      signal: options?.signal,
      onMessage: (chunk) => consumeChunk(chunk),
      onEnd: () => consumeChunk('\n', true),
    },
  );
  return sessionID;
}

/** 提交 clarify 工具的选择结果，恢复 SSE 流式对话 */
export async function resolveClarify(
  sessionID: string,
  toolCallID: string,
  selectedOption: string,
): Promise<void> {
  // 与普通工具使用同一权限上下文，失败时由消息面板恢复可选状态。
  const response = await submitChatToolResult(sessionID, toolCallID, selectedOption);
  if (response.status !== 'accepted') throw new Error($t('aiChat.ui.confirmationExpired'));
}

/** 文件上传 */
export async function uploadFile(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  return requestClient.upload('/api/v1/system/common/upload-file', {
    file,
  });
}

/** 判断对象 URI 是否适合浏览器内联预览（图片/PDF），其余类型走附件下载。 */
export function isInlinePreviewableFile(fileUri: string): boolean {
  return /\.(?:png|jpe?g|gif|webp|bmp|svg|pdf)$/i.test(fileUri);
}

/**
 * 经 file-proxy 登录态代理拉取本站对象存储公开桶/临时桶文件字节。
 * AI 生成文件交付约定：沙箱把生成文件上传临时桶后，在回复中以 markdown 链接给出
 * `/oss/<bucket>/<key>` 形式的 fileUri；代理由服务端校验桶范围，禁止任意外部 URL。
 */
export async function fetchChatOssFileBlob(fileUri: string): Promise<Blob> {
  return requestClient.download(`/api/v1/system/common/file-proxy?url=${encodeURIComponent(fileUri)}`);
}

/** 查询结果预览；每次加载都由服务端重新核对当前范围。 */
export function getInteractionResult(resultID: string) {
  // OpenAPI 的动态对象在服务端按 v1 校验；展示组件还会核对版本和结果 ID。
  return CoreAi.postApiV1AiChatResultGetOne({ resultID }, { headers: interactionHeaders() }) as unknown as Promise<{ result: ChatInteractionResult }>;
}

/** 表格分页、排序与指标定位均读取同一不可变快照。 */
export function getInteractionRows(resultID: string, datasetID: string, page = 1, sortField = '', sortDirection = '', pageSize = 20) {
  return CoreAi.postApiV1AiChatResultRows({ resultID, datasetID, page: { page, pageSize }, sortField, sortDirection }, { headers: interactionHeaders() }) as Promise<{ rows: Record<string, Cell>[]; total: number }>;
}

/** 读取图表的有限序列，保留采样提示。 */
export function getInteractionSeries(resultID: string, blockID: string) {
  return CoreAi.postApiV1AiChatResultSeries({ resultID, blockID }, { headers: interactionHeaders() }) as Promise<{ rows: Record<string, Cell>[]; sampled: boolean; originalRowCount: number }>;
}

/** 已完成轮次只包含原始文字、附件 ID 和助手回复。 */
export interface InteractionHistoryTurn { turnIndex: number; userContents: ContentPart[]; aiResponse: string }

/** 同时分页恢复消息与结果，两类记录分别计算总数。 */
export async function getInteractionHistory(sessionID: string, signal?: AbortSignal) {
  const results: InteractionReference[] = [];
  const turns: InteractionHistoryTurn[] = [];
  let page = 1;
  for (;;) {
    const response = await CoreAi.postApiV1AiChatResultHistory({ sessionID, page: { page, pageSize: 100 } }, { headers: interactionHeaders(), signal }) as { results: InteractionReference[]; total: number; turns?: InteractionHistoryTurn[]; turnTotal?: number };
    results.push(...response.results);
    turns.push(...(response.turns ?? []));
    const resultsDone = response.results.length === 0 || results.length >= response.total;
    const turnsDone = !response.turns?.length || turns.length >= (response.turnTotal ?? 0);
    if (resultsDone && turnsDone) return { results, turns };
    page++;
  }
}

/** 附件元数据不含内部路径或凭据。 */
export interface ChatAttachmentInfo {
  artifactID: string; name: string; mime: string; kind: 'image' | 'video' | 'file';
  size: number; status: 'uploading' | 'ready' | 'failed' | 'expired'; sessionID: string; expiresAt: string;
}

/** 上传原件到当前账号的私有附件草稿，失败不会生成可发送内容。 */
export async function uploadChatAttachment(file: File, requestID: string, signal?: AbortSignal): Promise<ChatAttachmentInfo> {
  const response = await CoreAi.postApiV1AiChatAttachmentUpload({ file, requestID }, {
    signal, headers: { ...interactionHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  if (!response?.artifactID || response.status !== 'ready') throw new Error($t('aiChat.ui.attachmentRegistrationFailed'));
  return response as ChatAttachmentInfo;
}

/** 每次展示重新校验附件当前权限与有效期。 */
export function getChatAttachment(artifactID: string) {
  return CoreAi.postApiV1AiChatAttachmentGetOne({ artifactID }, { headers: interactionHeaders() }) as Promise<ChatAttachmentInfo>;
}

/** 下载或媒体重试时重新签发链接，不能持久化签名地址。 */
export function getChatAttachmentDownload(artifactID: string) {
  return CoreAi.postApiV1AiChatAttachmentDownload({ artifactID }, { headers: interactionHeaders() }) as Promise<{ url: string; expiresAt: string }>;
}

/** 导出任务关联同一结果快照，附件登记完成前不会有可下载文件。 */
export interface ChatExportInfo {
  taskID: string; resultID: string; format: 'xlsx' | 'pdf';
  status: 'pending' | 'generating' | 'uploading' | 'success' | 'failed';
  artifactID: string; errorCode: string;
}
/** 幂等创建导出，生成入口由服务端固定。 */
export function createChatExport(resultID: string, format: 'xlsx' | 'pdf', requestID: string) {
  return CoreAi.postApiV1AiChatExportCreate({ resultID, format, requestID }, { headers: interactionHeaders() }) as Promise<ChatExportInfo>;
}
/** 恢复结果对应的最近导出任务，避免刷新后丢失文件卡片。 */
export function getChatExports(resultID: string) {
  return CoreAi.postApiV1AiChatExportGetList({ resultID }, { headers: interactionHeaders() }) as Promise<{ list: ChatExportInfo[] }>;
}
/** 失败重试沿用任务 ID，服务端重新鉴权原始快照。 */
export function retryChatExport(taskID: string) {
  return CoreAi.postApiV1AiChatExportRetry({ taskID }, { headers: interactionHeaders() }) as Promise<ChatExportInfo>;
}

/** 回传当前会话的真实业务工具结果，服务端再次核验会话归属。 */
export function submitChatToolResult(sessionID: string, toolCallID: string, result: string, error = '', signal?: AbortSignal) {
  return CoreAi.postApiV1AiChatToolResult({ sessionID, toolCallID, result, error }, { headers: interactionHeaders(), signal }) as Promise<{ status: string }>;
}

/** ChatSessionItem 是当前范围会话列表的最小展示信息。 */
export interface ChatSessionItem {
  sessionID: string;
  title?: string;
  lastActiveAt: number;
  status: number | string;
  /** 完成标记独立于设备生命周期。 */
  completionState?: 'inProgress' | 'completed';
  parentSessionID?: string;
  parentTurnIndex?: number;
  turnCount?: number;
}
/** getChatSessions 始终从服务端发现历史，不能由本地缓存推断账号是否有会话。 */
export function getChatSessions(page = 1, signal?: AbortSignal, completionState?: 'inProgress' | 'completed') {
  return CoreAi.postApiV1AiSessionWorkspaceGetList({ completionState, page: { page, pageSize: 20 } }, { headers: interactionHeaders(), signal }) as Promise<{ list: ChatSessionItem[]; total: number }>;
}

/** updateChatSession 只更新整理信息，不结束或重新打开设备连接。 */
export function updateChatSession(sessionID: string, changes: { title?: string; completionState?: 'inProgress' | 'completed' }, signal?: AbortSignal) {
  return CoreAi.postApiV1AiSessionWorkspaceUpdate({ sessionID, ...changes }, { headers: interactionHeaders(), signal }) as Promise<ChatSessionItem>;
}
/** forkChatSession 以幂等请求创建独立分支，原会话保持不变。 */
export function forkChatSession(sessionID: string, requestID: string, signal?: AbortSignal) {
  return CoreAi.postApiV1AiSessionWorkspaceFork({ sessionID, requestID }, { headers: interactionHeaders(), signal }) as Promise<ChatSessionItem>;
}
/** getChatSession 读取来源元数据，不修改最近交互时间。 */
export async function getChatSession(sessionID: string, signal?: AbortSignal) {
  const response = await CoreAi.postApiV1AiSessionWorkspaceGetOne({ sessionID, page: { page: 1, pageSize: 1 } }, { headers: interactionHeaders(), signal });
  return response.session as ChatSessionItem;
}
