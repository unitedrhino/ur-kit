<!--
  文件说明：各应用共用的规则引擎 AI 任务列表（TASK-124 v3）。
  数据来自 aisvr clone-task（taskType=tool_run，按已选作用范围的 cloneGroup 过滤）。
  列：任务/调度/状态/上次执行/结果/操作；操作：启停、立即执行、执行记录、编辑调度、删除。
  新建入口打开 aitask-create 两步弹窗（配置触发 → 对话开发）。
-->
<script lang="ts" setup>

import { notifyRequestError } from '@vben/saas/request-error';

import type { AiTaskDraftInfo, AiTaskInfo, RuleEngineScope } from '../aitask.api';
import type { EventTriggerConfig } from '../event-trigger';
import { $t } from '@vben/saas/locales';

import { computed, h, onActivated, onDeactivated, ref, watch } from 'vue';

import { FlexRender, getCoreRowModel, message, useVueTable } from '@vben/saas';
import type { ColumnDef } from '@vben/saas';

import { AiToolDetail } from '@vben/saas/ai-tool-detail';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';
import { Textarea } from '@unitedrhino/saas-ui/ui/textarea';
import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Label } from '@unitedrhino/saas-ui/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unitedrhino/saas-ui/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@unitedrhino/saas-ui/ui/table';
import { VbenIcon } from '@vben-core/shadcn-ui';

import { AiTaskApi, getProjectCloneGroupID, getRecoverableAiTaskDrafts, getRuleCloneGroupID, publishAiTool } from '../aitask.api';
import { emptyEventTrigger, readEventTrigger } from '../event-trigger';
import { SIMULATE_WEEKDAY_OPTIONS, formatSimulateTime, hhmmToSec, isAiTaskEnabled, runStatusMeta, secToHHMM, summarizeAiTaskSchedule } from '../shared';

import AiTaskCreateDialog from './aitask-create.vue';
import AiTaskRunsDialog from './aitask-runs.vue';
import EventTriggerEditor from './event-trigger-editor.vue';

const props = defineProps<{
  /** 项目 ID（任务按项目级 CloneGroup 过滤） */
  projectID?: string;
  /** fillHeight 让独立入口的表格和空状态撑满内容面板。 */
  fillHeight?: boolean;
  /** scope 决定使用项目、企业或平台公共规则分身组。 */
  scope?: RuleEngineScope;
  /** 当前登录企业编码，用于非项目规则分身组精确匹配。 */
  tenantCode?: string;
}>();
const scope = computed(() => props.scope || 'project');
/** fullHeight 保留项目详情布局，并允许独立项目入口撑满面板。 */
const fullHeight = computed(() => props.fillHeight || scope.value !== 'project');

// ==================== 列表 ====================

const loading = ref(false);
const rows = ref<AiTaskInfo[]>([]);
/** drafts 保存当前项目未绑定任务的规则引擎工具，刷新或退出后仍可恢复。 */
const drafts = ref<AiTaskDraftInfo[]>([]);

async function loadList() {
  if (scope.value === 'project' && !props.projectID || scope.value !== 'project' && !props.tenantCode) return;
  loading.value = true;
  try {
    const contextKey = `${scope.value}:${props.projectID || props.tenantCode}`;
    const cloneGroupID = scope.value === 'project'
      ? await getProjectCloneGroupID(props.projectID!)
      : await getRuleCloneGroupID(scope.value as 'tenant' | 'common', props.tenantCode!);
    if (!cloneGroupID) { rows.value = []; drafts.value = []; return; }
    const res = await AiTaskApi.getList(cloneGroupID);
    const taskRows = res?.list ?? [];
    let recoverableDrafts: AiTaskDraftInfo[] = [];
    try {
      recoverableDrafts = await getRecoverableAiTaskDrafts(
        cloneGroupID,
        taskRows.map((task) => task.toolID).filter((id): id is string => !!id),
      );
    } catch (error: any) {
      notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.draftListFailed'), (text) => message.warning(text));
    }
    if (contextKey !== `${scope.value}:${props.projectID || props.tenantCode}`) return;
    rows.value = taskRows;
    drafts.value = recoverableDrafts;
  } catch (error: any) {
    rows.value = [];
    drafts.value = [];
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.aiTaskListFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

// ==================== 行操作 ====================

const actionLoadingId = ref<string | null>(null);

async function withRowAction(task: AiTaskInfo, action: () => Promise<any>, successText: string) {
  if (actionLoadingId.value != null) return;
  actionLoadingId.value = task.id;
  try {
    await action();
    message.success(successText);
    await loadList();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.actionFailedRetry'), (text) => message.error(text));
  } finally {
    actionLoadingId.value = null;
  }
}

function toggleEnabled(task: AiTaskInfo) {
  const enabled = isAiTaskEnabled(task.enabled);
  void withRowAction(task, () => (enabled ? AiTaskApi.stop(task.id) : AiTaskApi.start(task.id)), enabled ? $t('iotApp.project.taskStopped') : $t('iotApp.project.taskStarted'));
}

function runNow(task: AiTaskInfo) {
  void withRowAction(task, () => AiTaskApi.run(task.id), $t('iotApp.project.runTriggered'));
}

// ==================== 执行记录 / 删除 ====================

const runsOpen = ref(false);
const runsTask = ref<AiTaskInfo | null>(null);

function openRuns(task: AiTaskInfo) {
  runsTask.value = task;
  runsOpen.value = true;
}

const deleteTarget = ref<AiTaskInfo | null>(null);
const deleteLoading = ref(false);

async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target || deleteLoading.value) return;
  deleteLoading.value = true;
  try {
    await AiTaskApi.delete(target.id);
    message.success($t('iotApp.project.aiTaskDeleted'));
    deleteTarget.value = null;
    await loadList();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.deleteFailedRetry'), (text) => message.error(text));
  } finally {
    deleteLoading.value = false;
  }
}

// ==================== 编辑调度 ====================

const editOpen = ref(false);
const editSaving = ref(false);
const editForm = ref({
  id: '',
  name: '',
  desc: '',
  onceTime: '',
  repeatTimes: 0,
  timeoutSeconds: 300,
  scheduleType: 'interval' as AiTaskInfo['scheduleType'],
  intervalMin: 5,
  dailyTime: '08:00',
  weeklyDay: 1,
  weeklyTime: '08:00',
});
/** editEvent 保存本次任务的触发方式与条件。 */
const editEvent = ref<EventTriggerConfig>(emptyEventTrigger());
const editTriggerEditor = ref<InstanceType<typeof EventTriggerEditor> | null>(null);

function openEdit(task: AiTaskInfo) {
  try {
    editEvent.value = readEventTrigger(task, scope.value === 'common');
  } catch (error: any) {
    notifyRequestError(error, () => error?.message || $t('iotApp.ruleTrigger.eventConfigUnreadable'), (text) => message.error(text));
    return;
  }
  editForm.value = {
    id: task.id,
    name: task.name,
    desc: task.desc || '',
    onceTime: task.scheduleTime ? new Date(Date.parse(task.scheduleTime) - new Date(task.scheduleTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
    repeatTimes: task.repeatTimes ?? 0,
    timeoutSeconds: task.timeoutSeconds ?? 300,
    scheduleType: task.scheduleType,
    intervalMin: Number(task.scheduleInterval ?? 5) || 5,
    dailyTime: secToHHMM(task.scheduleDailyTimeSec),
    weeklyDay: Number(task.scheduleWeeklyDay ?? 1),
    weeklyTime: secToHHMM(task.scheduleWeeklyTimeSec),
  };
  editOpen.value = true;
}

async function saveEdit() {
  if (editSaving.value) return;
  editSaving.value = true;
  try {
    const f = editForm.value;
    if (!f.name.trim()) throw new Error($t('iotApp.project.taskNameRequired'));
    if (!Number.isInteger(f.timeoutSeconds) || f.timeoutSeconds < 1) throw new Error($t('iotApp.project.timeoutPositive'));
    if (!Number.isInteger(f.repeatTimes) || f.repeatTimes < 0) throw new Error($t('iotApp.project.repeatNonNegative'));
    if (editEvent.value.triggerType === 'schedule' && f.scheduleType === 'once' && (!f.onceTime || Number.isNaN(Date.parse(f.onceTime)) || Date.parse(f.onceTime) <= Date.now())) throw new Error($t('iotApp.project.futureTimeRequired'));
    const event = editEvent.value.triggerType === 'subscribe_message'
      ? editTriggerEditor.value?.serialize()
      : { triggerType: 'schedule' as const };
    if (!event) throw new Error($t('iotApp.ruleTrigger.sourcesNotReady'));
    await AiTaskApi.update(f.id, {
      name: f.name.trim(),
      desc: f.desc,
      repeatTimes: f.repeatTimes,
      timeoutSeconds: f.timeoutSeconds,
      ...event,
      ...(editEvent.value.triggerType === 'schedule' && f.scheduleType === 'once' ? { scheduleTime: new Date(f.onceTime).toISOString() } : {}),
      scheduleType: editEvent.value.triggerType === 'subscribe_message' ? 'none' : f.scheduleType,
      ...(editEvent.value.triggerType === 'schedule' && f.scheduleType === 'interval' ? { scheduleInterval: Math.max(1, Math.round(f.intervalMin || 1)) } : {}),
      ...(editEvent.value.triggerType === 'schedule' && f.scheduleType === 'daily' ? { scheduleDailyTimeSec: hhmmToSec(f.dailyTime) ?? 0 } : {}),
      ...(editEvent.value.triggerType === 'schedule' && f.scheduleType === 'weekly'
        ? { scheduleWeeklyDay: f.weeklyDay, scheduleWeeklyTimeSec: hhmmToSec(f.weeklyTime) ?? 0 }
        : {}),
    });
    message.success($t('iotApp.project.scheduleUpdated'));
    editOpen.value = false;
    await loadList();
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.saveFailedRetry'), (text) => message.error(text));
  } finally {
    editSaving.value = false;
  }
}

/** 已绑定工具的继续编辑入口；保存产物后重新发布，失败保留面板供重试。 */
const codeTask = ref<AiTaskInfo | null>(null);
const codePublishing = ref(false);
async function publishEditedCode() {
  if (!codeTask.value?.toolID || codePublishing.value) return;
  codePublishing.value = true;
  try {
    await publishAiTool(codeTask.value.toolID);
    message.success($t('iotApp.project.codePublished'));
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.publishFailedRetry'), (text) => message.error(text));
  } finally {
    codePublishing.value = false;
  }
}

// ==================== 表格 ====================

const createOpen = ref(false);
/** resumeDraft 指向本次要恢复的工具；为空时创建全新草稿。 */
const resumeDraft = ref<AiTaskDraftInfo | null>(null);

/** openNewTask 打开全新任务开发流程。 */
function openNewTask() {
  resumeDraft.value = null;
  createOpen.value = true;
}

/** resumeTaskDraft 打开既有工具并恢复同一开发会话。 */
function resumeTaskDraft(draft: AiTaskDraftInfo) {
  resumeDraft.value = draft;
  createOpen.value = true;
}

/** 启停状态徽标元数据 */
function enabledMeta(task: AiTaskInfo) {
  return isAiTaskEnabled(task.enabled)
    ? { label: task.state === 'completed' ? $t('iotApp.project.taskCompleted') : $t('iotApp.project.taskRunning'), tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
    : { label: $t('iotApp.project.taskStopped'), tone: 'border-border/60 bg-muted text-muted-foreground' };
}

/** columns 固定关键列宽，避免窄窗口挤压状态文字与操作按钮。 */
const columns: ColumnDef<AiTaskInfo>[] = [
  {
    accessorKey: 'name',
    size: 180,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.project.colTaskName')),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-foreground block truncate text-sm font-medium', title: row.original.name }, row.original.name || '-'),
        row.original.desc
          ? h('span', { class: 'text-muted-foreground truncate text-xs' }, row.original.desc)
          : null,
      ]),
  },
  {
    id: 'schedule',
    size: 240,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.ruleTrigger.chooseTrigger')),
    cell: ({ row }) => h('span', { class: 'text-muted-foreground block truncate text-sm', title: summarizeAiTaskSchedule(row.original) }, summarizeAiTaskSchedule(row.original)),
  },
  {
    accessorKey: 'enabled',
    size: 100,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.project.statusCol')),
    cell: ({ row }) => {
      const meta = enabledMeta(row.original);
      return h(Badge, { variant: 'outline', class: `whitespace-nowrap px-2 py-0.5 ${meta.tone}` }, () => meta.label);
    },
  },
  {
    id: 'lastRunAt',
    size: 160,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.project.colLastRun')),
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-muted-foreground text-sm' }, formatSimulateTime(row.original.lastRunAt)),
        row.original.triggerType !== 'subscribe_message' && row.original.nextRunAt
          ? h('span', { class: 'text-muted-foreground text-xs' }, $t('iotApp.project.nextRunAt', { time: formatSimulateTime(row.original.nextRunAt) }))
          : null,
      ]),
  },
  {
    id: 'lastStatus',
    size: 80,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.project.colResult')),
    cell: ({ row }) => {
      const status = row.original.lastStatus;
      if (!status) return h('span', { class: 'text-muted-foreground text-sm' }, '-');
      const meta = runStatusMeta(status);
      const badge = h(Badge, { variant: 'outline', class: `whitespace-nowrap px-2 py-0.5 ${meta.tone}` }, () => meta.label);
      if (!row.original.lastError) return badge;
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        badge,
        h('span', { class: 'text-destructive max-w-[200px] truncate text-xs', title: row.original.lastError }, row.original.lastError),
      ]);
    },
  },
  {
    id: 'actions',
    size: 360,
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, $t('iotApp.project.colActions')),
    cell: ({ row }) => {
      const task = row.original;
      const enabled = isAiTaskEnabled(task.enabled);
      const disabled = actionLoadingId.value === task.id;
      const btn = (label: string, icon: string, onClick: () => void, testid?: string) =>
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'text-primary h-8 shrink-0 gap-1 whitespace-nowrap px-1.5 text-xs',
            disabled,
            'data-testid': testid,
            onClick: (event: Event) => {
              event.stopPropagation();
              onClick();
            },
          },
          () => [h(VbenIcon, { icon, class: 'size-3' }), label],
        );
      return h('div', { class: 'flex items-center gap-1 whitespace-nowrap' }, [
        btn(enabled ? $t('iotApp.project.btnDisable') : $t('iotApp.project.btnEnable'), enabled ? 'lucide:pause' : 'lucide:play', () => toggleEnabled(task)),
        btn($t('iotApp.project.btnRun'), 'lucide:zap', () => runNow(task), `aitask-run-${task.id}`),
        btn($t('iotApp.project.btnRecords'), 'lucide:scroll-text', () => openRuns(task), `aitask-runs-${task.id}`),
        btn($t('iotApp.project.btnScheduleEdit'), 'lucide:pencil', () => openEdit(task)),
        ...(task.toolID ? [btn($t('iotApp.project.btnAiCode'), 'lucide:code', () => { codeTask.value = task; })] : []),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 p-0',
            'aria-label': $t('iotApp.project.delete'),
            disabled,
            onClick: (event: Event) => {
              event.stopPropagation();
              deleteTarget.value = task;
            },
          },
          () => h(VbenIcon, { icon: 'lucide:trash-2', class: 'size-3.5' }),
        ),
      ]);
    },
  },
];

const table = useVueTable({
  get data() {
    return rows.value;
  },
  get columns() {
    return columns;
  },
  getCoreRowModel: getCoreRowModel(),
});

/** totalText 列表统计文案 */
const totalText = computed(() => String(rows.value.length));

watch(() => [props.projectID, props.tenantCode, scope.value], () => { rows.value = []; drafts.value = []; void loadList(); }, { immediate: true });
watch(createOpen, (value) => { if (!value) resumeDraft.value = null; });

/** refreshOnActivation 标记缓存页面离开后需要重新读取共享规则。 */
let refreshOnActivation = false;
onDeactivated(() => { refreshOnActivation = true; });
onActivated(() => {
  if (!refreshOnActivation) return;
  refreshOnActivation = false;
  void loadList();
});

defineExpose({ loadList });
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4" :class="fullHeight ? 'h-full flex-1' : ''">
    <!-- Toolbar -->
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <Badge variant="outline" class="border-sky-500/30 bg-sky-500/10 text-sky-600">{{ $t('iotApp.project.btnAiCode') }}</Badge>
      <span class="text-muted-foreground text-xs">{{ scope === 'project' ? $t('iotApp.project.aiCodeHint') : '与 AI 对话编写执行代码，按已配置规则触发。' }}</span>
      <div class="flex-1"></div>
      <Button variant="outline" size="sm" class="h-8 gap-1.5" :disabled="loading" @click="loadList">
        <VbenIcon icon="lucide:refresh-cw" class="size-4" :class="loading ? 'animate-spin' : ''" />
        {{ $t('iotApp.project.refresh') }}
      </Button>
      <Button size="sm" class="h-8 gap-1.5" data-testid="aitask-create" @click="openNewTask">
        <VbenIcon icon="lucide:plus" class="size-4" />
        {{ $t('iotApp.project.newAiTask') }}
      </Button>
    </div>

    <!-- 可恢复草稿：异常、刷新或主动保存退出后，都从这里回到同一工具继续开发。 -->
    <div v-if="drafts.length > 0" class="border-amber-500/30 bg-amber-500/5 flex flex-col gap-2 rounded-lg border p-3" data-testid="aitask-drafts">
      <div class="flex items-center gap-2 text-sm font-medium">
        <VbenIcon icon="lucide:file-clock" class="size-4 text-amber-600" />
        {{ $t('iotApp.project.unfinishedTasks') }}
        <Badge variant="outline" class="h-5 border-amber-500/30 px-1.5 text-xs text-amber-700">{{ drafts.length }}</Badge>
      </div>
      <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="draft in drafts"
          :key="draft.id"
          type="button"
          class="border-border/70 bg-background hover:border-primary/50 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors"
          :data-testid="`aitask-resume-${draft.id}`"
          @click="resumeTaskDraft(draft)"
        >
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{{ draft.name }}</span>
            <span class="text-muted-foreground text-xs">{{ draft.status === '2' ? $t('iotApp.project.draftPublishedHint') : $t('iotApp.project.draftDevelopingHint') }}</span>
          </span>
          <VbenIcon icon="lucide:arrow-right" class="text-muted-foreground size-4 shrink-0" />
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="border-border/70 bg-background relative flex min-h-[240px] flex-col overflow-hidden rounded-lg border" :class="fullHeight ? 'min-h-0 flex-1' : ''">
      <div v-if="loading" class="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
        <Spinner class="size-6" />
      </div>

      <Empty v-if="!loading && rows.length === 0" class="min-h-[240px] flex-1 py-16">
        <EmptyHeader>
          <EmptyTitle>{{ $t('iotApp.project.noAiTasks') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.project.noAiTasksDesc') }}</EmptyDescription>
        </EmptyHeader>
        <Button size="sm" class="mt-2" data-testid="aitask-create-empty" @click="openNewTask">{{ $t('iotApp.project.newAiTask') }}</Button>
      </Empty>

      <div v-else class="min-h-0 flex-1 overflow-hidden">
        <Table :table="table" class="w-full min-w-[1120px] table-fixed" style="height: 100%">
          <TableHeader>
            <TableRow class="bg-muted/30 hover:bg-muted/30">
              <TableHead v-for="header in table.getHeaderGroups()[0]?.headers ?? []" :key="header.id" class="h-10 whitespace-nowrap" :class="header.id === 'actions' ? 'bg-background sticky right-0 z-10' : ''" :style="{ width: `${header.getSize()}px` }">
                <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-muted/40 cursor-pointer"
              :data-testid="`aitask-row-${row.original.id}`"
              @click="openRuns(row.original)"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="py-3" :class="cell.column.id === 'actions' ? 'bg-background sticky right-0' : ''">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div v-if="rows.length > 0" class="border-border/70 text-muted-foreground flex shrink-0 items-center justify-between border-t px-4 py-3 text-sm">
        <div class="tabular-nums">
          {{ $t('iotApp.project.totalItemsN', { total: totalText }) }}
        </div>
      </div>
    </div>

    <!-- 新建 AI 任务（两步：配置触发 → 对话开发） -->
    <AiTaskCreateDialog
      v-model:open="createOpen"
      :project-i-d="projectID"
      :scope="scope"
      :tenant-code="tenantCode"
      :resume-tool-i-d="resumeDraft?.id"
      @success="loadList"
      @draft-saved="loadList"
      @draft-deleted="loadList"
    />

    <!-- 执行记录 -->
    <AiTaskRunsDialog v-model:open="runsOpen" :task-name="runsTask?.name || ''" :task-id="runsTask?.id || ''" />

    <!-- 编辑任务触发条件 -->
    <Dialog :open="editOpen" @update:open="editOpen = $event">
      <DialogContent class="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{{ $t('iotApp.ruleTrigger.editTaskTrigger') }}</DialogTitle>
          <DialogDescription>{{ $t('iotApp.ruleTrigger.editTaskTriggerHint') }}</DialogDescription>
        </DialogHeader>
        <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">{{ $t('iotApp.project.taskNameLabel') }}</Label>
            <Input v-model="editForm.name" />
          </div>
          <EventTriggerEditor ref="editTriggerEditor" v-model="editEvent" :project-i-d="projectID" :scope="scope" />
          <div v-if="editEvent.triggerType === 'schedule'" class="flex flex-col gap-1.5">
            <Label class="text-xs">{{ $t('iotApp.project.scheduleType') }}</Label>
            <Select v-model="editForm.scheduleType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interval">{{ $t('iotApp.project.scheduleInterval') }}</SelectItem>
                <SelectItem value="daily">{{ $t('iotApp.project.scheduleDaily') }}</SelectItem>
                <SelectItem value="weekly">{{ $t('iotApp.project.scheduleWeekly') }}</SelectItem>
                <SelectItem value="once">{{ $t('iotApp.project.scheduleOnceItem') }}</SelectItem>
                <SelectItem value="none">{{ $t('iotApp.project.scheduleNoneItem') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ $t('iotApp.project.taskDescLabel') }}</Label>
            <Textarea v-model="editForm.desc" />
          </div>
          <div v-if="editEvent.triggerType === 'schedule' && editForm.scheduleType === 'once'" class="flex flex-col gap-1.5">
            <Label>{{ $t('iotApp.project.execTimeLabel') }}</Label>
            <Input v-model="editForm.onceTime" type="datetime-local" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><Label>{{ $t('iotApp.project.repeatTimesLabel') }}</Label><Input v-model.number="editForm.repeatTimes" type="number" :min="0" /></div>
            <div><Label>{{ $t('iotApp.project.timeoutSecondsLabel') }}</Label><Input v-model.number="editForm.timeoutSeconds" type="number" :min="1" /></div>
          </div>
          <div v-if="editEvent.triggerType === 'schedule' && editForm.scheduleType === 'interval'" class="flex flex-col gap-1.5">
            <Label class="text-xs">{{ $t('iotApp.project.intervalMinutesLabel') }}</Label>
            <Input v-model.number="editForm.intervalMin" type="number" :min="1" />
          </div>
          <div v-if="editEvent.triggerType === 'schedule' && editForm.scheduleType === 'daily'" class="flex flex-col gap-1.5">
            <Label class="text-xs">{{ $t('iotApp.project.dailyTimeLabel') }}</Label>
            <Input v-model="editForm.dailyTime" type="time" />
          </div>
          <div v-if="editEvent.triggerType === 'schedule' && editForm.scheduleType === 'weekly'" class="grid grid-cols-2 items-end gap-3">
            <div class="flex flex-col gap-1.5">
              <Label class="text-xs">{{ $t('iotApp.project.weeklyLabel') }}</Label>
              <Select v-model.number="editForm.weeklyDay">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in SIMULATE_WEEKDAY_OPTIONS" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label class="text-xs">{{ $t('iotApp.project.execTimeLabel') }}</Label>
              <Input v-model="editForm.weeklyTime" type="time" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editOpen = false">{{ $t('iotApp.ota.cancel') }}</Button>
          <Button :disabled="editSaving" data-testid="aitask-edit-save" @click="saveEdit">
            {{ editSaving ? $t('iotApp.project.saving') : $t('iotApp.project.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 复用真实工具编辑器，不允许直接删除任务仍引用的工具。 -->
    <Dialog :open="!!codeTask" @update:open="(value: boolean) => !value && !codePublishing && (codeTask = null)">
      <DialogContent class="flex h-[calc(100dvh-2rem)] max-h-[960px] w-[calc(100vw-2rem)] max-w-7xl flex-col overflow-hidden">
        <DialogHeader class="shrink-0">
          <DialogTitle>{{ $t('iotApp.project.editCodeTitle', { name: codeTask?.name }) }}</DialogTitle>
          <DialogDescription>{{ $t('iotApp.project.editCodeDesc') }}</DialogDescription>
        </DialogHeader>
        <AiToolDetail v-if="codeTask?.toolID" :tool-id="Number(codeTask.toolID)" :clone-id="codeTask.cloneID" :allow-delete="false" class="min-h-0 flex-1" @close="codeTask = null" @artifacts-saved="publishEditedCode" />
        <DialogFooter class="shrink-0">
          <Button :disabled="codePublishing" @click="publishEditedCode">{{ codePublishing ? $t('iotApp.project.publishing') : $t('iotApp.project.republish') }}</Button>
          <Button variant="outline" :disabled="codePublishing" @click="codeTask = null">{{ $t('iotApp.ota.closeLabel') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除二次确认 -->
    <Dialog :open="!!deleteTarget" @update:open="(val: boolean) => !val && (deleteTarget = null)">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{{ $t('iotApp.project.deleteAiTaskTitle') }}</DialogTitle>
          <DialogDescription>
            {{ $t('iotApp.project.deleteAiTaskDesc', { name: deleteTarget?.name }) }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="deleteTarget = null">{{ $t('iotApp.ota.cancel') }}</Button>
          <Button variant="destructive" :disabled="deleteLoading" data-testid="aitask-delete-confirm" @click="confirmDelete">
            {{ deleteLoading ? $t('iotApp.project.deleting') : $t('iotApp.project.confirmDelete') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
