<!-- 文件说明：渲染单个受控内容块；图表与表格数据均从保存的快照查询。 -->
<script setup lang="ts">
import { Table as ResizableTable } from '@unitedrhino/saas-ui/ui/table';

import { $t } from '@vben/saas/locales';
import type { Cell, ChatInteractionResult, InteractionBlock, ResultFollowUp } from './interaction';
import AiAttachment from './AiAttachment.vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ChartRenderer from '../ai-tool/ChartRenderer.vue';
import { getInteractionRows, getInteractionSeries } from './api';
import { chartData } from './interaction';
import { reportMarkdown } from './report-markdown';

/** block 和 result 均来自已鉴权的结果接口，不接收模型任意组件参数。 */
const props = defineProps<{ block: InteractionBlock; result: ChatInteractionResult; readOnly?: boolean }>();
/** followUp 把当前表格条件连同内容块引用交给输入框。 */
const emit = defineEmits<{ followUp: [reference: ResultFollowUp] }>();
/** 页面与分页状态只在当前块存活期间保留。 */
const rows = ref<Record<string, Cell>[]>([]);
const total = ref(0);
const page = ref(1);
const sortField = ref('');
const sortDirection = ref('');
const loading = ref(false);
const error = ref('');
const sampled = ref(false);
const expanded = ref(false);
const chartDialog = ref<HTMLDialogElement>();
const detail = ref<Record<string, Cell>>();
/** 用户点击的真实数据点，随内容块切换清除。 */
const selection = ref<Record<string, Cell>>({});
let generation = 0;

/** 数据集字段是指标、表头和明细名称的唯一来源。 */
const dataset = computed(() => props.result.datasets.find((item) => item.id === props.block.datasetID));
const chart = computed(() => {
  const data = chartData(props.block, rows.value);
  data.series.forEach((series, index) => {
    const field = props.block.series?.[index]?.yField;
    const unit = dataset.value?.fields.find((item) => item.key === field)?.unit;
    if (unit) series.name = `${series.name}（${unit}）`;
  });
  return data;
});
const hasChartValues = computed(() => chart.value.series.some((series) => series.data.some((value) => value !== null && (props.block.chartType !== 'pie' || value > 0))));
const metricValue = computed(() => rows.value[0]?.[props.block.valueField ?? ''] ?? null);
const markdown = computed(() => reportMarkdown(props.block.text ?? ''));

/** load 阻止较早的分页响应覆盖最新选择；卸载后不再回写组件。 */
async function load() {
  const current = ++generation;
  error.value = '';
  loading.value = true;
  try {
    if (props.block.type === 'chart') {
      const response = await getInteractionSeries(props.result.resultID, props.block.id);
      if (current !== generation) return;
      rows.value = response.rows;
      sampled.value = response.sampled;
      total.value = response.originalRowCount;
    } else if (props.block.type === 'table' || props.block.type === 'metric') {
      const metric = props.block.type === 'metric';
      const response = await getInteractionRows(props.result.resultID, props.block.datasetID ?? '', metric ? (props.block.rowIndex ?? 0) + 1 : page.value, sortField.value, sortDirection.value, metric ? 1 : 20);
      if (current !== generation) return;
      rows.value = response.rows;
      total.value = response.total;
    }
  } catch (cause) {
    if (current === generation) {
      rows.value = [];
      error.value = cause instanceof Error ? cause.message : $t('aiChat.ui.failedToReadTheResultPleaseTryAgain');
    }
  } finally {
    if (current === generation) loading.value = false;
  }
}

/** sort 保留按字段类型排序的服务端语义，点击同列切换方向。 */
function sort(field: string) {
  sortDirection.value = sortField.value === field && sortDirection.value === 'asc' ? 'desc' : 'asc';
  sortField.value = field;
  page.value = 1;
  void load();
}

/** turnPage 发起分页，不触发业务工具重新统计。 */
function turnPage(delta: number) { page.value += delta; detail.value = undefined; void load(); }
/** label 把字段键映射为业务名称。 */
function label(key: string) { return dataset.value?.fields.find((field) => field.key === key)?.label ?? key; }
/** display 将 null 明确显示为缺失。 */
function display(value: Cell | undefined) { return value === null || value === undefined ? $t('aiChat.ui.noDataYet') : String(value); }
watch(() => [props.result.resultID, props.block.id], () => { page.value = 1; selection.value = {}; void load(); }, { immediate: true });
onBeforeUnmount(() => { generation++; });
</script>

<template>
  <section class="min-w-0 max-w-full space-y-3" :data-block-type="block.type">
    <div class="flex flex-wrap items-center justify-between gap-2"><h4 v-if="block.title" class="text-foreground text-sm font-medium">{{ block.title }}</h4><div class="ml-auto flex items-center gap-3"><button v-if="block.type === 'chart' && hasChartValues" class="text-muted-foreground text-xs hover:text-foreground" @click="expanded = true; chartDialog?.showModal()">{{ $t('aiChat.ui.enlargeToView') }}</button><button v-if="!readOnly && block.type !== 'markdown'" type="button" class="text-muted-foreground text-xs hover:text-foreground" @click="emit('followUp', { resultID: result.resultID, blockID: block.id, title: block.title || result.title, selection: JSON.stringify({ page, sortField, sortDirection, ...selection }) })">{{ $t('aiChat.ui.continueAskingQuestions') }}</button></div></div>
    <p v-if="selection.xValue" class="text-muted-foreground text-xs">{{ $t('aiChat.ui.selected_f24ddc') }} {{ selection.xValue }} · {{ selection.seriesName }}：{{ display(selection.value) }}</p>
    <p v-if="loading" class="text-muted-foreground text-xs" role="status">{{ $t('aiChat.ui.readingResults') }}</p>
    <div v-else-if="error" class="text-destructive space-y-1 text-xs" role="alert">
      <p>{{ error }}</p><button type="button" class="underline" @click="load">{{ $t('aiChat.ui.reread') }}</button>
    </div>
    <template v-else>
      <!-- Markdown 已禁止原始 HTML 并经过 DOMPurify。 -->
      <div v-if="block.type === 'markdown'" class="prose prose-sm dark:prose-invert max-w-none" v-html="markdown" />
      <AiAttachment v-else-if="block.artifactID" :artifact-i-d="block.artifactID" />
      <div v-else-if="block.type === 'metric'">
        <span class="text-foreground text-2xl font-semibold">{{ display(metricValue) }}</span>
        <span v-if="metricValue !== null" class="text-muted-foreground ml-1 text-xs">{{ block.unit }}</span>
        <p v-if="block.description" class="text-muted-foreground mt-1 text-xs">{{ block.description }}</p>
      </div>
      <template v-else-if="block.type === 'chart'">
        <p v-if="!hasChartValues" class="text-muted-foreground text-xs">{{ $t('aiChat.ui.thereIsCurrentlyNoValueToDrawPleaseCheckTheMissi') }}</p>
        <template v-else>
          <ChartRenderer @selection="selection = $event" :type="block.chartType ?? 'line'" :data="chart" flat :time-axis="dataset?.fields.find((field) => field.key === block.xField)?.type === 'datetime'" height="260px" zoom />
          <!-- 原生放大层先消费 Esc，避免同时关闭外层工作台。 -->
          <dialog ref="chartDialog" @keydown.esc.stop @close="expanded = false" class="bg-background text-foreground border-border w-[min(90vw,1000px)] rounded-xl border p-4 backdrop:bg-background/70">
            <div class="mb-3 flex justify-between"><span>{{ block.title }}</span><button type="button" :aria-label="$t('aiChat.ui.closeMagnifiedChart')" @click="chartDialog?.close()">{{ $t('aiChat.ui.close') }}</button></div>
            <ChartRenderer @selection="selection = $event" v-if="expanded" :type="block.chartType ?? 'line'" :data="chart" flat :time-axis="dataset?.fields.find((field) => field.key === block.xField)?.type === 'datetime'" height="480px" zoom />
          </dialog>
        </template>
        <p v-if="sampled" class="text-muted-foreground text-xs">{{ $t('aiChat.ui.original') }} {{ total }} {{ $t('aiChat.ui.okTheSamplingTrendIsCurrentlyDisplayedTheExportR') }}</p>
      </template>
      <template v-else-if="block.type === 'table'">
        <div class="min-w-0 max-w-full overflow-x-auto">
          <ResizableTable class="w-full text-left text-xs">
            <thead><tr><th v-for="column in block.columns" :key="column" class="border-border border-b px-2 py-2"><button type="button" @click="sort(column)">{{ label(column) }} {{ sortField === column ? sortDirection === 'asc' ? '↑' : '↓' : '' }}</button></th><th class="px-2">{{ $t('aiChat.ui.operation') }}</th></tr></thead>
            <tbody><tr v-for="(row, index) in rows" :key="index" class="border-border border-b"><td v-for="column in block.columns" :key="column" class="max-w-60 truncate px-2 py-2">{{ display(row[column]) }}</td><td class="px-2"><button type="button" class="text-primary whitespace-nowrap" @click="detail = row">{{ $t('aiChat.ui.details') }}</button></td></tr></tbody>
          </ResizableTable>
          <p v-if="!rows.length" class="text-muted-foreground py-3 text-xs">{{ $t('aiChat.ui.theCurrentQueryHasNoData') }}</p>
        </div>
        <div class="text-muted-foreground flex items-center justify-between text-xs"><button type="button" :disabled="page <= 1" @click="turnPage(-1)">{{ $t('aiChat.ui.previousPage') }}</button><span>{{ $t('aiChat.ui.no') }} {{ page }} {{ $t('aiChat.ui.pageTotal') }} {{ total }} {{ $t('aiChat.ui.ok') }}</span><button type="button" :disabled="page * 20 >= total" @click="turnPage(1)">{{ $t('aiChat.ui.nextPage') }}</button></div>
        <dl v-if="detail" class="bg-muted space-y-1 rounded p-2 text-xs"><template v-for="field in dataset?.fields" :key="field.key"><dt class="text-muted-foreground">{{ field.label }} {{ field.unit }}</dt><dd class="break-all">{{ display(detail[field.key]) }}</dd></template><button type="button" class="text-primary" @click="detail = undefined">{{ $t('aiChat.ui.collapseDetails') }}</button></dl>
      </template>
    </template>
  </section>
</template>
