/** 文件说明：项目场景列表和执行日志，筛选、表格及反馈随当前语言切换。 */
<script lang="ts" setup>
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { notifyRequestError } from '@vben/saas/request-error';

import type { ThingsApi } from '@vben/api';
import type { ColumnDef, SortingState } from '@tanstack/vue-table';

import { computed, h, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import { FlexRender, getCoreRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ToggleGroup, ToggleGroupItem, VbenIcon, VbenSpinner } from '@vben-core/shadcn-ui';
import { useMessage } from 'naive-ui';

import { ProjectSceneApi } from './index.api';

// t 根据翻译键和可选插值参数返回当前语言文案，并建立响应式依赖。
function t(key: string, params?: Record<string, number | string>): string {
  void preferences.app.locale;
  return $t(key, params ?? {});
}

// metaLabel 只翻译内置状态与场景类型，未知后端值保持原值以便排查。
function metaLabel(label: string): string {
  return ['enabled', 'disabled', 'abnormal', 'success', 'failed', 'automation', 'oneClick'].includes(label)
    ? t(`iotApp.projectScene.${label}`)
    : label;
}

type SceneType = 'auto' | 'manual';

const props = withDefaults(
  defineProps<{
    createRoute?: string;
    createRouteV2?: string;
    fixedSceneType?: '' | SceneType;
    projectId?: null | string;
    sceneListTitle?: string;
    showCreate?: boolean;
    showExecute?: boolean;
    showLogs?: boolean;
  }>(),
  {
    createRoute: '',
    createRouteV2: '',
    fixedSceneType: '',
    projectId: '',
    sceneListTitle: '',
    showCreate: true,
    showExecute: true,
    showLogs: true,
  },
);

const router = useRouter();
const message = useMessage();

const projectID = computed(() => String(props.projectId ?? '').trim());
const createTargetRoute = computed(() => props.createRouteV2 || props.createRoute || '');
const canCreate = computed(() => props.showCreate && !!projectID.value && !!createTargetRoute.value);
const fixedSceneType = computed(() => props.fixedSceneType || '');

const activeKey = ref<'logs' | 'scenes'>('scenes');

const sceneFilters = ref<{
  deviceName: string;
  name: string;
  status: string;
  type: string;
}>({
  deviceName: '',
  name: '',
  status: '',
  type: '',
});
const sceneLoading = ref(false);
const sceneRows = ref<ThingsApi.SceneInfo[]>([]);
const sceneTotal = ref(0);
const scenePage = ref(0);
const scenePageSize = ref(15);
const sceneSorting = ref<SortingState>([]);

const sceneHasFilter = computed(
  () =>
    !!(
      sceneFilters.value.name ||
      (!fixedSceneType.value && sceneFilters.value.type) ||
      sceneFilters.value.status ||
      sceneFilters.value.deviceName
    ),
);

const logFilters = ref<{ sceneName: string; status: string }>({
  sceneName: '',
  status: '',
});
const logLoading = ref(false);
const logRows = ref<ThingsApi.SceneLog[]>([]);
const logTotal = ref(0);
const logPage = ref(0);
const logPageSize = ref(15);
const logSorting = ref<SortingState>([]);

const logHasFilter = computed(() => !!(logFilters.value.sceneName || logFilters.value.status));

function formatTime(val?: number | string) {
  if (!val) return '-';
  const ts = Number(val);
  if (!Number.isNaN(ts) && ts > 0) {
    return new Date(ts * (ts < 1e12 ? 1000 : 1)).toLocaleString(preferences.app.locale);
  }
  return String(val);
}

const sceneStatusMeta: Record<number, { label: string; tone: string }> = {
  1: {
    label: 'enabled',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  2: {
    label: 'disabled',
    tone: 'border-border/60 bg-muted text-muted-foreground',
  },
  3: {
    label: 'abnormal',
    tone: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};
const logStatusMeta: Record<number, { label: string; tone: string }> = {
  1: {
    label: 'success',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  2: {
    label: 'failed',
    tone: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
};
const sceneTypeMeta: Record<string, { label: string; tone: string }> = {
  auto: {
    label: 'automation',
    tone: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  manual: {
    label: 'oneClick',
    tone: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
};

function resetSceneData() {
  sceneRows.value = [];
  sceneTotal.value = 0;
  scenePage.value = 0;
}

function resetSceneFilters() {
  sceneFilters.value = { deviceName: '', name: '', status: '', type: fixedSceneType.value };
}

function resetLogData() {
  logRows.value = [];
  logTotal.value = 0;
  logPage.value = 0;
}

async function loadScenes() {
  if (!projectID.value) {
    resetSceneData();
    return;
  }
  sceneLoading.value = true;
  try {
    const payload: any = {};
    if (sceneFilters.value.name) payload.name = sceneFilters.value.name;
    const sceneType = fixedSceneType.value || sceneFilters.value.type;
    if (sceneType) payload.type = sceneType;
    if (sceneFilters.value.status) {
      payload.status = Number(sceneFilters.value.status);
    }
    if (sceneFilters.value.deviceName) {
      payload.deviceName = sceneFilters.value.deviceName;
    }
    const res = await ProjectSceneApi.list(scenePage.value + 1, scenePageSize.value, payload, projectID.value);
    sceneRows.value = res?.list ?? [];
    sceneTotal.value = res?.total ?? 0;
  } finally {
    sceneLoading.value = false;
  }
}

async function onExecuteScene(row: ThingsApi.SceneInfo) {
  if (!row.id || !projectID.value) return;
  try {
    await ProjectSceneApi.manuallyTrigger(String(row.id), projectID.value);
    message.success(t('iotApp.projectScene.executeSuccess'));
    loadScenes();
    loadLogs();
  } catch (requestError) {
    notifyRequestError(requestError, () => t('iotApp.projectScene.executeFailed'), (text) => message.error(text));
  }
}

function onCreateScene() {
  if (!canCreate.value) return;
  router.push(createTargetRoute.value);
}

function onSearchScenes() {
  scenePage.value = 0;
  loadScenes();
}

function onResetScenes() {
  resetSceneFilters();
  scenePage.value = 0;
  loadScenes();
}

function goScenePrev() {
  if (scenePage.value > 0) {
    scenePage.value -= 1;
    loadScenes();
  }
}

function goSceneNext() {
  if (scenePage.value < sceneTotalPages.value - 1) {
    scenePage.value += 1;
    loadScenes();
  }
}

const sceneColumns = computed<ColumnDef<ThingsApi.SceneInfo>[]>(() => {
  const columns: ColumnDef<ThingsApi.SceneInfo>[] = [
    {
      accessorKey: 'name',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.sceneName')),
      cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.name || '-'),
    },
    {
      accessorKey: 'type',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.triggerType')),
      cell: ({ row }) => {
        const m = sceneTypeMeta[row.original.type as string] ?? {
          label: row.original.type || '-',
          tone: '',
        };
        return h(Badge, { variant: 'outline', class: `px-2 py-0.5 ${m.tone}` }, () => metaLabel(m.label));
      },
    },
    {
      accessorKey: 'status',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.status')),
      cell: ({ row }) => {
        const m = sceneStatusMeta[Number(row.original.status)] ?? {
          label: '-',
          tone: '',
        };
        return h(Badge, { variant: 'outline', class: `px-2 py-0.5 ${m.tone}` }, () => metaLabel(m.label));
      },
    },
    {
      accessorKey: 'areaID',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.areaId')),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.areaID || '-'),
    },
    {
      id: 'device',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.device')),
      cell: ({ row }) => h('span', null, row.original.deviceAlias || row.original.deviceName || '-'),
    },
    {
      accessorKey: 'productID',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.productId')),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.productID || '-'),
    },
    {
      accessorKey: 'lastRunTime',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.lastExecution')),
      cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, formatTime(row.original.lastRunTime)),
    },
    {
      accessorKey: 'desc',
      header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.description')),
      cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, row.original.desc || '-'),
    },
  ];

  if (props.showExecute) {
    columns.push({
      id: 'actions',
      header: () => h('span', { class: 'sr-only' }, t('iotApp.projectScene.actions')),
      enableSorting: false,
      cell: ({ row }) =>
        h(
          'div',
          { class: 'flex justify-end' },
          h(
            Button,
            {
              variant: 'outline',
              size: 'sm',
              class: 'h-7 gap-1 text-xs',
              disabled: !projectID.value,
              onClick: () => onExecuteScene(row.original),
            },
            {
              default: () => [h(VbenIcon, { icon: 'lucide:play', class: 'size-3.5' }), t('iotApp.projectScene.execute')],
            },
          ),
        ),
    });
  }

  return columns;
});

const sceneTable = useVueTable({
  get data() {
    return sceneRows.value;
  },
  get columns() {
    return sceneColumns.value;
  },
  state: {
    get sorting() {
      return sceneSorting.value;
    },
  },
  onSortingChange: (u) => {
    sceneSorting.value = typeof u === 'function' ? u(sceneSorting.value) : u;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualPagination: true,
  get pageCount() {
    return Math.max(1, Math.ceil(sceneTotal.value / scenePageSize.value));
  },
});

const sceneTotalPages = computed(() => Math.max(1, Math.ceil(sceneTotal.value / scenePageSize.value)));
const scenePageRange = computed(() => {
  if (sceneTotal.value === 0) return '0';
  const start = scenePage.value * scenePageSize.value + 1;
  const end = Math.min(sceneTotal.value, (scenePage.value + 1) * scenePageSize.value);
  return `${start} - ${end}`;
});

async function loadLogs() {
  if (!projectID.value) {
    resetLogData();
    return;
  }
  logLoading.value = true;
  try {
    const payload: any = {};
    if (logFilters.value.sceneName) payload.sceneName = logFilters.value.sceneName;
    if (logFilters.value.status) payload.status = Number(logFilters.value.status);
    const res = await ProjectSceneApi.logIndex(logPage.value + 1, logPageSize.value, payload, projectID.value);
    logRows.value = res?.list ?? [];
    logTotal.value = res?.total ?? 0;
  } finally {
    logLoading.value = false;
  }
}

function onSearchLogs() {
  logPage.value = 0;
  loadLogs();
}

function onResetLogs() {
  logFilters.value = { sceneName: '', status: '' };
  logPage.value = 0;
  loadLogs();
}

function goLogPrev() {
  if (logPage.value > 0) {
    logPage.value -= 1;
    loadLogs();
  }
}

function goLogNext() {
  if (logPage.value < logTotalPages.value - 1) {
    logPage.value += 1;
    loadLogs();
  }
}

const logColumns = computed<ColumnDef<ThingsApi.SceneLog>[]>(() => [
  {
    accessorKey: 'sceneName',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.sceneName')),
    cell: ({ row }) => h('div', { class: 'font-medium' }, row.original.sceneName || '-'),
  },
  {
    accessorKey: 'type',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.triggerType')),
    cell: ({ row }) => {
      const m = sceneTypeMeta[row.original.type as string] ?? {
        label: row.original.type || '-',
        tone: '',
      };
      return h(Badge, { variant: 'outline', class: `px-2 py-0.5 ${m.tone}` }, () => metaLabel(m.label));
    },
  },
  {
    accessorKey: 'status',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.executionResult')),
    cell: ({ row }) => {
      const m = logStatusMeta[Number(row.original.status)] ?? {
        label: '-',
        tone: '',
      };
      return h(Badge, { variant: 'outline', class: `px-2 py-0.5 ${m.tone}` }, () => metaLabel(m.label));
    },
  },
  {
    accessorKey: 'areaID',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.areaId')),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.areaID || '-'),
  },
  {
    accessorKey: 'createdTime',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.executionTime')),
    cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, formatTime(row.original.createdTime)),
  },
  {
    id: 'actionsCount',
    header: () => h('span', { class: 'text-xs font-medium text-muted-foreground' }, t('iotApp.projectScene.actionCount')),
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, String(row.original.actions?.length ?? 0)),
  },
]);

const logTable = useVueTable({
  get data() {
    return logRows.value;
  },
  get columns() {
    return logColumns.value;
  },
  state: {
    get sorting() {
      return logSorting.value;
    },
  },
  onSortingChange: (u) => {
    logSorting.value = typeof u === 'function' ? u(logSorting.value) : u;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualPagination: true,
  get pageCount() {
    return Math.max(1, Math.ceil(logTotal.value / logPageSize.value));
  },
});

const logTotalPages = computed(() => Math.max(1, Math.ceil(logTotal.value / logPageSize.value)));
const logPageRange = computed(() => {
  if (logTotal.value === 0) return '0';
  const start = logPage.value * logPageSize.value + 1;
  const end = Math.min(logTotal.value, (logPage.value + 1) * logPageSize.value);
  return `${start} - ${end}`;
});

watch(activeKey, (k) => {
  if (k === 'logs' && props.showLogs) loadLogs();
});

watch(projectID, () => {
  resetSceneData();
  resetLogData();
  loadScenes();
  if (activeKey.value === 'logs' && props.showLogs) loadLogs();
});

onMounted(() => {
  resetSceneFilters();
  loadScenes();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <ToggleGroup v-if="props.showLogs" :model-value="activeKey" type="single" size="sm" variant="outline" @update:model-value="(v: any) => v && (activeKey = v)">
        <ToggleGroupItem value="scenes">{{ props.sceneListTitle || t('iotApp.projectScene.sceneList') }}</ToggleGroupItem>
        <ToggleGroupItem value="logs">{{ t('iotApp.projectScene.sceneLogs') }}</ToggleGroupItem>
      </ToggleGroup>
      <div v-else class="text-foreground text-base font-medium">{{ props.sceneListTitle || t('iotApp.projectScene.sceneList') }}</div>
    </div>

    <div
      v-if="!projectID"
      class="border-border/70 bg-background text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 rounded-lg border text-sm"
    >
      <span class="icon-[lucide--workflow] size-8 opacity-60"></span>
      <span>{{ t('iotApp.projectScene.selectProject') }}</span>
    </div>

    <div v-show="activeKey === 'scenes' && projectID" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <Input v-model="sceneFilters.name" :placeholder="t('iotApp.projectScene.sceneName')" class="h-8 w-[180px] shadow-none" @keydown.enter="onSearchScenes" />
        <Select v-if="!fixedSceneType" v-model="sceneFilters.type">
          <SelectTrigger class="h-8 w-[130px]">
            <SelectValue :placeholder="t('iotApp.projectScene.triggerType')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">{{ t('iotApp.projectScene.automation') }}</SelectItem>
            <SelectItem value="manual">{{ t('iotApp.projectScene.oneClick') }}</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="sceneFilters.status">
          <SelectTrigger class="h-8 w-[130px]">
            <SelectValue :placeholder="t('iotApp.projectScene.status')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{{ t('iotApp.projectScene.enabled') }}</SelectItem>
            <SelectItem value="2">{{ t('iotApp.projectScene.disabled') }}</SelectItem>
            <SelectItem value="3">{{ t('iotApp.projectScene.abnormal') }}</SelectItem>
          </SelectContent>
        </Select>
        <Input v-model="sceneFilters.deviceName" :placeholder="t('iotApp.projectScene.deviceName')" class="h-8 w-[160px] shadow-none" @keydown.enter="onSearchScenes" />
        <Button variant="outline" size="sm" class="h-8 gap-1.5" @click="onSearchScenes">
          <VbenIcon icon="lucide:search" class="size-4" />
          {{ t('iotApp.projectScene.search') }}
        </Button>
        <Button v-if="sceneHasFilter" variant="ghost" size="sm" class="text-muted-foreground h-8 gap-1" @click="onResetScenes">
          {{ t('iotApp.projectScene.reset') }}
          <VbenIcon icon="lucide:x" class="size-3.5" />
        </Button>

        <div class="flex-1"></div>

        <Button variant="outline" size="sm" class="h-8 gap-1.5" :disabled="sceneLoading" @click="loadScenes">
          <VbenIcon icon="lucide:refresh-cw" class="size-4" :class="sceneLoading ? 'animate-spin' : ''" />
          {{ t('iotApp.projectScene.refresh') }}
        </Button>
        <Button v-if="showCreate" size="sm" class="h-8 gap-1.5" :disabled="!canCreate" @click="onCreateScene">
          <VbenIcon icon="lucide:plus" class="size-4" />
          {{ t('iotApp.projectScene.createScene') }}
        </Button>
      </div>

      <div class="border-border/70 bg-background relative flex flex-col overflow-hidden rounded-lg border">
        <div v-if="sceneLoading" class="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <VbenSpinner />
        </div>
        <div class="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow v-for="hg in sceneTable.getHeaderGroups()" :key="hg.id" class="bg-muted/30 hover:bg-muted/30">
                <TableHead v-for="header in hg.headers" :key="header.id" class="h-10">
                  <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="sceneTable.getRowModel().rows?.length">
                <TableRow v-for="row in sceneTable.getRowModel().rows" :key="row.id" class="hover:bg-muted/40">
                  <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </TableCell>
                </TableRow>
              </template>
              <TableRow v-else>
                <TableCell :colspan="sceneColumns.length" class="h-40 text-center">
                  <div class="text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <span class="icon-[lucide--workflow] size-8 opacity-60"></span>
                    <span>{{ t('iotApp.projectScene.noScenes') }}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="border-border/70 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-sm">
          <div class="tabular-nums">
            {{ t('iotApp.projectScene.totalItems', { total: sceneTotal, range: scenePageRange }) }}
          </div>
          <div class="flex items-center gap-2">
            <span class="tabular-nums">{{ t('iotApp.projectScene.pageOf', { page: scenePage + 1, total: sceneTotalPages }) }}</span>
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="scenePage <= 0 || sceneLoading" @click="goScenePrev">
              <VbenIcon icon="lucide:chevron-left" class="size-4" />
            </Button>
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="scenePage >= sceneTotalPages - 1 || sceneLoading" @click="goSceneNext">
              <VbenIcon icon="lucide:chevron-right" class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeKey === 'logs' && projectID" class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <Input v-model="logFilters.sceneName" :placeholder="t('iotApp.projectScene.sceneName')" class="h-8 w-[220px] shadow-none" @keydown.enter="onSearchLogs" />
        <Select v-model="logFilters.status">
          <SelectTrigger class="h-8 w-[140px]">
            <SelectValue :placeholder="t('iotApp.projectScene.executionResult')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{{ t('iotApp.projectScene.success') }}</SelectItem>
            <SelectItem value="2">{{ t('iotApp.projectScene.failed') }}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" class="h-8 gap-1.5" @click="onSearchLogs">
          <VbenIcon icon="lucide:search" class="size-4" />
          {{ t('iotApp.projectScene.search') }}
        </Button>
        <Button v-if="logHasFilter" variant="ghost" size="sm" class="text-muted-foreground h-8 gap-1" @click="onResetLogs">
          {{ t('iotApp.projectScene.reset') }}
          <VbenIcon icon="lucide:x" class="size-3.5" />
        </Button>

        <div class="flex-1"></div>

        <Button variant="outline" size="sm" class="h-8 gap-1.5" :disabled="logLoading" @click="loadLogs">
          <VbenIcon icon="lucide:refresh-cw" class="size-4" :class="logLoading ? 'animate-spin' : ''" />
          {{ t('iotApp.projectScene.refresh') }}
        </Button>
      </div>

      <div class="border-border/70 bg-background relative flex flex-col overflow-hidden rounded-lg border">
        <div v-if="logLoading" class="bg-background/60 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <VbenSpinner />
        </div>
        <div class="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow v-for="hg in logTable.getHeaderGroups()" :key="hg.id" class="bg-muted/30 hover:bg-muted/30">
                <TableHead v-for="header in hg.headers" :key="header.id" class="h-10">
                  <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="logTable.getRowModel().rows?.length">
                <TableRow v-for="row in logTable.getRowModel().rows" :key="row.id" class="hover:bg-muted/40">
                  <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </TableCell>
                </TableRow>
              </template>
              <TableRow v-else>
                <TableCell :colspan="logColumns.length" class="h-40 text-center">
                  <div class="text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <span class="icon-[lucide--file-clock] size-8 opacity-60"></span>
                    <span>{{ t('iotApp.projectScene.noLogs') }}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div class="border-border/70 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-sm">
          <div class="tabular-nums">
            {{ t('iotApp.projectScene.totalItems', { total: logTotal, range: logPageRange }) }}
          </div>
          <div class="flex items-center gap-2">
            <span class="tabular-nums">{{ t('iotApp.projectScene.pageOf', { page: logPage + 1, total: logTotalPages }) }}</span>
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="logPage <= 0 || logLoading" @click="goLogPrev">
              <VbenIcon icon="lucide:chevron-left" class="size-4" />
            </Button>
            <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="logPage >= logTotalPages - 1 || logLoading" @click="goLogNext">
              <VbenIcon icon="lucide:chevron-right" class="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
