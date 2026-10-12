<!-- 文件说明：文档工作区面板，聚合文档工具栏、原文件/解析阅读/关联三视图与高级信息弹窗；详情数据由工作台壳层受控下发。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { CitationLocateResult } from '../citation-locate';
import type { KnowledgeDetail } from '../data';
import type { KnowledgeDocumentView, KnowledgeWorkbenchTab } from '../workbench';

import { computed, defineAsyncComponent, ref } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent } from '@unitedrhino/saas-ui/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Tabs, TabsList, TabsTrigger } from '@unitedrhino/saas-ui/ui/tabs';
import { Crosshair, FileText, LoaderCircle, MoreHorizontal, PanelLeft } from 'lucide-vue-next';

import { statusLabel } from '../data';
import { knowledgeStatusClass } from '../workbench';
import { useDialogWidth } from './dialog-resize';
import DialogResizeHandle from './dialog-resize-handle.vue';
import ProcessingStages from './processing-stages.vue';

const props = withDefaults(defineProps<Props>(), {
  canWrite: false,
  /** 引用定位三态反馈；空表示当前无定位请求。 */
  citationLocate: null,
  /** 存在待处理的引用定位请求（消费后未随切文档失效）；PDF 据此激活内置定位视图。 */
  citationPending: false,
  /** PDF 定位的先验页（0 基），来自检索命中的 pageIdx。 */
  citationPageIndex: undefined,
  /** 兜底引文前缀，PDF 文本层匹配使用。 */
  citationQuote: '',
  detail: null,
  detailError: '',
  detailLoading: false,
  directoryVisible: true,
  folder: '',
  parsedError: '',
  parsedLoading: false,
  parsedText: '',
  pendingCount: 0,
  retryError: '',
  retrying: false,
  sourcePreviewURL: '',
});
/** 面板只承载当前文档的展示与视图切换；详情加载、URL 导航与统计刷新由工作台壳层协调。 */
const emit = defineEmits<{
  /** 字段引用变化，壳层据此刷新失效角标。 */
  changed: [];
  /** PDF 定位预览产出的三态反馈，壳层统一展示与记录。 */
  locateDetected: [result: CitationLocateResult];
  /** 处理结果刷新请求，壳层统一刷新统计与目录。 */
  refresh: [];
  /** 解析全文重新加载请求。 */
  reloadParsed: [];
  /** 高级处理阶段重试请求，壳层确认后按当前文档提交。 */
  retryStage: [stage: string];
  /** 切换目录展开或打开临时侧栏。 */
  toggleDirectory: [];
  /** 文档视图切换（v-model:preview-mode）。 */
  'update:previewMode': [view: KnowledgeDocumentView];
}>();
/** 视图按真正进入加载，避免默认原文件携带关系和高级调试组件。 */
const DocumentReading = defineAsyncComponent(() => import('../document-reading.vue'));
const DocumentRelations = defineAsyncComponent(() => import('../document-relations.vue'));
const ProcessingResults = defineAsyncComponent(() => import('../processing-results.vue'));
/** PDF 引用定位预览仅在带定位请求的 PDF 上加载，常规打开仍走 @file-viewer。 */
const PdfLocateViewer = defineAsyncComponent(() => import('./pdf-locate-viewer.vue'));

interface Props {
  /** 是否允许文档级操作（下载源文件、高级处理重试）。 */
  canWrite?: boolean;
  /** 证据引用定位三态反馈（精确/仅页/未找到），显示在文档名下方。 */
  citationLocate?: CitationLocateResult | null;
  /** PDF 定位的先验页（0 基）。 */
  citationPageIndex?: number;
  /** 存在待处理的引用定位请求（消费后未随切文档失效）；PDF 据此激活内置定位视图。 */
  citationPending?: boolean;
  /** 兜底引文前缀，PDF 文本层匹配使用。 */
  citationQuote?: string;
  /** 当前文档详情，空表示未选择或加载失败。 */
  detail?: KnowledgeDetail | null;
  /** 详情加载失败文案。 */
  detailError?: string;
  /** 详情加载中占位。 */
  detailLoading?: boolean;
  /** 目录常驻可见性，控制收起按钮的无障碍标注。 */
  directoryVisible?: boolean;
  /** 文档工具栏中的父目录展示路径。 */
  folder?: string;
  /** 解析全文加载失败文案。 */
  parsedError?: string;
  /** 解析全文加载中占位。 */
  parsedLoading?: boolean;
  /** 源文件解析全文。 */
  parsedText?: string;
  /** 字段引用失效数量，透传给关联视图提示条。 */
  pendingCount?: number;
  /** URL 归一化后的文档视图（v-model:preview-mode）。 */
  previewMode: KnowledgeDocumentView;
  /** 高级处理重试错误文案。 */
  retryError?: string;
  /** 高级处理重试进行中。 */
  retrying?: boolean;
  /** 原文预览签名地址，空表示无预览。 */
  sourcePreviewURL?: string;
  /** 当前主导航 tab，解析全文仅在文档+阅读视图按需加载。 */
  workbenchTab: KnowledgeWorkbenchTab;
}

/** 本页目录下拉依赖阅读组件上报的章节列表；面板内部仅保存该展示状态。 */
const readingRef = ref<{ jump: (id: string) => void; sections: Array<{ id: string; label: string }> }>();
const documentActions = ref<HTMLElement>();
const directoryActions = ref<HTMLElement>();
const resultsOpen = ref(false);
const advancedSection = ref('chunks');
/** 高级信息弹层宽度记忆：拖宽后刷新保持，默认与原 max-width 一致。 */
const { startResize: startAdvancedResize, style: advancedDialogStyle } = useDialogWidth('kb-advanced-info', { defaultWidth: 960 });

const activeDocumentName = computed(() => props.detail?.document?.name || $t('knowledgeBase.text_777cbf94dccc'));
const activeDocumentPath = computed(() => props.detail?.document?.path || '');
/** isPdfDocument 按扩展名判断当前文档是否 PDF，决定定位请求走原文高亮还是解析正文。 */
const isPdfDocument = computed(() => /\.pdf$/i.test(activeDocumentPath.value || activeDocumentName.value));
/** pdfLocateActive 带定位请求的 PDF 走内置定位预览；激活依据是"存在待处理请求"本身——
 * 若依赖已上报的结果会死锁：viewer 不渲染→永不上报→结果恒空，深链定位整体失效。
 * viewer 挂载后自行按引文/页码匹配并经 locate-detected 上报三态，随后 citationLocate 才有值供工具栏展示。 */
const pdfLocateActive = computed(() => isPdfDocument.value && !!props.citationPending);
/** 定位反馈配色：精确=成功色，仅页=提示色，未找到=警示色。 */
const citationLocateClass = computed(() => {
  switch (props.citationLocate?.status) {
    case 'exact': {
      return 'text-green-600 dark:text-green-400';
    }
    case 'page': {
      return 'text-amber-600 dark:text-amber-400';
    }
    default: {
      return 'text-destructive';
    }
  }
});

/** openAdvanced 统一章节异常和更多菜单入口；打开不会触发处理请求。 */
function openAdvanced(section = 'chunks') {
  advancedSection.value = section;
  resultsOpen.value = true;
}

/** restoreActionFocus 模态面板关闭后回到仍在页面内的操作入口。 */
function restoreActionFocus(target: 'directory' | 'document') {
  (target === 'directory' ? directoryActions : documentActions).value?.querySelector('button')?.focus();
}

/** downloadSourceFile 在新窗口打开后端返回的源文件地址。 */
function downloadSourceFile() {
  if (!props.detail?.sourceDownloadURL) return;
  window.open(props.detail.sourceDownloadURL, '_blank', 'noopener,noreferrer');
}

defineExpose({
  /** focusDirectoryAction 目录临时侧栏关闭后把焦点还给目录开关按钮。 */
  focusDirectoryAction: () => restoreActionFocus('directory'),
  /** isDetailLive 高级信息弹窗打开或当前不在原文件视图时，编译轮询需要同步详情。 */
  isDetailLive: () => resultsOpen.value || props.previewMode !== 'source',
});
</script>
<template>
  <section class="kb-document bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
    <div class="kb-document-toolbar flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
      <div class="min-w-0 flex-1 basis-40">
        <div class="flex min-w-0 items-center gap-2">
          <FileText class="text-primary size-4 shrink-0" />
          <h2 class="truncate text-sm font-semibold">{{ activeDocumentName }}</h2>
          <Badge
            v-if="detail?.document?.compileStatus"
            variant="outline"
            class="shrink-0 whitespace-nowrap"
            :class="knowledgeStatusClass(detail.document.compileStatus)"
          >
            {{ statusLabel(detail.document.compileStatus) }}
          </Badge>
        </div>
        <div v-if="citationLocate" class="mt-1 flex min-w-0 items-center gap-1 text-xs" :class="citationLocateClass" data-testid="citation-locate-feedback">
          <Crosshair class="size-3 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ citationLocate.message }}</span>
        </div>
        <div v-else-if="folder" class="text-muted-foreground mt-1 truncate text-xs" :title="folder">
          {{ folder }}
        </div>
      </div>
      <div class="flex max-w-full flex-wrap items-center gap-2">
        <Tabs :model-value="previewMode" @update:model-value="emit('update:previewMode', $event as KnowledgeDocumentView)">
          <TabsList class="h-8">
            <TabsTrigger value="source" class="h-7">{{ $t('knowledgeBase.text_4b87fd67bbc7') }}</TabsTrigger>
            <TabsTrigger value="reading" class="h-7">{{ $t('knowledgeBase.text_aaf049401cbb') }}</TabsTrigger>
            <TabsTrigger value="relations" class="h-7">{{ $t('knowledgeBase.text_757fb196dce9') }}</TabsTrigger>
          </TabsList>
        </Tabs>
        <span ref="directoryActions">
          <Button
            variant="ghost"
            size="icon"
            class="kb-control size-8"
            :aria-label="directoryVisible ? $t('knowledgeBase.text_3dd15592c49a') : $t('knowledgeBase.text_863a3341e3a2')"
            :aria-expanded="directoryVisible"
            @click="emit('toggleDirectory')"
          >
            <PanelLeft class="size-4" />
          </Button>
        </span>
        <DropdownMenu v-if="previewMode === 'reading' && readingRef?.sections.length">
          <DropdownMenuTrigger as-child
            ><Button variant="ghost" size="sm" class="kb-control">{{ $t('knowledgeBase.text_41370da1ef45') }}</Button></DropdownMenuTrigger
          >
          <DropdownMenuContent align="end" @close-auto-focus.prevent>
            <DropdownMenuItem v-for="section in readingRef.sections" :key="section.id" @select="readingRef?.jump(section.id)">
              {{ section.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span ref="documentActions">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="icon" class="kb-control size-8" :aria-label="$t('knowledgeBase.text_ecef1e23c4ee')" :disabled="!detail">
                <MoreHorizontal class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem :disabled="!detail?.sourceDownloadURL" @select="downloadSourceFile">{{
                $t('knowledgeBase.text_49fff7ff2403')
              }}</DropdownMenuItem>
              <DropdownMenuItem @select="openAdvanced()">{{ $t('knowledgeBase.text_57109d2d3250') }}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>
    </div>

    <!-- 分阶段时间线为文档详情一级区块：失败阶段一键重试直达，不再需要进三层弹窗。 -->
    <ProcessingStages v-if="detail" :can-retry="canWrite" :detail="detail" :retrying="retrying" @retry="emit('retryStage', $event)" />

    <div class="kb-preview-region bg-muted/20 relative h-[max(360px,60dvh)] min-h-0 flex-none overflow-hidden lg:h-auto lg:flex-1">
      <div v-if="detailLoading" class="bg-background/70 text-muted-foreground absolute inset-0 z-10 flex items-center justify-center text-sm">
        <LoaderCircle class="mr-2 size-4 animate-spin" /> {{ $t('knowledgeBase.text_ce56f617e402') }}
      </div>
      <div v-if="detailError" class="border-destructive/30 bg-destructive/10 text-destructive m-4 rounded-md border p-3 text-sm">
        {{ detailError }}
      </div>
      <Empty v-else-if="!detail" class="h-full min-h-80">
        <EmptyHeader>
          <FileText class="text-muted-foreground mx-auto size-8" />
          <EmptyTitle>{{ $t('knowledgeBase.text_2a70fd3f5353') }}</EmptyTitle>
          <EmptyDescription>{{ $t('knowledgeBase.text_f649ba775239') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <div v-else-if="previewMode === 'source' && pdfLocateActive" class="h-full min-h-0" data-testid="pdf-locate-active">
        <PdfLocateViewer
          :key="sourcePreviewURL"
          :filename="activeDocumentName"
          :page-index="citationPageIndex"
          :quote="citationQuote"
          :url="sourcePreviewURL"
          class="bg-background block h-full min-h-0 w-full overflow-hidden"
          @located="emit('locateDetected', $event)"
        />
      </div>
      <div v-else-if="previewMode === 'source'" class="h-full min-h-0">
        <slot name="source" :filename="activeDocumentName" :path="activeDocumentPath"></slot>
      </div>
      <DocumentReading
        v-else-if="previewMode === 'reading'"
        :key="detail.document.id"
        ref="readingRef"
        :can-write="canWrite"
        :detail="detail"
        :highlight="
          citationLocate?.status === 'exact' && citationLocate.charStart !== undefined
            ? { charEnd: citationLocate.charEnd ?? citationLocate.charStart, charStart: citationLocate.charStart }
            : undefined
        "
        :source-u-r-l="sourcePreviewURL"
        :text="parsedText"
        :error="parsedError"
        :loading="parsedLoading"
        @changed="emit('changed')"
        @retry="emit('reloadParsed')"
        @advanced="openAdvanced('status')"
      />
      <DocumentRelations
        v-else
        :key="detail.document.id"
        :can-write="canWrite"
        :detail="detail"
        :pending-count="pendingCount"
        @advanced="openAdvanced('status')"
        @changed="emit('changed')"
      />
    </div>

    <Dialog v-model:open="resultsOpen">
      <DialogContent
        class="kb-ui relative flex h-[85dvh] max-h-[85dvh] flex-col gap-0 overflow-hidden p-0"
        :style="advancedDialogStyle"
        @close-auto-focus.prevent="restoreActionFocus('document')"
      >
        <ProcessingResults
          v-if="resultsOpen && detail"
          :detail="detail"
          :initial-section="advancedSection"
          :can-retry="canWrite"
          :retrying="retrying"
          :retry-error="retryError"
          @retry="emit('retryStage', $event)"
          @refresh="emit('refresh')"
        />
        <DialogResizeHandle @resize-start="startAdvancedResize" />
      </DialogContent>
    </Dialog>
  </section>
</template>
