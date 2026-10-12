<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { ThingsApi } from '@vben/api';

import type { AlarmLevel } from '../types/alarm-v2.types';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { message } from '@vben/saas';
import { useProjectStore } from '@vben/stores';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unitedrhino/saas-ui/ui/table';

import { ListPagination } from '../../../components/data-table-page';
import { deleteAlarmInfo, evaluateAlarmInfo, getAlarmInfoList, updateAlarmInfoStatus } from '../api/alarm-info.api';
import AlarmConfirmDialog from '../components/AlarmConfirmDialog.vue';
import AlarmProjectFilter from '../components/AlarmProjectFilter.vue';
import AlarmSelect from '../components/AlarmSelect.vue';
import { getAlarmTargetDisplay, useAlarmObjectTree } from '../composables/useAlarmObjectTree';
import { AlarmLevelMap } from '../types/alarm-v2.types';

/** showProjectFilter 控制是否渲染项目选择器；routePrefix 用于拼接规则新建/编辑跳转路径。 */
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

/** statusOptions 定义告警规则状态筛选项；label 经 $t 翻译，value 保持后端状态枚举。 */
const statusOptions = computed(() => [
  { label: $t('iotApp.alarmCommon.allStatus'), value: '' },
  { label: $t('iotApp.common.enable'), value: '1' },
  { label: $t('iotApp.common.disable'), value: '2' },
]);

interface AlarmRuleDisplay {
  id: string;
  levelText: string;
  name: string;
  period: number;
  status: number;
  targetDisplay: string;
}

const rules = ref<AlarmRuleDisplay[]>([]);
const loading = ref(false);
const deleteTargetId = ref('');
const keyword = ref('');
const statusFilter = ref('');
// manualProjectReady 在项目选择器模式（showProjectFilter=true）下由 onProjectChange 置位。
const manualProjectReady = ref(false);
const projectReady = computed(() => (props.showProjectFilter ? manualProjectReady.value : Boolean(projectStore.currentProjectID)));
const currentPage = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const { treeData, loadSources } = useAlarmObjectTree();

function buildDisplay(info: ThingsApi.AlarmInfo): AlarmRuleDisplay {
  const level = info.if?.triggers?.[0]?.level as AlarmLevel | undefined;
  return {
    id: info.id ?? '',
    name: info.name ?? '',
    targetDisplay: getAlarmTargetDisplay(info.target, treeData.value, info.targetName),
    period: info.evalPeriod ?? 1,
    levelText: level ? (AlarmLevelMap[level]?.label ?? '-') : '-',
    status: info.status ?? 2,
  };
}

async function loadRules() {
  if (!projectReady.value) return;
  loading.value = true;
  try {
    const request: ThingsApi.AlarmInfoGetListReq = {
      page: { page: currentPage.value, size: pageSize },
    };
    const normalizedKeyword = keyword.value.trim();
    if (normalizedKeyword) request.keyword = normalizedKeyword;
    if (statusFilter.value) request.status = Number(statusFilter.value);

    const listPromise = getAlarmInfoList(request);
    if (treeData.value.length === 0) await loadSources();
    const res = await listPromise;
    rules.value = (res.list || []).map((item) => buildDisplay(item));
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function goEdit(id?: string) {
  if (!projectReady.value) {
    if (props.showProjectFilter) projectStore.openProjectSelectModal();
    return;
  }
  router.push(id ? `${props.routePrefix}/rule/edit/${id}` : `${props.routePrefix}/rule/edit`);
}

/** onSearch 从第一页按当前条件查询告警规则。 */
function onSearch() {
  currentPage.value = 1;
  loadRules();
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

/** onReset 清空筛选条件并重新查询告警规则。 */
function onReset() {
  keyword.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
  loadRules();
}

/** goPrev 查询上一页告警规则。 */
function goPrev() {
  if (currentPage.value <= 1) return;
  currentPage.value -= 1;
  loadRules();
}

/** goNext 查询下一页告警规则。 */
function goNext() {
  if (currentPage.value >= totalPages.value) return;
  currentPage.value += 1;
  loadRules();
}

/** requestDelete 打开当前告警规则的删除确认弹窗。 */
function requestDelete(id: string) {
  deleteTargetId.value = id;
}

/** onDeleteDialogOpenChange 在取消确认时清理待删除规则。 */
function onDeleteDialogOpenChange(open: boolean) {
  if (!open) deleteTargetId.value = '';
}

/** onDelete 删除已确认的告警规则。 */
async function onDelete() {
  const id = deleteTargetId.value;
  if (!id) return;
  deleteTargetId.value = '';
  try {
    await deleteAlarmInfo(id);
    message.success('删除成功');
    await loadRules();
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('console.common.deleteFailed'), (text) => message.error(text));
  }
}

async function onToggleStatus(rule: AlarmRuleDisplay) {
  const nextStatus = rule.status === 1 ? 2 : 1;
  try {
    await updateAlarmInfoStatus(rule.id, nextStatus);
    message.success(nextStatus === 1 ? '已启用' : '已禁用');
    await loadRules();
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('orgManage.common.updateFailed'), (text) => message.error(text));
  }
}

async function onEvaluate(id: string) {
  try {
    await evaluateAlarmInfo(id);
    message.success('触发评估已执行');
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('ui.actionMessage.executeFailed'), (text) => message.error(text));
  }
}
</script>

<template>
  <Page auto-content-height>
    <div class="bg-background flex h-full min-h-0 flex-col gap-4 p-4">
      <div class="bg-muted/20 flex flex-wrap items-center gap-3 rounded-lg border p-3" data-testid="alarm-filter-toolbar">
        <AlarmProjectFilter v-if="showProjectFilter" @change="onProjectChange" />
        <Input v-model="keyword" :placeholder="$t('iotApp.alarmCommon.ruleName')" class="w-[200px]" @keyup.enter="onSearch" />
        <AlarmSelect v-model="statusFilter" class="w-[120px]" :options="statusOptions" :placeholder="$t('iotApp.alarmCommon.allStatus')" @update:model-value="onSearch" />
        <Button variant="outline" @click="onSearch">{{ $t('iotApp.common.query') }}</Button>
        <Button v-if="keyword || statusFilter" variant="ghost" @click="onReset">{{ $t('iotApp.common.reset') }}</Button>
        <!-- 工具条扩展插槽：宿主应用可注入页面教程等自定义入口（默认无内容） -->
        <slot name="toolbar-extra"></slot>
        <Button class="ml-auto" @click="goEdit()"> {{ $t('iotApp.alarmRule.addRule') }} </Button>
      </div>

      <div v-if="loading || rules.length > 0" class="flex min-h-0 flex-1 flex-col gap-3">
        <div class="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow class="bg-muted/40">
                <TableHead>ID</TableHead>
                <TableHead>{{ $t('iotApp.alarmCommon.ruleName') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmRule.objectLabel') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmRule.alarmLevel') }}</TableHead>
                <TableHead>{{ $t('iotApp.alarmRule.evalPeriod') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.status') }}</TableHead>
                <TableHead>{{ $t('iotApp.common.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="7" class="text-muted-foreground py-8 text-center">{{ $t('iotApp.alarmCommon.loading') }}</TableCell>
              </TableRow>
              <TableRow v-for="rule in rules" :key="rule.id" data-testid="alarm-rule-row" :data-rule-id="rule.id" :data-rule-name="rule.name">
                <TableCell>{{ rule.id }}</TableCell>
                <TableCell>{{ rule.name }}</TableCell>
                <TableCell>{{ rule.targetDisplay }}</TableCell>
                <TableCell>{{ rule.levelText }}</TableCell>
                <TableCell>{{ rule.period }} {{ $t('iotApp.alarmRule.minutes') }}</TableCell>
                <TableCell>
                  <Badge :variant="rule.status === 1 ? 'secondary' : 'outline'">{{ rule.status === 1 ? $t('iotApp.common.enable') : $t('iotApp.common.disable') }}</Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Button data-testid="alarm-rule-edit" class="h-auto p-0" size="sm" variant="link" @click="goEdit(rule.id)">{{ $t('iotApp.common.edit') }}</Button>
                    <Button data-testid="alarm-rule-toggle" class="h-auto p-0" size="sm" variant="link" @click="onToggleStatus(rule)">
                      {{ rule.status === 1 ? $t('iotApp.common.disable') : $t('iotApp.common.enable') }}
                    </Button>
                    <Button data-testid="alarm-rule-evaluate" class="h-auto p-0" size="sm" variant="link" @click="onEvaluate(rule.id)">{{ $t('iotApp.alarmRule.evaluate') }}</Button>
                    <Button data-testid="alarm-rule-delete" class="text-destructive h-auto p-0" size="sm" variant="link" @click="requestDelete(rule.id)">
                      {{ $t('iotApp.common.delete') }}
                    </Button>
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
          <EmptyTitle>{{ $t('iotApp.alarmRule.emptyTitle') }}</EmptyTitle>
          <EmptyDescription>{{ $t('iotApp.alarmRule.emptyDesc') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <AlarmConfirmDialog
        :open="!!deleteTargetId"
        title="删除告警规则"
        description="删除后将无法恢复，确定继续吗？"
        confirm-text="删除"
        @update:open="onDeleteDialogOpenChange"
        @confirm="onDelete"
      />
    </div>
  </Page>
</template>
