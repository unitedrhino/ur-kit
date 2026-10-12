<script setup lang="ts">
import type { ThingsApi } from '@vben/api';

import type { AlarmLevel } from '../types/alarm-v2.types';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useProjectStore } from '@vben/stores';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { ListPagination } from '../../../components/data-table-page';
import { getAlarmEventList, getAlarmEventStat } from '../api/alarm-event.api';
import AlarmProjectFilter from '../components/AlarmProjectFilter.vue';
import AlarmSelect from '../components/AlarmSelect.vue';
import { levelVariant as alarmLevelVariant, eventStatusVariant, statValueClass } from '../composables/useAlarmBadgeVariant';
import { levelLabel } from '../types/alarm-v2.types';

/** showProjectFilter 控制是否渲染项目选择器；routePrefix 用于拼接处置详情跳转路径。 */
const props = withDefaults(
  defineProps<{
    routePrefix?: string;
    showProjectFilter?: boolean;
  }>(),
  {
    showProjectFilter: true,
    routePrefix: '/iot/alarm',
  },
);

const router = useRouter();

const projectStore = useProjectStore();

/** statusOptions 定义告警事件状态筛选项；label 经 $t 翻译，value 保持后端状态码。 */
const statusOptions = computed(() => [
  { label: $t('iotApp.alarmCommon.allStatus'), value: '' },
  { label: $t('iotApp.alarmEvent.statusAlarmActive'), value: 'alarmActive' },
  { label: $t('iotApp.alarmEvent.statusAcked'), value: 'acked' },
  { label: $t('iotApp.alarmEvent.statusNormal'), value: 'normal' },
  { label: $t('iotApp.alarmEvent.statusShielded'), value: 'shielded' },
]);

/** 事件状态 code → 翻译键，列表与统计卡片共用，避免以界面文案做判定。 */
const statusTextKey: Record<string, string> = {
  alarmActive: 'iotApp.alarmEvent.statusAlarmActive',
  acked: 'iotApp.alarmEvent.statusAcked',
  normal: 'iotApp.alarmEvent.statusNormal',
  shielded: 'iotApp.alarmEvent.statusShielded',
};

/** statusText 渲染状态 code 对应的当前语言文案；未知 code 原样展示。 */
function statusText(code: string): string {
  return statusTextKey[code] ? $t(statusTextKey[code]) : code || '-';
}

interface AlarmEventDisplay {
  device: string;
  deviceID?: string;
  id: string;
  level: string;
  levelCode: AlarmLevel;
  ruleName: string;
  status: string;
  triggerTime: string;
}

const events = ref<AlarmEventDisplay[]>([]);
/** stats 保存后端按状态汇总后的告警事件数量；label 保存状态 code，文案由模板按当前语言渲染。 */
const stats = ref<{ code: string; count: number }[]>([
  { code: 'alarmActive', count: 0 },
  { code: 'acked', count: 0 },
  { code: 'normal', count: 0 },
  { code: 'shielded', count: 0 },
]);

const keyword = ref('');
const statusFilter = ref('');
// manualProjectReady 在项目选择器模式（showProjectFilter=true）下由 onProjectChange 置位。
const manualProjectReady = ref(false);
const projectReady = computed(() => (props.showProjectFilter ? manualProjectReady.value : Boolean(projectStore.currentProjectID)));
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

// 将毫秒时间戳格式化为本地时间字符串
function formatTime(ts?: number | string): string {
  if (ts === undefined || ts === null || ts === '') return '-';
  const num = typeof ts === 'string' ? Number(ts) : ts;
  if (Number.isNaN(num) || num === 0) return '-';
  return new Date(num).toLocaleString();
}

async function loadData() {
  if (!projectReady.value) return;
  loading.value = true;
  try {
    const request: ThingsApi.AlarmEventGetListReq = {
      page: { page: currentPage.value, size: pageSize },
    };
    const normalizedKeyword = keyword.value.trim();
    if (normalizedKeyword) request.keyword = normalizedKeyword;
    if (statusFilter.value) request.status = [statusFilter.value];

    const [listRes, statRes] = await Promise.all([getAlarmEventList(request), getAlarmEventStat({ groupBy: 'status' })]);

    events.value = (listRes.list || []).map((item) => ({
      id: String(item.id ?? ''),
      ruleName: item.alarmName || '-',
      device: item.targetName || item.deviceName || '-',
      deviceID: item.deviceID || '',
      level: levelLabel(item.level as AlarmLevel),
      levelCode: item.level as AlarmLevel,
      status: item.status || '',
      triggerTime: formatTime(item.firstTriggerTime),
    }));
    total.value = listRes.total || 0;

    // 按状态统计：后端返回 key 为状态码，total 为该状态总数
    const statMap: Record<string, number> = {};
    (statRes.list || []).forEach((item) => {
      const code = item.key || '';
      if (code) {
        statMap[code] = (statMap[code] || 0) + (item.total || 0);
      }
    });

    stats.value = [
      { code: 'alarmActive', count: statMap['alarmActive'] || 0 },
      { code: 'acked', count: statMap['acked'] || 0 },
      // 已恢复对应后端 normal 状态（recoveryTime 不为空）
      { code: 'normal', count: statMap['normal'] || 0 },
      { code: 'shielded', count: statMap['shielded'] || 0 },
    ];
  } finally {
    loading.value = false;
  }
}

function goDisposal(id: string) {
  router.push(`${props.routePrefix}/disposal/${id}`);
}

/** onSearch 从第一页按当前条件查询告警事件。 */
function onSearch() {
  currentPage.value = 1;
  loadData();
}

/** onProjectChange 在项目管理器给出有效项目后执行首次查询。 */
function onProjectChange(projectID: string) {
  manualProjectReady.value = Boolean(projectID);
  if (!manualProjectReady.value) return;
  onSearch();
}

// 不渲染项目选择器时，跟随全局项目切换（如侧边栏项目选择器）自动刷新列表。
watch(
  () => projectStore.currentProjectID,
  () => {
    if (!props.showProjectFilter && projectReady.value) onSearch();
  },
  { immediate: true },
);

/** onReset 清空筛选条件并重新查询告警事件。 */
function onReset() {
  keyword.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
  loadData();
}

/** selectStatus 从统计卡片切换事件状态筛选。 */
function selectStatus(status: string) {
  statusFilter.value = status;
  onSearch();
}

/** goPrev 查询上一页告警事件。 */
function goPrev() {
  if (currentPage.value <= 1) return;
  currentPage.value -= 1;
  loadData();
}

/** goNext 查询下一页告警事件。 */
function goNext() {
  if (currentPage.value >= totalPages.value) return;
  currentPage.value += 1;
  loadData();
}
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4" data-testid="alarm-event-content">
      <div class="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3" data-testid="alarm-filter-toolbar">
        <AlarmProjectFilter v-if="showProjectFilter" @change="onProjectChange" />
        <AlarmSelect v-model="statusFilter" class="w-[140px]" :options="statusOptions" :placeholder="$t('iotApp.alarmCommon.allStatus')" @update:model-value="onSearch" />
        <Input v-model="keyword" :placeholder="$t('iotApp.alarmCommon.ruleName')" class="w-[200px]" @keyup.enter="onSearch" />
        <Button variant="outline" @click="onSearch">{{ $t('iotApp.common.query') }}</Button>
        <Button v-if="keyword || statusFilter" variant="ghost" @click="onReset">{{ $t('iotApp.common.reset') }}</Button>
      </div>

      <div class="grid grid-cols-2 gap-4 md:grid-cols-4" data-testid="alarm-event-stats">
        <Button
          v-for="stat in stats"
          :key="stat.code"
          variant="outline"
          class="hover:bg-accent bg-card flex h-auto flex-col items-center justify-center gap-1 rounded-xl border p-4 text-center shadow-sm"
          @click="selectStatus(stat.code)"
        >
          <div class="text-2xl font-semibold" :class="statValueClass(stat.code)">{{ stat.count }}</div>
          <div class="text-muted-foreground text-sm">{{ statusText(stat.code) }}</div>
        </Button>
      </div>

      <div v-if="loading" class="text-muted-foreground py-8 text-center text-sm">{{ $t('iotApp.alarmCommon.loading') }}</div>

      <div v-else-if="events.length > 0" class="flex min-h-0 flex-1 flex-col gap-3">
        <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/40">
                <TableHead>{{ $t('iotApp.alarmCommon.ruleName') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmEvent.monitoringPoint') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmEvent.level') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.status') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmEvent.triggerTime') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="event in events" :key="event.id" data-testid="alarm-event-row" :data-event-id="event.id" :data-rule-name="event.ruleName">
                <TableCell>{{ event.ruleName }}</TableCell>
                <TableCell>{{ event.deviceID ? `${event.device}(${event.deviceID})` : event.device }}</TableCell>
                <TableCell>
                  <Badge :variant="alarmLevelVariant(event.levelCode)">{{ event.level }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="eventStatusVariant(event.status)">{{ statusText(event.status) }}</Badge>
                </TableCell>
                <TableCell>{{ event.triggerTime }}</TableCell>
                <TableCell>
                  <Button data-testid="alarm-event-disposal" class="h-auto p-0" size="sm" variant="link" @click="goDisposal(event.id)">{{ $t('iotApp.alarmEvent.dispose') }}</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <ListPagination :page="currentPage" :total-pages="totalPages" :total="total" :loading="loading" @prev="goPrev" @next="goNext" />
      </div>

      <Empty v-else class="min-h-0 flex-1 border">
        <EmptyHeader>
          <EmptyTitle>{{ $t('iotApp.alarmEvent.emptyTitle') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.alarmEvent.emptyDesc') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </Page>
</template>
