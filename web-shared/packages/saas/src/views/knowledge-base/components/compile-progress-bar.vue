<!-- 文件说明：编译任务常驻状态区，聚合进行中进度、失败警告条与失败文档列表；失败原因以错误色突出。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { KnowledgeCompileStatusResp, KnowledgeItem, KnowledgeTreeNode } from '../data';

import { computed, ref } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { LoaderCircle } from 'lucide-vue-next';

import { Api } from '../index.api';
import { getErrorMessage } from '../workbench';
import { useDialogWidth } from './dialog-resize';
import DialogResizeHandle from './dialog-resize-handle.vue';

const props = withDefaults(defineProps<Props>(), {
  canWrite: false,
  knowledge: null,
  retryLoading: false,
  status: null,
});

/** 组件负责失败文档加载与批量操作；重试提交与统计刷新由工作台壳层协调。 */
const emit = defineEmits<{
  /** 批量删除或重试提交完成，壳层统一刷新树、统计与库信息。 */
  changed: [];
  /** 失败文档列表加载失败，由壳层写入头部错误条。 */
  error: [message: string];
  /** 打开失败文档，壳层写入 URL 并回到内容页。 */
  openDocument: [node: KnowledgeTreeNode];
  /** 重试失败文档请求，壳层核验权限后提交。 */
  retryFailed: [];
}>();

interface Props {
  /** 是否允许重试操作。 */
  canWrite?: boolean;
  /** 当前知识库信息，提供 documentCount/failedDocumentCount 兜底。 */
  knowledge?: KnowledgeItem | null;
  /** 失败文档重试进行中，控制按钮状态。 */
  retryLoading?: boolean;
  /** get-status 编译统计，进行中任务与失败计数来源。 */
  status?: KnowledgeCompileStatusResp | null;
}

const failedDocsOpen = ref(false);
const failedDocs = ref<KnowledgeTreeNode[]>([]);
const failedDocsLoading = ref(false);
/** 失败列表弹层宽度记忆：错误原文较长，拖宽后刷新保持。 */
const { startResize: startFailedDocsResize, style: failedDocsDialogStyle } = useDialogWidth('kb-failed-docs', { defaultWidth: 672 });
/** 失败列表批量勾选：键为节点 ID。 */
const selectedFailedIDs = ref<number[]>([]);
const batchRetrying = ref(false);
const batchDeleting = ref(false);
const batchDeleteOpen = ref(false);

/** 全选状态：列表非空且全部勾选时为真，半选由 indeterminate 呈现。 */
const allFailedSelected = computed(() => failedDocs.value.length > 0 && selectedFailedIDs.value.length === failedDocs.value.length);
const selectedFailedNodes = computed(() => failedDocs.value.filter((node) => selectedFailedIDs.value.includes(node.id)));

/** toggleFailedChecked 勾选或取消单个失败文档。 */
function toggleFailedChecked(id: number, checked: boolean) {
  selectedFailedIDs.value = checked ? [...selectedFailedIDs.value, id] : selectedFailedIDs.value.filter((value) => value !== id);
}

/** toggleAllFailed 全选或清空当前失败列表。 */
function toggleAllFailed(checked: boolean) {
  selectedFailedIDs.value = checked ? failedDocs.value.map((node) => node.id) : [];
}

/** batchRetrySelected 对勾选文档逐个提交重试；单个失败不中断其余提交。 */
async function batchRetrySelected() {
  if (!props.canWrite || batchRetrying.value) return;
  const nodes = selectedFailedNodes.value;
  if (nodes.length === 0) return;
  batchRetrying.value = true;
  let failedCount = 0;
  for (const node of nodes) {
    try {
      await Api.retryCompile(props.status?.knowledgeID || props.knowledge?.id || 0, 'all', { documentID: node.id });
    } catch {
      failedCount++;
    }
  }
  batchRetrying.value = false;
  if (failedCount > 0) emit('error', $t('knowledgeBase.text_fc908cfd6fb1', { arg0: failedCount }));
  selectedFailedIDs.value = [];
  emit('changed');
}

/** confirmBatchDelete 逐个删除勾选失败文档，完成后刷新列表并请求壳层刷新。 */
async function confirmBatchDelete() {
  if (batchDeleting.value) return;
  batchDeleting.value = true;
  let deletedCount = 0;
  for (const node of selectedFailedNodes.value) {
    try {
      await Api.deleteNode(node.id);
      deletedCount++;
    } catch (error) {
      emit('error', getErrorMessage(error, $t('knowledgeBase.text_f90f11218658', { arg0: node.name })));
    }
  }
  batchDeleting.value = false;
  batchDeleteOpen.value = false;
  selectedFailedIDs.value = [];
  if (deletedCount > 0) {
    await openFailedDocuments();
    emit('changed');
  }
}

/** 任务是否处于编译进行中，控制常驻进度条展示。 */
const taskRunning = computed(() => ['pending', 'processing'].includes(props.status?.currentTask?.status || ''));
const documentCount = computed(() => props.status?.documentCount ?? props.knowledge?.documentCount ?? 0);
const compiledDocumentCount = computed(() => props.status?.compiledDocumentCount ?? props.knowledge?.compiledDocumentCount ?? 0);
const failedCount = computed(() => props.status?.failedDocumentCount ?? props.knowledge?.failedDocumentCount ?? 0);
/** 进度百分比按已完成文档数计算，无文档时不显示进度条。 */
const progressPercent = computed(() => (documentCount.value > 0 ? Math.min(100, Math.round((compiledDocumentCount.value / documentCount.value) * 100)) : 0));
/** 关联阶段独立于文档编译，异常或未完成时在进度条上提示。 */
const relationNotice = computed(() => {
  const status = props.status?.relationStatus;
  if (!status || status === 'success' || status === 'notApplicable') return null;
  return { failed: status === 'failed', label: relationNoticeLabel(status) };
});

/** relationNoticeLabel 映射关联阶段的进行中提示文案。 */
function relationNoticeLabel(status: string) {
  return (
    (
      {
        deferred: $t('knowledgeBase.text_99544c3e3eb8'),
        failed: $t('knowledgeBase.text_29938becd0f0'),
        pending: $t('knowledgeBase.text_3f4f0abbaacd'),
        processing: $t('knowledgeBase.text_8ebc1db500c7'),
      } as Record<string, string>
    )[status] ?? $t('knowledgeBase.text_d5bbfc56c680', { arg0: status })
  );
}

/** openFailedDocuments 按需加载失败文档列表，重开时清空上一轮勾选。 */
async function openFailedDocuments() {
  failedDocsOpen.value = true;
  failedDocsLoading.value = true;
  selectedFailedIDs.value = [];
  try {
    const response = await Api.getFailedDocuments(props.status?.knowledgeID || props.knowledge?.id || 0, 1, 100);
    failedDocs.value = response.list ?? [];
  } catch (error) {
    failedDocs.value = [];
    failedDocsOpen.value = false;
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_a6cc12046f47')));
  } finally {
    failedDocsLoading.value = false;
  }
}

/** openFailedDocument 打开失败文档并返回内容页。 */
function openFailedDocument(node: KnowledgeTreeNode) {
  failedDocsOpen.value = false;
  emit('openDocument', node);
}

defineExpose({ openFailedDocuments });
</script>
<template>
  <div v-if="taskRunning" class="border-primary/30 bg-primary/5 text-foreground shrink-0 border-b px-4 py-2 text-sm">
    <div class="flex flex-wrap items-center gap-2">
      <LoaderCircle class="text-primary size-4 shrink-0 animate-spin" />
      <span class="font-medium">{{ $t('knowledgeBase.text_98df682d1d51') }}</span>
      <span class="text-muted-foreground">{{ $t('knowledgeBase.progressCompleted', { done: compiledDocumentCount, total: documentCount }) }}</span>
      <Badge v-if="failedCount > 0" variant="destructive" class="shrink-0">{{ $t('knowledgeBase.failedCount', { count: failedCount }) }}</Badge>
      <Badge v-if="relationNotice" variant="outline" :class="relationNotice.failed ? 'border-destructive/40 text-destructive shrink-0' : 'shrink-0'">
        {{ relationNotice.label }}
      </Badge>
      <span class="text-muted-foreground ml-auto text-xs">{{ progressPercent }}%</span>
    </div>
    <div class="bg-muted/40 mt-2 h-1.5 overflow-hidden rounded-full">
      <div class="bg-primary h-full rounded-full transition-all" :style="{ width: `${progressPercent}%` }"></div>
    </div>
    <!-- 失败原因错误文案突出：编译任务的最新错误信息用错误色完整展示，不折叠省略。 -->
    <p v-if="status?.currentTask?.errorMessage" class="text-destructive mt-2 break-all text-xs">
      {{ status.currentTask.errorMessage }}
    </p>
  </div>

  <div
    v-if="failedCount > 0"
    class="border-warning/30 bg-warning/10 text-foreground flex min-h-10 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-1.5 text-sm"
  >
    <span class="font-medium">{{ $t('knowledgeBase.failedSummary', { count: failedCount }) }}</span>
    <div class="ml-auto flex items-center gap-2">
      <Button variant="ghost" size="sm" class="kb-control h-8" @click="openFailedDocuments">{{ $t('knowledgeBase.text_ceb0935bfcc6') }}</Button>
      <Button v-if="canWrite" variant="outline" size="sm" class="kb-control bg-background h-8" :disabled="retryLoading" @click="emit('retryFailed')">
        <LoaderCircle v-if="retryLoading" class="size-3 animate-spin" /> {{ $t('knowledgeBase.text_64c49fe74ffc') }}
      </Button>
    </div>
  </div>

  <Dialog :open="failedDocsOpen" @update:open="failedDocsOpen = $event">
    <DialogContent class="kb-ui relative max-h-[80vh] overflow-auto p-6" :style="failedDocsDialogStyle">
      <DialogHeader>
        <DialogTitle>{{ $t('knowledgeBase.text_79658c1c6dd4') }}</DialogTitle>
        <DialogDescription>{{ $t('knowledgeBase.text_7b6d3df6670c') }}</DialogDescription>
      </DialogHeader>
      <div v-if="failedDocsLoading" class="text-muted-foreground flex justify-center py-8 text-sm">
        <LoaderCircle class="mr-2 size-4 animate-spin" /> {{ $t('knowledgeBase.text_ce56f617e402') }}
      </div>
      <template v-else>
        <!-- 批量操作条：勾选即现，操作粒度与目录树一致。 -->
        <div
          v-if="canWrite && failedDocs.length > 0"
          class="bg-muted/40 border-border flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
          data-testid="kb-failed-batch-bar"
        >
          <label class="flex cursor-pointer items-center gap-1.5 text-xs">
            <Checkbox :checked="allFailedSelected" @update:checked="toggleAllFailed(Boolean($event))" /> {{ $t('knowledgeBase.text_3e44b2a93338') }}
          </label>
          <span class="text-muted-foreground text-xs">{{
            selectedFailedIDs.length > 0 ? $t('knowledgeBase.text_70d5c801163c', { arg0: selectedFailedIDs.length }) : ''
          }}</span>
          <div v-if="selectedFailedIDs.length > 0" class="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" class="kb-control h-7 text-xs" :disabled="batchRetrying" @click="batchRetrySelected">
              <LoaderCircle v-if="batchRetrying" class="size-3 animate-spin" /> {{ $t('knowledgeBase.text_f397fa1c2a51') }}
            </Button>
            <Button variant="destructive" size="sm" class="kb-control h-7 text-xs" :disabled="batchDeleting" @click="batchDeleteOpen = true">
              {{ $t('knowledgeBase.text_362aedce377d') }}
            </Button>
          </div>
        </div>
        <div class="space-y-2">
          <div
            v-for="node in failedDocs"
            :key="node.id"
            class="hover:bg-muted/30 flex items-start gap-2 rounded-lg border p-3"
            :class="selectedFailedIDs.includes(node.id) ? 'border-primary/40' : ''"
          >
            <Checkbox
              v-if="canWrite"
              class="mt-0.5"
              :checked="selectedFailedIDs.includes(node.id)"
              :aria-label="$t('knowledgeBase.text_6aee2c44dd6f', { arg0: node.name })"
              @update:checked="toggleFailedChecked(node.id, Boolean($event))"
            />
            <button type="button" class="min-w-0 flex-1 text-left" @click="openFailedDocument(node)">
              <div class="text-sm font-medium">{{ node.name }}</div>
              <div class="text-muted-foreground mt-1 truncate text-xs">{{ node.path }}</div>
              <!-- 失败原因错误文案突出：每条失败文档的最近错误原文展示。 -->
              <div class="text-destructive mt-1 text-xs">{{ node.lastError || $t('knowledgeBase.text_5f76edc5de7b') }}</div>
            </button>
          </div>
        </div>
      </template>
      <DialogResizeHandle @resize-start="startFailedDocsResize" />
    </DialogContent>
  </Dialog>

  <Dialog :open="batchDeleteOpen" @update:open="batchDeleteOpen = $event">
    <DialogContent class="kb-ui p-6 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('knowledgeBase.text_c5c28966b24e') }}</DialogTitle>
        <DialogDescription
          >{{ $t('knowledgeBase.confirmFailedBatchDelete', { count: selectedFailedIDs.length }) }}</DialogDescription
        >
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="batchDeleteOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
        <Button variant="destructive" :disabled="batchDeleting" @click="confirmBatchDelete" class="kb-control">{{
          $t('knowledgeBase.text_3c06abe11651')
        }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
