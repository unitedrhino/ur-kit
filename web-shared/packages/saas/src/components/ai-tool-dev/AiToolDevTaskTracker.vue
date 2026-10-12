<!-- 文件说明：紧凑任务进度摘要与可折叠明细，默认收起，保留真实任务状态和缺失描述提示。 -->
<script lang="ts" setup>
import { computed, ref, useId } from 'vue';

import type { TodoItem } from './api';

defineOptions({ name: 'AiToolDevTaskTracker' });

/** 接收任务计划及生成状态，不触发业务请求。 */
const props = defineProps<{
  /** 当前生成轮次状态，用于连接中断后终止进度动画并显示明确失败态。 */
  executionStatus?: 'completed' | 'failed' | 'idle' | 'running' | 'waiting';
  /** AI 返回的任务计划。 */
  tasks: TodoItem[];
}>();

/** 展开状态由用户控制；流式更新不抢占用户的展开/收起选择。 */
const expanded = ref(false);
/** 每个面板独立的明细标识，供读屏器关联控制按钮。 */
const detailsId = useId();

/** 已完成任务数量，仅根据服务端任务状态统计。 */
const completedCount = computed(() => props.tasks.filter((t) => t.status === 'completed').length);
/** 计划中的任务总数。 */
const totalCount = computed(() => props.tasks.length);
/** 当前执行步骤，用于收起时显示真实进度。 */
const inProgressTask = computed(() => props.tasks.find((t) => t.status === 'in_progress'));

/** 进度摘要；连接中断优先显示失败，不能伪装为完成。 */
const progressText = computed(() => {
  if (totalCount.value === 0) {
    return 'AI 将根据你的需求自动生成任务计划...';
  }
  const ratio = `${completedCount.value}/${totalCount.value}`;
  if (props.executionStatus === 'failed') {
    const task = inProgressTask.value;
    return `生成已中断${task ? ` · ${getDisplayText(task)}` : ''}`;
  }
  if (inProgressTask.value) {
    return `${ratio} · ${getDisplayText(inProgressTask.value)}`;
  }
  if (completedCount.value === totalCount.value) {
    return `${ratio} · 已完成所有任务`;
  }
  return `${ratio} · 等待开始`;
});

/** getEffectiveStatus 在整轮失败时把未结束任务切为失败展示，避免残留运行中动画。 */
function getEffectiveStatus(task: TodoItem): TodoItem['status'] {
  if (props.executionStatus === 'failed' && task.status === 'in_progress') {
    return 'failed';
  }
  return task.status;
}

/** 返回静态状态图标，进行中使用独立加载指示。 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '';
    case 'failed':
      return '❌';
    default:
      return '○';
  }
}

/** 使用主题语义颜色区分运行、完成与失败状态。 */
function getStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-foreground';
    case 'in_progress':
      return 'text-primary font-medium';
    case 'failed':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

/** 保留任务描述；协议缺失文字时明确提示，不能呈现空行。 */
function getDisplayText(task: TodoItem): string {
  if (task.status === 'in_progress' && task.activeForm) {
    return task.activeForm;
  }
  return task.content?.trim() || task.activeForm?.trim() || '任务描述未提供';
}
</script>

<template>
  <div v-if="tasks.length > 0" class="ai-tool-task-tracker shrink-0 border-b px-3 py-2" :data-status="executionStatus || 'idle'">
    <button
      type="button"
      class="ai-tool-task-summary text-muted-foreground hover:bg-muted/50 focus-visible:ring-ring flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs outline-none focus-visible:ring-2"
      data-testid="ai-tool-task-summary"
      :aria-expanded="expanded"
      :aria-controls="detailsId"
      :title="progressText"
      @click="expanded = !expanded"
    >
      <svg aria-hidden="true" class="size-3.5 shrink-0" :class="{ 'rotate-90': expanded }" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 3 5 5-5 5" /></svg>
      <span class="min-w-0 flex-1 truncate">{{ progressText }}</span>
      <span class="shrink-0">{{ expanded ? '收起' : '展开' }}</span>
    </button>
    <div v-if="expanded" :id="detailsId" class="ai-tool-task-details mt-2 max-h-48 space-y-2 overflow-y-auto px-2 pb-1" data-testid="ai-tool-task-details" role="list" aria-label="任务明细">
      <div v-for="task in tasks" :key="task.id" role="listitem" class="flex items-start gap-2 text-xs" :class="getStatusClass(getEffectiveStatus(task))">
        <span v-if="getEffectiveStatus(task) === 'in_progress'" aria-label="进行中" class="i-lucide:loader-circle text-primary mt-0.5 inline-block size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
        <span v-else class="shrink-0">{{ getStatusIcon(getEffectiveStatus(task)) }}</span>
        <span class="min-w-0 whitespace-pre-wrap break-words leading-5 [overflow-wrap:anywhere]">{{ getDisplayText(task) }}</span>
      </div>
    </div>
  </div>
</template>
