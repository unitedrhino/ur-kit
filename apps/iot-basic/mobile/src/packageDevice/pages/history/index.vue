<template>
<app-navigation-bar title="数据分析" />

<scroll-view class="history-page" scroll-y type="list">
  <view class="filter-panel">
    <view class="history-summary">
      <text class="history-summary__name">{{deviceName || '设备'}}</text>
      <text class="history-summary__desc">{{selectedProperty?.dataName || selectedDataID || '请选择属性'}}</text>
    </view>

    <picker mode="selector" :range="propertyPickerLabels" :value="selectedPropertyIndex" @change="handlePropertyChange">
      <view class="filter-row">
        <text class="filter-row__label">属性过滤</text>
        <text class="filter-row__value">{{selectedProperty?.dataName || '请选择'}}</text>
      </view>
    </picker>

    <picker mode="selector" :range="aggFuncLabels" :value="aggFuncIndex" @change="handleAggFuncChange">
      <view class="filter-row">
        <text class="filter-row__label">聚合函数</text>
        <text class="filter-row__value">{{selectedAggFunc.label}}</text>
      </view>
    </picker>

    <view class="filter-row filter-row--inline">
      <text class="filter-row__label">间隔数值</text>
      <input class="filter-input" type="number" v-model="interval" />
    </view>

    <picker mode="selector" :range="intervalUnitLabels" :value="intervalUnitIndex" @change="handleIntervalUnitChange">
      <view class="filter-row">
        <text class="filter-row__label">间隔单位</text>
        <text class="filter-row__value">{{selectedIntervalUnit.label}}</text>
      </view>
    </picker>

    <picker mode="date" :value="startDate" @change="handleStartDateChange">
      <view class="filter-row">
        <text class="filter-row__label">开始日期</text>
        <text class="filter-row__value">{{startDate}}</text>
      </view>
    </picker>

    <picker mode="date" :value="endDate" @change="handleEndDateChange">
      <view class="filter-row">
        <text class="filter-row__label">结束日期</text>
        <text class="filter-row__value">{{endDate}}</text>
      </view>
    </picker>

    <view class="filter-actions">
      <button class="filter-btn filter-btn--ghost" @tap="resetFilters">重置</button>
      <button class="filter-btn filter-btn--primary" @tap="loadAggData">提交</button>
    </view>
  </view>

  <loading v-if="loading" text="加载中..." />
  <template v-else>
    <history-trend-chart
      :points="chartPoints"
      :title="chartTitle"
      :subtitle="chartSubtitle"
      empty-text="暂无可绘制数据"
    />

    <view class="history-list">
      <view class="history-list__head">
        <text>数据明细</text>
        <text>{{chartPoints.length}} 条</text>
      </view>
      <view class="history-item" v-for="item in chartPoints" :key="`${item.timestamp}-${item.dataID}`">
        <view>
          <text class="history-item__id">{{item.dataName || item.dataID}}</text>
          <text class="history-item__time">{{formatDateTime(item.timestamp)}}</text>
        </view>
        <text class="history-item__value">{{item.rawValue || '-'}}</text>
      </view>
      <empty-state v-if="!chartPoints.length" text="暂无历史数据" />
    </view>
  </template>
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import HistoryTrendChart from '../../../components/history-trend-chart/history-trend-chart.vue';
import Loading from '../../../components/loading/loading.vue';
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceControlService } from '../../../services/device-control.service';
import { ensurePageReady } from '../../../utils/page-guard';
import type {
  PropertyAggFunc,
  PropertyAggIntervalUnit,
  PropertyAggPoint,
} from '../../../domain/interfaces/device-msg.repository';

interface PropertyOption {
  dataID: string;
  dataName: string;
  isNumeric: boolean;
}

interface DateParts {
  year: number;
  monthIndex: number;
  day: number;
}

const aggFuncOptions: Array<{ label: string; value: PropertyAggFunc }> = [
  { label: 'last（最新值）', value: 'last' },
  { label: 'avg（平均值）', value: 'avg' },
  { label: 'max（最大值）', value: 'max' },
  { label: 'min（最小值）', value: 'min' },
  { label: 'count（总数）', value: 'count' },
];

const intervalUnitOptions: Array<{ label: string; value: PropertyAggIntervalUnit }> = [
  { label: '分钟', value: 'm' },
  { label: '小时', value: 'h' },
  { label: '天', value: 'd' },
];

const loading = ref(true);
const productID = ref('');
const deviceName = ref('');
const selectedDataID = ref('');
const propertyOptions = ref<PropertyOption[]>([]);
const chartPoints = ref<PropertyAggPoint[]>([]);
const aggFuncIndex = ref(0);
const intervalUnitIndex = ref(1);
const interval = ref('1');
const startDate = ref(formatDate(Date.now()));
const endDate = ref(formatDate(Date.now()));

const propertyPickerLabels = computed(() => propertyOptions.value.map((item) => `${item.dataName} ${item.dataID}`));
const selectedProperty = computed(() => propertyOptions.value.find((item) => item.dataID === selectedDataID.value));
const selectedPropertyIndex = computed(() => Math.max(0, propertyOptions.value.findIndex((item) => item.dataID === selectedDataID.value)));
const aggFuncLabels = computed(() => aggFuncOptions.map((item) => item.label));
const intervalUnitLabels = computed(() => intervalUnitOptions.map((item) => item.label));
const selectedAggFunc = computed(() => aggFuncOptions[aggFuncIndex.value] || aggFuncOptions[0]);
const selectedIntervalUnit = computed(() => intervalUnitOptions[intervalUnitIndex.value] || intervalUnitOptions[1]);
const chartTitle = computed(() => selectedProperty.value?.dataName || selectedDataID.value || '历史属性');
const chartSubtitle = computed(() => `${selectedAggFunc.value.label} · 每 ${interval.value || 1} ${selectedIntervalUnit.value.label} · ${startDate.value} 至 ${endDate.value}`);

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * parseDateParts 将 picker 的 yyyy-MM-dd 拆成数字，避免小程序 iOS 解析 yyyy-MM-dd HH:mm:ss 告警。
 * @param date 日期选择器返回的 yyyy-MM-dd 字符串。
 * @returns 可直接传入 Date 数字构造函数的年月日。
 */
function parseDateParts(date: string): DateParts {
  const [yearText, monthText, dayText] = date.split('-');
  return {
    year: Number(yearText),
    monthIndex: Number(monthText) - 1,
    day: Number(dayText),
  };
}

/**
 * parseDateStart 生成本地日期起始时间戳。
 * @param date 日期选择器返回的 yyyy-MM-dd 字符串。
 * @returns 当天 00:00:00.000 的毫秒时间戳。
 */
function parseDateStart(date: string): number {
  const parts = parseDateParts(date);
  return new Date(parts.year, parts.monthIndex, parts.day, 0, 0, 0, 0).getTime();
}

/**
 * parseDateEnd 生成本地日期结束时间戳。
 * @param date 日期选择器返回的 yyyy-MM-dd 字符串。
 * @returns 当天 23:59:59.999 的毫秒时间戳。
 */
function parseDateEnd(date: string): number {
  const parts = parseDateParts(date);
  return new Date(parts.year, parts.monthIndex, parts.day, 23, 59, 59, 999).getTime();
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function normalizeInterval(): number {
  return Math.max(1, Number.parseInt(interval.value, 10) || 1);
}

async function loadProperties(queryDataID: string) {
  const latest = await deviceControlService.refreshProperties(productID.value, deviceName.value);
  const options = latest
    .map((item) => ({
      dataID: item.dataID,
      dataName: item.dataName || item.dataID,
      isNumeric: Number.isFinite(Number(item.value)),
    }))
    .filter((item) => item.dataID);
  if (queryDataID && !options.some((item) => item.dataID === queryDataID)) {
    options.unshift({ dataID: queryDataID, dataName: queryDataID, isNumeric: true });
  }
  propertyOptions.value = options;
  selectedDataID.value = queryDataID || options.find((item) => item.isNumeric)?.dataID || options[0]?.dataID || '';
}

async function loadAggData() {
  if (!selectedDataID.value) {
    uni.showToast({ title: '暂无可查询的历史属性', icon: 'none' });
    chartPoints.value = [];
    loading.value = false;
    return;
  }
  const timeStart = parseDateStart(startDate.value);
  const timeEnd = parseDateEnd(endDate.value);
  if (timeStart > timeEnd) {
    uni.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    chartPoints.value = await deviceControlService.getPropertyHistoryAgg(
      productID.value,
      deviceName.value,
      {
        dataID: selectedDataID.value,
        argFunc: selectedAggFunc.value.value,
        interval: normalizeInterval(),
        intervalUnit: selectedIntervalUnit.value.value,
        timeStart,
        timeEnd,
      },
    );
    if (!chartPoints.value.length) {
      uni.showToast({ title: '暂无历史数据', icon: 'none' });
    }
  } finally {
    loading.value = false;
  }
}

function handlePropertyChange(e: any) {
  const index = Number(e.detail.value || 0);
  selectedDataID.value = propertyOptions.value[index]?.dataID || selectedDataID.value;
}

function handleAggFuncChange(e: any) {
  aggFuncIndex.value = Number(e.detail.value || 0);
}

function handleIntervalUnitChange(e: any) {
  intervalUnitIndex.value = Number(e.detail.value || 0);
}

function handleStartDateChange(e: any) {
  startDate.value = e.detail.value;
}

function handleEndDateChange(e: any) {
  endDate.value = e.detail.value;
}

function resetFilters() {
  aggFuncIndex.value = 0;
  intervalUnitIndex.value = 1;
  interval.value = '1';
  startDate.value = formatDate(Date.now());
  endDate.value = formatDate(Date.now());
}

onLoad(async (q: any) => {
  const query = (q || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageDevice/pages/history/index', query);
  if (!ready) { loading.value = false; return; }
  productID.value = query.productID || '';
  deviceName.value = query.deviceName || '';
  try {
    await loadProperties(query.dataID || '');
    await loadAggData();
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.history-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.history-summary {
  padding: 2px 0 10px;
}

.history-summary__name {
  display: block;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 700;
}

.history-summary__desc {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.filter-panel {
  margin: 10px 16px;
  padding: 14px 14px 12px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color);
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  border-bottom: 1px solid var(--border-color);
}

.filter-row--inline {
  gap: 16px;
}

.filter-row__label {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.filter-row__value {
  min-width: 0;
  color: var(--text-primary);
  font-size: 14px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-input {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
  text-align: right;
}

.filter-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
}

.filter-btn {
  flex: 1;
  height: 36px;
  line-height: 36px;
  border-radius: var(--radius-sm, 8px);
  font-size: 14px;
}

.filter-btn--ghost {
  color: var(--text-secondary);
  background: var(--page-bg);
}

.filter-btn--primary {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.history-list {
  margin: 12px 16px 24px;
  padding: 14px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color);
}

.history-list__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid var(--border-color);
}

.history-item__id {
  display: block;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.history-item__time {
  display: block;
  margin-top: 4px;
  color: var(--text-placeholder);
  font-size: 12px;
}

.history-item__value {
  max-width: 120px;
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
