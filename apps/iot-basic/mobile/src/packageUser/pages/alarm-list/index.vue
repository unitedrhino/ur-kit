<template>
<app-navigation-bar title="告警记录" />

<scroll-view class="alarm-page" scroll-y type="list" refresher-enabled @refresherrefresh="onPullDownRefresh" @scrolltolower="onReachBottom">
  <loading v-if="loading && records.length === 0" text="加载中..." />

  <template v-else-if="records.length > 0">
    <view class="alarm-list">
      <view class="alarm-item" v-for="(item, index) in records" :key="item.id">
        <view class="alarm-item__header">
          <text :class="`alarm-item__level alarm-item__level--${item.level}`">{{item.level === 1 ? '提醒' : item.level === 2 ? '次要' : item.level === 3 ? '重要' : '紧急'}}</text>
          <text class="alarm-item__time">{{item.createdTime}}</text>
        </view>
        <text class="alarm-item__scene">{{item.alarmName}} </text>
      </view>
    </view>
  </template>

  <empty-state v-else text="暂无告警记录" />

  <view v-if="!hasMore && records.length > 0" class="alarm-end"><text>没有更多了</text></view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { alarmProvider } from '../../../providers/alarm.provider';
import type { AlarmRecordEntity } from '../../../domain/entities/alarm.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const records = ref<AlarmRecordEntity[]>([]);
const loading = ref(true);
const hasMore = ref(true);
const unsubscribes: Array<() => void> = [];

onLoad(async () => {
  const ready = await ensurePageReady('/packageUser/pages/alarm-list/index');
  if (!ready) {
    loading.value = false;
    return;
  }
  unsubscribes.push(
    alarmProvider.subscribe((s) => {
      records.value = s.records;
      loading.value = s.pageState.loading;
      hasMore.value = s.pageState.hasMore;
    }),
  );
  alarmProvider.clearUnread();
  alarmProvider.loadFirst();
});

onUnload(() => {
  unsubscribes.forEach((fn) => fn());
});

onUnmounted(() => {
  unsubscribes.forEach((fn) => fn());
});

onPullDownRefresh(() => {
  alarmProvider.loadFirst().finally(() => uni.stopPullDownRefresh());
});

onReachBottom(() => {
  alarmProvider.loadMore();
});
</script>

<style lang="scss" scoped>
.alarm-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.alarm-list { padding: 0 16px; }
.alarm-item { background: var(--card-bg); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
.alarm-item__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.alarm-item__level { font-size: 12px; padding: 2px 8px; border-radius: 4px; }
.alarm-item__level--1 { background: var(--color-primary-light); color: var(--color-primary); }
.alarm-item__level--2 { background: var(--color-warning-bg); color: var(--color-warning); }
.alarm-item__level--3 { background: var(--color-error-bg); color: var(--color-error); }
.alarm-item__level--4 { background: var(--color-error); color: var(--card-bg); }
.alarm-item__time { font-size: 12px; color: var(--text-tertiary); }
.alarm-item__scene { font-size: 14px; color: var(--text-primary); }
.alarm-end { text-align: center; padding: 16px; font-size: 13px; color: var(--text-tertiary); }

</style>
