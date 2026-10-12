<template>
<app-navigation-bar :title="sceneName + ' - 执行日志'" />

<scroll-view
  class="log-page"
  scroll-y
  type="list"
  refresher-enabled
  :refresher-triggered="refreshing"
  @refresherrefresh="onRefresh"
  @scrolltolower="onLoadMore"
>
  <loading v-if="loading && logs.length === 0" text="加载中..." />

  <template v-else-if="logs.length > 0">
    <view class="log-list">
      <view class="log-item" v-for="(item, index) in logs" :key="item.id">
        <view class="log-item__header">
          <view :class="`log-item__status ${item.status === 1 ? 'log-item__status--success' : 'log-item__status--fail'}`">
            <text>{{item.statusText}}</text>
          </view>
          <text class="log-item__time">{{item.timeText}}</text>
        </view>
        <view class="log-item__body">
          <text class="log-item__type">{{item.typeText}}</text>
          <text v-if="item.desc" class="log-item__desc">{{item.desc}}</text>
        </view>
      </view>
    </view>
  </template>

  <empty-state v-else icon="no-data" text="暂无执行记录" />

  <view v-if="!hasMore && logs.length > 0" class="log-end">
    <text>没有更多了</text>
  </view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { sceneService } from '../../../services/scene.service';
import type { SceneLogEntity } from '../../../domain/entities/scene.entity';
import { ensurePageReady } from '../../../utils/page-guard';

interface FormattedLog extends SceneLogEntity {
  statusText: string;
  typeText: string;
  timeText: string;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${M}-${d} ${h}:${m}:${s}`;
}

function formatLog(log: SceneLogEntity): FormattedLog {
  return {
    ...log,
    statusText: log.status === 1 ? '成功' : '失败',
    typeText: log.type === 'auto' ? '自动触发' : '手动触发',
    timeText: formatTime(log.createdTime),
  };
}

/** decodeRouteText 解码路由参数中的中文名称，避免展示百分号编码。 */
function decodeRouteText(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const sceneID = ref('');
const sceneName = ref('');
const logs = ref<FormattedLog[]>([]);
const loading = ref(true);
const hasMore = ref(true);
const page = ref(1);
const size = ref(20);
const refreshing = ref(false);

onLoad(async (query: Record<string, string | undefined> | undefined) => {
  const q = (query || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageScene/pages/log/index', q);
  if (!ready) {
    loading.value = false;
    refreshing.value = false;
    return;
  }
  sceneID.value = q.id || q.sceneID || '';
  sceneName.value = decodeRouteText(q.sceneName, '场景日志');
  loadFirst();
});

async function loadFirst() {
  loading.value = true;
  page.value = 1;
  try {
    const result = await sceneService.getLogList(sceneID.value, 1, size.value);
    const list = result.list.map(formatLog);
    logs.value = list;
    loading.value = false;
    hasMore.value = list.length < result.total;
    page.value = 2;
  } catch {
    loading.value = false;
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
}

async function loadMore() {
  if (!hasMore.value || loading.value) return;
  loading.value = true;
  try {
    const result = await sceneService.getLogList(sceneID.value, page.value, size.value);
    const newLogs = result.list.map(formatLog);
    const all = [...logs.value, ...newLogs];
    logs.value = all;
    loading.value = false;
    hasMore.value = all.length < result.total;
    page.value = page.value + 1;
  } catch {
    loading.value = false;
  }
}

function onRefresh() {
  refreshing.value = true;
  loadFirst().then(() => {
    refreshing.value = false;
  });
}

function onLoadMore() {
  loadMore();
}
</script>

<style lang="scss" scoped>
.log-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.log-list {
  padding: 0 16px;
}

.log-item {
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  margin-bottom: 12px;
}

.log-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.log-item__status {
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 12px;
}

.log-item__status--success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.log-item__status--fail {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.log-item__time {
  font-size: 12px;
  color: var(--text-secondary);
}

.log-item__body {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.log-item__type {
  font-size: 14px;
  color: var(--text-primary);
}

.log-item__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.log-end {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: var(--text-tertiary);
}

</style>
