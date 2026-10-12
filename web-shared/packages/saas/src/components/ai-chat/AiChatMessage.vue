<!-- 文件说明：共享消息渲染，包含文本、工具过程、媒体及持久化分析结果。 -->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import type { AiToolEvent, ChatMessage } from './api';
import type { ResultFollowUp } from './interaction';

import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { resolveKnowledgeSearchEmptyState } from '../../views/knowledge-base/retrieval';
import {
  Loader,
  Message,
  MessageAction,
  MessageActions,
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
/** 知识库证据 chip：轻量组件随消息组件一起加载。 */
import EvidenceCitations from './EvidenceCitations.vue';
import { joinTextContents, toToolParts } from './stream-view';
import { createChatWaitController } from './wait-state';

defineOptions({ name: 'AiChatMessage' });
const props = defineProps<Props>();
const emit = defineEmits<{
  clarifySelect: [option: string];
  followUp: [reference: ResultFollowUp];
  /** 用户请求重新生成当前回复，由会话面板截断后重放最近一条用户消息。 */
  regenerate: [];
}>();
/** 分析结果组件按需加载，不把图表和报告解析器带入登录首屏。 */
const AiInteractionResult = defineAsyncComponent(() => import('./AiInteractionResult.vue'));
/** 附件组件仅在消息包含长期引用时加载。 */
const AiExportFiles = defineAsyncComponent(() => import('./AiExportFiles.vue'));
const AiAttachment = defineAsyncComponent(() => import('./AiAttachment.vue'));

interface ClarifyInfo {
  level: string;
  options: string[];
  question: string;
  resolvedOption?: string;
}

interface Props {
  message: ChatMessage & { clarify?: ClarifyInfo; isLoading?: boolean; stopped?: boolean; toolEventList?: AiToolEvent[]; toolEvents?: string[] };
  /** 只读历史不提供消息追问入口。 */
  readOnly?: boolean;
  /** 当前消息是否允许重新生成（仅最后一条 AI 回复且可写会话）。 */
  regenerable?: boolean;
}

/** 检索空态区分：候选计数大于返回引用数说明有候选被阈值过滤；聊天载荷暂无候选计数时按无结果提示。 */
const searchEmpty = computed(() => resolveKnowledgeSearchEmptyState({ chunks: props.message.citations ?? [], total: props.message.searchTotal }));

/** 自然语言导出返回任务引用，卡片通过服务端查询实际状态。 */
const exportResults = computed(() => {
  const ids = new Set<string>();
  for (const event of props.message.toolEventList ?? []) {
    if (event.phase !== 'result' || event.name !== 'export_chat_result' || !event.result) continue;
    try {
      const value = JSON.parse(event.result);
      if (typeof value.exportTask?.resultID === 'string' && /^result_[a-zA-Z0-9-]{1,64}$/.test(value.exportTask.resultID)) ids.add(value.exportTask.resultID);
    } catch {
      /* 非结构化旧结果按文本显示。 */
    }
  }
  return [...ids];
});
const copied = ref(false);

const isUser = () => props.message.role === 'user';

const textContent = computed(() => joinTextContents(props.message.contents));

/** 消息是否携带知识库证据；检索结果与流式正文独立到达，有数据即展示。 */
const hasEvidence = computed(() => (props.message.citations?.length ?? 0) > 0 || (props.message.expandedCitations?.length ?? 0) > 0);

/** 检索过程折叠态：无改写问题时整段不渲染，避免空折叠占位。 */
const hasRetrievalProcess = computed(() => !!props.message.rewrittenQuery?.trim());
/** 检索进行中：检索结果先于正文 token 到达，正文尚未输出且仍在生成即视为检索阶段。 */
const retrieving = computed(() => !!props.message.isLoading && !textContent.value && hasRetrievalProcess.value);
/** 折叠区展开状态：检索中自动展开，生成结束后折叠为"已检索"。 */
const retrievalOpen = ref(false);
watch(retrieving, (active) => {
  if (active) retrievalOpen.value = true;
});
watch(
  () => props.message.isLoading,
  (loading, previous) => {
    if (!loading && previous) retrievalOpen.value = false;
  },
  { immediate: true },
);

/** 结构化工具调用部件(供 Tool 组件渲染) */
const toolParts = computed(() => toToolParts(props.message.toolEventList ?? []));

/** 等待状态机视图：250ms 内不闪现加载态，60s 无内容提示响应较慢，内容到达立即收敛。 */
const wait = ref({ visible: false, stalled: false });
const waitController = createChatWaitController((view) => {
  wait.value = view;
});
watch(
  () => ({ isLoading: !!props.message.isLoading, hasContent: !!textContent.value }),
  (input) => waitController.update(input),
  { immediate: true },
);
onBeforeUnmount(() => waitController.dispose());

async function copyText() {
  if (!textContent.value) return;
  try {
    await navigator.clipboard.writeText(textContent.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // 复制失败静默处理
  }
}

function getImageUrls(): string[] {
  return props.message.contents.filter((c) => c.type === 'image_url' && c.imageUrl).map((c) => c.imageUrl!);
}

function getFiles(): Array<{ mime: string; name: string; url: string }> {
  return props.message.contents
    .filter((c) => c.type === 'file' && c.fileUrl)
    .map((c) => ({ url: c.fileUrl!, name: c.fileName ?? $t('aiChat.ui.attachment'), mime: c.fileMime ?? '' }));
}
</script>

<template>
  <Message class="ai-workspace-message mb-0 min-w-0 !max-w-full" :from="isUser() ? 'user' : 'assistant'">
    <!-- 消息气泡 -->
    <div class="min-w-0 space-y-3" :class="isUser() ? 'max-w-[85%]' : 'w-full'">
      <!-- 图片附件 -->
      <div v-if="getImageUrls().length > 0" class="flex flex-wrap gap-1.5">
        <img v-for="(url, i) in getImageUrls()" :key="i" :src="url" class="max-h-40 max-w-40 rounded-lg object-cover shadow-sm" :alt="$t('aiChat.ui.attachmentPicture')" />
      </div>

      <!-- 原生视频展示，播放由用户主动触发。 -->
      <video
        v-for="(part, index) in message.contents.filter((item) => item.type === 'video_url' && /^https?:\/\//i.test(item.videoUrl ?? ''))"
        :key="`video-${index}`"
        :src="part.videoUrl"
        controls
        preload="metadata"
        class="max-h-72 max-w-full rounded-lg"
        :aria-label="part.fileName ?? $t('aiChat.ui.videoAttachment')"
      ></video>
      <AiAttachment
        v-for="part in message.contents.filter((item) => item.artifactID)"
        :key="part.artifactID"
        :artifact-i-d="part.artifactID!"
        :name="part.fileName"
      />
      <AiExportFiles v-for="resultID in exportResults" :key="`export-${resultID}`" :result-i-d="resultID" />
      <AiInteractionResult
        v-for="result in message.interactionResults"
        :key="result.resultID"
        :reference="result"
        :read-only="readOnly"
        @follow-up="emit('followUp', $event)"
      />

      <!-- 文件附件 -->
      <div v-if="getFiles().length > 0" class="space-y-1">
        <a
          v-for="(f, i) in getFiles()"
          :key="i"
          :href="f.url"
          target="_blank"
          rel="noopener noreferrer"
          class="border-border bg-muted/50 hover:bg-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
        >
          <VbenIcon icon="lucide:file-text" class="text-muted-foreground size-4 shrink-0" />
          <span class="text-foreground truncate">{{ f.name }}</span>
          <VbenIcon icon="lucide:download" class="text-muted-foreground ml-auto size-3.5 shrink-0" />
        </a>
      </div>

      <!-- 文字内容 -->
      <!-- 用户消息:纯文本气泡 -->
      <div
        v-if="isUser() && (textContent || message.isLoading)"
        class="bg-muted/70 text-foreground whitespace-pre-wrap break-words rounded-2xl rounded-tr-md px-4 py-3 text-sm leading-[1.7]"
      >
        {{ textContent }}
      </div>
      <template v-else-if="!isUser() && (textContent || message.isLoading)">
        <!-- 检索过程折叠：检索中自动展开，生成结束折叠为"已检索"；无改写问题不渲染 -->
        <Reasoning
          v-if="hasRetrievalProcess"
          v-model:open="retrievalOpen"
          class="text-xs"
          :default-open="false"
          :is-streaming="retrieving"
          data-testid="ai-chat-retrieval-collapse"
        >
          <ReasoningTrigger>
            <VbenIcon icon="lucide:search" class="size-3.5" />
            <span>{{ retrieving ? $t('aiChat.ui.searchInTheKnowledgeBase') : $t('aiChat.ui.knowledgeBaseRetrieved') }}</span>
          </ReasoningTrigger>
          <ReasoningContent class="text-xs" :content="$t('aiChat.ui.rewrittenQuery', { query: message.rewrittenQuery ?? '' })" />
        </Reasoning>
        <!-- AI 消息:流式 Markdown 渲染(shiki 代码高亮) -->
        <MessageContent
          class="ai-workspace-prose !block !w-full min-w-0 max-w-full !bg-transparent !p-0 text-sm leading-[1.7]"
          data-testid="ai-chat-message-content"
        >
          <MessageResponse v-if="textContent" :content="textContent" />
          <!-- 等待首个 token:状态机延迟显示加载态，超时提示响应较慢，避免闪烁与永久等待 -->
          <div v-if="wait.visible" class="text-muted-foreground flex items-center gap-2 py-1 text-xs" data-testid="ai-chat-wait" role="status">
            <Loader :size="16" />
            <span v-if="wait.stalled">响应较慢，仍在等待模型输出…</span>
          </div>
        </MessageContent>
      </template>

      <p v-if="message.stopped" class="text-muted-foreground text-xs" role="status">{{ $t('aiChat.ui.generationStopped') }}</p>

      <!-- 知识库证据 chip：悬浮预览切片原文，点击跳转工作台 -->
      <EvidenceCitations v-if="!isUser() && hasEvidence" :citations="message.citations" :expanded-citations="message.expandedCitations" />

      <!-- 工具调用过程(结构化,可折叠查看入参/结果) -->
      <div v-if="!isUser() && toolParts.length > 0" class="space-y-2" data-testid="ai-chat-tool-events">
        <Tool v-for="part in toolParts" :key="part.toolCallId" class="text-xs">
          <ToolHeader type="dynamic-tool" :state="part.state" :tool-name="part.toolName || part.toolCallId" class="rounded-md" />
          <ToolContent>
            <ToolInput v-if="part.input" :input="part.input" />
            <ToolOutput :output="part.output" :error-text="part.errorText" />
          </ToolContent>
        </Tool>
      </div>

      <!-- clarify 选项卡片 -->
      <div
        v-if="!isUser() && message.clarify && message.clarify.options.length > 0"
        class="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/40"
      >
        <div class="mb-1.5 text-xs font-medium text-blue-800 dark:text-blue-300">{{ message.clarify.question }}</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="opt in message.clarify.options"
            :key="opt"
            :disabled="readOnly || !!message.clarify.resolvedOption"
            class="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs text-blue-700 transition-colors hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed dark:border-blue-800 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-900/60"
            :class="{ '!border-blue-500 !bg-blue-500 !text-white': message.clarify.resolvedOption === opt }"
            @click="emit('clarifySelect', opt)"
          >
            {{ opt }}
          </button>
        </div>
        <div v-if="message.clarify.resolvedOption" class="mt-1.5 text-[11px] text-blue-600 dark:text-blue-400">
          {{ $t('aiChat.ui.selected') }}{{ message.clarify.resolvedOption }}
        </div>
      </div>

      <!-- 操作按钮 (仅 AI 消息) -->
      <MessageActions
        v-if="!isUser() && textContent && !message.isLoading"
        class="text-muted-foreground opacity-70 transition-opacity focus-within:opacity-100 hover:opacity-100"
      >
        <MessageAction :tooltip="copied ? $t('aiChat.ui.copied') : $t('aiChat.ui.copy')" :label="copied ? $t('aiChat.ui.copied') : $t('aiChat.ui.copy')" @click="copyText">
          <VbenIcon :icon="copied ? 'lucide:check' : 'lucide:copy'" class="size-3" />
        </MessageAction>
        <MessageAction v-if="regenerable && !readOnly" :tooltip="$t('aiChat.ui.regenerate')" :label="$t('aiChat.ui.regenerate')" data-testid="ai-chat-regenerate" @click="emit('regenerate')">
          <VbenIcon icon="lucide:refresh-cw" class="size-3" />
        </MessageAction>
      </MessageActions>

      <div
        v-if="!isUser() && message.confidenceBand === 'low'"
        class="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <div class="mb-1 font-medium text-amber-900 dark:text-amber-200">{{ $t('aiChat.ui.searchPrompts') }}</div>
        <div>{{ $t('aiChat.ui.theCurrentHitEvidenceIsWeakAndTheAnswerHasBeenGe') }}</div>
      </div>

      <div
        v-else-if="!isUser() && message.searchStatus === 'empty'"
        class="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400"
        data-testid="ai-chat-search-empty"
      >
        <div class="mb-1 font-medium text-slate-700 dark:text-slate-300">{{ $t('aiChat.ui.knowledgeRetrievalResults') }}</div>
        <div v-if="searchEmpty.kind === 'below-threshold'">
          {{ $t('aiChat.ui.searchBelowThresholdWithCandidates', { count: searchEmpty.candidateCount }) }}
        </div>
        <div v-else>{{ $t('aiChat.ui.searchEmptyNoResults') }}</div>
      </div>
    </div>
  </Message>
</template>

<style scoped>
.ai-workspace-prose :deep(pre),
.ai-workspace-prose :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
.ai-workspace-prose :deep(p) {
  overflow-wrap: anywhere;
  line-height: 1.7;
}
.ai-workspace-prose :deep(h1),
.ai-workspace-prose :deep(h2),
.ai-workspace-prose :deep(h3) {
  margin-top: 1.3em;
  font-weight: 600;
}
</style>
