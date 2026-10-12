<script setup lang="ts">
/**
 * org-iot-client 单设备日志聚合页。
 *
 * 页面按上下线、控制、调试、物模型四类日志聚合展示，并以日期分组降低噪音。
 */
import type { ThingsApi } from '@vben/api';

import type { DeviceLogTabKey, DeviceLogTimelineItem } from './normalizers';
import type { DeviceLogTimePreset } from './time-range';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { Page } from '@vben/common-ui';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VbenSpinner,
} from '@vben-core/shadcn-ui';

import { buildOrgPath, extractOrgIdFromPath } from '#/router/org-scope';
import { DEVICE_STATUS_MAP } from '#/utils/energy-constants';

import DateTimeRangePopover from './components/DateTimeRangePopover.vue';
import LogTimeline from './components/LogTimeline.vue';
import { DeviceLogsApi } from './index.api';
import {
  buildSchemaNameMap,
  mergeAndSortTimelineItems,
  normalizeControlLog,
  normalizeEventLog,
  normalizeHubLog,
  normalizePropertyLog,
  normalizeStatusLog,
} from './normalizers';
import { createTimeRangeFromCustom, createTimeRangeFromPreset, DEVICE_LOG_TIME_PRESETS } from './time-range';

const PAGE_SIZE = 20;

const route = useRoute();
const router = useRouter();

/** 日志页签配置，保持和用户确认的四类日志顺序一致。 */
const logTabs: Array<{ description: string; label: string; value: DeviceLogTabKey }> = [
  { description: $t('orgIotClient.deviceLogs.tabStatusDesc'), label: $t('orgIotClient.deviceLogs.tabStatus'), value: 'status' },
  { description: $t('orgIotClient.deviceLogs.tabControlDesc'), label: $t('orgIotClient.deviceLogs.tabControl'), value: 'control' },
  { description: $t('orgIotClient.deviceLogs.tabDebugDesc'), label: $t('orgIotClient.deviceLogs.tabDebug'), value: 'debug' },
  { description: $t('orgIotClient.deviceLogs.tabThingModelDesc'), label: $t('orgIotClient.deviceLogs.tabThingModel'), value: 'thingModel' },
];

function firstRouteParam(value: unknown) {
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

const productID = computed(() => firstRouteParam(route.params.productID));
const deviceName = computed(() => firstRouteParam(route.params.deviceName));

const activeTab = ref<DeviceLogTabKey>('status');
const timePreset = ref<DeviceLogTimePreset | 'custom'>('last30m');
const timeRange = ref(createTimeRangeFromPreset('last30m'));
const startInput = ref(timeRange.value.startInput);
const endInput = ref(timeRange.value.endInput);

const deviceInfo = ref<ThingsApi.DeviceInfo | null>(null);
const schemaList = ref<ThingsApi.DeviceSchema[]>([]);
const metaLoading = ref(false);
const logs = ref<DeviceLogTimelineItem[]>([]);
const expandedDates = ref<Record<DeviceLogTabKey, Record<string, boolean>>>({
  control: {},
  debug: {},
  status: {},
  thingModel: {},
});
const loading = ref(false);
const loadingMore = ref(false);
const errorMessage = ref('');
const page = ref(1);
const hasMore = ref(false);
const lastUpdated = ref('');
const selectedLog = ref<DeviceLogTimelineItem | null>(null);
const customTimePopoverOpen = ref(false);

const schemaMap = computed(() => buildSchemaNameMap(schemaList.value));
const currentTabMeta = computed(() => logTabs.find((item) => item.value === activeTab.value) || logTabs[0]!);
const currentTimeRangeLabel = computed(() => timeRange.value.label);
/** currentTimeRangeSummary 展示当前日志查询的完整起止时间，作为非交互摘要避免误触自定义时间浮层。 */
const currentTimeRangeSummary = computed(() => $t('orgIotClient.deviceLogs.timeRangeJoin', { start: timeRange.value.startInput.replace('T', ' '), end: timeRange.value.endInput.replace('T', ' ') }));
const deviceTitle = computed(() => deviceInfo.value?.deviceAlias || deviceName.value);
const deviceStatus = computed(() => DEVICE_STATUS_MAP[Number(deviceInfo.value?.status)] || { label: $t('orgIotClient.deviceSpace.unknown'), type: 'default' as const });
const detailOpen = computed({
  get: () => Boolean(selectedLog.value),
  set: (open: boolean) => {
    if (!open) selectedLog.value = null;
  },
});

/** badgeVariantByStatus 统一设备状态 badge 的样式变体。 */
function badgeVariantByStatus(type: string) {
  if (type === 'error') return 'destructive';
  if (type === 'success') return 'default';
  if (type === 'warning') return 'secondary';
  return 'outline';
}

/** badgeToneClass 按日志色调返回同一套明暗适配颜色类。 */
function badgeToneClass(type: string) {
  if (type === 'success') {
    return 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-500/20 dark:text-emerald-100';
  }
  if (type === 'danger') {
    return 'border-rose-400/60 bg-rose-50 text-rose-700 dark:border-rose-400/70 dark:bg-rose-500/20 dark:text-rose-100';
  }
  if (type === 'warning') {
    return 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-400/70 dark:bg-amber-500/20 dark:text-amber-100';
  }
  if (type === 'info') {
    return 'border-sky-400/60 bg-sky-50 text-sky-700 dark:border-sky-400/70 dark:bg-sky-500/20 dark:text-sky-100';
  }
  return 'border-border/70 bg-muted/60 text-muted-foreground dark:border-muted-foreground/30 dark:bg-muted/20 dark:text-muted-foreground';
}

function formatUpdateTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function buildQuery(nextPage: number) {
  return {
    deviceName: deviceName.value,
    page: nextPage,
    productID: productID.value,
    size: PAGE_SIZE,
    timeEnd: timeRange.value.timeEnd,
    timeStart: timeRange.value.timeStart,
  };
}

async function loadDeviceMeta() {
  if (!deviceName.value || !productID.value) return;
  metaLoading.value = true;
  try {
    const [infoResult, schemaResult] = await Promise.allSettled([
      DeviceLogsApi.getDeviceInfo({ deviceName: deviceName.value, productID: productID.value }),
      DeviceLogsApi.getDeviceSchemas({ deviceName: deviceName.value, productID: productID.value }),
    ]);
    if (infoResult.status === 'fulfilled') {
      deviceInfo.value = infoResult.value as ThingsApi.DeviceInfo;
    }
    if (schemaResult.status === 'fulfilled') {
      schemaList.value = schemaResult.value;
    }
  } finally {
    metaLoading.value = false;
  }
}

function normalizeThingModelLogs(source: Awaited<ReturnType<typeof DeviceLogsApi.getThingModelLogs>>) {
  return mergeAndSortTimelineItems([
    ...source.propertyLogs.map((item) => normalizePropertyLog(item, schemaMap.value)),
    ...source.propertyHubLogs.map((item) => normalizeHubLog(item, 'thingModel')),
    ...source.eventLogs.map((item) => normalizeEventLog(item, schemaMap.value)),
    ...source.actionLogs.map((item) => normalizeControlLog(item, schemaMap.value, 'thingModel')),
  ]);
}

function expandAllDateGroups(list: DeviceLogTimelineItem[], clearExisting = false) {
  const nextMap = clearExisting ? {} : { ...(expandedDates.value[activeTab.value] || {}) };
  for (const item of list) {
    nextMap[item.dateLabel] = true;
  }
  expandedDates.value[activeTab.value] = nextMap;
}

async function loadCurrentLogs(append = false) {
  if (!deviceName.value || !productID.value) return;
  const nextPage = append ? page.value + 1 : 1;
  if (append) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    errorMessage.value = '';
  }

  try {
    const query = buildQuery(nextPage);
    let normalized: DeviceLogTimelineItem[] = [];
    let sourceCounts: number[] = [];

    if (activeTab.value === 'status') {
      const list = await DeviceLogsApi.getStatusLogs(query);
      normalized = list.map(normalizeStatusLog);
      sourceCounts = [list.length];
    } else if (activeTab.value === 'control') {
      const list = await DeviceLogsApi.getControlLogs(query);
      normalized = list.map((item) => normalizeControlLog(item, schemaMap.value));
      sourceCounts = [list.length];
    } else if (activeTab.value === 'debug') {
      const list = await DeviceLogsApi.getDebugLogs(query);
      normalized = list.map((item) => normalizeHubLog(item));
      sourceCounts = [list.length];
    } else {
      // 属性历史接口要求明确的 dataID；批量请求复用已加载物模型，保留每条质量和接收时间。
      const dataIDs = schemaList.value.filter((item) => item.type === 1).map((item) => item.identifier).filter((id): id is string => Boolean(id));
      const source = await DeviceLogsApi.getThingModelLogs(query, dataIDs);
      normalized = normalizeThingModelLogs(source);
      sourceCounts = [source.propertyLogs.length, source.propertyHubLogs.length, source.eventLogs.length, source.actionLogs.length];
    }

    logs.value = append ? mergeAndSortTimelineItems([...logs.value, ...normalized]) : normalized;
    expandAllDateGroups(logs.value, !append);
    hasMore.value = sourceCounts.some((count) => count >= PAGE_SIZE);
    page.value = nextPage;
    lastUpdated.value = formatUpdateTime(new Date());
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : $t('orgIotClient.deviceLogs.apiError');
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

/** selectPresetRange 应用快捷时间范围，并确保已打开的自定义时间浮层被收起。 */
function selectPresetRange(preset: DeviceLogTimePreset) {
  customTimePopoverOpen.value = false;
  timePreset.value = preset;
  timeRange.value = createTimeRangeFromPreset(timePreset.value);
  startInput.value = timeRange.value.startInput;
  endInput.value = timeRange.value.endInput;
  loadCurrentLogs();
}

function applyCustomTimeRange() {
  const customRange = createTimeRangeFromCustom(startInput.value, endInput.value);
  if (!customRange) {
    errorMessage.value = $t('orgIotClient.deviceLogs.invalidCustomRange');
    return;
  }
  timePreset.value = 'custom';
  timeRange.value = customRange;
  loadCurrentLogs();
}

function refreshLogs() {
  customTimePopoverOpen.value = false;
  loadCurrentLogs();
}

function toggleDate(dateLabel: string) {
  expandedDates.value[activeTab.value] = {
    ...expandedDates.value[activeTab.value],
    [dateLabel]: !expandedDates.value[activeTab.value][dateLabel],
  };
}

function goBackToConsole() {
  router.push(buildOrgPath(extractOrgIdFromPath(route.path), '/device-space/console'));
}

watch(activeTab, () => {
  customTimePopoverOpen.value = false;
  loadCurrentLogs();
});

onMounted(async () => {
  await loadDeviceMeta();
  await loadCurrentLogs();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <Card>
        <CardContent class="p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-start gap-4">
              <div class="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-lg font-semibold text-foreground">
                {{ deviceTitle.slice(0, 1).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-medium text-muted-foreground">{{ $t('orgIotClient.deviceLogs.currentDevice') }}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-xl font-semibold text-foreground">{{ deviceTitle }}</h2>
                  <Badge :variant="badgeVariantByStatus(deviceStatus.type)">{{ deviceStatus.label }}</Badge>
                  <Badge variant="outline" class="w-24 justify-center">{{ currentTabMeta.label }}</Badge>
                </div>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{{ $t('orgIotClient.deviceSpace.deviceIdValue', { value: deviceName }) }}</span>
                  <span>{{ $t('orgIotClient.deviceLogs.productIdValue', { value: productID }) }}</span>
                  <span v-if="deviceInfo?.productName">{{ $t('orgIotClient.deviceLogs.productValue', { value: deviceInfo.productName }) }}</span>
                  <span v-if="lastUpdated">{{ $t('orgIotClient.deviceLogs.lastRefresh', { value: lastUpdated }) }}</span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" @click="goBackToConsole">
                <span class="icon-[mdi--arrow-left]" data-icon="inline-start"></span>
                {{ $t('orgIotClient.deviceLogs.backToConsole') }}
              </Button>
              <Button size="sm" :disabled="loading || metaLoading" @click="refreshLogs">
                <VbenSpinner v-if="loading" class="mr-2 size-4" />
                <span v-else class="icon-[mdi--refresh]" data-icon="inline-start"></span>
                {{ $t('iotApp.common.refresh') }}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>{{ $t('orgIotClient.deviceLogs.deviceLogsTitle') }}</CardTitle>
              <CardDescription>{{ $t('orgIotClient.deviceLogs.deviceLogsDesc') }}</CardDescription>
            </div>
            <div class="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
              <div
                data-testid="device-log-time-presets"
                class="grid w-full grid-cols-2 gap-1 sm:grid-cols-5 xl:w-[460px]"
              >
                <Button
                  v-for="preset in DEVICE_LOG_TIME_PRESETS"
                  :key="preset.value"
                  :variant="timePreset === preset.value ? 'secondary' : 'outline'"
                  size="sm"
                  class="h-8 w-full min-w-0 px-2"
                  @pointerdown="customTimePopoverOpen = false"
                  @click="selectPresetRange(preset.value)"
                >
                  {{ preset.label }}
                </Button>
              </div>
              <div class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-end xl:w-[460px]">
                <div
                  data-testid="device-log-current-range"
                  class="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-xs text-muted-foreground"
                >
                  <span class="icon-[mdi--clock-time-four-outline] shrink-0" data-icon="inline-start"></span>
                  <span class="min-w-0 truncate tabular-nums">{{ $t('orgIotClient.deviceLogs.currentRange', { label: currentTimeRangeLabel, value: currentTimeRangeSummary }) }}</span>
                </div>
                <DateTimeRangePopover
                  v-model:end-input="endInput"
                  v-model:open="customTimePopoverOpen"
                  v-model:start-input="startInput"
                  :label="currentTimeRangeLabel"
                  @apply="applyCustomTimeRange"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <Tabs v-model="activeTab" class="flex flex-col gap-4">
            <TabsList data-testid="device-log-tabs" class="grid h-auto w-full grid-cols-2 gap-1 lg:h-10 lg:w-[432px] lg:grid-cols-4">
              <TabsTrigger v-for="tab in logTabs" :key="tab.value" :value="tab.value" class="h-8 w-full min-w-0 px-3">
                {{ tab.label }}
              </TabsTrigger>
            </TabsList>

            <TabsContent v-for="tab in logTabs" :key="tab.value" :value="tab.value" class="m-0">
              <LogTimeline
                :error-message="errorMessage"
                :expanded-dates="expandedDates[activeTab]"
                :has-more="hasMore"
                :loading="loading"
                :loading-more="loadingMore"
                :logs="logs"
                @load-more="loadCurrentLogs(true)"
                @retry="loadCurrentLogs()"
                @select="(item) => (selectedLog = item)"
                @toggle-date="toggleDate"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>

    <Sheet v-model:open="detailOpen">
      <SheetContent side="right" class="flex w-full max-w-xl flex-col gap-0 p-0 sm:max-w-xl" :modal="true" :open="detailOpen">
        <SheetHeader class="border-b border-border p-5">
          <div class="flex items-center justify-between gap-3">
            <SheetTitle>{{ selectedLog?.title || $t('orgIotClient.deviceLogs.logDetail') }}</SheetTitle>
            <Button variant="ghost" size="sm" :aria-label="$t('orgIotClient.deviceLogs.closeLogDetail')" @click="detailOpen = false">{{ $t('console.common.close') }}</Button>
          </div>
          <SheetDescription>{{ selectedLog?.dateLabel }} {{ selectedLog?.timeLabel }}</SheetDescription>
        </SheetHeader>
        <div v-if="selectedLog" class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
          <div class="flex flex-wrap items-center gap-2">
            <Badge
              v-if="selectedLog"
              variant="outline"
              :class="badgeToneClass(selectedLog.resultTone)"
            >
              {{ selectedLog.badgeLabel }}
            </Badge>
            <Badge v-if="selectedLog.actor" variant="secondary">{{ selectedLog.actor }}</Badge>
          </div>
          <div class="flex flex-col gap-3">
            <div v-for="row in selectedLog.detailRows" :key="row.label" class="grid gap-1 rounded-md border border-border p-3 md:grid-cols-[120px_minmax(0,1fr)]">
              <div class="text-xs font-medium text-muted-foreground">{{ row.label }}</div>
              <div class="break-all text-sm text-foreground">{{ row.value }}</div>
            </div>
          </div>
          <Separator />
          <div class="flex flex-col gap-2">
            <div class="text-xs font-medium text-muted-foreground">{{ $t('orgIotClient.deviceLogs.rawRecord') }}</div>
            <pre class="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">{{ JSON.stringify(selectedLog.raw, null, 2) }}</pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </Page>
</template>
