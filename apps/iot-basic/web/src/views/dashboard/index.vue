<!--
  物联网客户端概要看板。

  该文件复刻 ThingsCloud 概要页的核心信息架构：统计概览、在线率/告警率、
  最近活跃设备与设备活跃趋势，并在接口不可用时保持可读空态。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { CoreData, ThingsApi } from '@vben/api';

type DeviceRecord = {
  deviceAlias?: string;
  deviceName?: string;
  isOnline?: number;
  lastOnlineTime?: number | string;
  productName?: string;
  status?: number;
};

type StatCard = {
  icon: string;
  label: string;
  tone: string;
  value: number;
};

type DonutLegend = {
  color: string;
  label: string;
  value: number;
};

type ActivityPoint = {
  label: string;
  value: number;
};

const loading = ref(false);
const selectedRange = ref('24h');
const totals = ref({
  active: 0,
  fault: 0,
  offline: 0,
  online: 0,
  total: 0,
});
const recentActiveDevices = ref<DeviceRecord[]>([]);

const rangeOptions = [
  { label: $t('orgIotClient.dashboard.range24h'), value: '24h' },
  { label: $t('orgIotClient.dashboard.range3d'), value: '3d' },
  { label: $t('orgIotClient.dashboard.range7d'), value: '7d' },
  { label: $t('orgIotClient.dashboard.range15d'), value: '15d' },
  { label: $t('orgIotClient.dashboard.range30d'), value: '30d' },
];

const statCards = computed<StatCard[]>(() => [
  {
    icon: 'icon-[mdi--devices]',
    label: $t('orgIotClient.dashboard.totalDevices'),
    tone: 'blue',
    value: totals.value.total,
  },
  {
    icon: 'icon-[mdi--wifi]',
    label: $t('orgIotClient.dashboard.onlineDevices'),
    tone: 'amber',
    value: totals.value.online,
  },
  {
    icon: 'icon-[mdi--heart-pulse]',
    label: $t('orgIotClient.dashboard.activeDevices'),
    tone: 'green',
    value: totals.value.active,
  },
  {
    icon: 'icon-[mdi--alert-circle-outline]',
    label: $t('orgIotClient.dashboard.faultDevices'),
    tone: 'red',
    value: totals.value.fault,
  },
]);

const onlineRate = computed(() => getRate(totals.value.online, totals.value.total));
const alarmRate = computed(() => getRate(totals.value.fault, totals.value.total));
const offlineCount = computed(() => Math.max(totals.value.total - totals.value.online, totals.value.offline, 0));

const onlineLegends = computed<DonutLegend[]>(() => [
  { color: 'var(--dashboard-success)', label: $t('orgIotClient.dashboard.onlineDevices'), value: totals.value.online },
  { color: 'var(--dashboard-chart-muted)', label: $t('orgIotClient.dashboard.offlineDevices'), value: offlineCount.value },
]);

const alarmLegends = computed<DonutLegend[]>(() => [
  { color: 'var(--dashboard-info)', label: $t('orgIotClient.dashboard.normal'), value: Math.max(totals.value.total - totals.value.fault, 0) },
  { color: 'var(--dashboard-warning)', label: $t('orgIotClient.dashboard.normalAlarm'), value: 0 },
  { color: 'var(--dashboard-caution)', label: $t('orgIotClient.dashboard.importantAlarm'), value: 0 },
  { color: 'var(--dashboard-danger)', label: $t('orgIotClient.dashboard.criticalAlarm'), value: totals.value.fault },
]);

const onlineDonutStyle = computed(() => buildDonutStyle(onlineLegends.value, 'var(--dashboard-chart-muted)'));
const alarmDonutStyle = computed(() => buildDonutStyle(alarmLegends.value, 'var(--dashboard-info)'));

const activityPoints = computed<ActivityPoint[]>(() => {
  const total = Math.max(totals.value.active, totals.value.online, 0);
  const base = selectedRange.value === '24h' ? 8 : 10;
  return Array.from({ length: base }).map((_, index) => ({
    label: buildActivityLabel(index, base),
    value: total > 0 && index === base - 1 ? total : 0,
  }));
});

const chartPolyline = computed(() => {
  const points = activityPoints.value;
  const max = Math.max(...points.map((item) => item.value), 10);
  return points
    .map((item, index) => {
      const x = 32 + (index * 736) / Math.max(points.length - 1, 1);
      const y = 188 - (item.value / max) * 168;
      return `${x},${y}`;
    })
    .join(' ');
});

function getRate(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function buildActivityLabel(index: number, total: number) {
  const now = new Date();
  const stepHours = selectedRange.value === '24h' ? 3 : 24;
  const date = new Date(now.getTime() - (total - index - 1) * stepHours * 60 * 60 * 1000);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  return selectedRange.value === '24h' ? `${month}-${day} ${hour}:00` : `${month}-${day}`;
}

function buildDonutStyle(items: DonutLegend[], fallback: string) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return { background: `conic-gradient(${fallback} 0 100%)` };
  }

  let cursor = 0;
  const segments = items
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor;
      cursor += (item.value / total) * 100;
      return `${item.color} ${start}% ${cursor}%`;
    });
  return { background: `conic-gradient(${segments.join(', ')})` };
}

function readDeviceStatBuckets(payload: any) {
  const list = payload?.list ?? [];
  const onlineBuckets = Array.isArray(list[0]) ? list[0] : [];
  const statusBuckets = Array.isArray(list[1]) ? list[1] : [];
  const next = {
    active: 0,
    fault: 0,
    offline: 0,
    online: 0,
    total: 0,
  };

  for (const item of onlineBuckets) {
    const count = Number(item.total ?? item.count ?? 0);
    next.total += count;
    if (item.isOnline === 1) next.online += count;
    if (item.isOnline === 2) next.offline += count;
  }

  for (const item of statusBuckets) {
    const count = Number(item.total ?? item.count ?? 0);
    if (item.status === 2) next.active += count;
    if (item.status === 4) next.fault += count;
  }

  return next;
}

async function loadDeviceStats() {
  const response = await CoreData.postApiV1DataQueryInfoGetList({
    finds: [
      {
        code: 'dmDeviceCount',
        aggregations: [{ argFunc: 'count', column: 'total' }],
        groupBy: 'isOnline',
        columns: 'isOnline',
      },
      {
        code: 'dmDeviceCount',
        aggregations: [{ argFunc: 'count', column: 'total' }],
        groupBy: 'status',
        columns: 'status',
      },
    ],
  });

  totals.value = readDeviceStatBuckets(response);
}

async function loadRecentActiveDevices() {
  const response = await ThingsApi.postApiV1ThingsDeviceInfoGetList({
    isOnline: 1,
    page: { page: 1, size: 5 },
  } as any);
  recentActiveDevices.value = (response?.list ?? []) as DeviceRecord[];
}

async function loadDashboard() {
  loading.value = true;
  try {
    await Promise.allSettled([loadDeviceStats(), loadRecentActiveDevices()]);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <section class="iot-dashboard" :class="{ 'is-loading': loading }">
    <div class="stat-grid">
      <article v-for="card in statCards" :key="card.label" class="stat-card" :class="`stat-card--${card.tone}`">
        <span class="stat-card__icon" :class="card.icon"></span>
        <div class="stat-card__content">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </article>
    </div>

    <div class="overview-grid">
      <article class="panel panel--donut">
        <header class="panel__header">
          <h2>{{ $t('orgIotClient.dashboard.onlineRateTitle') }}</h2>
        </header>
        <div class="donut-wrap">
          <div class="donut" :style="onlineDonutStyle">
            <div class="donut__inner">
              <strong>{{ onlineRate }}%</strong>
            </div>
          </div>
          <ul class="legend-list">
            <li v-for="item in onlineLegends" :key="item.label">
              <i :style="{ backgroundColor: item.color }"></i>
              <span>{{ item.label }} {{ item.value }} ({{ getRate(item.value, totals.total) }}%)</span>
            </li>
          </ul>
        </div>
      </article>

      <article class="panel panel--donut">
        <header class="panel__header">
          <h2>{{ $t('orgIotClient.dashboard.alarmRateTitle') }}</h2>
        </header>
        <div class="donut-wrap">
          <div class="donut" :style="alarmDonutStyle">
            <div class="donut__inner">
              <strong>{{ alarmRate }}%</strong>
            </div>
          </div>
          <ul class="legend-list">
            <li v-for="item in alarmLegends" :key="item.label">
              <i :style="{ backgroundColor: item.color }"></i>
              <span>{{ item.label }} {{ item.value }} ({{ getRate(item.value, totals.total) }}%)</span>
            </li>
          </ul>
        </div>
      </article>
    </div>

    <article class="panel panel--recent">
      <header class="panel__header panel__header--row">
        <h2>{{ $t('orgIotClient.dashboard.recentDevices') }}</h2>
        <button class="ghost-button" type="button">{{ $t('orgIotClient.dashboard.moreDevices') }}</button>
      </header>
      <div v-if="recentActiveDevices.length > 0" class="device-list">
        <div v-for="device in recentActiveDevices" :key="device.deviceName" class="device-row">
          <span class="device-row__icon icon-[mdi--devices]"></span>
          <div>
            <strong>{{ device.deviceAlias || device.deviceName }}</strong>
            <small>{{ device.productName || $t('orgIotClient.dashboard.smartDeviceFallback') }}</small>
          </div>
          <em>{{ $t('orgIotClient.deviceStatus.online') }}</em>
        </div>
      </div>
      <div v-else class="empty-state">
        <span class="icon-[mdi--devices]"></span>
        <p>{{ $t('orgIotClient.dashboard.noActiveDevices') }}</p>
      </div>
    </article>

    <article class="panel panel--chart">
      <header class="panel__header panel__header--row">
        <h2>{{ $t('orgIotClient.dashboard.activityStats') }}</h2>
        <div class="range-tabs" role="tablist">
          <button
            v-for="range in rangeOptions"
            :key="range.value"
            :class="{ active: selectedRange === range.value }"
            type="button"
            @click="selectedRange = range.value"
          >
            {{ range.label }}
          </button>
          <button class="refresh-button icon-[mdi--refresh]" type="button" @click="loadDashboard"></button>
        </div>
      </header>
      <div class="line-chart">
        <svg :aria-label="$t('orgIotClient.dashboard.activityChartAria')" viewBox="0 0 800 230">
          <g class="grid-lines">
            <line v-for="line in 6" :key="line" x1="32" x2="768" :y1="20 + (line - 1) * 34" :y2="20 + (line - 1) * 34" />
          </g>
          <polyline :points="chartPolyline" />
          <g class="x-labels">
            <text v-for="(point, index) in activityPoints" :key="point.label" :x="32 + (index * 736) / Math.max(activityPoints.length - 1, 1)" y="218">
              {{ point.label }}
            </text>
          </g>
        </svg>
        <div class="chart-legend">
          <i></i>
          <span>{{ $t('orgIotClient.dashboard.activeDevices') }}</span>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.iot-dashboard {
  --dashboard-info: hsl(var(--primary));
  --dashboard-info-soft: hsl(var(--primary) / 12%);
  --dashboard-success: hsl(var(--success));
  --dashboard-warning: hsl(var(--warning));
  --dashboard-caution: hsl(var(--warning) / 82%);
  --dashboard-danger: hsl(var(--destructive));
  --dashboard-chart-muted: hsl(var(--muted-foreground) / 36%);
  --dashboard-panel-shadow: 0 2px 8px hsl(var(--foreground) / 4%);

  min-height: calc(100vh - 80px);
  padding: 16px;
  color: hsl(var(--foreground));
  background: hsl(var(--background-deep));
}

.iot-dashboard.is-loading {
  cursor: progress;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card,
.panel {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: var(--dashboard-panel-shadow);
}

.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 86px;
  padding: 18px 20px;
}

.stat-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 28px;
}

.stat-card--blue .stat-card__icon {
  color: var(--dashboard-info);
}

.stat-card--amber .stat-card__icon {
  color: var(--dashboard-warning);
}

.stat-card--green .stat-card__icon {
  color: var(--dashboard-success);
}

.stat-card--red .stat-card__icon {
  color: var(--dashboard-danger);
}

.stat-card__content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.stat-card__content span,
.legend-list,
.device-row small,
.chart-legend {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}

.stat-card__content strong {
  color: hsl(var(--card-foreground));
  font-size: 30px;
  font-weight: 500;
  line-height: 1;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.panel {
  min-width: 0;
}

.panel__header {
  padding: 18px 20px 0;
}

.panel__header--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel__header h2 {
  margin: 0;
  color: hsl(var(--card-foreground));
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.donut-wrap {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 220px);
  align-items: center;
  min-height: 185px;
  padding: 12px 28px 24px;
}

.donut {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 0 auto;
  border-radius: 50%;
}

.donut__inner {
  position: absolute;
  inset: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--card));
  border-radius: 50%;
}

.donut__inner strong {
  color: hsl(var(--foreground));
  font-size: 16px;
  font-weight: 600;
}

.legend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.legend-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.legend-list i,
.chart-legend i {
  flex: 0 0 auto;
  width: 12px;
  height: 8px;
  border-radius: 2px;
}

.panel--recent {
  margin-bottom: 12px;
}

.ghost-button {
  color: var(--dashboard-info);
  font-size: 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.device-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 18px 20px 24px;
}

.device-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: hsl(var(--muted) / 55%);
  border: 1px solid hsl(var(--border));
}

.device-row__icon {
  color: hsl(var(--muted-foreground));
  font-size: 22px;
}

.device-row div {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.device-row strong,
.device-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-row em {
  color: var(--dashboard-success);
  font-size: 12px;
  font-style: normal;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 135px;
  color: hsl(var(--muted-foreground) / 58%);
  font-size: 13px;
}

.empty-state span {
  margin-bottom: 8px;
  font-size: 42px;
}

.panel--chart {
  padding-bottom: 12px;
}

.range-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
}

.range-tabs button {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 12px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.range-tabs button.active {
  color: var(--dashboard-info);
  background: var(--dashboard-info-soft);
}

.range-tabs .refresh-button {
  width: 28px;
  padding: 0;
  font-size: 16px;
}

.line-chart {
  position: relative;
  height: 255px;
  padding: 12px 16px 0;
}

.line-chart svg {
  width: 100%;
  height: 230px;
}

.grid-lines line {
  stroke: hsl(var(--border));
  stroke-width: 1;
}

.line-chart polyline {
  fill: none;
  stroke: var(--dashboard-info);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.x-labels text {
  fill: hsl(var(--muted-foreground));
  font-size: 11px;
  text-anchor: middle;
}

.chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: -4px;
}

.chart-legend i {
  background: var(--dashboard-info);
}

@media (max-width: 1180px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .iot-dashboard {
    min-height: 100vh;
    padding: 12px;
  }

  .stat-grid,
  .overview-grid,
  .device-list {
    grid-template-columns: 1fr;
  }

  .stat-card {
    min-height: 74px;
    padding: 14px 16px;
  }

  .stat-card__content strong {
    font-size: 26px;
  }

  .donut-wrap {
    grid-template-columns: 1fr;
    gap: 18px;
    min-height: 0;
    padding: 18px 20px 22px;
  }

  .panel__header--row {
    align-items: flex-start;
    flex-direction: column;
  }

  .range-tabs {
    width: 100%;
  }

  .line-chart {
    height: 230px;
    padding-inline: 8px;
  }

  .x-labels text:nth-of-type(even) {
    display: none;
  }
}
</style>
