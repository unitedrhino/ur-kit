<template>
<app-navigation-bar title="设备日志" />

<scroll-view class="logs-page" scroll-y type="list" @scrolltolower="handleLoadMore">
  <view class="logs-filter">
    <view class="logs-tabs">
      <view
        v-for="tab in logTabs"
        :key="tab.value"
        class="logs-tab"
        :class="{ 'logs-tab--active': activeTab === tab.value }"
        @tap="handleSwitchTab(tab.value)"
      >
        <text>{{tab.label}}</text>
      </view>
    </view>

    <view class="logs-presets">
      <button
        v-for="preset in timePresets"
        :key="preset.value"
        class="logs-preset"
        :class="{ 'logs-preset--active': timeRange.label === preset.label }"
        @tap="handleSelectPreset(preset.value)"
      >
        {{preset.label}}
      </button>
    </view>

  </view>

  <loading v-if="loading && groups.length === 0" text="日志加载中..." />

  <view v-else class="logs-list">
    <view v-if="errorMessage" class="logs-error">
      <text class="logs-error__text">{{errorMessage}}</text>
      <button class="logs-error__btn" @tap="handleRefresh">重试</button>
    </view>

    <template v-else-if="groups.length > 0">
      <view v-for="group in groups" :key="group.dateLabel" class="logs-date-group">
        <view class="logs-date-head" @tap="handleToggleDate(group.dateLabel)">
          <text class="logs-date-head__title">{{group.dateLabel}}</text>
          <text class="logs-date-head__count">
            {{group.hiddenCount > 0 ? `展开 ${group.hiddenCount} 条` : '收起'}}
          </text>
        </view>

        <view
          v-for="item in group.visibleItems"
          :key="item.id"
          class="logs-item"
          :class="[`logs-item--${item.resultTone}`]"
          @tap="handleToggleItem(item.id)"
        >
          <view class="logs-item__head">
            <text class="logs-item__time">{{item.timeLabel}}</text>
            <text class="logs-item__badge">{{item.badgeLabel}}</text>
          </view>
          <text class="logs-item__title">{{item.title}}</text>
          <text v-if="item.subtitle" class="logs-item__subtitle">{{item.subtitle}}</text>
          <text v-if="item.actor" class="logs-item__actor">操作人：{{item.actor}}</text>

          <view v-if="item.expanded" class="logs-detail">
            <view v-for="row in item.detailRows" :key="row.label" class="logs-detail__row">
              <text class="logs-detail__label">{{row.label}}</text>
              <text class="logs-detail__value">{{row.value}}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loadingMore" class="logs-load-more">
        <text>加载更多...</text>
      </view>
      <view v-else-if="!hasMore" class="logs-load-more">
        <text>没有更多了</text>
      </view>
    </template>

    <empty-state v-else text="暂无设备日志" />
  </view>

  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { onUnmounted, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceLogProvider, type DeviceLogState } from '../../../providers/device-log.provider';
import type { DeviceLogTabKey, DeviceLogTimePreset } from '../../../domain/models/device-log.model';
import { DEVICE_LOG_TIME_PRESETS, createDeviceLogTimeRangeFromPreset } from '../../../domain/models/device-log.model';
import { ensurePageReady } from '../../../utils/page-guard';

/** logTabs 是设备日志页三个固定业务页签。 */
const logTabs: Array<{ label: string; value: DeviceLogTabKey }> = [
  { label: '上下线', value: 'status' },
  { label: '操作', value: 'operation' },
  { label: '调试', value: 'debug' },
];

const timePresets = DEVICE_LOG_TIME_PRESETS;
const defaultRange = createDeviceLogTimeRangeFromPreset('last30m');

const activeTab = ref<DeviceLogTabKey>('status');
const errorMessage = ref('');
const groups = ref<DeviceLogState['groups']>([]);
const hasMore = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const timeRange = ref(defaultRange);
const unsubscribes: Array<() => void> = [];

/** syncState 将 Provider 状态同步到页面响应式变量。 */
function syncState(state: DeviceLogState): void {
  activeTab.value = state.activeTab;
  errorMessage.value = state.errorMessage;
  groups.value = state.groups;
  hasMore.value = state.hasMore;
  loading.value = state.loading;
  loadingMore.value = state.loadingMore;
  timeRange.value = state.timeRange;
}

/** handleSwitchTab 切换日志类型。 */
function handleSwitchTab(tab: DeviceLogTabKey): void {
  void deviceLogProvider.switchTab(tab);
}

/** handleSelectPreset 应用快捷时间范围。 */
function handleSelectPreset(preset: DeviceLogTimePreset): void {
  void deviceLogProvider.selectPresetRange(preset);
}

/** handleToggleDate 展开或收起日期分组。 */
function handleToggleDate(dateLabel: string): void {
  deviceLogProvider.toggleDateGroup(dateLabel);
}

/** handleToggleItem 展开或收起日志详情。 */
function handleToggleItem(itemId: string): void {
  deviceLogProvider.toggleItemDetail(itemId);
}

/** handleRefresh 刷新当前页签日志。 */
function handleRefresh(): void {
  void deviceLogProvider.refresh();
}

/** handleLoadMore 触底加载更多日志。 */
function handleLoadMore(): void {
  void deviceLogProvider.loadMore();
}

onLoad(async (q: any) => {
  unsubscribes.push(deviceLogProvider.subscribe(syncState));
  const query = (q || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageDevice/pages/logs/index', query);
  if (!ready) {
    loading.value = false;
    return;
  }
  await deviceLogProvider.init(query.productID || '', query.deviceName || '');
});

onUnmounted(() => {
  unsubscribes.forEach((fn) => fn());
  deviceLogProvider.clear();
});
</script>

<style lang="scss" scoped>
.logs-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.logs-filter {
  margin: 0 16px 12px;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 12px);
}

.logs-tabs,
.logs-presets {
  display: flex;
  gap: 8px;
}

.logs-tab {
  flex: 1;
  height: 36px;
  line-height: 36px;
  color: var(--text-secondary);
  background: var(--page-bg);
  border-radius: var(--radius-sm, 8px);
  font-size: 14px;
  text-align: center;
}

.logs-tab--active {
  color: var(--color-primary);
  background: var(--color-primary-light);
  font-weight: 600;
}

.logs-presets {
  flex-wrap: wrap;
  margin-top: 10px;
}

.logs-preset {
  flex: 1 0 calc(25% - 8px);
  min-width: 74px;
  height: 32px;
  line-height: 32px;
  padding: 0 8px;
  color: var(--text-secondary);
  background: var(--page-bg);
  border-radius: var(--radius-sm, 8px);
  font-size: 12px;
}

.logs-preset--active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.logs-list {
  margin: 0 16px 24px;
}

.logs-error {
  padding: 18px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  text-align: center;
}

.logs-error__text {
  display: block;
  color: var(--color-error);
  font-size: 13px;
}

.logs-error__btn {
  width: 96px;
  height: 34px;
  line-height: 34px;
  margin-top: 12px;
  color: var(--color-on-primary);
  background: var(--color-primary);
  border-radius: var(--radius-sm, 8px);
  font-size: 13px;
}

.logs-date-group {
  margin-bottom: 12px;
}

.logs-date-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
}

.logs-date-head__title {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 700;
}

.logs-date-head__count {
  color: var(--text-secondary);
  font-size: 12px;
}

.logs-item {
  margin-bottom: 10px;
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-left-width: 4px;
  border-radius: var(--radius-md, 12px);
}

.logs-item--success { border-left-color: var(--color-success); }
.logs-item--danger { border-left-color: var(--color-error); }
.logs-item--warning { border-left-color: var(--color-warning); }
.logs-item--info { border-left-color: var(--color-primary); }
.logs-item--neutral { border-left-color: var(--border-color); }

.logs-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.logs-item__time {
  color: var(--text-secondary);
  font-size: 12px;
  font-family: monospace;
}

.logs-item__badge {
  flex-shrink: 0;
  padding: 2px 8px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  border-radius: var(--radius-full, 9999px);
  font-size: 11px;
}

.logs-item__title {
  display: block;
  margin-top: 8px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
}

.logs-item__subtitle,
.logs-item__actor {
  display: block;
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 12px;
  word-break: break-all;
}

.logs-detail {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.logs-detail__row {
  display: flex;
  gap: 10px;
  padding: 6px 0;
}

.logs-detail__label {
  flex-shrink: 0;
  width: 72px;
  color: var(--text-secondary);
  font-size: 12px;
}

.logs-detail__value {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
  font-size: 12px;
  word-break: break-all;
}

.logs-load-more {
  padding: 12px;
  color: var(--text-secondary);
  font-size: 12px;
  text-align: center;
}
</style>
