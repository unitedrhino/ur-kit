<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useProjectStore } from '@vben/stores';

import { Alert, AlertDescription, AlertTitle } from '@unitedrhino/saas-ui/ui/alert';
import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';
import { Minus, Plus } from 'lucide-vue-next';

import { ListPagination } from '../../../components/data-table-page';
import { getAlarmEventOne } from '../api/alarm-event.api';
import { getAlarmNotifyRecordList, resendAlarmNotifyRecord } from '../api/alarm-notify-record.api';
import AlarmProjectFilter from '../components/AlarmProjectFilter.vue';
import { needsLegacyNotificationEvent, renderLegacyNotificationContent, resolveNotificationRecordDisplay } from './notification-content';
import { buildNotifyRecordListRequest, createEmptyNotifyRecordFilters } from './notify-record-query';

/** showProjectFilter 控制是否渲染项目选择器；当前列表仅 iot 与能源中心使用，无其他跳转路径依赖。 */
const props = withDefaults(
  defineProps<{
    showProjectFilter?: boolean;
  }>(),
  {
    showProjectFilter: true,
  },
);

const projectStore = useProjectStore();

interface NotifyRecordDisplay {
  alarmID: string;
  channel: string;
  content: string;
  createdTime: string;
  device: string;
  eventID: string;
  externalResp: string;
  failReason: string;
  id: string;
  rawStatus: string;
  retryTimes: number;
  ruleName: string;
  sentTime: string;
  status: string;
  target: string;
  type: string;
}

const records = ref<NotifyRecordDisplay[]>([]);
const loading = ref(false);
// advancedFiltersOpen 控制低频查询条件的展开状态，收起时保留已填写的筛选值。
const advancedFiltersOpen = ref(false);
const detailOpen = ref(false);
const selectedRecord = ref<NotifyRecordDisplay | null>(null);
const filters = ref(createEmptyNotifyRecordFilters());
// manualProjectReady 在项目选择器模式（showProjectFilter=true）下由 onProjectChange 置位。
const manualProjectReady = ref(false);
const projectReady = computed(() => (props.showProjectFilter ? manualProjectReady.value : Boolean(projectStore.currentProjectID)));
const currentPage = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const hasFilter = computed(() => Object.values(filters.value).some(Boolean));

// 通知状态 code → 翻译键；展示文案按当前语言渲染，判定用 code。
const statusTextKey: Record<string, string> = {
  success: 'iotApp.alarmNotify.statusSuccess',
  fail: 'iotApp.alarmNotify.statusFail',
  pending: 'iotApp.alarmNotify.statusPending',
  canceled: 'iotApp.alarmNotify.statusCanceled',
};

// 通知渠道 code → 翻译键。
const channelTextKey: Record<string, string> = {
  email: 'iotApp.alarmNotify.channelEmail',
  sms: 'iotApp.alarmNotify.channelSms',
  message: 'iotApp.alarmNotify.channelMessage',
  callback: 'iotApp.alarmNotify.channelCallback',
  dingTalk: 'iotApp.alarmNotify.channelDingTalk',
  wxMini: 'iotApp.alarmNotify.channelWxMini',
};

/** notifyStatusText 渲染通知发送状态的当前语言文案；未知值原样展示。 */
function notifyStatusText(code: string): string {
  return statusTextKey[code] ? $t(statusTextKey[code]) : code || '-';
}

/** notifyChannelText 渲染通知渠道的当前语言文案；未知值原样展示。 */
function notifyChannelText(code: string): string {
  return channelTextKey[code] ? $t(channelTextKey[code]) : code || '-';
}

function formatTargets(targets?: {
  groupIDs?: string[];
  roleIDs?: string[];
  userIDs?: string[];
  phones?: string[];
  emails?: string[];
}): string {
  if (!targets) return '-';
  const parts: string[] = [];
  if (targets.userIDs?.length) parts.push(`${$t('iotApp.alarmNotify.targetUser')}:${targets.userIDs.join(',')}`);
  if (targets.groupIDs?.length) parts.push(`${$t('iotApp.alarmNotify.targetUserGroup')}:${targets.groupIDs.join(',')}`);
  if (targets.roleIDs?.length) parts.push(`${$t('iotApp.alarmNotify.targetRole')}:${targets.roleIDs.join(',')}`);
  // 直接填写的手机号/邮箱（告警通知直接地址场景，无用户昵称可查）
  if (targets.phones?.length) parts.push(`${$t('iotApp.alarmNotify.targetPhone')}:${targets.phones.join(',')}`);
  if (targets.emails?.length) parts.push(`${$t('iotApp.alarmNotify.targetEmail')}:${targets.emails.join(',')}`);
  return parts.length > 0 ? parts.join('; ') : '-';
}

async function loadData() {
  if (!projectReady.value) return;
  loading.value = true;
  try {
    const res = await getAlarmNotifyRecordList(buildNotifyRecordListRequest(filters.value, currentPage.value, pageSize));
    const list = res.list || [];
    total.value = res.total || 0;
    const eventIDs = [
      ...new Set(
        list
          .filter((item) => needsLegacyNotificationEvent(item.content))
          .map((item) => String(item.eventID ?? ''))
          .filter(Boolean),
      ),
    ];
    const eventResults = await Promise.allSettled(eventIDs.map((id) => getAlarmEventOne(id)));
    const eventMap = new Map(
      eventResults.flatMap((result, index) => {
        if (result.status !== 'fulfilled' || !result.value.event) return [];
        return [[eventIDs[index], result.value.event] as const];
      }),
    );

    records.value = list.map((item) => {
      const eventID = String(item.eventID ?? '');
      const alarmID = String(item.alarmID ?? '');
      const event = eventMap.get(eventID);
      const display = resolveNotificationRecordDisplay(
        {
          alarmID,
          alarmName: item.alarmName,
          eventID,
          targetName: item.targetName,
        },
        event,
      );
      const rawStatus = item.status || '';
      return {
        id: String(item.id ?? ''),
        eventID,
        alarmID,
        type: item.timing === 'recovery' ? 'recovery' : 'trigger',
        ruleName: display.ruleName,
        device: display.device,
        channel: item.channel || '-',
        target: formatTargets(item.targets),
        status: rawStatus || '-',
        rawStatus,
        content: renderLegacyNotificationContent(item.content || '-', item.timing || '', event),
        failReason: item.failReason || '',
        externalResp: item.externalResp || '',
        createdTime: formatTime(item.createdTime),
        sentTime: formatTime(item.sentTime),
        retryTimes: item.retryTimes || 0,
      };
    });
  } finally {
    loading.value = false;
  }
}

/** onSearch 从第一页执行当前筛选条件。 */
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

/** onReset 清空筛选条件并重新加载第一页。 */
function onReset() {
  filters.value = createEmptyNotifyRecordFilters();
  currentPage.value = 1;
  loadData();
}

/** goPrev 加载上一页通知记录。 */
function goPrev() {
  if (currentPage.value <= 1) return;
  currentPage.value -= 1;
  loadData();
}

/** goNext 加载下一页通知记录。 */
function goNext() {
  if (currentPage.value >= totalPages.value) return;
  currentPage.value += 1;
  loadData();
}

async function resend(id: string) {
  await resendAlarmNotifyRecord(id);
  await loadData();
}

// openDetail 打开当前通知记录的详情弹窗。
function openDetail(record: NotifyRecordDisplay) {
  selectedRecord.value = record;
  detailOpen.value = true;
}

// formatTime 将接口毫秒时间戳转换为本地时间文案。
function formatTime(value?: string): string {
  if (!value) return '-';
  const timestamp = Number(value);
  const date = Number.isNaN(timestamp) ? new Date(value) : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

/** statusVariant 将通知状态 code 映射为 Badge 的语义变体。 */
function statusVariant(status: string): 'destructive' | 'outline' | 'secondary' {
  if (status === 'fail') return 'destructive';
  if (status === 'success') return 'secondary';
  return 'outline';
}
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4">
      <div class="bg-muted/20 flex min-w-0 flex-col gap-2 rounded-lg border p-3" data-testid="alarm-filter-toolbar">
        <div class="flex w-full items-center gap-2 overflow-x-auto" data-testid="alarm-filter-primary">
          <AlarmProjectFilter v-if="showProjectFilter" class="shrink-0" @change="onProjectChange" />
          <Input v-model="filters.ruleName" class="h-8 w-[180px] shrink-0" :placeholder="$t('iotApp.alarmCommon.ruleName')" @keyup.enter="onSearch" />
          <Input v-model="filters.targetName" class="h-8 w-[180px] shrink-0" :placeholder="$t('iotApp.alarmRule.objectLabel')" @keyup.enter="onSearch" />
          <Button class="h-8 shrink-0" size="sm" @click="onSearch">{{ $t('iotApp.common.query') }}</Button>
          <Button v-if="hasFilter" class="h-8 shrink-0" size="sm" variant="ghost" @click="onReset">{{ $t('iotApp.common.reset') }}</Button>
          <Button
            class="h-8 w-8 shrink-0"
            size="icon"
            variant="outline"
            data-testid="alarm-filter-toggle"
            :aria-label="advancedFiltersOpen ? $t('iotApp.alarmNotify.collapseFilters') : $t('iotApp.alarmNotify.expandFilters')"
            :title="advancedFiltersOpen ? $t('iotApp.alarmNotify.collapseFilters') : $t('iotApp.alarmNotify.expandFilters')"
            @click="advancedFiltersOpen = !advancedFiltersOpen"
          >
            <Minus v-if="advancedFiltersOpen" class="h-4 w-4" />
            <Plus v-else class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="advancedFiltersOpen" class="flex flex-wrap items-center gap-2" data-testid="alarm-filter-advanced">
          <Select v-model="filters.timing">
            <SelectTrigger class="h-8 w-[130px]"><SelectValue :placeholder="$t('iotApp.alarmNotify.notifyType')" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="trigger">{{ $t('iotApp.alarmNotify.triggerLabel') }}</SelectItem>
              <SelectItem value="recovery">{{ $t('iotApp.alarmNotify.recoveryLabel') }}</SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="filters.status">
            <SelectTrigger class="h-8 w-[130px]"><SelectValue :placeholder="$t('iotApp.alarmNotify.sendStatus')" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{{ $t('iotApp.alarmNotify.statusPending') }}</SelectItem>
              <SelectItem value="success">{{ $t('iotApp.alarmNotify.statusSuccess') }}</SelectItem>
              <SelectItem value="fail">{{ $t('iotApp.alarmNotify.statusFail') }}</SelectItem>
              <SelectItem value="canceled">{{ $t('iotApp.alarmNotify.statusCanceled') }}</SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="filters.channel">
            <SelectTrigger class="h-8 w-[130px]"><SelectValue :placeholder="$t('iotApp.alarmContentTpl.channelLabel')" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{{ $t('iotApp.alarmNotify.channelEmail') }}</SelectItem>
              <SelectItem value="sms">{{ $t('iotApp.alarmNotify.channelSms') }}</SelectItem>
              <SelectItem value="message">{{ $t('iotApp.alarmNotify.channelMessage') }}</SelectItem>
              <SelectItem value="callback">{{ $t('iotApp.alarmNotify.channelCallback') }}</SelectItem>
            </SelectContent>
          </Select>

          <div class="text-muted-foreground flex items-center gap-1 text-xs">
            <span>{{ $t('iotApp.alarmNotify.createdTime') }}</span>
            <Input v-model="filters.createdStart" class="h-8 w-[180px]" type="datetime-local" />
            <span>{{ $t('iotApp.alarmNotify.to') }}</span>
            <Input v-model="filters.createdEnd" class="h-8 w-[180px]" type="datetime-local" />
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-muted-foreground py-8 text-center text-sm">{{ $t('iotApp.alarmCommon.loading') }}</div>

      <div v-else-if="records.length > 0" class="flex min-h-0 flex-1 flex-col gap-3">
        <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/40">
                <TableHead>{{ $t('iotApp.alarmNotify.colType') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmCommon.ruleName') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmRule.objectLabel') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmNotify.colChannel') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmNotify.colTarget') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.status') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rec in records" :key="rec.id">
                <TableCell>{{ rec.type === 'recovery' ? $t('iotApp.alarmNotify.recoveryLabel') : $t('iotApp.alarmNotify.triggerLabel') }}</TableCell>
                <TableCell>{{ rec.ruleName }}</TableCell>
                <TableCell>{{ rec.device }}</TableCell>
                <TableCell>{{ notifyChannelText(rec.channel) }}</TableCell>
                <TableCell>{{ rec.target }}</TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(rec.rawStatus)">{{ notifyStatusText(rec.status) }}</Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-3">
                    <Button v-if="rec.rawStatus === 'fail'" class="h-auto p-0" size="sm" variant="link" @click="resend(rec.id)">{{ $t('iotApp.alarmNotify.resend') }}</Button>
                    <Button class="h-auto p-0" size="sm" variant="link" @click="openDetail(rec)">{{ $t('iotApp.common.detail') }}</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <ListPagination :page="currentPage" :total-pages="totalPages" :total="total" :loading="loading" @prev="goPrev" @next="goNext" />
      </div>

      <Empty v-else class="min-h-0 flex-1 border">
        <EmptyHeader>
          <EmptyTitle>{{ $t('iotApp.alarmNotify.emptyTitle') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.alarmNotify.emptyDesc') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ $t('iotApp.alarmNotify.detailTitle') }}</DialogTitle>
          <DialogDescription>{{ $t('iotApp.alarmNotify.detailDesc') }}</DialogDescription>
        </DialogHeader>

        <div v-if="selectedRecord" class="flex flex-col gap-4 text-sm">
          <div class="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmCommon.ruleName') }}：</span>{{ selectedRecord.ruleName }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmRule.objectLabel') }}：</span>{{ selectedRecord.device }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.notifyType') }}：</span>{{ selectedRecord.type === 'recovery' ? $t('iotApp.alarmNotify.recoveryLabel') : $t('iotApp.alarmNotify.triggerLabel') }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmContentTpl.channelLabel') }}：</span>{{ notifyChannelText(selectedRecord.channel) }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.colTarget') }}：</span>{{ selectedRecord.target }}</div>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.sendStatus') }}：</span>
              <Badge :variant="statusVariant(selectedRecord.rawStatus)">{{ notifyStatusText(selectedRecord.status) }}</Badge>
            </div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.createdTime') }}：</span>{{ selectedRecord.createdTime }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.sentTime') }}：</span>{{ selectedRecord.sentTime }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.retryTimes') }}：</span>{{ selectedRecord.retryTimes }}</div>
            <div><span class="text-muted-foreground">{{ $t('iotApp.alarmNotify.recordId') }}：</span>{{ selectedRecord.id }}</div>
          </div>

          <Alert v-if="selectedRecord.failReason" variant="destructive">
            <AlertTitle>{{ $t('iotApp.alarmNotify.failReason') }}</AlertTitle>
            <AlertDescription class="whitespace-pre-wrap break-words">{{ selectedRecord.failReason }}</AlertDescription>
          </Alert>

          <div class="rounded-lg border p-4">
            <div class="mb-2 font-medium">{{ $t('iotApp.alarmNotify.contentTitle') }}</div>
            <div class="text-muted-foreground whitespace-pre-wrap break-words">{{ selectedRecord.content }}</div>
          </div>

          <div v-if="selectedRecord.externalResp" class="rounded-lg border p-4">
            <div class="mb-2 font-medium">{{ $t('iotApp.alarmNotify.externalResp') }}</div>
            <div class="text-muted-foreground whitespace-pre-wrap break-words">{{ selectedRecord.externalResp }}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </Page>
</template>
