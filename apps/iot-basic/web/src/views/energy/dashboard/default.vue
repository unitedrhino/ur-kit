<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted } from 'vue';
import { $t } from '@vben/locales';
import { NTreeSelect, NSelect } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import dayjs from 'dayjs';

import { useDashboardData } from './composables/useDashboardData';
import type { EnergyTimeUnit, PowerTimeRange } from './composables/useDashboardData';
import { useDashboardThemeProvider, THEME_OPTIONS, DASHBOARD_THEMES } from './composables/useTheme';
import type { DashboardThemeKey } from './composables/useTheme';
import FlickeringGrid from './components/FlickeringGrid.vue';
import OverviewCards from './components/OverviewCards.vue';
import PowerTrendChart from './components/PowerTrendChart.vue';
import MonthlyEnergyChart from './components/MonthlyEnergyChart.vue';
import AreaEnergyChart from './components/AreaEnergyChart.vue';
import AreaCompareChart from './components/AreaCompareChart.vue';
import DeviceStatusChart from './components/DeviceStatusChart.vue';
import AlarmPanel from './components/AlarmPanel.vue';
import DashboardSettingModal from './components/DashboardSettingModal.vue';

const emit = defineEmits<{ (e: 'setting-saved'): void }>();

const { themeKey, theme, setTheme } = useDashboardThemeProvider();

function renderThemeLabel(option: SelectOption) {
  const t = DASHBOARD_THEMES[option.value as DashboardThemeKey];
  return h('span', {
    style: `display:inline-block;width:12px;height:12px;border-radius:50%;background:${t?.accent ?? '#888'}`,
  });
}

const {
  areaLoading,
  powerStats,
  totalPower,
  todayEnergy,
  energyTimeUnit,
  energyChartData,
  setEnergyTimeUnit,
  powerTimeRange,
  powerChartData,
  setPowerTimeRange,
  areaEnergyChartData,
  deviceOnlineStats,
  deviceStatusStats,
  alarmRecords,
  areaTreeOptions,
  selectedAreaKey,
  setSelectedArea,
} = useDashboardData(theme);

const energyUnits: { label: string; value: EnergyTimeUnit }[] = [
  { label: $t('orgIotClient.energyDashboard.granularityHour'), value: 'hour' },
  { label: $t('orgIotClient.energyDashboard.granularityDay'), value: 'day' },
  { label: $t('orgIotClient.energyDashboard.granularityMonth'), value: 'month' },
  { label: $t('orgIotClient.energyDashboard.granularityYear'), value: 'year' },
];

const powerRanges: { label: string; value: PowerTimeRange }[] = [
  { label: $t('orgIotClient.energyDashboard.rangeToday'), value: 'today' },
  { label: $t('orgIotClient.energyDashboard.rangeYesterday'), value: 'yesterday' },
  { label: $t('orgIotClient.energyDashboard.rangeWeek'), value: 'week' },
];

const currentTime = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

function updateTime() {
  currentTime.value = dayjs().format($t('orgIotClient.energyDashboard.datetimeFormat'));
}

const isFullscreen = ref(false);
const dashboardRef = ref<HTMLElement | null>(null);

const panelStyle = computed(() => ({
  background: theme.value.bgCard,
  borderColor: theme.value.cardBorder,
  boxShadow: theme.value.cardInsetShadow,
}));

const normalBtnStyle = computed(() => ({
  color: theme.value.textMuted,
  borderLeftColor: theme.value.panelHeadBorder,
}));

const activeBtnStyle = computed(() => ({
  color: theme.value.btnActiveText,
  background: theme.value.btnActiveBg,
}));

function toggleFullscreen() {
  if (!isFullscreen.value) {
    dashboardRef.value?.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// ===== 5 连击标题唤出大屏配置入口 =====
const TITLE_CLICK_REQUIRED = 5;
const TITLE_CLICK_WINDOW_MS = 1500;
const titleClickCount = ref(0);
let titleClickTimer: ReturnType<typeof setTimeout> | null = null;
const showSettingModal = ref(false);

function handleTitleClick() {
  titleClickCount.value += 1;
  if (titleClickTimer) clearTimeout(titleClickTimer);
  titleClickTimer = setTimeout(() => {
    titleClickCount.value = 0;
  }, TITLE_CLICK_WINDOW_MS);
  if (titleClickCount.value >= TITLE_CLICK_REQUIRED) {
    titleClickCount.value = 0;
    if (titleClickTimer) {
      clearTimeout(titleClickTimer);
      titleClickTimer = null;
    }
    showSettingModal.value = true;
  }
}

function handleSettingSaved() {
  showSettingModal.value = false;
  emit('setting-saved');
}
</script>

<template>
  <div
    ref="dashboardRef"
    class="dashboard"
    :class="{ 'dashboard--fullscreen': isFullscreen }"
    :style="{ background: theme.bg, color: theme.text }"
  >
    <!-- Flickering Grid 背景 -->
    <FlickeringGrid
      :square-size="4"
      :grid-gap="6"
      :flicker-chance="0.3"
      :color="theme.gridColor"
      :max-opacity="0.12"
    />

    <!-- 加载状态 -->
    <div v-if="areaLoading" class="dashboard__loading">
      <div class="dashboard__spinner" />
      <p>{{ $t('orgIotClient.energyDashboard.dataLoading') }}</p>
    </div>

    <template v-else>
      <!-- 顶部标题栏 -->
      <header class="dashboard__header">
        <div class="dashboard__title">
          <div
            class="dashboard__title-icon"
            :style="{ background: theme.iconBg, borderColor: theme.cardBorder, color: theme.accent }"
          >
            <span class="icon-[mdi--transmission-tower]" />
          </div>
          <div>
            <h1
              :style="{ background: theme.titleGradient, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }"
              class="dashboard__title-text"
              @click="handleTitleClick"
            >{{ $t('orgIotClient.energyDashboard.screenTitle') }}</h1>
            <p :style="{ color: theme.textMuted }">{{ currentTime }}</p>
          </div>
        </div>
        <div class="dashboard__header-actions">
          <NTreeSelect
            :value="selectedAreaKey"
            :options="areaTreeOptions"
            clearable
            :placeholder="$t('orgIotClient.console.allAreas')"
            size="small"
            :consistent-menu-width="false"
            key-field="key"
            label-field="label"
            class="dashboard__area-select"
            @update:value="setSelectedArea"
          />
          <NSelect
            :value="themeKey"
            :options="THEME_OPTIONS"
            :render-label="renderThemeLabel"
            size="small"
            class="dashboard__theme-select"
            @update:value="(v: string) => setTheme(v as DashboardThemeKey)"
          />
          <button
            class="dashboard__fs-btn"
            :style="{ background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }"
            @click="toggleFullscreen"
          >
          <span
            :class="isFullscreen ? 'icon-[mdi--fullscreen-exit]' : 'icon-[mdi--fullscreen]'"
            class="size-4"
          />
          {{ isFullscreen ? $t('orgIotClient.energyDashboard.exitFullscreen') : $t('orgIotClient.energyDashboard.fullscreen') }}
          </button>
        </div>
      </header>

      <!-- 统计卡片 -->
      <OverviewCards
        :avg-power="powerStats.avg"
        :min-power="powerStats.min"
        :max-power="powerStats.max"
        :total-power="totalPower"
        :today-energy="todayEnergy"
        :device-total="deviceOnlineStats.total"
        :device-online="deviceOnlineStats.online"
        :device-offline="deviceOnlineStats.offline"
      />

      <!-- 图表网格 -->
      <div class="dashboard__charts">
        <!-- 功率趋势 -->
        <div class="chart-panel chart-panel--wide" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.powerTrend') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.powerTrendDesc') }}</p>
            </div>
            <div class="btn-group" :style="{ borderColor: theme.btnBorder }">
              <button
                v-for="r in powerRanges"
                :key="r.value"
                class="btn-group__item"
                :style="r.value === powerTimeRange ? activeBtnStyle : normalBtnStyle"
                @click="setPowerTimeRange(r.value)"
              >
                {{ r.label }}
              </button>
            </div>
          </div>
          <div class="chart-panel__body">
            <PowerTrendChart
              :x-data="powerChartData.xData"
              :y-data="powerChartData.yData"
            />
          </div>
        </div>

        <!-- 设备状态概览 -->
        <div class="chart-panel chart-panel--area-share" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.deviceStatusOverview') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.deviceStatusOverviewDesc') }}</p>
            </div>
            <span class="icon-[mdi--monitor-dashboard] chart-panel__icon" :style="{ color: theme.accent + '66' }" />
          </div>
          <div class="chart-panel__body">
            <DeviceStatusChart
              :data="deviceStatusStats.data"
              :total="deviceStatusStats.total"
            />
          </div>
        </div>

        <!-- 告警信息 -->
        <div class="chart-panel" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.alarmInfo') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.alarmInfoDesc') }}</p>
            </div>
            <span class="icon-[mdi--alarm-light-outline] chart-panel__icon" :style="{ color: theme.accent + '99' }" />
          </div>
          <div class="chart-panel__body">
            <AlarmPanel :records="alarmRecords" />
          </div>
        </div>

        <!-- 用电量分析 -->
        <div class="chart-panel" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.energyAnalysis') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.energyAnalysisDesc') }}</p>
            </div>
            <div class="btn-group" :style="{ borderColor: theme.btnBorder }">
              <button
                v-for="u in energyUnits"
                :key="u.value"
                class="btn-group__item"
                :style="u.value === energyTimeUnit ? activeBtnStyle : normalBtnStyle"
                @click="setEnergyTimeUnit(u.value)"
              >
                {{ u.label }}
              </button>
            </div>
          </div>
          <div class="chart-panel__body">
            <MonthlyEnergyChart
              :x-data="energyChartData.xData"
              :y-data="energyChartData.yData"
            />
          </div>
        </div>

        <!-- 区域用电排行 -->
        <div class="chart-panel" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.areaEnergyRank') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.areaEnergyRankDesc') }}</p>
            </div>
            <span class="icon-[mdi--podium] chart-panel__icon" :style="{ color: theme.accent + '66' }" />
          </div>
          <div class="chart-panel__body">
            <AreaCompareChart
              :names="areaEnergyChartData.names"
              :values="areaEnergyChartData.values"
            />
          </div>
        </div>

        <!-- 区域用电占比 -->
        <div class="chart-panel" :style="panelStyle">
          <div class="chart-panel__head" :style="{ borderBottomColor: theme.panelHeadBorder }">
            <div>
              <h3 :style="{ color: theme.text }">{{ $t('orgIotClient.energyDashboard.areaEnergyShare') }}</h3>
              <p :style="{ color: theme.textDim }">{{ $t('orgIotClient.energyDashboard.areaEnergyShareDesc') }}</p>
            </div>
            <span class="icon-[mdi--chart-donut] chart-panel__icon" />
          </div>
          <div class="chart-panel__body">
            <AreaEnergyChart
              :names="areaEnergyChartData.names"
              :values="areaEnergyChartData.values"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 大屏配置设置（5 连击标题唤出） -->
    <DashboardSettingModal v-model:show="showSettingModal" @saved="handleSettingSaved" />
  </div>
</template>

<style scoped>
.dashboard {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.dashboard--fullscreen {
  height: 100vh;
  padding: 24px;
}

/* 加载 */
.dashboard__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  opacity: 0.6;
  font-size: 14px;
  position: relative;
  z-index: 1;
}

.dashboard__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  opacity: 0.4;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 头部 */
.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.dashboard__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard__title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid;
  font-size: 22px;
}

.dashboard__title h1 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
}

.dashboard__title-text {
  cursor: default;
  user-select: none;
}

.dashboard__title p {
  font-size: 12px;
  margin-top: 2px;
}

.dashboard__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard__area-select {
  width: 160px;
}

.dashboard__theme-select {
  width: 58px;
}

.dashboard__area-select :deep(.n-base-selection),
.dashboard__theme-select :deep(.n-base-selection) {
  --n-color: transparent !important;
  --n-color-active: transparent !important;
  border-radius: 8px;
}

.dashboard__fs-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dashboard__fs-btn:hover {
  opacity: 0.85;
}

/* 图表网格 */
.dashboard__charts {
  flex: 1;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.chart-panel {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid;
  backdrop-filter: blur(16px);
  overflow: hidden;
  min-height: 0;
}

.chart-panel--wide {
  min-width: 0;
}

/* 区域用电占比：允许浮层展开覆盖 */
.chart-panel--area-share {
  position: relative;
  overflow: visible;
  z-index: 1;
}

.chart-panel--area-share:has(.aec__overlay) {
  z-index: 20;
}

.chart-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid;
  flex-shrink: 0;
}

.chart-panel__head h3 {
  font-size: 13px;
  font-weight: 600;
}

.chart-panel__head p {
  font-size: 11px;
  margin-top: 1px;
}

.chart-panel__icon {
  font-size: 18px;
}

.chart-panel__body {
  flex: 1;
  padding: 8px;
  min-height: 0;
}

/* btn-group 切换按钮组 */
.btn-group {
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid;
}

.btn-group__item {
  padding: 3px 10px;
  font-size: 11px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
}

.btn-group__item + .btn-group__item {
  border-left: 1px solid;
  border-left-color: inherit;
}

@media (max-width: 1024px) {
  .dashboard {
    height: auto;
    min-height: calc(100vh - 80px);
    overflow-y: auto;
  }
}
</style>
