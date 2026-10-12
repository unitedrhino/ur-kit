<!-- 文件说明：知识库分页列表，主操作仅保留进入与新建，其他能力收进更多菜单。 -->
<script setup lang="ts">
import { $t } from '../../locales';
import type { KnowledgeItem } from './data';
import type { KnowledgeScopeFilter } from './workbench';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@unitedrhino/saas-ui/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@unitedrhino/saas-ui/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { watchDebounced } from '@vueuse/core';
import { ArrowRight, BookOpen, Download, LoaderCircle, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-vue-next';

import { ListPagination } from '../../components/data-table-page';
import { useTaskPolling } from '../../hooks/use-task-polling';
import { useToast } from '../../hooks/use-toast';
import { useDialogWidth } from './components/dialog-resize';
import DialogResizeHandle from './components/dialog-resize-handle.vue';
import { statusLabel } from './data';
import { Api } from './index.api';
import { buildKnowledgeBaseDetailPath } from './navigation';
import { canWriteKnowledge } from './workbench';

import './workbench.css';

interface Props {
  /** 详情页路由前缀。 */
  detailPathBase?: string;
  /** platform 管理平台公共库；tenant 管理企业自有库并只读查看平台共享库。 */
  mode?: 'platform' | 'tenant';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'platform',
  detailPathBase: '/ai-center/knowledge-base',
});

type ConfirmAction = 'delete' | 'export';

interface ExportTaskInfo {
  downloadURL?: string;
  errorMessage?: string;
  knowledgeName: string;
  status: string;
  taskID: number;
}

interface ImportTaskInfo {
  errorMessage?: string;
  importedCount?: number;
  knowledgeName: string;
  status: string;
  taskID: number;
}

const router = useRouter();
const { toast } = useToast();
const items = ref<KnowledgeItem[]>([]);
const listLoading = ref(false);
const keyword = ref('');
const scopeFilter = ref<KnowledgeScopeFilter>('all');
/** 分页状态：翻页、搜索和归属筛选均由后端 KnowledgeGetListReq 承载，摆脱全量拉取截断。 */
const currentPage = ref(1);
const pageSize = 12;
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const statusError = ref('');
const rowActionKey = ref('');
const editorOpen = ref(false);
/** 编辑知识库弹层宽度记忆：长描述表单拖宽后刷新保持。 */
const { startResize: startEditorResize, style: editorDialogStyle } = useDialogWidth('kb-editor', { defaultWidth: 512 });
const editorLoading = ref(false);
const editorForm = ref({ desc: '', id: 0, name: '' });
const confirmOpen = ref(false);
const confirmAction = ref<ConfirmAction>('delete');
const confirmTarget = ref<KnowledgeItem | null>(null);
const zipImportInput = ref<HTMLInputElement | null>(null);
const zipImportTargetId = ref(0);
const exportOpen = ref(false);
const exportTask = ref<ExportTaskInfo | null>(null);
const importOpen = ref(false);
const importTask = ref<ImportTaskInfo | null>(null);
const previousStatuses = ref<Record<number, string>>({});
let exportPollTimer: null | ReturnType<typeof setTimeout> = null;
let importPollTimer: null | ReturnType<typeof setTimeout> = null;
/** 列表轮询收敛到 useTaskPolling：处理中启动、页面不可见暂停，SSE 接入后仅替换刷新来源。 */
const { start: startListPolling, stop: stopListPolling } = useTaskPolling(() => loadList());

/** canWrite 对齐后端公共库权限，企业端平台共享库默认只读。 */
function canWrite(item: KnowledgeItem) {
  return canWriteKnowledge(item, props.mode);
}

/** buildListFilter 组装后端筛选条件：名称搜索与租户端归属过滤。 */
function buildListFilter() {
  const formValues: Record<string, any> = {};
  const normalizedKeyword = keyword.value.trim();
  if (normalizedKeyword) formValues.name = normalizedKeyword;
  if (props.mode === 'tenant' && scopeFilter.value !== 'all') {
    // 归属按钮组映射到后端 scope：我的=租户库，平台共享=平台公共库
    formValues.scope = scopeFilter.value === 'mine' ? 'tenant' : 'platform';
  }
  return formValues;
}

/** getApiErrorMessage 统一提取请求错误文案。 */
function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  const data = (error as { data?: { message?: string; msg?: string } })?.data;
  return data?.message || data?.msg || fallback;
}

/** formatUpdatedTime 格式化知识库最后处理时间。 */
function formatUpdatedTime(timestamp?: number) {
  if (!timestamp) return $t('knowledgeBase.text_1ed82a3101bd');
  return new Date(timestamp * 1000).toLocaleString('zh-CN', { hour12: false });
}

/** statusBadgeClass 用语义色表达编译状态。 */
function statusBadgeClass(status?: string) {
  if (status === 'success') {
    return 'border-success/30 bg-success/10 text-foreground';
  }
  if (status === 'failed') return 'border-destructive/30 bg-destructive/10 text-foreground';
  if (status === 'processing') return 'border-primary/30 bg-primary/10 text-foreground';
  return 'border-border bg-muted/50 text-muted-foreground';
}

/** loadList 按当前页码与筛选条件加载知识库分页列表；删除或筛选收窄导致页码越界时回退末页。 */
async function loadList() {
  listLoading.value = true;
  statusError.value = '';
  try {
    const response = await Api.list(currentPage.value, pageSize, buildListFilter());
    const list = response.list ?? [];
    if (list.length === 0 && currentPage.value > 1) {
      currentPage.value = Math.max(1, Math.ceil((response.total ?? 0) / pageSize));
      return loadList();
    }
    items.value = list;
    total.value = response.total ?? 0;
  } catch (error) {
    statusError.value = getApiErrorMessage(error, $t('knowledgeBase.text_261dd18c8318'));
  } finally {
    listLoading.value = false;
  }
}

/** switchScope 切换租户端归属筛选并回到第一页重新查询。 */
function switchScope(scope: KnowledgeScopeFilter) {
  scopeFilter.value = scope;
  currentPage.value = 1;
  void loadList();
}

/** goPrev 查询上一页知识库。 */
function goPrev() {
  if (currentPage.value <= 1) return;
  currentPage.value -= 1;
  void loadList();
}

/** goNext 查询下一页知识库。 */
function goNext() {
  if (currentPage.value >= totalPages.value) return;
  currentPage.value += 1;
  void loadList();
}

/** openKnowledge 进入当前知识库的内容工作台。 */
function openKnowledge(id: number) {
  void router.push(buildKnowledgeBaseDetailPath(id, props.detailPathBase));
}

/** openCreateDialog 打开空白知识库表单。 */
function openCreateDialog() {
  editorForm.value = { desc: '', id: 0, name: '' };
  editorOpen.value = true;
}

/** openEditDialog 打开指定知识库的编辑表单。 */
function openEditDialog(item: KnowledgeItem) {
  editorForm.value = { desc: item.desc || '', id: item.id, name: item.name };
  editorOpen.value = true;
}

/** submitEditor 创建或更新知识库并立即刷新列表。 */
async function submitEditor() {
  if (!editorForm.value.name.trim()) {
    statusError.value = $t('knowledgeBase.text_c54e205f8c26');
    return;
  }
  editorLoading.value = true;
  try {
    if (editorForm.value.id) {
      await Api.update({
        desc: editorForm.value.desc.trim(),
        id: editorForm.value.id,
        name: editorForm.value.name.trim(),
      });
      toast({ title: $t('knowledgeBase.text_8b3c9401fad2'), type: 'success' });
    } else {
      await Api.create({
        desc: editorForm.value.desc.trim(),
        name: editorForm.value.name.trim(),
      });
      toast({ title: $t('knowledgeBase.text_b9428fe1d730'), type: 'success' });
    }
    editorOpen.value = false;
    await loadList();
  } catch (error) {
    statusError.value = getApiErrorMessage(error, $t('knowledgeBase.text_fbbc34fdb70f'));
  } finally {
    editorLoading.value = false;
  }
}

/** requestConfirmation 收集删除或导出二次确认的上下文。 */
function requestConfirmation(action: ConfirmAction, item: KnowledgeItem) {
  confirmAction.value = action;
  confirmTarget.value = item;
  confirmOpen.value = true;
}

/** runConfirmedAction 执行已确认的删除或 ZIP 导出。 */
async function runConfirmedAction() {
  const item = confirmTarget.value;
  if (!item) return;
  confirmOpen.value = false;
  if (confirmAction.value === 'delete') {
    rowActionKey.value = `delete:${item.id}`;
    try {
      await Api.delete(item.id);
      toast({ title: $t('knowledgeBase.text_afba31fcd6a8'), type: 'success' });
      await loadList();
    } catch (error) {
      statusError.value = getApiErrorMessage(error, $t('knowledgeBase.text_59134cf0e7ff'));
    } finally {
      rowActionKey.value = '';
    }
    return;
  }
  try {
    const response = await Api.exportZip(item.id);
    if (!response.taskID) throw new Error($t('knowledgeBase.text_062a3a47384e'));
    exportTask.value = {
      knowledgeName: item.name,
      status: 'pending',
      taskID: response.taskID,
    };
    exportOpen.value = true;
    startExportPoll(response.taskID, item.name);
  } catch (error) {
    statusError.value = getApiErrorMessage(error, $t('knowledgeBase.text_637f7490a5e2'));
  }
}

/** retryCompile 重试当前库的失败文档。 */
async function retryCompile(item: KnowledgeItem) {
  rowActionKey.value = `retry:${item.id}`;
  try {
    await Api.retryCompile(item.id, 'failed_only');
    toast({ title: $t('knowledgeBase.text_e34f24cd4c90'), type: 'success' });
    await loadList();
  } catch (error) {
    statusError.value = getApiErrorMessage(error, $t('knowledgeBase.text_cebf8a44cbd1'));
  } finally {
    rowActionKey.value = '';
  }
}

/** openZipImport 触发指定知识库的 ZIP 文件选择。 */
function openZipImport(item: KnowledgeItem) {
  zipImportTargetId.value = item.id;
  zipImportInput.value?.click();
}

/** handleZipImportFileChange 上传 ZIP 并启动导入任务轮询。 */
async function handleZipImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.zip')) {
    statusError.value = $t('knowledgeBase.text_dc563e107aac');
    return;
  }
  const item = items.value.find((candidate) => candidate.id === zipImportTargetId.value);
  importTask.value = {
    knowledgeName: item?.name || '',
    status: 'uploading',
    taskID: 0,
  };
  importOpen.value = true;
  try {
    const upload = await Api.uploadTempFile(file);
    const fileURL = upload.fileUri || upload.filePath;
    if (!fileURL) throw new Error($t('knowledgeBase.text_81989c431937'));
    const response = await Api.importZip(zipImportTargetId.value, fileURL);
    if (!response.taskID) throw new Error($t('knowledgeBase.text_58dc6f9f6716'));
    importTask.value = {
      knowledgeName: item?.name || '',
      status: 'processing',
      taskID: response.taskID,
    };
    startImportPoll(response.taskID, item?.name || '');
  } catch (error) {
    importTask.value = {
      ...importTask.value,
      errorMessage: getApiErrorMessage(error, $t('knowledgeBase.text_9db5d02ae8e0')),
      knowledgeName: item?.name || '',
      status: 'failed',
      taskID: importTask.value?.taskID || 0,
    };
  }
}

/** startExportPoll 轮询 ZIP 导出任务，最长等待五分钟。 */
function startExportPoll(taskID: number, knowledgeName: string) {
  let count = 0;
  const poll = async () => {
    count += 1;
    if (count > 150) {
      exportTask.value = { knowledgeName, status: 'timeout', taskID, errorMessage: $t('knowledgeBase.text_43edbcde3eab') };
      return;
    }
    try {
      const response = await Api.getExportStatus(taskID);
      exportTask.value = { downloadURL: response.downloadURL, knowledgeName, status: response.status, taskID };
      if (response.status !== 'success' && response.status !== 'failed') {
        exportPollTimer = setTimeout(poll, 2000);
      }
    } catch (error) {
      exportTask.value = { knowledgeName, status: 'failed', taskID, errorMessage: getApiErrorMessage(error, $t('knowledgeBase.text_bde021fa4b70')) };
    }
  };
  exportPollTimer = setTimeout(poll, 500);
}

/** startImportPoll 轮询 ZIP 导入任务，成功后刷新列表。 */
function startImportPoll(taskID: number, knowledgeName: string) {
  let count = 0;
  const poll = async () => {
    count += 1;
    if (count > 150) {
      importTask.value = { knowledgeName, status: 'timeout', taskID, errorMessage: $t('knowledgeBase.text_43edbcde3eab') };
      return;
    }
    try {
      const response = await Api.getExportStatus(taskID);
      importTask.value = {
        importedCount: response.importedCount,
        knowledgeName,
        status: response.status,
        taskID,
      };
      if (response.status === 'success') {
        await loadList();
      } else if (response.status !== 'failed') {
        importPollTimer = setTimeout(poll, 2000);
      }
    } catch (error) {
      importTask.value = { knowledgeName, status: 'failed', taskID, errorMessage: getApiErrorMessage(error, $t('knowledgeBase.text_07f658ecf001')) };
    }
  };
  importPollTimer = setTimeout(poll, 500);
}

/** downloadExport 使用后端签名地址下载导出包。 */
function downloadExport() {
  if (!exportTask.value?.downloadURL) return;
  window.open(exportTask.value.downloadURL, '_blank', 'noopener,noreferrer');
}

onMounted(() => void loadList());

/** 关键词输入防抖后回到第一页重新查询，由后端按名称检索。 */
watchDebounced(
  keyword,
  () => {
    currentPage.value = 1;
    void loadList();
  },
  { debounce: 300 },
);

watch(
  items,
  (nextItems) => {
    for (const item of nextItems) {
      const previous = previousStatuses.value[item.id];
      if (previous === 'processing' && item.status === 'success') {
        toast({ title: $t('knowledgeBase.text_07c01dc763b4', { arg0: item.name }), type: 'success' });
      }
      if (previous === 'processing' && item.status === 'failed') {
        toast({ title: $t('knowledgeBase.text_9024d26d5b27', { arg0: item.name }), type: 'warning' });
      }
    }
    previousStatuses.value = Object.fromEntries(nextItems.map((item) => [item.id, item.status]));
    const hasProcessing = nextItems.some((item) => item.status === 'processing');
    if (hasProcessing) startListPolling();
    else stopListPolling();
  },
  { deep: true, immediate: true },
);

onUnmounted(() => {
  if (exportPollTimer) clearTimeout(exportPollTimer);
  if (importPollTimer) clearTimeout(importPollTimer);
});
</script>

<template>
  <Page auto-content-height>
    <div class="kb-ui bg-background flex h-full min-h-0 flex-col gap-4 p-3 sm:p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-foreground text-base font-semibold">{{ $t('knowledgeBase.text_1dda51f9e350') }}</h1>
          <p class="text-muted-foreground mt-1 text-sm">{{ $t('knowledgeBase.text_23a3bf55389a') }}</p>
        </div>
        <Button @click="openCreateDialog" class="kb-control"> <Plus class="size-4" /> {{ $t('knowledgeBase.text_f93ee39a94c6') }} </Button>
      </div>

      <div class="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3">
        <div class="relative min-w-56 flex-1 sm:max-w-sm">
          <Search class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input v-model="keyword" class="h-8 pl-9" :placeholder="$t('knowledgeBase.text_89aa1f8b335a')" />
        </div>
        <div v-if="mode === 'tenant'" class="bg-background inline-flex rounded-md border p-1" :aria-label="$t('knowledgeBase.text_c1e20aa89a71')">
          <Button
            v-for="option in [
              { key: 'all', label: $t('knowledgeBase.text_778fc8f99453') },
              { key: 'mine', label: $t('knowledgeBase.text_a82c993d7388') },
              { key: 'shared', label: $t('knowledgeBase.text_b085853c0caf') },
            ]"
            :key="option.key"
            size="sm"
            :variant="scopeFilter === option.key ? 'secondary' : 'ghost'"
            @click="switchScope(option.key as KnowledgeScopeFilter)"
            class="kb-control"
          >
            {{ option.label }}
          </Button>
        </div>
      </div>

      <div v-if="statusError" class="border-destructive/30 bg-destructive/10 text-foreground rounded-md border px-3 py-2 text-sm">
        {{ statusError }}
      </div>

      <div v-if="listLoading && items.length === 0" class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        <LoaderCircle class="mr-2 size-4 animate-spin" /> {{ $t('knowledgeBase.text_ce56f617e402') }}
      </div>

      <Empty v-else-if="items.length === 0" class="bg-card flex-1 rounded-lg border">
        <EmptyHeader>
          <BookOpen class="text-muted-foreground mx-auto size-9" />
          <EmptyTitle>{{ keyword || scopeFilter !== 'all' ? $t('knowledgeBase.text_8ff35eff90c3') : $t('knowledgeBase.text_39671a4fac96') }}</EmptyTitle>
          <EmptyDescription>{{
            keyword || scopeFilter !== 'all' ? $t('knowledgeBase.text_7ebed53981c9') : $t('knowledgeBase.text_78594d34f555')
          }}</EmptyDescription>
        </EmptyHeader>
        <!-- 首次建库引导：无筛选无关键词时直通新建，筛选场景仅保留调整提示。 -->
        <Button v-if="!keyword && scopeFilter === 'all'" size="sm" class="kb-control mt-3" @click="openCreateDialog">
          <Plus class="size-4" /> {{ $t('knowledgeBase.text_f93ee39a94c6') }}
        </Button>
      </Empty>

      <div v-else class="flex min-h-0 flex-1 flex-col gap-4">
        <div class="grid min-h-0 flex-1 content-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card
            v-for="item in items"
            :key="item.id"
            class="kb-panel group flex min-h-52 flex-col rounded-lg shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <CardHeader class="p-4 pb-0">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <CardTitle class="truncate text-base">{{ item.name }}</CardTitle>
                  <p class="text-muted-foreground mt-2 line-clamp-2 min-h-10 text-sm leading-5">{{ item.desc || $t('knowledgeBase.text_4b64e784af01') }}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="kb-control size-8 shrink-0"
                      :aria-label="$t('knowledgeBase.text_f4b7d758a043', { arg0: item.name })"
                    >
                      <LoaderCircle v-if="rowActionKey.endsWith(`:${item.id}`)" class="size-4 animate-spin" />
                      <MoreHorizontal v-else class="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-44">
                    <DropdownMenuItem v-if="canWrite(item)" @click="openEditDialog(item)">
                      <Pencil class="mr-2 size-4" /> {{ $t('knowledgeBase.text_a7f814c0a40d') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="requestConfirmation('export', item)">
                      <Download class="mr-2 size-4" /> {{ $t('knowledgeBase.text_752f1ceb9690') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="canWrite(item)" @click="openZipImport(item)">
                      <Upload class="mr-2 size-4" /> {{ $t('knowledgeBase.text_cae2939c9a99') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-if="canWrite(item)" @click="retryCompile(item)">
                      <RefreshCw class="mr-2 size-4" /> {{ $t('knowledgeBase.text_2315cc66dbf1') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator v-if="canWrite(item)" />
                    <DropdownMenuItem v-if="canWrite(item)" class="text-destructive focus:text-destructive" @click="requestConfirmation('delete', item)">
                      <Trash2 class="mr-2 size-4" /> {{ $t('knowledgeBase.text_3755f56f2f83') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent class="flex-1 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="outline" :class="statusBadgeClass(item.status)">{{ statusLabel(item.status) }}</Badge>
                <Badge v-if="item.scope === 'platform'" variant="outline">{{ $t('knowledgeBase.text_b085853c0caf') }}</Badge>
                <span v-if="!canWrite(item)" class="text-muted-foreground text-xs">{{ $t('knowledgeBase.text_ffc1d065fb53') }}</span>
              </div>
              <div class="mt-4 flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ $t('knowledgeBase.text_1069127253fa') }}</span>
                <span class="text-foreground font-medium">{{ item.documentCount || 0 }}</span>
              </div>
              <div class="text-muted-foreground mt-2 flex items-center justify-between gap-3 text-xs">
                <span>{{ $t('knowledgeBase.text_093dea88c930') }}</span>
                <span class="truncate">{{ formatUpdatedTime(item.lastCompileTime) }}</span>
              </div>
            </CardContent>
            <CardFooter class="justify-end border-t px-4 py-3">
              <Button size="sm" @click="openKnowledge(item.id)" class="kb-control">
                {{ $t('knowledgeBase.text_0e25578e8fa1') }} <ArrowRight class="size-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        <ListPagination
          v-if="totalPages > 1"
          :page="currentPage"
          :total-pages="totalPages"
          :total="total"
          :loading="listLoading"
          @prev="goPrev"
          @next="goNext"
        />
      </div>
    </div>

    <input ref="zipImportInput" class="hidden" type="file" accept=".zip" @change="handleZipImportFileChange" />

    <Dialog v-model:open="editorOpen">
      <DialogContent class="kb-ui relative p-6" :style="editorDialogStyle">
        <DialogResizeHandle @resize-start="startEditorResize" />
        <DialogHeader>
          <DialogTitle>{{ editorForm.id ? $t('knowledgeBase.text_f8cf989d7143') : $t('knowledgeBase.text_f93ee39a94c6') }}</DialogTitle>
          <DialogDescription>{{ $t('knowledgeBase.text_e17a5f9010a9') }}</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <label for="knowledge-name" class="text-sm font-medium">{{ $t('knowledgeBase.text_1be7ae4fc257') }}</label>
            <Input id="knowledge-name" v-model="editorForm.name" maxlength="128" :placeholder="$t('knowledgeBase.text_2c71d890ce97')" />
          </div>
          <div class="space-y-2">
            <label for="knowledge-desc" class="text-sm font-medium">{{ $t('knowledgeBase.text_412f54dc38e6') }}</label>
            <Textarea id="knowledge-desc" v-model="editorForm.desc" rows="4" :placeholder="$t('knowledgeBase.text_6152f7bd0cce')" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editorOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button :disabled="editorLoading" @click="submitEditor" class="kb-control">
            <LoaderCircle v-if="editorLoading" class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_fadf24dbc5a9') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="confirmOpen">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ confirmAction === 'delete' ? $t('knowledgeBase.text_e62a78b1a7a8') : $t('knowledgeBase.text_863fb227d5ac') }}</DialogTitle>
          <DialogDescription>
            <template v-if="confirmAction === 'delete'"
              >{{ $t('knowledgeBase.confirmKnowledgeDelete', { name: confirmTarget?.name || '' }) }}</template
            >
            <template v-else>{{ $t('knowledgeBase.confirmKnowledgeExport', { name: confirmTarget?.name || '' }) }}</template>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button :variant="confirmAction === 'delete' ? 'destructive' : 'default'" @click="runConfirmedAction" class="kb-control">
            {{ confirmAction === 'delete' ? $t('knowledgeBase.text_3c06abe11651') : $t('knowledgeBase.text_86c599fe6e85') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="exportOpen">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_752f1ceb9690') }}</DialogTitle>
          <DialogDescription>{{ exportTask?.knowledgeName }}</DialogDescription>
        </DialogHeader>
        <div class="py-3">
          <div v-if="['pending', 'processing'].includes(exportTask?.status || '')" class="text-muted-foreground flex items-center gap-2 text-sm">
            <LoaderCircle class="size-4 animate-spin" /> {{ $t('knowledgeBase.text_03fb7b2f7e7d') }}
          </div>
          <div v-else-if="exportTask?.status === 'success'" class="text-success text-sm">{{ $t('knowledgeBase.text_6b974f43bd58') }}</div>
          <div v-else class="text-destructive text-sm">{{ exportTask?.errorMessage || $t('knowledgeBase.text_675338126127') }}</div>
        </div>
        <DialogFooter v-if="exportTask?.status === 'success'">
          <Button @click="downloadExport" class="kb-control"><Download class="size-4" />{{ $t('knowledgeBase.text_b25a3f04047f') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="importOpen">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_cae2939c9a99') }}</DialogTitle>
          <DialogDescription>{{ importTask?.knowledgeName }}</DialogDescription>
        </DialogHeader>
        <div class="py-3 text-sm">
          <div v-if="['uploading', 'pending', 'processing'].includes(importTask?.status || '')" class="text-muted-foreground flex items-center gap-2">
            <LoaderCircle class="size-4 animate-spin" />
            {{ importTask?.status === 'uploading' ? $t('knowledgeBase.text_c5624ed962e2') : $t('knowledgeBase.text_cd74f096295f') }}
          </div>
          <div v-else-if="importTask?.status === 'success'" class="text-success">
            {{ $t('knowledgeBase.text_75c33f5c2ecc')
            }}<span v-if="importTask.importedCount"
              >{{ $t('knowledgeBase.text_e6d397553786') }} {{ importTask.importedCount }} {{ $t('knowledgeBase.text_64728a772742') }}</span
            >。
          </div>
          <div v-else class="text-destructive">{{ importTask?.errorMessage || $t('knowledgeBase.text_a01a8d53938f') }}</div>
        </div>
      </DialogContent>
    </Dialog>
  </Page>
</template>
