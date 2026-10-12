<!--
  文件说明：AI 数据任务执行记录弹窗（TASK-124 v3）。
  数据来自 aisvr clone-task 执行记录（ai_clone_task_runs）：时间/触发方式/状态/耗时/输出/错误。
  AI 任务工具的 stdout 最后一行 JSON 落在 output 字段，是排查任务执行结果的主要依据。
-->
<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import type { AiTaskRunInfo } from '../aitask.api';
import { $t } from '@vben/saas/locales';

import { ref, watch } from 'vue';

import { message } from '@vben/saas';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';
import { VbenIcon } from '@vben-core/shadcn-ui';

import { AiTaskApi } from '../aitask.api';
import { formatSimulateTime, runStatusMeta } from '../shared';

const props = defineProps<{
  /** 任务名称（标题展示） */
  taskName: string;
  /** 任务标识：与父页面 task-id 的 Vue camelize 结果一致，值始终为字符串。 */
  taskId: string;
}>();

const open = defineModel<boolean>('open', { default: false });

const loading = ref(false);
const runs = ref<AiTaskRunInfo[]>([]);
const total = ref(0);
const pageIndex = ref(1);

/** loadRuns 查询当前任务的执行记录，失败时展示接口错误。 */
async function loadRuns() {
  if (!props.taskId) return;
  loading.value = true;
  try {
    const res = await AiTaskApi.getRuns(props.taskId, pageIndex.value, 20);
    runs.value = res?.list ?? [];
    total.value = res?.total ?? 0;
  } catch (error: any) {
    notifyRequestError(error, () => error?.msg || error?.message || $t('iotApp.project.runsLoadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

watch(open, (val) => {
  if (val) {
    pageIndex.value = 1;
    loadRuns();
  }
});

/** triggerMeta 触发方式展示文案 */
function triggerMeta(type?: string): string {
  if (type === 'manual') return $t('iotApp.project.triggerManual');
  if (type === 'subscribe_message') return $t('iotApp.ruleTrigger.eventTriggered');
  return $t('iotApp.project.triggerSchedule');
}
</script>

<template>
  <Dialog :open="open" @update:open="open = $event">
    <DialogContent class="flex h-[70vh] max-w-[760px] flex-col overflow-hidden sm:max-w-[760px]">
      <DialogHeader>
        <DialogTitle>{{ $t('iotApp.project.runsTitle') }}</DialogTitle>
        <DialogDescription>{{ $t('iotApp.project.runsDesc', { name: taskName }) }}</DialogDescription>
      </DialogHeader>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div v-if="loading" class="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
          <Spinner class="size-5" />
          {{ $t('iotApp.project.loadingDots') }}
        </div>
        <div v-else-if="runs.length === 0" class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
          {{ $t('iotApp.project.noRuns') }}
        </div>
        <div v-else class="flex flex-col gap-2 overflow-y-auto pr-1">
          <div
            v-for="run in runs"
            :key="run.runID || run.id"
            class="border-border/70 bg-muted/20 flex flex-col gap-1 rounded-lg border p-3"
            :data-testid="`aitask-run-${run.runID || run.id}`"
          >
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline" :class="`px-2 py-0.5 ${runStatusMeta(run.status).tone}`">
                {{ runStatusMeta(run.status).label }}
              </Badge>
              <span class="text-muted-foreground text-xs">{{ formatSimulateTime(run.startTime) }}</span>
              <span class="text-muted-foreground text-xs">{{ triggerMeta(run.triggerType) }}</span>
              <span v-if="run.durationMs != null" class="text-muted-foreground text-xs tabular-nums">
                {{ (run.durationMs / 1000).toFixed(1) }}s
              </span>
            </div>
            <div v-if="run.errorMsg" class="text-destructive text-xs">{{ run.errorMsg }}</div>
            <pre v-if="run.output" class="bg-background text-muted-foreground max-h-24 overflow-auto rounded p-2 text-xs">{{ run.output }}</pre>
          </div>
        </div>
      </div>

      <div class="border-border/70 flex items-center justify-between border-t pt-3">
        <span class="text-muted-foreground text-xs tabular-nums">{{ $t('iotApp.project.totalItemsN', { total }) }}</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="pageIndex <= 1 || loading" @click="pageIndex--; loadRuns()">
            <VbenIcon icon="lucide:chevron-left" class="size-4" />
          </Button>
          <span class="text-muted-foreground text-xs tabular-nums">{{ $t('iotApp.project.pageNShort', { page: pageIndex }) }}</span>
          <Button variant="outline" size="sm" class="h-8 w-8 p-0" :disabled="pageIndex * 20 >= total || loading" @click="pageIndex++; loadRuns()">
            <VbenIcon icon="lucide:chevron-right" class="size-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
