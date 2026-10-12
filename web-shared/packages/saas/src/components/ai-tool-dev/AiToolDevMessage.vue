<script lang="ts" setup>
import type { DynamicToolUIPart } from '../ai-elements/types';
import type { ToolDevMessage } from './api';

import { computed, ref } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { ChevronDownIcon } from 'lucide-vue-next';

import {
  Loader,
  Message,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '../ai-elements';

defineOptions({ name: 'AiToolDevMessage' });

const props = defineProps<{
  message: ToolDevMessage;
}>();

/** historyExpanded 记录当前消息是否由用户主动展开历史调用。 */
const historyExpanded = ref(false);

/** 思考过程按文案去重计数，避免同类文件操作被误解为界面卡死。 */
const thinkingText = computed(() => {
  const items = props.message.thinking ?? [];
  if (items.length === 0) return '';
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.description, (counts.get(item.description) ?? 0) + 1);
  }
  return [...counts.entries()].map(([description, count]) => `- ${description}${count > 1 ? ` × ${count}` : ''}`).join('\n');
});

/** 当前消息的可见执行状态，兼容旧消息只携带 isLoading 的数据。 */
const executionStatus = computed(() => props.message.status ?? (props.message.isLoading ? 'running' : 'completed'));

const executionStatusText = computed(() => {
  const labels: Record<NonNullable<ToolDevMessage['status']>, string> = {
    running: '执行中',
    waiting: '等待确认',
    completed: '已完成',
    failed: '执行失败',
  };
  return labels[executionStatus.value];
});

/** parseToolPayload 将调用入参与返回值解析为可读 JSON，非 JSON 内容保留原文。 */
function parseToolPayload(value?: string): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** toolTitle 将开发工具内部名称转成用户可读标题。 */
function toolTitle(name: string): string {
  const labels: Record<string, string> = {
    knowledge_search: '搜索知识库',
    list_files: '查看工作区文件',
    read_file: '读取文件',
    write_file: '创建文件',
    edit_file: '修改文件',
    save_artifacts: '保存工具文件',
    skill_view: '查看开发规范',
    todos: '更新任务计划',
  };
  return labels[name] ?? name ?? '未知操作';
}

/** 工具调用事件按 toolCallID 合并，卡片会随 SSE 阶段实时从准备更新到完成。 */
const toolParts = computed(() => {
  const parts: Array<DynamicToolUIPart & { title: string }> = [];
  const indexByID = new Map<string, number>();
  for (const event of props.message.toolEvents ?? []) {
    const index = indexByID.get(event.toolCallID);
    // start 事件到达时后端已开始执行，直接标记“运行中”，避免后端工具不发 execute 时一直显示等待。
    const state: DynamicToolUIPart['state'] = event.phase === 'result' ? 'output-available' : 'input-available';
    const result = parseToolPayload(event.result);
    const errorText = result && typeof result === 'object' && 'error' in result ? String((result as { error: unknown }).error) : undefined;
    const next = {
      type: 'dynamic-tool',
      toolCallId: event.toolCallID,
      toolName: event.name,
      title: toolTitle(event.name),
      state: errorText ? ('output-error' as const) : state,
      input: parseToolPayload(event.arguments),
      output: errorText ? undefined : result,
      errorText,
    };
    if (index === undefined) {
      indexByID.set(event.toolCallID, parts.length);
      parts.push(next);
    } else {
      const previous = parts[index]!;
      parts[index] = {
        ...previous,
        ...next,
        input: next.input ?? previous.input,
        output: next.output ?? previous.output,
      };
    }
  }
  return parts;
});

/** currentToolPart 仅展示事件流末尾仍未结束的调用，避免过期运行态被误认为当前操作。 */
const currentToolPart = computed(() => {
  if (executionStatus.value !== 'running' && executionStatus.value !== 'waiting') return undefined;
  const latestEvent = props.message.toolEvents?.at(-1);
  if (!latestEvent || latestEvent.phase === 'result') return undefined;
  return toolParts.value.find((part) => part.toolCallId === latestEvent.toolCallID);
});

/** historicalToolParts 收纳已结束调用及被后续调用替代的旧运行态，默认不展开。 */
const historicalToolParts = computed(() => toolParts.value.filter((part) => part.toolCallId !== currentToolPart.value?.toolCallId));

const isUser = computed(() => props.message.role === 'user');
const isBrief = computed(() => props.message.role === 'brief');
</script>

<template>
  <!-- 系统简报：自动发起的初始化指令不作为用户气泡，居中浅色展示 -->
  <div v-if="isBrief" class="mb-4 flex justify-center" data-testid="ai-tool-dev-brief">
    <span class="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
      {{ message.content }}
    </span>
  </div>
  <Message v-else class="mb-4" :from="isUser ? 'user' : 'assistant'">
    <!-- 头像 -->
    <div
      class="flex size-8 shrink-0 items-center justify-center rounded-full"
      :class="isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'"
    >
      <VbenIcon :icon="isUser ? 'lucide:user' : 'lucide:sparkles'" class="size-4" />
    </div>

    <div class="max-w-[85%] space-y-2">
      <!-- 思考过程(可折叠) -->
      <Reasoning
        v-if="thinkingText && !isUser"
        :default-open="executionStatus === 'running'"
        :is-streaming="executionStatus === 'running'"
        class="text-xs"
        data-testid="ai-tool-dev-thinking"
      >
        <ReasoningTrigger>
          <span class="flex items-center gap-1">
            <Loader v-if="executionStatus === 'running'" :size="12" />
            思考过程 · {{ executionStatusText }}
            <ChevronDownIcon class="size-3 transition-transform" />
          </span>
        </ReasoningTrigger>
        <ReasoningContent :content="thinkingText" class="text-xs" />
      </Reasoning>

      <!-- 当前工具调用保持可见，完成及被替代的调用统一收进历史区域。 -->
      <div v-if="!isUser && toolParts.length > 0" class="space-y-2" data-testid="ai-tool-dev-tool-events">
        <div v-if="currentToolPart" class="space-y-1" data-testid="ai-tool-dev-current-tool">
          <span class="text-muted-foreground text-xs">当前操作</span>
          <Tool class="mb-0 text-xs">
            <ToolHeader
              type="dynamic-tool"
              :state="currentToolPart.state"
              :tool-name="currentToolPart.toolName || currentToolPart.toolCallId"
              :title="currentToolPart.title"
              class="rounded-md"
            />
            <ToolContent>
              <ToolInput v-if="currentToolPart.input !== undefined" :input="currentToolPart.input" />
              <ToolOutput :output="currentToolPart.output" :error-text="currentToolPart.errorText" />
            </ToolContent>
          </Tool>
        </div>

        <button
          v-if="historicalToolParts.length > 0"
          type="button"
          class="text-muted-foreground hover:bg-muted hover:text-foreground flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors"
          :aria-expanded="historyExpanded"
          data-testid="ai-tool-dev-tool-history-toggle"
          @click="historyExpanded = !historyExpanded"
        >
          <span>调用历史（{{ historicalToolParts.length }}）</span>
          <ChevronDownIcon class="size-3 transition-transform" :class="historyExpanded ? 'rotate-180' : ''" />
        </button>

        <div v-if="historyExpanded" class="space-y-2" data-testid="ai-tool-dev-tool-history">
          <Tool v-for="part in historicalToolParts" :key="part.toolCallId" class="mb-0 text-xs">
            <ToolHeader type="dynamic-tool" :state="part.state" :tool-name="part.toolName || part.toolCallId" :title="part.title" class="rounded-md" />
            <ToolContent>
              <ToolInput v-if="part.input !== undefined" :input="part.input" />
              <ToolOutput :output="part.output" :error-text="part.errorText" />
            </ToolContent>
          </Tool>
        </div>
      </div>

      <!-- 消息内容(流式 Markdown,mermaid 代码块由 vue-stream-markdown 内置渲染) -->
      <MessageContent
        v-if="message.content || message.isLoading"
        class="rounded-2xl px-3 py-2"
        :class="isUser ? 'bg-primary text-primary-foreground whitespace-pre-wrap rounded-tr-md' : 'bg-muted rounded-tl-md text-sm leading-relaxed'"
        data-testid="ai-tool-dev-message-content"
      >
        <!-- 用户消息:纯文本展示 -->
        <template v-if="isUser">{{ message.content }}</template>
        <!-- 助手消息:流式 Markdown -->
        <MessageResponse v-else-if="message.content" :content="message.content" />
        <!-- 等待首个 token -->
        <span v-if="message.isLoading && !message.content" class="flex items-center gap-2 py-1">
          <Loader :size="14" />
          <span class="text-muted-foreground text-xs">思考中...</span>
        </span>
      </MessageContent>
    </div>
  </Message>
</template>
