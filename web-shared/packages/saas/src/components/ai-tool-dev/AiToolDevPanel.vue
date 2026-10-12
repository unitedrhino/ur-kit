<!-- 文件说明：工具开发对话面板，负责会话恢复、流式消息和任务进度合并。 -->
<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useSessionStore } from '../../store/session';
import { Conversation, ConversationContent, ConversationScrollButton } from '../ai-elements';
import type {
  ClarifyData,
  FileChangeData,
  TaskPlanData,
  TaskUpdateData,
  TaskUpdateEventData,
  ThinkingData,
  TodoItem,
  ToolDevMessage,
  ToolDevToolEvent,
} from './api';
import { fetchToolDevHistory, isAutoInitialPrompt, resolveClarify, TOOL_DEV_BRIEF_TEXT, toolDevStream } from './api';
import AiToolDevConfirmation from './AiToolDevConfirmation.vue';
import AiToolDevHeader from './AiToolDevHeader.vue';
import AiToolDevInput from './AiToolDevInput.vue';
import AiToolDevMessage from './AiToolDevMessage.vue';
import AiToolDevTaskTracker from './AiToolDevTaskTracker.vue';
import AiToolDevWelcome from './AiToolDevWelcome.vue';

defineOptions({ name: 'AiToolDevPanel' });

const props = defineProps<{
  assistantCode?: string;
  toolID?: number;
  sessionKey?: string;
  /** 项目级 clone ID：completions 指定后 AI 记忆挂项目 clone，跨工具/跨会话复用记忆。 */
  cloneId?: number | string;
  /** 开发依据摘要（只读展示）：触发条件与入参/出参契约字段，AI 将按这些内容开发 */
  devContext?: {
    triggerCondition?: string;
    inputFields?: string[];
    outputFields?: string[];
  };
  /** 本工具固定开发约定，随用户消息发送，确保 AI 实际收到触发合同。 */
  instruction?: string;
}>();

const emit = defineEmits<{
  artifactsSaved: [];
}>();

const sessionStore = useSessionStore();
/** 会话历史仅拉取一次，失败后不重试（静默降级为空历史）。 */
const historyLoaded = ref(false);
/** 首选确定性会话 ID；后端可在其无历史时返回同一工具的旧随机会话 ID。 */
const deterministicSessionID = computed(() => (props.toolID != null ? `alarm-tooldev-${props.toolID}` : ''));
const STORAGE_KEY = computed(() => `ai_tool_dev_panel_session_${sessionStore.tenantCode || 'default'}_${props.sessionKey || 'default'}`);

const messages = ref<ToolDevMessage[]>([]);
const tasks = ref<TodoItem[]>([]);
const pendingClarify = ref<(ClarifyData & { toolCallID: string }) | null>(null);
const isLoading = ref(false);
/** 当前生成轮次状态，独立于任务计划保存，确保断流后可覆盖遗留的 in_progress。 */
const executionStatus = ref<'completed' | 'failed' | 'idle' | 'running' | 'waiting'>('idle');
const currentSessionID = ref('');
const inputText = ref('');

// 当前正在流式输出的助手消息索引
let currentAssistantIndex = -1;

function loadSession() {
  // 有 toolID 时先用确定性会话 ID；若后端恢复到旧随机会话，loadHistory 会采用实际 ID。
  // 无 toolID 的通用场景保持原有 localStorage 持久化逻辑。
  if (deterministicSessionID.value) {
    currentSessionID.value = deterministicSessionID.value;
    return;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY.value);
    if (saved) {
      const { sid } = JSON.parse(saved);
      if (sid) {
        currentSessionID.value = sid;
      }
    }
  } catch {
    // 忽略存储错误
  }
}

/** 拉取会话历史并回显到消息列表（仅一次）；失败时静默降级为空历史，SSE/本地新消息逻辑照旧。 */
async function loadHistory() {
  if (historyLoaded.value || !currentSessionID.value) return;
  historyLoaded.value = true;
  try {
    const history = await fetchToolDevHistory(currentSessionID.value, props.toolID);
    if (history.sessionID && history.sessionID !== currentSessionID.value) {
      currentSessionID.value = history.sessionID;
    }
    if (history.messages.length) {
      // 历史里自动发起的初始化指令转成简报样式，不在对话里展示大段指令原文
      messages.value.push(
        ...history.messages.map((m) =>
          m.role === 'user' && isAutoInitialPrompt(m.content) ? { ...m, role: 'brief' as const, content: TOOL_DEV_BRIEF_TEXT } : m,
        ),
      );
      // 滚动由 Conversation 的 stick-to-bottom 机制处理，无需手动滚动
    }
  } catch {
    // 静默降级：历史拉取失败不阻塞正常对话流程
  }
}

onMounted(() => {
  loadSession();
  loadHistory();
});

watch(
  () => sessionStore.tenantCode,
  () => {
    loadSession();
  },
);

watch(currentSessionID, (sid) => {
  try {
    localStorage.setItem(STORAGE_KEY.value, JSON.stringify({ sid }));
  } catch {
    // 忽略存储错误
  }
});

function addUserMessage(text: string) {
  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: text,
  });
}

function startAssistantMessage() {
  currentAssistantIndex = messages.value.length;
  messages.value.push({
    id: `a-${Date.now()}`,
    role: 'assistant',
    content: '',
    thinking: [],
    toolEvents: [],
    status: 'running',
    isLoading: true,
  });
  executionStatus.value = 'running';
}

function appendToken(token: string) {
  const msg = messages.value[currentAssistantIndex];
  if (msg) {
    msg.content += token;
  }
}

function appendThinking(data: ThinkingData) {
  const msg = messages.value[currentAssistantIndex];
  if (msg) {
    if (!msg.thinking) msg.thinking = [];
    msg.thinking.push(data);
  }
}

/** appendToolEvent 将后端工具调用阶段追加到当前助手消息，供界面实时合并展示。 */
function appendToolEvent(data: ToolDevToolEvent) {
  const msg = messages.value[currentAssistantIndex];
  if (msg) {
    if (!msg.toolEvents) msg.toolEvents = [];
    msg.toolEvents.push(data);
  }
}

/** setLoading 同步当前消息与面板的加载状态，并标记等待、完成或失败结果。 */
function setLoading(loading: boolean, status?: ToolDevMessage['status']) {
  const msg = messages.value[currentAssistantIndex];
  if (msg) {
    msg.isLoading = loading;
    if (status) msg.status = status;
  }
  isLoading.value = loading;
  if (status) executionStatus.value = status;
}

/** markStreamFailed 幂等记录流错误，兼容 API 的 onError 回调与 Promise reject 双通道。 */
function markStreamFailed(err: Error) {
  const msg = messages.value[currentAssistantIndex];
  const errorText = `[错误] ${err.message}`;
  if (msg && !msg.content.includes(errorText)) {
    msg.content += `\n\n${errorText}`;
  }
  setLoading(false, 'failed');
}

/** 合并旧版任务增量；完成事件允许省略标题，不能清空已经收到的任务描述。 */
function applyTaskUpdate(data: TaskUpdateData) {
  // 固定步骤名称来自旧版事件协议，仅用于缺失标题时显示；不推断执行结果。
  const legacyLabels: Record<string, string> = {
    analyze: '需求分析', explore: '探索上下文', confirm: '等待确认', code: '编码', save: '保存',
  };
  // 按稳定任务 ID 合并，未知任务明确标识描述缺失，避免仅剩状态图标。
  const index = tasks.value.findIndex((task) => task.id === data.taskId);
  const existing = tasks.value[index];
  const content = data.label?.trim() || existing?.content || legacyLabels[data.taskId] || '任务描述未提供';
  const task: TodoItem = {
    id: data.taskId,
    content,
    activeForm: data.label?.trim() || existing?.activeForm || content,
    status: data.status,
  };
  if (index >= 0) tasks.value[index] = task;
  else tasks.value.push(task);
}

async function handleSend(text: string) {
  if (isLoading.value) return;

  addUserMessage(text);
  startAssistantMessage();
  isLoading.value = true;
  pendingClarify.value = null;

  try {
    const sid = await toolDevStream(
      {
        assistantCode: props.assistantCode,
        sessionID: currentSessionID.value || undefined,
        userInput: props.instruction ? `${props.instruction}\n\n用户需求：${text}` : text,
        toolID: props.toolID,
        cloneID: props.cloneId,
      },
      {
        onToken: (token: string) => {
          appendToken(token);
        },
        onTaskUpdate: applyTaskUpdate,
        onTaskPlan: (data: TaskPlanData) => {
          tasks.value = (data.todos || []).map((t) => ({
            ...t,
            id: t.id || `task-${Date.now()}`,
            activeForm: t.activeForm || t.content,
          }));
        },
        onTaskUpdateEvent: (data: TaskUpdateEventData) => {
          if (data.todos && data.todos.length > 0) {
            tasks.value = data.todos;
          }
        },
        onThinking: (data: ThinkingData) => {
          appendThinking(data);
        },
        onToolEvent: (data: ToolDevToolEvent) => {
          appendToolEvent(data);
        },
        onFileChange: (_data: FileChangeData) => {
          // 文件变更信息可后续扩展展示
        },
        onClarify: (data: ClarifyData & { toolCallID: string }) => {
          pendingClarify.value = data;
          setLoading(false, 'waiting');
        },
        onArtifactsSaved: () => {
          emit('artifactsSaved');
        },
        onDone: () => {
          setLoading(false, 'completed');
        },
        onError: (err: Error) => {
          markStreamFailed(err);
        },
      },
    );
    if (sid) {
      currentSessionID.value = sid;
    }
  } catch (err) {
    markStreamFailed(err as Error);
  }
}

async function handleClarifySubmit(feedback: string, toolCallID: string) {
  pendingClarify.value = null;

  // 把用户反馈显示为一条用户消息
  addUserMessage(feedback);
  startAssistantMessage();
  isLoading.value = true;

  try {
    await resolveClarify(currentSessionID.value, toolCallID, feedback);

    // clarify 提交后，后端会继续推送 SSE 流，
    // 但当前接口是同步提交，前端需再次发起 stream 才能接收后续内容。
    // 这里通过 handleSend 的逻辑重新发起（但用户消息已推入，不需要再推）。
    // 简化处理：直接再发起一次空流式请求以接收后续内容。
    const sid = await toolDevStream(
      {
        assistantCode: props.assistantCode,
        sessionID: currentSessionID.value,
        userInput: '',
        toolID: props.toolID,
        cloneID: props.cloneId,
      },
      {
        onToken: (token: string) => {
          appendToken(token);
        },
        onTaskUpdate: applyTaskUpdate,
        onTaskPlan: (data: TaskPlanData) => {
          tasks.value = (data.todos || []).map((t) => ({
            ...t,
            id: t.id || `task-${Date.now()}`,
            activeForm: t.activeForm || t.content,
          }));
        },
        onTaskUpdateEvent: (data: TaskUpdateEventData) => {
          if (data.todos && data.todos.length > 0) {
            tasks.value = data.todos;
          }
        },
        onThinking: (data: ThinkingData) => {
          appendThinking(data);
        },
        onToolEvent: (data: ToolDevToolEvent) => {
          appendToolEvent(data);
        },
        onFileChange: () => {
          // 暂不展示
        },
        onClarify: (data: ClarifyData & { toolCallID: string }) => {
          pendingClarify.value = data;
          setLoading(false, 'waiting');
        },
        onArtifactsSaved: () => {
          emit('artifactsSaved');
        },
        onDone: () => {
          setLoading(false, 'completed');
        },
        onError: (err: Error) => {
          markStreamFailed(err);
        },
      },
    );
    if (sid) {
      currentSessionID.value = sid;
    }
  } catch (err) {
    markStreamFailed(err as Error);
  }
}
</script>

<template>
  <div class="ai-tool-dev-panel bg-background flex h-full min-h-0 flex-col overflow-hidden border">
    <!-- 顶部栏 -->
    <AiToolDevHeader />

    <!-- 任务进度追踪 -->
    <AiToolDevTaskTracker :execution-status="executionStatus" :tasks="tasks" />

    <!-- 消息列表(Conversation 吸底滚动) -->
    <Conversation class="min-h-0 flex-1" aria-label="工具开发对话消息列表">
      <!-- 开发依据摘要（无消息时展示）：AI 将按这些当前配置开发，替代预填提示词 -->
      <div
        v-if="messages.length === 0 && devContext && (devContext.triggerCondition || devContext.inputFields?.length || devContext.outputFields?.length)"
        class="border-border bg-muted/40 mx-4 mb-2 rounded-lg border p-3 text-xs"
        data-testid="ai-tool-dev-dev-context"
      >
        <div class="text-foreground mb-1 font-medium">开发依据（AI 将按以下当前配置开发）</div>
        <div v-if="devContext.triggerCondition" class="text-muted-foreground">触发条件：{{ devContext.triggerCondition }}</div>
        <div v-if="devContext.inputFields?.length" class="text-muted-foreground">入参：{{ devContext.inputFields.join('、') }}</div>
        <div v-if="devContext.outputFields?.length" class="text-muted-foreground">出参：{{ devContext.outputFields.join('、') }}</div>
      </div>
      <!-- 启动提示（无消息时展示） -->
      <div v-if="messages.length === 0" class="flex size-full items-center justify-center">
        <AiToolDevWelcome @use-template="inputText = $event" />
      </div>

      <ConversationContent v-else class="space-y-4 px-4 py-4">
        <template v-for="msg in messages" :key="msg.id">
          <AiToolDevMessage :message="msg" />
        </template>

        <!-- 确认卡片 -->
        <AiToolDevConfirmation v-if="pendingClarify" :data="pendingClarify" @submit="handleClarifySubmit" />
      </ConversationContent>

      <ConversationScrollButton />
    </Conversation>

    <!-- 输入区 -->
    <AiToolDevInput v-model="inputText" :disabled="isLoading" @send="handleSend" />
  </div>
</template>

<style scoped>
/* 任务明细按右侧面板实际宽度响应，而不是依赖整页视口宽度。 */
.ai-tool-dev-panel {
  container: ai-tool-dev-panel / inline-size;
}
</style>
