<script setup lang="ts">
import type { AlarmLevel } from '../types/alarm-v2.types';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ThingsApi } from '@vben/api';
import { Page } from '@vben/common-ui';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@unitedrhino/saas-ui/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { dealAlarmEvent, falseAlarmEvent, getAlarmEventOne } from '../api/alarm-event.api';
import { levelVariant as alarmLevelVariant, eventStatusVariant, notifyStatusVariant } from '../composables/useAlarmBadgeVariant';
import { levelLabel } from '../types/alarm-v2.types';

const route = useRoute();
const eventId = String(route.params.eventId);

const event = ref<null | ThingsApi.AlarmEvent>(null);
const dealRecords = ref<ThingsApi.AlarmDealRecord[]>([]);
const notifyRecords = ref<ThingsApi.AlarmNotifyRecord[]>([]);
const loading = ref(false);
const actionLoading = ref(false);
// falseAlarmDialogOpen 控制虚警原因录入弹窗。
const falseAlarmDialogOpen = ref(false);
// falseAlarmReasonType 保存后端要求的虚警原因分类。
const falseAlarmReasonType = ref('other');
// falseAlarmReason 保存本次虚警处置备注。
const falseAlarmReason = ref('');

// 后端告警事件状态与前端展示文案的映射
const statusLabelMap: Record<string, string> = {
  alarmActive: '报警激活',
  acked: '已确认',
  shielded: '已屏蔽',
  normal: '正常',
};

// 通知发送状态与前端展示文案的映射
const notifyStatusLabelMap: Record<string, string> = {
  success: '成功',
  fail: '失败',
  pending: '待发送',
  canceled: '已取消',
};

// 处置动作与前端展示文案的映射
const actionLabelMap: Record<string, string> = {
  ack: '确认告警',
  shield: '屏蔽告警',
  unshield: '解除屏蔽',
  falseAlarm: '标记虚警',
  recover: '系统恢复',
};

// 将毫秒时间戳格式化为本地时间字符串
function formatTime(ts?: number | string): string {
  if (ts === undefined || ts === null || ts === '') return '-';
  const num = typeof ts === 'string' ? Number(ts) : ts;
  if (Number.isNaN(num) || num === 0) return '-';
  return new Date(num).toLocaleString();
}

function formatTargets(targets?: { groupIDs?: string[]; roleIDs?: string[]; userIDs?: string[] }): string {
  if (!targets) return '-';
  const parts: string[] = [];
  if (targets.userIDs?.length) parts.push(`用户:${targets.userIDs.join(',')}`);
  if (targets.groupIDs?.length) parts.push(`用户组:${targets.groupIDs.join(',')}`);
  if (targets.roleIDs?.length) parts.push(`角色:${targets.roleIDs.join(',')}`);
  return parts.length > 0 ? parts.join('; ') : '-';
}

async function loadData() {
  loading.value = true;
  try {
    const detail = await getAlarmEventOne(eventId);
    event.value = detail.event || null;
    dealRecords.value = detail.dealRecords || [];
    notifyRecords.value = detail.notifyRecords || [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

const eventStatus = computed(() => statusLabelMap[event.value?.status || ''] || event.value?.status || '-');
// availableActions 根据后端状态机计算当前允许展示的人工处置动作。
const availableActions = computed(() => {
  switch (event.value?.status) {
    case 'acked': {
      return ['shield', 'falseAlarm'];
    }
    case 'alarmActive': {
      return ['ack', 'shield', 'falseAlarm'];
    }
    case 'shielded': {
      return ['unshield', 'falseAlarm'];
    }
    default: {
      return [];
    }
  }
});

async function onAck() {
  actionLoading.value = true;
  try {
    await dealAlarmEvent(eventId, '确认告警');
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function onShield() {
  actionLoading.value = true;
  try {
    await dealAlarmEvent(eventId, '屏蔽告警');
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

/** onUnshield 将已屏蔽事件恢复为报警激活状态。 */
async function onUnshield() {
  actionLoading.value = true;
  try {
    await dealAlarmEvent(eventId, '解除屏蔽');
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

/** openFalseAlarmDialog 打开虚警原因录入弹窗并重置表单。 */
function openFalseAlarmDialog() {
  falseAlarmReasonType.value = 'other';
  falseAlarmReason.value = '';
  falseAlarmDialogOpen.value = true;
}

/** submitFalseAlarm 提交虚警原因分类和备注。 */
async function submitFalseAlarm() {
  actionLoading.value = true;
  try {
    await falseAlarmEvent(eventId, falseAlarmReason.value.trim() || '标记为虚警', falseAlarmReasonType.value);
    falseAlarmDialogOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4">
      <div v-if="loading" class="text-muted-foreground py-8 text-center text-sm">加载中...</div>

      <template v-else>
        <div class="bg-card rounded-xl border p-4 text-sm shadow-sm">
          <div class="grid grid-cols-3 gap-4">
            <div>规则：{{ event?.alarmName || '-' }}</div>
            <div>监测点：{{ event?.targetName || event?.deviceName || '-' }}</div>
            <div>事件 ID：{{ eventId }}</div>
            <div>
              级别：
              <Badge :variant="alarmLevelVariant(event?.level as AlarmLevel)">
                {{ levelLabel(event?.level as AlarmLevel) }}
              </Badge>
            </div>
            <div>
              状态：
              <Badge data-testid="alarm-disposal-status" :variant="eventStatusVariant(eventStatus)">{{ eventStatus }}</Badge>
            </div>
            <div>触发时间：{{ formatTime(event?.firstTriggerTime) }}</div>
            <div>累计触发：{{ event?.triggerCount ?? 0 }} 次</div>
            <div>通知次数：{{ notifyRecords.length }} 次</div>
          </div>
        </div>

        <div v-if="availableActions.length > 0" class="flex gap-3" data-testid="alarm-disposal-actions">
          <Button v-if="availableActions.includes('ack')" :disabled="actionLoading" data-testid="alarm-disposal-action-ack" @click="onAck"> 确认告警 </Button>
          <Button
            v-if="availableActions.includes('shield')"
            variant="outline"
            :disabled="actionLoading"
            data-testid="alarm-disposal-action-shield"
            @click="onShield"
          >
            屏蔽告警
          </Button>
          <Button
            v-if="availableActions.includes('unshield')"
            variant="outline"
            :disabled="actionLoading"
            data-testid="alarm-disposal-action-unshield"
            @click="onUnshield"
          >
            解除屏蔽
          </Button>
          <Button
            v-if="availableActions.includes('falseAlarm')"
            variant="outline"
            :disabled="actionLoading"
            data-testid="alarm-disposal-action-false-alarm"
            @click="openFalseAlarmDialog"
          >
            标记虚警
          </Button>
        </div>

        <Dialog :open="falseAlarmDialogOpen" @update:open="falseAlarmDialogOpen = $event">
          <DialogContent class="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>标记虚警</DialogTitle>
              <DialogDescription>请选择虚警原因分类并填写处置备注。</DialogDescription>
            </DialogHeader>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <label class="text-sm font-medium">原因分类</label>
                <Select v-model="falseAlarmReasonType">
                  <SelectTrigger data-testid="alarm-false-reason-type">
                    <SelectValue placeholder="请选择原因分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="configurationError">配置错误</SelectItem>
                    <SelectItem value="dataError">数据异常</SelectItem>
                    <SelectItem value="drill">演练</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <label class="text-sm font-medium">处置备注</label>
                <Input v-model="falseAlarmReason" data-testid="alarm-false-reason" placeholder="请输入虚警原因" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="falseAlarmDialogOpen = false">取消</Button>
              <Button :disabled="actionLoading" data-testid="alarm-false-confirm" @click="submitFalseAlarm"> 确认 </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div class="bg-card rounded-xl border p-4 shadow-sm">
          <div class="mb-2 text-sm font-medium">告警内容</div>
          <div class="text-muted-foreground text-sm">{{ event?.triggerContent || '-' }}</div>
        </div>

        <div class="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div class="bg-muted/40 border-b px-4 py-3 text-sm font-medium">流转记录</div>
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/40">
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>状态变更</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rec in dealRecords" :key="rec.id" data-testid="alarm-deal-record">
                <TableCell>{{ formatTime(rec.createdTime) }}</TableCell>
                <TableCell>{{ actionLabelMap[rec.action || ''] || rec.action || '-' }}</TableCell>
                <TableCell>
                  {{ statusLabelMap[rec.fromStatus || ''] || rec.fromStatus || '-' }}
                  →
                  {{ statusLabelMap[rec.toStatus || ''] || rec.toStatus || '-' }}
                </TableCell>
                <TableCell>{{ rec.operatorName || rec.operatorID || 'system' }}</TableCell>
                <TableCell>{{ rec.remark || '-' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div class="bg-muted/40 border-b px-4 py-3 text-sm font-medium">通知记录</div>
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/40">
                <TableHead>时间</TableHead>
                <TableHead>渠道</TableHead>
                <TableHead>目标</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rec in notifyRecords" :key="rec.id">
                <TableCell>{{ formatTime(rec.createdTime) }}</TableCell>
                <TableCell>{{ rec.channel || '-' }}</TableCell>
                <TableCell>{{ formatTargets(rec.targets) }}</TableCell>
                <TableCell>
                  <Badge :variant="notifyStatusVariant(rec.status)">
                    {{ notifyStatusLabelMap[rec.status || ''] || rec.status || '-' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </template>
    </div>
  </Page>
</template>
