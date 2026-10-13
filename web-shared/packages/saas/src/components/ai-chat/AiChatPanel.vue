<!-- 文件说明：共享对话状态、结果引用恢复及按登录范围隔离的流式请求生命周期。 -->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import type { AiToolEvent, ChatSessionItem, ClarifyData, ContentPart, KnowledgeCitation, KnowledgeSearchDocument, ToolDef } from './api';
import type { InteractionReference, ResultFollowUp } from './interaction';

import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { VbenIcon, VbenIconButton } from '@vben-core/shadcn-ui';

import { useSessionStore } from '../../store/session';
import AiChatInput from './AiChatInput.vue';
import AiChatMessages from './AiChatMessages.vue';
import {
  fetchChatOssFileBlob,
  forkChatSession,
  getChatProjectID,
  getChatSession,
  getChatSessions,
  getInteractionHistory,
  isInlinePreviewableFile,
  resolveClarify,
  submitChatToolResult,
  updateChatSession,
  userAiCompletionsStream,
} from './api';
import { aiBusinessToolsKey, sharedChatTools } from './business-tools';

interface DisplayMessage {
  answerPolicy?: string;
  citations?: KnowledgeCitation[];
  clarify?: ClarifyData & { resolvedOption?: string; sessionID: string; toolCallID: string };
  confidenceBand?: string;
  contents: ContentPart[];
  expandedCitations?: KnowledgeCitation[];
  id: string;
  interactionResults?: InteractionReference[];
  isLoading?: boolean;
  matchedDocuments?: KnowledgeSearchDocument[];
  rewrittenQuery?: string;
  role: 'assistant' | 'system' | 'user';
  searchStatus?: string;
  /** 检索候选总数，空结果时区分"低于阈值"与"无结果"。 */
  searchTotal?: number;
  /** 用户主动停止，仅作为界面状态，不拼入模型正文。 */
  stopped?: boolean;
  /** 结构化工具事件(供 Tool 组件渲染调用过程) */
  toolEventList?: AiToolEvent[];
  toolEvents?: string[];
  /** 服务端轮次用于关联历史结果。 */
  turnIndex?: number;
}

defineOptions({ name: 'AiChatPanel' });

/** workspace 仅通用入口开启历史栏；工具编辑面板保留自己的会话。 */
const props = defineProps<{
  assistantCode?: string;
  currentAppID?: string;
  currentAppName?: string;
  currentRoute?: string;
  open?: boolean;
  sessionKey?: string;
  toolID?: number;
  tools?: ToolDef[];
  workspace?: boolean;
}>();

const emit = defineEmits<{
  artifactsSaved: [];
  close: [];
  toolCallExecute: [payload: { arguments: string; name: string; sessionID: string; toolCallID: string }];
}>();

/** 业务工具来自应用注入，模型不能新增执行器或任意代码。 */
const businessTools = inject(aiBusinessToolsKey, []);
/** executableTools 让应用工具优先覆盖同名共享工具，并为所有应用提供通用图表能力。 */
const executableTools = computed(() => {
  const applicationNames = new Set(businessTools.map((item) => item.definition.name));
  return [...businessTools, ...sharedChatTools.filter((item) => !applicationNames.has(item.definition.name))];
});
const availableTools = computed(() => [...executableTools.value.map((item) => item.definition), ...(props.tools ?? [])]);
const sessionStore = useSessionStore();
const route = useRoute();
const userStore = useUserStore();
/** 旧缓存没有用户标识，不再跨账号恢复。只保存消息与引用，不保存结果快照。 */
const STORAGE_KEY = computed(
  () =>
    `ai_chat_v2_${JSON.stringify([
      userStore.userInfo?.userID ?? userStore.userInfo?.userId ?? '',
      props.currentAppID ?? import.meta.env.VITE_GLOB_APPID ?? '',
      sessionStore.tenantCode,
      getChatProjectID(route.path),
      props.sessionKey ?? '',
      props.assistantCode ?? '',
      userStore.userRoles,
    ])}`,
);
/** 请求代次隔离迟到的 SSE 和查询响应。 */
let generation = 0;
let controller: AbortController | undefined;
/** 历史分页请求也在会话或身份切换时真正取消。 */
let historyController: AbortController | undefined;

/** 获取有效的 toolID：优先使用 props，否则从路由参数读取 */
const effectiveToolID = computed(() => {
  if (props.toolID != null && !Number.isNaN(props.toolID)) {
    return props.toolID;
  }
  if (props.workspace) return undefined;
  const routeId = Number(route.params.id);
  if (!Number.isNaN(routeId) && routeId > 0) {
    return routeId;
  }
  return undefined;
});

const messages = ref<DisplayMessage[]>([]);
const currentSessionID = ref('');
const sending = ref(false);
const inputRef = ref<InstanceType<typeof AiChatInput>>();
/** 来源轮次定位限制在本工作区，避免操作其他聊天组件。 */
const messageRegion = ref<HTMLElement>();

function loadSession() {
  stopGeneration();

  try {
    const saved = localStorage.getItem(STORAGE_KEY.value);
    if (saved) {
      const { msgs, sid } = JSON.parse(saved);
      messages.value = Array.isArray(msgs) ? msgs.filter((m: DisplayMessage) => !m.isLoading) : [];
      currentSessionID.value = sid || '';
    } else {
      messages.value = [];
      currentSessionID.value = '';
    }
  } catch {
    messages.value = [];
    currentSessionID.value = '';
  }
}

/** restoreResults 在缓存引用之外恢复断线期间已保存的结果。 */
async function restoreResults(recoverMessages = false, strict = false) {
  const current = generation;
  const sid = currentSessionID.value;
  if (!sid) return;
  try {
    historyController?.abort();
    historyController = new AbortController();
    const { results, turns } = await getInteractionHistory(sid, historyController.signal);
    if (current !== generation) return;
    if (recoverMessages && turns) {
      messages.value = turns.flatMap((turn) => [
        { id: `turn-${turn.turnIndex}-user`, turnIndex: turn.turnIndex, role: 'user' as const, contents: turn.userContents },
        { id: `turn-${turn.turnIndex}-assistant`, turnIndex: turn.turnIndex, role: 'assistant' as const, contents: [{ type: 'text', text: turn.aiResponse }] },
      ]);
    }
    const known = new Set(messages.value.flatMap((message) => message.interactionResults?.map((result) => result.resultID) ?? []));
    for (const result of results) {
      if (known.has(result.resultID)) continue;
      const existing = messages.value.find(
        (message) => message.id === result.messageID || (message.role === 'assistant' && message.turnIndex === result.turnIndex),
      );
      if (existing) existing.interactionResults = [...(existing.interactionResults ?? []), result];
      else messages.value.push({ id: result.messageID, role: 'assistant', contents: [], interactionResults: [result] });
      known.add(result.resultID);
    }
  } catch (error) {
    if (strict) throw error; /* 专用工具面板兼容旧文本链路。 */
  }
}

/** 列表、消息和 SSE 使用独立代次，切换身份立即废弃旧响应。 */
const sessions = ref<ChatSessionItem[]>([]);
const listLoading = ref(false);
const listError = ref('');
const historyLoading = ref(false);
const historyError = ref('');
const totalSessions = ref(0);
const listPage = ref(0);
const mobileSessions = ref(false);
const hasDraft = ref(false);
const inputKey = ref(0);
const sessionStatus = ref(1);
/** 整理状态与生命周期分别保存，分页切换不能丢失当前会话元数据。 */
const currentSession = ref<ChatSessionItem>();
const sessionFilter = ref<'completed' | 'inProgress' | undefined>('inProgress');
const actionBusy = ref(false);
const actionError = ref('');
const actionNotice = ref('');
const renameSessionID = ref('');
const renameTitle = ref('');
const referencedSession = ref<ChatSessionItem>();
let actionController: AbortController | undefined;
/** 失败重试沿用同一个分支请求 ID，避免网络超时后重复创建。 */
const forkRequestIDs = new Map<string, string>();
const readOnly = computed(() => sessionStatus.value !== 1 || currentSession.value?.completionState === 'completed');
const currentTitle = computed(() => currentSession.value?.title || (currentSessionID.value ? $t('aiChat.ui.untitledConversation') : $t('aiChat.ui.newConversation')));
let listGeneration = 0;
let listController: AbortController | undefined;

/** stopGeneration 保留已生成内容，代次先失效再取消网络，防止迟到 token 继续写入。 */
function stopGeneration() {
  generation++;
  historyController?.abort();
  controller?.abort();
  sending.value = false;
  messages.value = messages.value.map((message) => ({ ...message, stopped: message.isLoading ? true : message.stopped, isLoading: false }));
}
/** allowSwitch 避免运行中切换及静默丢弃未发送的附件和文字。 */
function allowSwitch() {
  if (sending.value || actionBusy.value) return false;
  return (!hasDraft.value && !referencedSession.value) || window.confirm($t('aiChat.ui.thereIsCurrentlyUnsentContentSwitchingSessionsWi'));
}
/** selectSession 仅恢复历史，不改变服务端的最近交互时间。 */
async function selectSession(item: ChatSessionItem, force = false) {
  if (!force && !allowSwitch()) return;
  stopGeneration();
  messages.value = [];
  followUp.value = undefined;
  referencedSession.value = undefined;
  currentSessionID.value = item.sessionID;
  currentSession.value = item;
  sessionStatus.value = Number(item.status);
  hasDraft.value = false;
  inputKey.value++;
  mobileSessions.value = false;
  historyLoading.value = true;
  historyError.value = '';
  const current = generation;
  try {
    await restoreResults(true, true);
  } catch (error) {
    if (current === generation) historyError.value = error instanceof Error ? error.message : $t('aiChat.ui.messageRecoveryFailedPleaseTryAgain');
  } finally {
    if (current === generation) historyLoading.value = false;
  }
}
/** refreshSessions 每次打开查询第一页；草稿、引用或生成存在时保持当前工作。 */
async function refreshSessions(restoreLatest = false, more = false) {
  if (!props.workspace) return;
  const current = ++listGeneration;
  const scopeKey = STORAGE_KEY.value;
  const workspaceGeneration = generation;
  listController?.abort();
  listController = new AbortController();
  listLoading.value = true;
  listError.value = '';
  const page = more ? listPage.value + 1 : 1;
  try {
    // 打开时先发现全部范围的最新记录，避免旧结束会话被默认分类隐藏。
    const mayRestore = restoreLatest && !actionBusy.value && !hasDraft.value && !sending.value && !followUp.value && !referencedSession.value;
    let response = await getChatSessions(page, listController.signal, mayRestore ? undefined : sessionFilter.value);
    if (current !== listGeneration || scopeKey !== STORAGE_KEY.value) return;
    const latest = mayRestore ? response.list[0] : undefined;
    if (mayRestore && workspaceGeneration === generation && !hasDraft.value && !sending.value && !followUp.value && !referencedSession.value) {
      sessionFilter.value = latest && Number(latest.status) === 1 ? (latest.completionState === 'completed' ? 'completed' : 'inProgress') : undefined;
      if (sessionFilter.value) response = await getChatSessions(1, listController.signal, sessionFilter.value);
    } else if (mayRestore && sessionFilter.value) {
      // 查询期间输入了草稿时只刷新原分类，不覆盖右侧工作。
      response = await getChatSessions(1, listController.signal, sessionFilter.value);
    }
    if (current !== listGeneration || scopeKey !== STORAGE_KEY.value) return;
    sessions.value = more ? [...sessions.value, ...response.list] : response.list;
    totalSessions.value = response.total;
    listPage.value = page;
    const selected = sessions.value.find((item) => item.sessionID === currentSessionID.value);
    if (selected) {
      currentSession.value = selected;
      sessionStatus.value = Number(selected.status);
    }
    if (
      restoreLatest &&
      !actionBusy.value &&
      workspaceGeneration === generation &&
      !hasDraft.value &&
      !sending.value &&
      !followUp.value &&
      !referencedSession.value
    ) {
      if (latest) await selectSession(latest, true);
      else {
        messages.value = [];
        currentSessionID.value = '';
        currentSession.value = undefined;
        sessionStatus.value = 1;
        historyError.value = '';
      }
    }
  } catch (error) {
    if (current === listGeneration) listError.value = error instanceof Error ? error.message : $t('aiChat.ui.sessionListLoadingFailed');
  } finally {
    if (current === listGeneration) {
      listLoading.value = false;
      if (restoreLatest && props.open) void nextTick(() => inputRef.value?.focus());
    }
  }
}
/** changeFilter 仅筛选列表，当前对话及草稿仍留在右栏。 */
async function changeFilter(filter: typeof sessionFilter.value) {
  if (sending.value || actionBusy.value) return;
  sessionFilter.value = filter;
  renameSessionID.value = '';
  await refreshSessions();
}
/** sessionLabel 区分用户完成标记与旧设备生命周期状态。 */
function sessionLabel(item: ChatSessionItem) {
  return Number(item.status) === 2 ? $t('aiChat.ui.ended') : Number(item.status) === 3 ? $t('aiChat.ui.archived') : item.completionState === 'completed' ? $t('aiChat.ui.completed') : $t('aiChat.ui.inProgress');
}
/** runSessionAction 将操作响应隔离在当前身份，并展示可重试的错误。 */
async function runSessionAction(action: (signal: AbortSignal) => Promise<void>) {
  if (sending.value || actionBusy.value) return;
  const scope = STORAGE_KEY.value;
  actionController?.abort();
  const request = new AbortController();
  actionController = request;
  actionBusy.value = true;
  actionError.value = '';
  actionNotice.value = '';
  try {
    await action(request.signal);
  } catch (error) {
    if (scope === STORAGE_KEY.value && !request.signal.aborted) actionError.value = error instanceof Error ? error.message : $t('aiChat.ui.operationFailedPleaseTryAgain');
  } finally {
    if (scope === STORAGE_KEY.value && actionController === request) actionBusy.value = false;
  }
}
/** saveSession 刷新当前分类；选中记录移出筛选时仍保留右栏，便于恢复或分支。 */
async function saveSession(item: ChatSessionItem, changes: { completionState?: 'completed' | 'inProgress'; title?: string }) {
  if (
    item.sessionID === currentSessionID.value &&
    changes.completionState === 'completed' &&
    (hasDraft.value || referencedSession.value) &&
    !window.confirm($t('aiChat.ui.thereIsCurrentlyUnsentContentAndTheDraftWillBeCl'))
  )
    return;
  await runSessionAction(async (signal) => {
    const updated = await updateChatSession(item.sessionID, changes, signal);
    if (signal.aborted) return;
    if (currentSessionID.value === updated.sessionID) {
      currentSession.value = updated;
      if (updated.completionState === 'completed') {
        hasDraft.value = false;
        referencedSession.value = undefined;
        followUp.value = undefined;
        inputKey.value++;
      }
    }
    renameSessionID.value = '';
    await refreshSessions();
  });
}
/** startRename 使用可键盘操作的内联表单，避免阻塞浏览器原生提示。 */
function startRename(item: ChatSessionItem) {
  renameSessionID.value = item.sessionID;
  renameTitle.value = item.title || '';
}
/** createFork 只加载新分支自身消息，来源历史通过独立链接访问。 */
async function createFork(item: ChatSessionItem) {
  if (!allowSwitch()) return;
  await runSessionAction(async (signal) => {
    let requestID = forkRequestIDs.get(item.sessionID);
    if (!requestID) {
      requestID = globalThis.crypto?.randomUUID?.() || `fork-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      forkRequestIDs.set(item.sessionID, requestID);
    }
    const fork = await forkChatSession(item.sessionID, requestID, signal);
    if (signal.aborted) return;
    forkRequestIDs.delete(item.sessionID);
    sessionFilter.value = 'inProgress';
    await refreshSessions();
    if (!signal.aborted) await selectSession(fork, true);
  });
}
/** openSource 从服务端鉴权查找来源，不要求它已在当前列表分页中出现。 */
async function openSource(sessionID: string, turnIndex?: number) {
  if (!allowSwitch()) return;
  await runSessionAction(async (signal) => {
    const source = await getChatSession(sessionID, signal);
    if (!signal.aborted) {
      await selectSession(source, true);
      await nextTick();
      if (!signal.aborted && turnIndex && Number.isSafeInteger(turnIndex)) {
        messageRegion.value?.querySelector(`[data-turn-index="${turnIndex}"]`)?.scrollIntoView?.({ block: 'center' });
      }
    }
  });
}
/** 对话区文本中 /oss/ 对象引用的匹配规则：兼容沙箱内绝对地址前缀与裸相对路径。 */
const OSS_FILE_TEXT_RE = /(?:https?:\/\/[^\s"'<>]+)?(\/oss\/temporary\/[^\s"'<>，。；）]+)/g;
let ossFileTextObserver: MutationObserver | null = null;
let ossFileTextDecorateScheduled = false;

/** scheduleOssFileTextDecorate 去抖触发装饰，避免流式渲染高频 mutation 下的重复扫描。 */
function scheduleOssFileTextDecorate() {
  if (ossFileTextDecorateScheduled) return;
  ossFileTextDecorateScheduled = true;
  queueMicrotask(() => {
    ossFileTextDecorateScheduled = false;
    if (messageRegion.value) decorateOssFileText(messageRegion.value);
  });
}

/** decorateOssFileText 把文本节点中的 /oss/ 对象引用替换为文件卡片链接（点击复用 followSessionLink 拦截）。 */
function decorateOssFileText(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hitsByNode = new Map<Text, { end: number; fileUri: string; start: number }[]>();
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = node.textContent || '';
    OSS_FILE_TEXT_RE.lastIndex = 0;
    let match: null | RegExpExecArray;
    while ((match = OSS_FILE_TEXT_RE.exec(text)) !== null) {
      const list = hitsByNode.get(node) ?? [];
      list.push({ start: match.index, end: match.index + match[0].length, fileUri: match[1] ?? '' });
      hitsByNode.set(node, list);
    }
  }
  hitsByNode.forEach((hits, node) => {
    hits.sort((x, y) => y.start - x.start); // 从后往前替换，避免偏移失效
    for (const hit of hits) {
      const text = node.textContent || '';
      const anchor = document.createElement('a');
      anchor.href = hit.fileUri;
      anchor.textContent = hit.fileUri.split('/').pop() || hit.fileUri;
      node.textContent = text.slice(0, hit.start);
      node.after(anchor, document.createTextNode(text.slice(hit.end)));
    }
  });
}

/** openOssFileLink 处理 AI 回复中的 /oss/ 对象链接：经 file-proxy 登录态代理拉取字节后按类型预览或下载。 */
async function openOssFileLink(fileUri: string, fileName: string) {
  actionError.value = '';
  try {
    const blob = await fetchChatOssFileBlob(fileUri);
    const objectUrl = URL.createObjectURL(blob);
    if (isInlinePreviewableFile(fileUri)) {
      // 图片/PDF 新标签内联预览；该标签需持有 objectURL 渲染，延迟回收避免截断加载。
      window.open(objectUrl, '_blank', 'noopener');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName || fileUri.split('/').pop() || 'file';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    actionError.value = '文件获取失败，请稍后重试';
  }
}

/** followSessionLink 将模型返回的站内片段或其常见绝对链接改写映射为鉴权后的历史导航。 */
function followSessionLink(event: MouseEvent) {
  const anchor = (event.target as HTMLElement)?.closest('a');
  // AI 生成文件交付约定：沙箱上传临时桶后以 markdown 链接给出 /oss/ 开头的 fileUri，
  // 拦截默认跳转（裸链无登录态必然失败），统一经 file-proxy 预览或下载。
  // 渲染器对含中文等字符的链接可能不生成 href（只渲染文字），此时回退用链接文字作为 fileUri；
  // AI 也可能贴出沙箱内视角的绝对地址（如 http://allinone:7777/oss/...），按 pathname 归一化拦截。
  const rawHref = anchor?.getAttribute('href');
  let fileHref = '';
  if (rawHref) {
    try {
      const target = new URL(rawHref, window.location.href);
      // pathname 可能含 URL 编码（AI 贴的链接常带中文编码），还原为原始对象键
      if (target.pathname.startsWith('/oss/')) fileHref = decodeURIComponent(target.pathname);
    } catch {
      // 非法 URL 视作非文件链接，交给后续会话分支处理
    }
  }
  if (!fileHref) {
    const text = anchor?.textContent?.trim();
    if (text?.startsWith('/oss/')) fileHref = text;
  }
  if (anchor && fileHref) {
    event.preventDefault();
    void openOssFileLink(fileHref, anchor.textContent?.trim() || '');
    return;
  }

  // stream-markdown 对纯 hash 链接可能只渲染文字而暂不生成 href，仍应把受控的会话引用交给本地鉴权导航。
  const href = anchor?.getAttribute('href') || anchor?.textContent?.trim();
  if (!href) return;
  let parameters: URLSearchParams;
  if (href.startsWith('#ai-session=')) parameters = new URLSearchParams(href.slice(1));
  else {
    try {
      const target = new URL(href, window.location.href);
      const rewritten = target.href.match(/(?:^|[/?#&])ai-session=([^&#?]+)/);
      if (rewritten)
        parameters = new URLSearchParams(
          `ai-session=${rewritten[1]}&turn=${target.searchParams.get('turn') || target.href.match(/[?&]turn=(\d+)/)?.[1] || ''}`,
        );
      else {
        if (!target.pathname.endsWith('/chat/ai-session')) return;
        parameters = target.searchParams;
      }
    } catch {
      return;
    }
  }
  const sessionID = parameters.get('ai-session') || parameters.get('sessionID');
  if (!sessionID) return;
  event.preventDefault();
  void openSource(sessionID, Number(parameters.get('turn')) || undefined);
}
/** referenceSession 仅为下一轮增加显式用户引用，不伪造来源会话的历史消息。 */
function referenceSession(item: ChatSessionItem) {
  if (sending.value || actionBusy.value || readOnly.value) return;
  referencedSession.value = item;
  mobileSessions.value = false;
  void nextTick(() => inputRef.value?.focus());
}
/** copySessionID 兼容测试环境 HTTP；浏览器禁止复制时保留清晰错误反馈。 */
async function copySessionID(sessionID: string) {
  actionError.value = '';
  actionNotice.value = '';
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(sessionID);
    else {
      const input = document.createElement('textarea');
      input.value = sessionID;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      const active = document.activeElement as HTMLElement | null;
      document.body.append(input);
      try {
        input.select();
        if (!document.execCommand('copy')) throw new Error($t('aiChat.ui.theBrowserDoesNotAllowCopyingPleaseTryAgain'));
      } finally {
        input.remove();
        active?.focus();
      }
    }
    actionNotice.value = $t('aiChat.ui.sessionIdCopied');
  } catch {
    actionError.value = $t('aiChat.ui.copyingFailedPleaseCheckTheBrowserClipboardPermi');
  }
}
/** sessionTime 使用用户本地时间显示最后真实交互，不以读取时间排序。 */
function sessionTime(value: number) {
  return new Date(value * 1000).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

onMounted(() => {
  if (props.workspace) {
    if (props.open) void refreshSessions(true);
  } else {
    loadSession();
    void restoreResults(true);
  }
  // AI 生成文件交付兜底：模型回复中文件链接的表达形式不稳定（markdown 链接/沙箱内绝对地址纯文本），
  // 流式渲染后扫描文本节点，把 /oss/ 对象引用统一转为文件卡片链接（点击由 followSessionLink 拦截走 file-proxy）
  if (messageRegion.value) {
    ossFileTextObserver = new MutationObserver(scheduleOssFileTextDecorate);
    ossFileTextObserver.observe(messageRegion.value, { childList: true, subtree: true });
    decorateOssFileText(messageRegion.value);
  }
});
watch(
  () => props.open,
  (open) => {
    if (open) void refreshSessions(true);
  },
);
onBeforeUnmount(() => {
  ossFileTextObserver?.disconnect();
  actionController?.abort();
  historyController?.abort();
  controller?.abort();
  listController?.abort();
  generation++;
  listGeneration++;
});
watch(
  STORAGE_KEY,
  () => {
    stopGeneration();
    listController?.abort();
    listGeneration++;
    actionController?.abort();
    actionBusy.value = false;
    actionError.value = '';
    actionNotice.value = '';
    renameSessionID.value = '';
    referencedSession.value = undefined;
    currentSession.value = undefined;
    forkRequestIDs.clear();
    sessionFilter.value = 'inProgress';
    sessions.value = [];
    totalSessions.value = 0;
    listPage.value = 0;
    listLoading.value = false;
    messages.value = [];
    currentSessionID.value = '';
    followUp.value = undefined;
    hasDraft.value = false;
    inputKey.value++;
    historyLoading.value = false;
    historyError.value = '';
    listError.value = '';
    sessionStatus.value = 1;
    if (props.workspace) {
      if (props.open) void refreshSessions(true);
    } else {
      loadSession();
      void restoreResults(true);
    }
  },
  { flush: 'sync' },
);

// 持久化到 localStorage
watch(
  [messages, currentSessionID],
  ([msgs, sid]) => {
    try {
      localStorage.setItem(STORAGE_KEY.value, JSON.stringify({ msgs, sid }));
    } catch {
      // 存储失败（如隐私模式）时忽略
    }
  },
  { deep: true },
);

function handleNewSession() {
  if (!allowSwitch()) return;
  sessionStatus.value = 1;
  currentSession.value = undefined;
  referencedSession.value = undefined;
  historyError.value = '';
  historyLoading.value = false;
  hasDraft.value = false;
  inputKey.value++;
  mobileSessions.value = false;
  followUp.value = undefined;
  stopGeneration();
  messages.value = [];
  currentSessionID.value = '';
  localStorage.removeItem(STORAGE_KEY.value);
  void nextTick(() => inputRef.value?.focus());
}

async function handleClarifySelect(msg: DisplayMessage, option: string) {
  if (!msg.clarify || msg.clarify.resolvedOption) return;
  const clarify = msg.clarify;
  const current = generation;
  // 乐观更新：标记已选择
  const idx = messages.value.findIndex((m) => m.id === msg.id);
  if (idx !== -1) {
    messages.value[idx] = {
      ...messages.value[idx]!,
      clarify: { ...clarify, resolvedOption: option },
    };
  }
  try {
    await resolveClarify(clarify.sessionID, clarify.toolCallID, option);
  } catch {
    // 只有仍处于原会话时才回滚，迟到失败不能污染新会话。
    if (current === generation && idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx]!,
        clarify: { ...clarify, resolvedOption: undefined },
      };
    }
  }
}

/** handleRegenerate 截断最后一条 AI 回复并重放其用户消息；历史中间回复不提供重放。 */
async function handleRegenerate(msg: DisplayMessage) {
  if (actionBusy.value || sending.value || readOnly.value || historyLoading.value || historyError.value) return;
  const index = messages.value.findIndex((item) => item.id === msg.id);
  if (index === -1) return;
  let userIndex = -1;
  for (let i = index - 1; i >= 0; i--) {
    if (messages.value[i]?.role === 'user') {
      userIndex = i;
      break;
    }
  }
  if (userIndex === -1) return;
  const userContents = messages.value[userIndex]!.contents;
  messages.value = messages.value.slice(0, userIndex);
  await handleSend(userContents);
}

/** 所选图表或表格只影响下一次请求，切换会话时立即清除。 */
const followUp = ref<ResultFollowUp>();
watch(STORAGE_KEY, () => {
  followUp.value = undefined;
});

async function handleSend(contents: ContentPart[]) {
  if (actionBusy.value || sending.value || readOnly.value || historyLoading.value || historyError.value || (props.workspace && listLoading.value)) return;
  if (referencedSession.value) {
    const reference = referencedSession.value;
    contents = [
      ...contents,
      { type: 'text', text: `请参考会话《${reference.title || $t('aiChat.ui.untitledConversation')}》（会话ID：${reference.sessionID}），通过会话读取工具核对相关原文并注明来源。` },
    ];
    referencedSession.value = undefined;
  }
  const current = ++generation;
  controller = new AbortController();

  // 推入用户消息
  const userMsg: DisplayMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    contents,
  };
  messages.value.push(userMsg);

  // 推入 AI 占位消息
  const aiMsgId = `ai-${Date.now()}`;
  const aiMsg: DisplayMessage = {
    id: aiMsgId,
    role: 'assistant',
    contents: [{ type: 'text', text: '' }],
    isLoading: true,
  };
  messages.value.push(aiMsg);

  sending.value = true;
  try {
    // 只发当前轮用户消息，历史由后端通过 sessionID 管理
    const sessionID = await userAiCompletionsStream(
      {
        sessionID: currentSessionID.value || undefined,
        messages: [{ role: 'user', contents }],
        resultContext: followUp.value ? { resultID: followUp.value.resultID, blockID: followUp.value.blockID, selection: followUp.value.selection } : undefined,
        currentAppID: props.currentAppID,
        currentAppName: props.currentAppName,
        currentRoute: props.currentRoute,
        assistantCode: props.assistantCode,
        toolID: effectiveToolID.value,
        tools: availableTools.value,
      },
      (token) => {
        if (current !== generation) return;
        const idx = messages.value.findIndex((m) => m.id === aiMsgId);
        if (idx !== -1) {
          const current = messages.value[idx]!.contents[0]?.text ?? '';
          messages.value[idx] = {
            ...messages.value[idx]!,
            id: aiMsgId,
            role: 'assistant',
            contents: [{ type: 'text', text: current + token }],
            isLoading: true,
          };
        }
      },
      ({
        sessionID: sid,
        interactionResults,
        searchStatus,
        searchTotal,
        rewrittenQuery,
        matchedDocuments,
        citations,
        expandedCitations,
        answerPolicy,
        confidenceBand,
        toolEvents,
      }) => {
        if (current !== generation) return;
        if (sid) currentSessionID.value = sid;
        const idx = messages.value.findIndex((m) => m.id === aiMsgId);
        if (idx !== -1) {
          messages.value[idx] = {
            ...messages.value[idx]!,
            interactionResults: interactionResults
              ? [...new Map([...(messages.value[idx]!.interactionResults ?? []), ...interactionResults].map((ref) => [ref.resultID, ref])).values()]
              : messages.value[idx]!.interactionResults,
            searchStatus: searchStatus ?? messages.value[idx]!.searchStatus,
            searchTotal: searchTotal ?? messages.value[idx]!.searchTotal,
            rewrittenQuery: rewrittenQuery ?? messages.value[idx]!.rewrittenQuery,
            matchedDocuments: matchedDocuments ?? messages.value[idx]!.matchedDocuments,
            citations: citations ?? messages.value[idx]!.citations,
            expandedCitations: expandedCitations ?? messages.value[idx]!.expandedCitations,
            answerPolicy: answerPolicy ?? messages.value[idx]!.answerPolicy,
            confidenceBand: confidenceBand ?? messages.value[idx]!.confidenceBand,
            toolEvents: toolEvents || messages.value[idx]!.toolEvents,
          };
        }
        if (toolEvents?.some((e) => e.includes('save_artifacts'))) {
          emit('artifactsSaved');
        }
      },
      (payload) => {
        if (current !== generation) return;
        if (payload.name === 'clarify' && payload.clarify) {
          const idx = messages.value.findIndex((m) => m.id === aiMsgId);
          if (idx !== -1) {
            messages.value[idx] = {
              ...messages.value[idx]!,
              clarify: {
                ...payload.clarify,
                sessionID: payload.sessionID,
                toolCallID: payload.toolCallID,
              },
            };
          }
        }
        const business = executableTools.value.find((item) => item.definition.name === payload.name);
        if (business && controller) {
          const signal = controller.signal;
          void (async () => {
            let result = '';
            let error = '';
            try {
              result = JSON.stringify(await business.execute(payload.arguments, signal));
            } catch (error_) {
              error = error_ instanceof Error ? error_.message : $t('aiChat.ui.businessQueryFailed');
            }
            if (signal.aborted || current !== generation) return;
            try {
              await submitChatToolResult(payload.sessionID, payload.toolCallID, result, error, signal);
            } catch {
              if (current === generation) controller?.abort();
            }
          })();
        } else emit('toolCallExecute', payload);
      },
      (event) => {
        if (current !== generation) return;
        // 收集结构化工具事件,驱动 Tool 组件渲染
        const idx = messages.value.findIndex((m) => m.id === aiMsgId);
        if (idx !== -1) {
          const list = [...(messages.value[idx]!.toolEventList ?? []), event];
          messages.value[idx] = {
            ...messages.value[idx]!,
            toolEventList: list,
          };
        }
      },
      { signal: controller.signal },
    );

    if (current !== generation) return;
    if (sessionID) {
      currentSessionID.value = sessionID;
      followUp.value = undefined;
    }

    // 标记完成
    const idx = messages.value.findIndex((m) => m.id === aiMsgId);
    if (idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx]!,
        isLoading: false,
      };
    }
  } catch (error) {
    if (current !== generation) return;
    const idx = messages.value.findIndex((m) => m.id === aiMsgId);
    if (idx !== -1) {
      messages.value[idx] = {
        ...messages.value[idx]!,
        id: aiMsgId,
        role: 'assistant',
        contents: [{ type: 'text', text: error instanceof Error ? error.message : $t('aiChat.ui.theRequestFailedPleaseTryAgainLater') }],
        isLoading: false,
      };
    }
  } finally {
    if (current === generation) {
      sending.value = false;
      void restoreResults();
      void refreshSessions();
      nextTick(() => inputRef.value?.focus());
    }
  }
}
</script>

<template>
  <div class="ai-chat-workspace relative flex h-full min-h-0 w-full min-w-0 overflow-hidden text-sm">
    <aside
      v-if="workspace"
      class="border-border bg-muted/35 max-sm:bg-background flex h-full w-[260px] shrink-0 flex-col border-r max-sm:absolute max-sm:inset-y-0 max-sm:left-0 max-sm:z-20 max-sm:shadow-xl"
      :class="mobileSessions ? 'flex' : 'max-sm:hidden'"
      :aria-label="$t('aiChat.ui.historySession')"
    >
      <div class="px-5 pb-4 pt-6">
        <div class="mb-6 flex items-center gap-2 font-semibold tracking-wide"><VbenIcon icon="lucide:sparkles" class="size-4" /> {{ $t('aiChat.ui.aiWorkspace') }}</div>
        <button
          class="border-border bg-background hover:bg-muted flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left disabled:opacity-40"
          :disabled="sending || actionBusy"
          @click="handleNewSession"
        >
          <VbenIcon icon="lucide:plus" class="size-4" />{{ $t('aiChat.ui.newConversation') }}
        </button>
      </div>
      <div class="bg-muted mx-4 mb-3 grid grid-cols-3 gap-1 rounded-lg p-1" role="group" :aria-label="$t('aiChat.ui.conversationClassification')">
        <button
          v-for="filter in [
            { value: 'inProgress', label: $t('aiChat.ui.inProgress') },
            { value: 'completed', label: $t('aiChat.ui.completed') },
            { value: undefined, label: $t('aiChat.ui.all') },
          ] as const"
          :key="filter.label"
          class="rounded-md py-1.5 text-xs disabled:opacity-40"
          :class="sessionFilter === filter.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          :aria-pressed="sessionFilter === filter.value"
          :disabled="sending || actionBusy"
          @click="changeFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
      <div class="text-muted-foreground px-5 pb-2 text-xs">{{ $t('aiChat.ui.recentConversations') }}</div>
      <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p v-if="listError" role="alert" class="text-destructive px-2 py-3 text-xs">
          {{ listError }} <button class="underline" @click="refreshSessions(true)">{{ $t('aiChat.ui.retryLoading') }}</button>
        </p>
        <p v-if="listLoading" role="status" class="text-muted-foreground px-2 py-3 text-xs">{{ $t('aiChat.ui.loadingSession') }}</p>
        <p v-else-if="!listError && sessions.length === 0" class="text-muted-foreground px-2 py-3 text-xs">{{ $t('aiChat.ui.noHistoricalSessionYet') }}</p>
        <div
          v-for="item in sessions"
          :key="item.sessionID"
          class="group relative mb-1 rounded-lg"
          :class="item.sessionID === currentSessionID ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70'"
        >
          <button
            class="block w-full rounded-lg px-3 py-3 pr-9 text-left disabled:opacity-40"
            :aria-current="item.sessionID === currentSessionID ? 'true' : undefined"
            :disabled="sending || actionBusy"
            :title="item.title || $t('aiChat.ui.untitledConversation')"
            @click="selectSession(item)"
          >
            <span class="mb-1 block truncate text-[13px] font-medium">{{ item.title || $t('aiChat.ui.untitledConversation') }}</span>
            <span class="text-muted-foreground flex items-center justify-between gap-2 text-[11px]"><time>{{ sessionTime(item.lastActiveAt) }}</time><span>{{ sessionLabel(item) }}</span></span>
          </button>
          <details class="absolute right-1 top-2" :key="`${item.sessionID}-${sessionFilter}-${actionBusy}-${renameSessionID}`">
            <summary
              class="hover:bg-background flex size-7 cursor-pointer list-none items-center justify-center rounded-md [&::-webkit-details-marker]:hidden"
              :aria-label="$t('aiChat.ui.sessionActions', { title: item.title || $t('aiChat.ui.untitledConversation') })"
            >
              <VbenIcon icon="lucide:ellipsis" class="size-4" />
            </summary>
            <div class="border-border bg-popover text-popover-foreground absolute right-0 z-30 w-40 rounded-lg border p-1 shadow-lg">
              <button v-if="Number(item.status) === 1" class="session-menu-action" :disabled="sending || actionBusy" @click="startRename(item)">{{ $t('aiChat.ui.rename') }}</button>
              <button class="session-menu-action" @click="copySessionID(item.sessionID)">{{ $t('aiChat.ui.copySessionId') }}</button>
              <button class="session-menu-action" :disabled="sending || actionBusy" @click="createFork(item)">{{ $t('aiChat.ui.createANewOneBasedOnThis') }}</button>
              <button
                v-if="item.sessionID !== currentSessionID"
                class="session-menu-action"
                :disabled="sending || actionBusy || readOnly"
                @click="referenceSession(item)"
              >
                {{ $t('aiChat.ui.referToThisSession') }}
              </button>
              <button
                v-if="Number(item.status) === 1"
                class="session-menu-action"
                :disabled="sending || actionBusy"
                @click="saveSession(item, { completionState: item.completionState === 'completed' ? 'inProgress' : 'completed' })"
              >
                {{ item.completionState === 'completed' ? $t('aiChat.ui.recoveryInProgress') : $t('aiChat.ui.markCompleted') }}
              </button>
            </div>
          </details>
          <form
            v-if="renameSessionID === item.sessionID"
            class="border-border bg-background mx-2 mb-2 rounded-lg border p-2"
            @submit.prevent="saveSession(item, { title: renameTitle.trim() })"
          >
            <input v-model="renameTitle" class="border-border bg-background w-full rounded border px-2 py-1 text-xs" :aria-label="$t('aiChat.ui.sessionName')" maxlength="100" />
            <div class="mt-2 flex justify-end gap-3 text-xs">
              <button type="button" :disabled="actionBusy" @click="renameSessionID = ''">{{ $t('aiChat.ui.cancel') }}</button><button type="submit" :disabled="actionBusy || !renameTitle.trim()">{{ $t('aiChat.ui.saveName') }}</button>
            </div>
          </form>
        </div>
        <button
          v-if="sessions.length < totalSessions"
          class="text-muted-foreground w-full py-3 text-xs hover:underline"
          :disabled="listLoading"
          @click="refreshSessions(false, true)"
        >
          {{ $t('aiChat.ui.loadMore') }}
        </button>
      </div>
      <div class="text-muted-foreground border-border border-t px-5 py-4 text-[11px]">{{ currentAppName || $t('aiChat.ui.currentApplication') }} {{ $t('aiChat.ui.historyAutomaticallySaved') }}</div>
    </aside>
    <button
      v-if="workspace && mobileSessions"
      class="absolute inset-0 z-10 bg-black/20 sm:hidden"
      :aria-label="$t('aiChat.ui.collapseConversationList')"
      @click="mobileSessions = false"
    ></button>
    <section ref="messageRegion" class="bg-background flex h-full min-h-0 min-w-0 flex-1 flex-col" :aria-label="$t('aiChat.ui.dialogueArea')" @click.capture="followSessionLink">
      <header class="border-border flex h-16 shrink-0 items-center gap-3 border-b px-5 pr-14">
        <button v-if="workspace" class="rounded-md px-2 py-1 text-xs sm:hidden" @click="mobileSessions = !mobileSessions">{{ $t('aiChat.ui.conversation') }}</button>
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{{ workspace ? currentTitle : $t('aiChat.ui.aiAssistant') }}</div>
          <div class="text-muted-foreground mt-0.5 text-[11px]">{{ sending ? $t('aiChat.ui.generatingReply_5e40fb') : readOnly ? $t('aiChat.ui.historySessionReadOnly') : $t('aiChat.ui.conversationDataAnalysisAndDocumentation') }}</div>
        </div>
        <template v-if="!workspace">
          <VbenIconButton :tooltip="$t('aiChat.ui.newConversation')" :disabled="sending || actionBusy" @click="handleNewSession"><VbenIcon icon="lucide:plus" /></VbenIconButton><VbenIconButton :tooltip="$t('aiChat.ui.close')" @click="emit('close')"><VbenIcon icon="lucide:x" /></VbenIconButton>
        </template>
      </header>
      <div v-if="currentSession?.parentSessionID" class="border-border text-muted-foreground border-b px-5 py-2 text-xs">
        <button class="text-foreground underline underline-offset-2" :disabled="sending || actionBusy" @click="openSource(currentSession.parentSessionID)">
          {{ $t('aiChat.ui.viewSourceSession') }}
        </button>
        <span class="ml-2">{{ $t('aiChat.ui.inheritanceContext', { turn: currentSession.parentTurnIndex }) }}</span>
      </div>
      <p v-if="actionError" class="text-destructive px-5 py-2 text-xs" role="alert">{{ actionError }}</p>
      <p v-if="actionNotice" class="text-muted-foreground px-5 py-2 text-xs" role="status">{{ actionNotice }}</p>
      <p v-if="actionBusy" class="text-muted-foreground px-5 py-2 text-xs" role="status">{{ $t('aiChat.ui.updatingSession') }}</p>
      <div v-if="historyLoading" class="text-muted-foreground flex flex-1 items-center justify-center" role="status">{{ $t('aiChat.ui.restoringMessagesAndAnalysisResults') }}</div>
      <div v-else-if="historyError" class="flex flex-1 flex-col items-center justify-center gap-3 p-6" role="alert">
        <p>{{ historyError }}</p>
        <button class="underline" @click="selectSession(currentSession || { sessionID: currentSessionID, status: sessionStatus, lastActiveAt: 0 }, true)">
          {{ $t('aiChat.ui.reloadMessage') }}
        </button>
      </div>
      <AiChatMessages
        v-else
        :messages="messages"
        :read-only="readOnly"
        @follow-up="
          (reference: ResultFollowUp) => {
            if (!sending && !readOnly) {
              followUp = reference;
              inputRef?.focus();
            }
          }
        "
        @quick-send="(text: string) => handleSend([{ type: 'text', text }])"
        @clarify-select="
          (msg: any, option: string) => {
            if (!readOnly) handleClarifySelect(msg, option);
          }
        "
        @regenerate="handleRegenerate"
      />
      <div class="mx-auto w-full min-w-0 max-w-[920px] shrink-0 px-3 pb-3 sm:px-5 sm:pb-5">
        <p v-if="followUp" class="bg-muted mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
          <span class="truncate">{{ $t('aiChat.ui.continueBasedOn', { title: followUp.title }) }}</span><button class="shrink-0 underline" @click="followUp = undefined">{{ $t('aiChat.ui.dereference') }}</button>
        </p>
        <p v-if="referencedSession" class="bg-muted mb-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
          <span class="truncate">{{ $t('aiChat.ui.referringToSession') }}<span class="ml-1">{{ referencedSession.title || $t('aiChat.ui.untitledConversation') }}</span></span><button class="shrink-0 underline" @click="referencedSession = undefined">{{ $t('aiChat.ui.dereference') }}</button>
        </p>
        <div v-if="readOnly" class="text-muted-foreground flex flex-wrap items-center justify-center gap-3 py-4 text-xs">
          <span>{{ sessionStatus === 1 ? $t('aiChat.ui.thisTopicHasBeenMarkedAsCompletedAndYouCanContin') : $t('aiChat.ui.thisSessionHasEndedOrBeenArchivedAndTheOriginalR') }}</span>
          <button
            v-if="currentSession && sessionStatus === 1"
            class="text-foreground underline"
            :disabled="actionBusy"
            @click="saveSession(currentSession, { completionState: 'inProgress' })"
          >
            {{ $t('aiChat.ui.recoveryInProgress') }}
          </button>
          <button v-if="currentSession" class="text-foreground underline" :disabled="actionBusy" @click="createFork(currentSession)">{{ $t('aiChat.ui.createANewOneBasedOnThis') }}</button>
        </div>
        <AiChatInput
          v-else
          :key="`${STORAGE_KEY}-${inputKey}`"
          ref="inputRef"
          :disabled="actionBusy || sending || historyLoading || !!historyError || (workspace && listLoading)"
          :generating="sending"
          @stop="stopGeneration"
          @draft-change="hasDraft = $event"
          @send="handleSend"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 会话菜单保持轻量原生键盘语义，颜色跟随主题。 */
.session-menu-action {
  display: block;
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 0.3rem;
  text-align: left;
  font-size: 12px;
}
.session-menu-action:hover {
  background: hsl(var(--muted));
}
.session-menu-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
/* 纯 hash 来源链接无需等待外部 URL 解析，由工作台在当前权限范围内处理。 */
:deep([data-stream-markdown='link'][data-stream-markdown-loading='true']) {
  pointer-events: auto;
  cursor: pointer;
  text-decoration: underline;
}
/* AI 生成文件交付：/oss/ 对象链接渲染为文件卡片（点击经 file-proxy 预览或下载）。 */
:deep(a[href^='/oss/']) {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  margin: 0.15rem 0;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background: hsl(var(--card));
  color: hsl(var(--foreground)) !important;
  font-weight: 500;
  text-decoration: none;
  max-width: 100%;
}
:deep(a[href^='/oss/']:hover) {
  border-color: hsl(var(--primary));
}
:deep(a[href^='/oss/'])::before {
  content: '';
  width: 1rem;
  height: 1rem;
  flex: none;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='7 10 12 15 17 10'/%3E%3Cline x1='12' y1='15' x2='12' y2='3'/%3E%3C/svg%3E")
    no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='7 10 12 15 17 10'/%3E%3Cline x1='12' y1='15' x2='12' y2='3'/%3E%3C/svg%3E")
    no-repeat center / contain;
}
</style>
