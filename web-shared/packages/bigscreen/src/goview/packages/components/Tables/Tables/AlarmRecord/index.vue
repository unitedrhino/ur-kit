<!-- 文件说明：渲染告警记录滚动表，并在预览/发布态提供只读事件详情。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { CreateComponentType } from '@/packages/index.type';

import type { PropType } from 'vue';

import type { AlarmEventDetail, AlarmEventSummary } from './model';

import { computed, nextTick, onMounted, onUnmounted, reactive, ref, toRefs, watch } from 'vue';

import { post } from '@/api/http';
import { useChartDataFetch } from '@/hooks';
import { ensureDecoratedChartOptionDefaults, resolveDecoratedChartTitleHeight } from '@/packages/components/Charts/shared/decoratedChartOptions';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { isPreview } from '@/utils';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';

import DecoratedTableView from '../../shared/DecoratedTableView.vue';
import { normalizeDatasetForTableScrollBoard } from '../../shared/iotDataset';
import { extractAlarmRowMetadata, formatAlarmTargets, formatAlarmTime, normalizeAlarmStatus, unwrapAlarmDetailResponse } from './model';

interface IndexCell {
  backgroundColor: string;
  type: 'index';
  value: number;
}

interface TagCell {
  color: string;
  type: 'tag';
  value: string;
}

/** AlarmTableRow 描述滚动表格行及其对应的告警事件元数据。 */
interface AlarmTableRow {
  ceils: any[];
  meta?: AlarmEventSummary | null;
  rowIndex: number;
  scroll?: number;
}

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
});
// 告警级别与状态列在 dataset 中的下标（由默认表头顺序决定）
const LEVEL_COLUMN_INDEX = 1;
const STATUS_COLUMN_INDEX = 4;

/** actionLabelMap 把处置动作转为只读详情中的中文文案。 */
const actionLabelMap: Record<string, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get ack() { return editorT('bigscreenEditor.ui.componentAcknowledgeAlarm'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get falseAlarm() { return editorT('bigscreenEditor.ui.componentMarkAsFalseAlarm'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get recover() { return editorT('bigscreenEditor.ui.componentSystemRecovery'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get shield() { return editorT('bigscreenEditor.ui.componentSuppressAlarm'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get unshield() { return editorT('bigscreenEditor.ui.componentRemoveSuppression'); },
};

/** notifyStatusLabelMap 把通知状态转为中文文案。 */
const notifyStatusLabelMap: Record<string, string> = {
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get canceled() { return editorT('iotApp.ota.jobStatusCanceled'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get fail() { return editorT('orgManage.memory.statusFailed'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get pending() { return editorT('iotApp.alarmNotify.statusPending'); },
  /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get success() { return editorT('orgManage.memory.statusSuccess'); },
};

const { w, h } = toRefs(props.chartConfig.attr);
const { displayDecimals } = toRefs(props.chartConfig.option as any);

/** rowMetadata 保存最新数据集中每一行对应的原始事件。 */
const rowMetadata = ref<Array<AlarmEventSummary | null>>([]);
/** detailVisible 控制预览态只读详情弹窗。 */
const detailVisible = ref(false);
/** detailLoading 表示详情接口正在加载。 */
const detailLoading = ref(false);
/** detailError 保存详情接口失败提示。 */
const detailError = ref('');
/** selectedSummary 保存当前点击行携带的事件摘要。 */
const selectedSummary = ref<AlarmEventSummary | null>(null);
/** lastTriggerElement 保存弹窗关闭后需要恢复焦点的表格行。 */
const lastTriggerElement = ref<HTMLElement | null>(null);
/** detail 保存只读告警事件、处置记录和通知记录。 */
const detail = reactive<AlarmEventDetail>({ dealRecords: [], event: null, notifyRecords: [] });

ensureDecoratedChartOptionDefaults(props.chartConfig.option as Record<string, any>);

const contentWidth = computed(() => {
  const option = props.chartConfig.option as Record<string, any>;
  const padding = option.containerType === 'border' ? Number(option.padding || 0) : 0;
  return Math.max(w.value - padding * 2, 0);
});

const contentHeight = computed(() => {
  const option = props.chartConfig.option as Record<string, any>;
  const padding = option.containerType === 'border' ? Number(option.padding || 0) : 0;
  const titleHeight = option.containerType === 'border' ? resolveDecoratedChartTitleHeight(option, option.borderOption?.borderTitle) : 0;
  return Math.max(h.value - padding * 2 - titleHeight, 0);
});

const status = reactive({
  defaultConfig: {
    header: [],
    dataset: [],
    rowNum: 5,
    headerBGC: '#00BAFF',
    oddRowBGC: '#003B51',
    evenRowBGC: '#0A2732',
    waitTime: 3,
    headerHeight: 35,
    columnWidth: [],
    align: [],
    index: false,
    indexHeader: '#',
    carousel: 'single',
    hoverPause: true,
    levelMap: {
      remind: { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgIotClient.energyDashboard.levelRemind'); }, color: '#1677ff' },
      minor: { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.componentSecondary'); }, color: '#faad14' },
      major: { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.message.priorityImportant'); }, color: '#fa8c16' },
      critical: { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('console.message.priorityUrgent'); }, color: '#f5222d' },
    },
  },
  mergedConfig: props.chartConfig.option,
  header: [],
  rowsData: [],
  rows: [
    {
      ceils: [] as any[],
      rowIndex: 0,
      scroll: 0,
    },
  ] as AlarmTableRow[],
  widths: [],
  heights: [0],
  avgHeight: 0,
  aligns: [],
  animationIndex: 0,
  animationHandler: 0,
  updater: 0,
  needCalc: false,
});

const lastNonEmptyTableData = reactive<{
  dataset: any[];
  header: string[];
}>({
  dataset: [],
  header: [],
});

const mergeConfig = () => {
  status.mergedConfig = merge(cloneDeep(status.defaultConfig), props.chartConfig.option);
};

const calcHeaderData = () => {
  let { header, index, indexHeader } = status.mergedConfig;
  if (header.length === 0) {
    status.header = [];
    return;
  }
  header = [...header];
  if (index) header.unshift(indexHeader);
  status.header = header;
};

const isIndexCell = (cell: unknown): cell is IndexCell => {
  return typeof cell === 'object' && cell !== null && (cell as IndexCell).type === 'index';
};

const isTagCell = (cell: unknown): cell is TagCell => {
  return typeof cell === 'object' && cell !== null && (cell as TagCell).type === 'tag';
};

const formatCellValue = (cell: unknown) => {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    const digits = Math.max(0, Number(displayDecimals?.value ?? 0));
    return Number(cell.toFixed(digits));
  }
  return String(cell);
};

// 把普通文本单元格转换为带颜色的 tag 单元格（级别/状态列）
const toTagCell = (value: unknown, color: string): TagCell => ({
  type: 'tag',
  value: String(value ?? '-'),
  color,
});

// 根据 levelMap 与级别列原始文本回查颜色（兼容直接映射后的文本与原始枚举两种形态）
const resolveLevelColor = (label: string): string => {
  const { levelMap } = status.mergedConfig;
  if (!levelMap || typeof levelMap !== 'object') return '#8c8c8c';
  for (const key of Object.keys(levelMap)) {
    const item = levelMap[key];
    if (item && (item.label === label || key === label)) return item.color || '#8c8c8c';
  }
  return '#8c8c8c';
};

// 根据状态列文本返回固定颜色
const resolveStatusColor = (label: string): string => {
  const colorMap: Record<string, string> = {
    报警激活: '#f5222d',
    已确认: '#faad14',
    已屏蔽: '#8c8c8c',
    已恢复: '#52c41a',
  };
  return colorMap[label] || '#8c8c8c';
};

/** levelLabel 返回事件详情使用的告警等级中文文案。 */
const levelLabel = (level: unknown): string => {
  const item = status.mergedConfig?.levelMap?.[String(level ?? '')];
  return item?.label || String(level || '-');
};

/** actionLabel 返回处置动作中文文案。 */
const actionLabel = (action: unknown): string => actionLabelMap[String(action ?? '')] || String(action || '-');

/** notifyStatusLabel 返回通知状态中文文案。 */
const notifyStatusLabel = (notifyStatus: unknown): string => notifyStatusLabelMap[String(notifyStatus ?? '')] || String(notifyStatus || '-');

// 将行内指定列转换为 tag 单元格（返回新数组避免污染原始数据）
const transformTagColumns = (ceils: any[]): any[] => {
  if (!Array.isArray(ceils)) return ceils;
  const hasIndex = Boolean(status.mergedConfig.index);
  const levelIdx = hasIndex ? LEVEL_COLUMN_INDEX + 1 : LEVEL_COLUMN_INDEX;
  const statusIdx = hasIndex ? STATUS_COLUMN_INDEX + 1 : STATUS_COLUMN_INDEX;
  const next = [...ceils];
  if (next[levelIdx] !== undefined && typeof next[levelIdx] !== 'object') {
    next[levelIdx] = toTagCell(next[levelIdx], resolveLevelColor(String(next[levelIdx])));
  }
  if (next[statusIdx] !== undefined && typeof next[statusIdx] !== 'object') {
    next[statusIdx] = toTagCell(next[statusIdx], resolveStatusColor(String(next[statusIdx])));
  }
  return next;
};

const calcRowsData = () => {
  let { dataset, index, headerBGC, rowNum } = status.mergedConfig;
  if (!Array.isArray(dataset)) return;
  if (index) {
    dataset = dataset.map((row: any, i: number) => {
      row = [...row];
      const indexTag: IndexCell = {
        type: 'index',
        value: i + 1,
        backgroundColor: headerBGC,
      };
      row.unshift(indexTag);
      return row;
    });
  }
  dataset = dataset.map((ceils: any, i: number) => {
    ceils = transformTagColumns(Array.isArray(ceils) ? ceils : []);
    return { ceils, meta: rowMetadata.value[i] ?? null, rowIndex: i };
  });
  const rowLength = dataset.length;
  if (rowLength > rowNum && rowLength < 2 * rowNum) {
    dataset = [...dataset, ...dataset];
  }
  dataset = dataset.map((d: any, i: number) => ({ ...d, scroll: i }));

  status.rowsData = dataset;
  status.rows = dataset;
};

const calcWidths = () => {
  const { mergedConfig, rowsData } = status;
  const { columnWidth, header } = mergedConfig;
  const usedWidth = columnWidth.reduce((all: any, ws: number) => all + ws, 0);
  let columnNum = 0;
  if (rowsData[0]) {
    columnNum = (rowsData[0] as any).ceils.length;
  } else if (header.length > 0) {
    columnNum = header.length;
  }
  const avgWidth = (contentWidth.value - usedWidth) / (columnNum - columnWidth.length);
  const widths = Array.from({ length: columnNum }).fill(avgWidth);
  status.widths = merge(widths, columnWidth);
};

const calcHeights = (onresize = false) => {
  const { mergedConfig, header } = status;
  const { headerHeight, rowNum, dataset } = mergedConfig;
  let allHeight = contentHeight.value;
  if (header.length > 0) allHeight -= headerHeight;
  const avgHeight = allHeight / rowNum;
  status.avgHeight = avgHeight;
  if (!onresize) status.heights = Array.from({ length: dataset.length }).fill(avgHeight);
};

const calcAligns = () => {
  const { header, mergedConfig } = status;
  const columnNum = header.length;
  const aligns = Array.from({ length: columnNum }).fill('left');
  const { align } = mergedConfig;

  status.aligns = merge(aligns, align);
};

/** canOpenRow 判定当前行是否在预览/发布态具备可访问的事件详情。 */
const canOpenRow = (row: AlarmTableRow): boolean => isPreview() && Boolean(row.meta?.id);

/** loadAlarmDetail 通过现有详情接口加载只读事件信息。 */
const loadAlarmDetail = async () => {
  const id = selectedSummary.value?.id;
  if (!id) return;
  detailLoading.value = true;
  detailError.value = '';
  detail.event = null;
  detail.dealRecords = [];
  detail.notifyRecords = [];
  try {
    const option = props.chartConfig.option as Record<string, any>;
    const response = await post(option.detailRequestUrl || '/api/v1/things/alarm/event/get-one', { id });
    if (response && typeof response === 'object' && 'code' in response && Number((response as Record<string, any>).code) !== 200) {
      throw new Error(String((response as Record<string, any>).msg || editorT('iotApp.deviceDetail.debugRequestFailed')));
    }
    const normalized = unwrapAlarmDetailResponse(response);
    detail.event = normalized.event;
    detail.dealRecords = normalized.dealRecords;
    detail.notifyRecords = normalized.notifyRecords;
  } catch (error) {
    detailError.value = error instanceof Error ? error.message : editorT('iotApp.deviceDetail.debugRequestFailed');
  } finally {
    detailLoading.value = false;
  }
};

/** openAlarmDetail 在预览态记录触发行并打开详情弹窗。 */
const openAlarmDetail = (row: AlarmTableRow, event: Event) => {
  if (!canOpenRow(row)) return;
  selectedSummary.value = row.meta || null;
  lastTriggerElement.value = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  detailVisible.value = true;
  void loadAlarmDetail();
};

/** onRowKeydown 支持键盘 Enter 与 Space 打开当前行详情。 */
const onRowKeydown = (row: AlarmTableRow, event: KeyboardEvent) => {
  if (!canOpenRow(row) || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  openAlarmDetail(row, event);
};

/** closeAlarmDetail 关闭弹窗，焦点由离场回调恢复。 */
const closeAlarmDetail = () => {
  detailVisible.value = false;
};

/** restoreRowFocus 把键盘焦点恢复到打开弹窗的告警行。 */
const restoreRowFocus = async () => {
  await nextTick();
  lastTriggerElement.value?.focus();
};

const calcData = () => {
  mergeConfig();
  calcHeaderData();
  calcRowsData();
  calcWidths();
  calcHeights();
  calcAligns();
  animation(true);
};

onMounted(() => {
  calcData();
});

const animation = async (start = false) => {
  const { needCalc } = status;

  if (needCalc) {
    calcRowsData();
    calcHeights();
    status.needCalc = false;
  }
  let { avgHeight, animationIndex, mergedConfig, rowsData, updater } = status;
  const { waitTime, carousel, rowNum } = mergedConfig;

  const rowLength = rowsData.length;
  if (rowNum >= rowLength) return;
  if (start) {
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    if (updater !== status.updater) return;
  }
  const animationNum = carousel === 'single' ? 1 : rowNum;
  const rows = rowsData.slice(animationIndex);
  rows.push(...rowsData.slice(0, animationIndex));
  status.rows = rows.slice(0, carousel === 'page' ? rowNum * 2 : rowNum + 1);
  status.heights = Array.from({ length: rowLength }).fill(avgHeight);
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (updater !== status.updater) return;
  status.heights.splice(0, animationNum, ...Array.from({ length: animationNum }).fill(0));
  animationIndex += animationNum;
  const back = animationIndex - rowLength;
  if (back >= 0) animationIndex = back;
  status.animationIndex = animationIndex;
  status.animationHandler = setTimeout(animation, waitTime * 1000 - 300) as any;
};

const stopAnimation = () => {
  status.updater = (status.updater + 1) % 999_999;
  if (!status.animationHandler) return;
  clearTimeout(status.animationHandler);
};

const onRestart = async () => {
  try {
    if (!status.mergedConfig) return;
    stopAnimation();
    calcData();
  } catch (error) {
    console.error(error);
  }
};

watch(
  () => w.value,
  () => {
    onRestart();
  },
);

watch(
  () => h.value,
  () => {
    onRestart();
  },
);

watch(
  () => props.chartConfig.option,
  () => {
    onRestart();
  },
  { deep: true },
);

useChartDataFetch(props.chartConfig, useChartEditStore, (resData: any[]) => {
  rowMetadata.value = extractAlarmRowMetadata(resData);
  const normalized = normalizeDatasetForTableScrollBoard(resData);
  const hasRows = Array.isArray(normalized.dataset) && normalized.dataset.length > 0;
  const hasHeader = Array.isArray(normalized.header) && normalized.header.length > 0;

  if (!hasRows && !hasHeader) {
    if (lastNonEmptyTableData.dataset.length > 0) {
      // eslint-disable-next-line vue/no-mutating-props -- 动态数据回调需要写回画布组件配置以触发既有渲染链。
      props.chartConfig.option.dataset = cloneDeep(lastNonEmptyTableData.dataset);
      if (lastNonEmptyTableData.header.length > 0) {
        // eslint-disable-next-line vue/no-mutating-props -- 表头与数据集必须在同一组件配置内保持同步。
        props.chartConfig.option.header = cloneDeep(lastNonEmptyTableData.header);
      }
      onRestart();
    }
    return;
  }

  if (hasRows) {
    lastNonEmptyTableData.dataset = cloneDeep(normalized.dataset);
  }
  if (hasHeader) {
    lastNonEmptyTableData.header = cloneDeep(normalized.header);
  }
  // eslint-disable-next-line vue/no-mutating-props -- 延续 useChartDataFetch 的组件内数据写回合同。
  props.chartConfig.option.dataset = normalized.dataset;
  if (hasHeader) {
    // eslint-disable-next-line vue/no-mutating-props -- 动态维度需要同步到组件表头。
    props.chartConfig.option.header = normalized.header;
  }
  onRestart();
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<template>
  <DecoratedTableView :chart-config="chartConfig">
    <div class="dv-alarm-record">
      <div v-if="status.header.length > 0 && status.mergedConfig" class="header" :style="`background-color: ${status.mergedConfig.headerBGC};`">
        <div
          v-for="(headerItem, i) in status.header"
          :key="`header-${i}`"
          class="header-item"
          :style="`
          height: ${status.mergedConfig.headerHeight}px;
          line-height: ${status.mergedConfig.headerHeight}px;
          width: ${status.widths[i]}px;
        `"
          :align="status.aligns[i]"
        >
          {{ headerItem }}
        </div>
      </div>

      <div v-if="status.mergedConfig" class="rows" :style="`height: ${contentHeight - (status.header.length > 0 ? status.mergedConfig.headerHeight : 0)}px;`">
        <div
          v-for="(row, ri) in status.rows"
          :key="`${row.toString()}${row.scroll}`"
          class="row-item"
          :class="{ 'row-item--interactive': canOpenRow(row) }"
          data-testid="alarm-row"
          :role="canOpenRow(row) ? 'button' : undefined"
          :tabindex="canOpenRow(row) ? 0 : undefined"
          :style="`
          height: ${status.heights[ri]}px;
          line-height: ${status.heights[ri]}px;
          background-color: ${status.mergedConfig[row.rowIndex % 2 === 0 ? 'evenRowBGC' : 'oddRowBGC']};
        `"
          @click="openAlarmDetail(row, $event)"
          @keydown="onRowKeydown(row, $event)"
        >
          <div v-for="(ceil, ci) in row.ceils" :key="`cell-${ri}-${ci}`" class="ceil" :style="`width: ${status.widths[ci]}px;`" :align="status.aligns[ci]">
            <span v-if="isIndexCell(ceil)" class="index-tag" :style="{ backgroundColor: ceil.backgroundColor }">
              {{ ceil.value }}
            </span>
            <span v-else-if="isTagCell(ceil)" class="level-tag" :style="{ color: ceil.color, borderColor: ceil.color, backgroundColor: `${ceil.color}22` }">
              {{ ceil.value }}
            </span>
            <span v-else class="cell-text" :title="String(formatCellValue(ceil))">
              {{ formatCellValue(ceil) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </DecoratedTableView>

  <n-modal
    v-model:show="detailVisible"
    class="alarm-detail-modal"
    preset="card"
    :bordered="false"
    :closable="false"
    :mask-closable="true"
    :close-on-esc="true"
    :trap-focus="true"
    :auto-focus="true"
    @after-leave="restoreRowFocus"
  >
    <template #header>
      <div class="detail-heading">
        <div>
          <div class="detail-eyebrow">{{ editorT('bigscreenEditor.ui.componentAlarmEventDetails') }}</div>
          <div class="detail-title">{{ detail.event?.alarmName || selectedSummary?.alarmName || editorT('bigscreenEditor.ui.componentAlarmDetails') }}</div>
        </div>
        <button data-testid="alarm-detail-close" class="detail-close" type="button" :aria-label="editorT('bigscreenEditor.ui.componentCloseAlarmDetails')" @click="closeAlarmDetail">×</button>
      </div>
    </template>

    <div v-if="detailLoading" class="detail-state">{{ editorT('bigscreenEditor.ui.componentLoadingAlarmDetails') }}</div>
    <div v-else-if="detailError" class="detail-state detail-state--error">
      <span>{{ editorT('bigscreenEditor.ui.componentFailedToLoadDetails') }}{{ detailError }}</span>
      <button data-testid="alarm-detail-retry" class="detail-retry" type="button" @click="loadAlarmDetail">{{ editorT('orgManage.agent.retry') }}</button>
    </div>
    <div v-else-if="!detail.event" class="detail-state">{{ editorT('bigscreenEditor.ui.componentAlarmDetailsNotFound') }}</div>
    <div v-else class="detail-content">
      <section class="detail-section detail-summary">
        <div class="summary-item">
          <span>{{ editorT('bigscreenEditor.ui.componentEventID') }}</span><strong>{{ detail.event.id || selectedSummary?.id || '-' }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ editorT('iotApp.alarmRule.alarmLevel') }}</span><strong>{{ levelLabel(detail.event.level) }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ editorT('bigscreenEditor.ui.componentCurrentStatus') }}</span><strong>{{ normalizeAlarmStatus(detail.event.status).label }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ editorT('iotApp.alarmRule.objectLabel') }}</span><strong>{{ detail.event.targetName || detail.event.deviceName || '-' }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ editorT('bigscreenEditor.ui.componentProductDevice') }}</span><strong>{{ detail.event.productID || '-' }} / {{ detail.event.deviceName || '-' }}</strong>
        </div>
        <div class="summary-item">
          <span>{{ editorT('bigscreenEditor.ui.componentTriggerCount') }}</span><strong>{{ detail.event.triggerCount ?? 0 }} {{ editorT('orgPark.ui.times') }}</strong>
        </div>
      </section>

      <section class="detail-section">
        <h3>{{ editorT('bigscreenEditor.ui.componentTriggerInformation') }}</h3>
        <div class="detail-grid">
          <div>
            <span>{{ editorT('bigscreenEditor.ui.componentTriggerValue') }}</span><strong>{{ detail.event.triggerValue ?? '-' }}</strong>
          </div>
          <div>
            <span>{{ editorT('bigscreenEditor.ui.componentFirstTriggered') }}</span><strong>{{ formatAlarmTime(detail.event.firstTriggerTime) }}</strong>
          </div>
          <div>
            <span>{{ editorT('bigscreenEditor.ui.componentLastTriggered') }}</span><strong>{{ formatAlarmTime(detail.event.lastTriggerTime) }}</strong>
          </div>
          <div>
            <span>{{ editorT('iotApp.alarmContentTpl.varRecoveryTime') }}</span><strong>{{ formatAlarmTime(detail.event.recoveryTime) }}</strong>
          </div>
        </div>
        <div class="detail-message">{{ detail.event.triggerContent || detail.event.content || '-' }}</div>
        <div v-if="detail.event.falseAlarm" class="false-alarm">
          {{ editorT('bigscreenEditor.ui.componentFalseAlarm') }}{{ detail.event.falseAlarmReasonType || '-' }} · {{ detail.event.falseAlarmReason || '-' }}
        </div>
      </section>

      <section class="detail-section">
        <h3>{{ editorT('bigscreenEditor.ui.componentResolutionRecords') }}</h3>
        <div v-if="detail.dealRecords.length === 0" class="empty-record">{{ editorT('bigscreenEditor.ui.componentNoResolutionRecords') }}</div>
        <div v-else class="record-list">
          <div v-for="record in detail.dealRecords" :key="record.id" class="record-row">
            <span>{{ formatAlarmTime(record.createdTime) }}</span>
            <strong>{{ actionLabel(record.action) }}</strong>
            <span>{{ normalizeAlarmStatus(record.fromStatus).label }} → {{ normalizeAlarmStatus(record.toStatus).label }}</span>
            <span>{{ record.operatorName || record.operatorID || editorT('iotApp.deviceDetail.system') }}</span>
            <span class="record-remark">{{ record.remark || '-' }}</span>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <h3>{{ editorT('iotApp.routes.alarmNotifyRecord') }}</h3>
        <div v-if="detail.notifyRecords.length === 0" class="empty-record">{{ editorT('iotApp.alarmNotify.emptyTitle') }}</div>
        <div v-else class="record-list">
          <div v-for="record in detail.notifyRecords" :key="record.id" class="record-row record-row--notify">
            <span>{{ formatAlarmTime(record.createdTime) }}</span>
            <strong>{{ record.channel || '-' }}</strong>
            <span>{{ formatAlarmTargets(record.targets) }}</span>
            <span>{{ notifyStatusLabel(record.status) }}</span>
          </div>
        </div>
      </section>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.dv-alarm-record {
  position: relative;
  width: 100%;
  height: 100%;
  color: #fff;

  .header {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid rgb(77 210 236 / 32%);
    border-radius: 8px 8px 0 0;
    color: #e9fbff;
    font-size: 14px;
    font-weight: 600;

    .header-item {
      box-sizing: border-box;
      overflow: hidden;
      padding: 0 8px;
      text-overflow: ellipsis;
      transition: all 0.3s;
      white-space: nowrap;
    }
  }

  .rows {
    overflow: hidden;

    .row-item {
      display: flex;
      overflow: hidden;
      border-bottom: 1px solid rgb(87 172 198 / 12%);
      color: #d7eaf2;
      font-size: 13px;
      transition:
        height 0.3s,
        background-color 0.18s,
        box-shadow 0.18s;

      .ceil {
        box-sizing: border-box;
        min-width: 0;
        overflow: hidden;
        padding: 0 8px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cell-text {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .row-item--interactive {
      cursor: pointer;

      &:hover {
        background-color: rgb(17 73 94 / 94%) !important;
        box-shadow: inset 3px 0 0 #36d9e7;
      }

      &:focus-visible {
        box-shadow: inset 0 0 0 2px #61e7f0;
        outline: none;
      }
    }
  }

  .index-tag {
    display: inline-block;
    padding: 0 3px;
    border-radius: 3px;
    line-height: 1.4;
  }

  .level-tag {
    display: inline-block;
    padding: 1px 6px;
    border: 1px solid;
    border-radius: 3px;
    line-height: 1.4;
    font-size: 12px;
    white-space: nowrap;
  }
}

:global(.alarm-detail-modal.n-card) {
  width: min(1040px, calc(100vw - 48px));
  max-height: min(820px, calc(100vh - 48px));
  overflow: hidden;
  border: 1px solid rgb(63 199 221 / 42%);
  border-radius: 12px;
  background: linear-gradient(145deg, rgb(5 25 43 / 98%), rgb(7 42 61 / 98%));
  box-shadow: 0 24px 80px rgb(0 0 0 / 55%);
  color: #dff7ff;
}

:global(.alarm-detail-modal .n-card-header) {
  padding: 20px 24px 14px;
  border-bottom: 1px solid rgb(75 190 215 / 22%);
}

:global(.alarm-detail-modal .n-card__content) {
  max-height: calc(100vh - 150px);
  overflow: auto;
  padding: 18px 24px 24px;
}

.detail-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.detail-eyebrow {
  margin-bottom: 4px;
  color: #63dce8;
  font-size: 12px;
  letter-spacing: 0.16em;
}

.detail-title {
  color: #f0fcff;
  font-size: 22px;
  font-weight: 600;
}

.detail-close,
.detail-retry {
  border: 1px solid rgb(89 213 229 / 36%);
  border-radius: 8px;
  background: rgb(15 77 98 / 55%);
  color: #dffaff;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s;
}

.detail-close {
  width: 34px;
  height: 34px;
  font-size: 24px;
  line-height: 28px;
}

.detail-retry {
  padding: 7px 18px;
}

.detail-close:hover,
.detail-retry:hover {
  border-color: #60e4ed;
  background: rgb(20 103 126 / 72%);
}

.detail-close:focus-visible,
.detail-retry:focus-visible {
  outline: 2px solid #66e8f1;
  outline-offset: 2px;
}

.detail-state {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #9ebdca;
}

.detail-state--error {
  color: #ffb4ae;
}

.detail-content {
  display: grid;
  gap: 14px;
}

.detail-section {
  padding: 16px;
  border: 1px solid rgb(75 190 215 / 20%);
  border-radius: 12px;
  background: linear-gradient(135deg, rgb(10 48 68 / 78%), rgb(7 32 51 / 88%));
  box-shadow: 0 10px 24px rgb(0 0 0 / 18%);
}

.detail-section h3 {
  margin: 0 0 12px;
  color: #e9fbff;
  font-size: 15px;
  font-weight: 600;
}

.detail-summary,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 18px;
}

.summary-item,
.detail-grid > div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.summary-item span,
.detail-grid span {
  color: #83a8b7;
  font-size: 12px;
}

.summary-item strong,
.detail-grid strong {
  overflow: hidden;
  color: #edfaff;
  font-family: 'Fira Code', 'Roboto Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-message,
.false-alarm {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgb(2 19 34 / 58%);
  color: #cce6ef;
  line-height: 1.6;
}

.false-alarm {
  border-left: 3px solid #f6c344;
  color: #ffe6a3;
}

.record-list {
  display: grid;
  overflow: hidden;
  border: 1px solid rgb(80 174 198 / 16%);
  border-radius: 8px;
}

.record-row {
  display: grid;
  grid-template-columns: 160px 100px 180px 120px minmax(120px, 1fr);
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgb(80 174 198 / 12%);
  color: #a9c8d4;
  font-size: 12px;
}

.record-row:last-child {
  border-bottom: 0;
}

.record-row strong {
  color: #dff8ff;
  font-weight: 500;
}

.record-row--notify {
  grid-template-columns: 160px 100px minmax(200px, 1fr) 100px;
}

.record-remark {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-record {
  padding: 20px;
  color: #7798a7;
  text-align: center;
}

@media (max-width: 760px) {
  .detail-summary,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .record-row,
  .record-row--notify {
    grid-template-columns: 1fr;
  }
}
</style>
