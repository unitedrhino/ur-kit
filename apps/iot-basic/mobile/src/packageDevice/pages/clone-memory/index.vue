<template>
<app-navigation-bar title="记忆" />

<view class="cm-tabs">
  <view
    :class="`cm-tab ${activeTab === 'session' ? 'cm-tab--active' : ''}`"
    @tap="handleTabChange('session')"
    hover-class="cm-tab--hover"
  >
    <text>会话管理</text>
  </view>
  <view
    :class="`cm-tab ${activeTab === 'memory' ? 'cm-tab--active' : ''}`"
    @tap="handleTabChange('memory')"
    hover-class="cm-tab--hover"
  >
    <text>记忆管理</text>
  </view>
</view>

<scroll-view class="cm-body" scroll-y type="list" @scrolltolower="handleScrollToLower">
  <template v-if="activeTab === 'session'">
    <view class="cm-date-filter">
      <view class="cm-date-filter__quick">
        <text class="cm-date-filter__label">快捷日期</text>
        <view :class="`cm-date-filter__btn ${sessionQuickRange === 1 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleSessionQuickRange(1)">今天</view>
        <view :class="`cm-date-filter__btn ${sessionQuickRange === 2 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleSessionQuickRange(2)">昨天</view>
        <view :class="`cm-date-filter__btn ${sessionQuickRange === 7 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleSessionQuickRange(7)">近7天</view>
        <view :class="`cm-date-filter__btn ${sessionQuickRange === 30 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleSessionQuickRange(30)">近30天</view>
        <view class="cm-date-filter__btn cm-date-filter__btn--text" @tap="handleClearSessionDateRange">清空</view>
      </view>
      <text v-if="sessionDateSummary" class="cm-date-filter__summary">当前筛选：{{sessionDateSummary}}</text>
    </view>

    <loading v-if="sessionsLoading && sessions.length === 0" fullscreen text="加载中..." />
    <empty-state v-else-if="sessions.length === 0 && !sessionsLoading" text="暂无会话记录" />

    <template v-else>
      <view class="cm-list">
        <view
          v-for="item in sessions"
          :key="item.sessionID"
          class="cm-session-card"
          @tap="handleSessionTap(item.sessionID)"
          hover-class="cm-session-card--hover"
        >
          <view class="cm-session-card__header">
            <text class="cm-session-card__id">{{item.title || item.sessionID}}</text>
            <text class="cm-session-card__channel">{{item.channel === 'voice' ? '语音' : '文本'}}</text>
          </view>
          <view class="cm-session-card__meta">
            <text class="cm-session-card__turns">{{item.turnCount || 0}} 轮对话</text>
            <text class="cm-session-card__time">{{item.lastActiveAtStr}}</text>
          </view>
        </view>
      </view>

      <view v-if="sessionsLoading" class="cm-load-more">
        <text>加载更多...</text>
      </view>
      <view v-else-if="!hasMoreSessions" class="cm-load-more">
        <text>没有更多了</text>
      </view>
    </template>
  </template>

  <template v-if="activeTab === 'memory'">
    <view class="cm-date-filter">
      <view class="cm-date-filter__quick">
        <text class="cm-date-filter__label">快捷日期</text>
        <view :class="`cm-date-filter__btn ${memoryQuickRange === 1 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleMemoryQuickRange(1)">今天</view>
        <view :class="`cm-date-filter__btn ${memoryQuickRange === 2 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleMemoryQuickRange(2)">昨天</view>
        <view :class="`cm-date-filter__btn ${memoryQuickRange === 7 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleMemoryQuickRange(7)">近7天</view>
        <view :class="`cm-date-filter__btn ${memoryQuickRange === 30 ? 'cm-date-filter__btn--active' : ''}`" @tap="handleMemoryQuickRange(30)">近30天</view>
        <view class="cm-date-filter__btn cm-date-filter__btn--text" @tap="handleClearMemoryDateRange">清空</view>
      </view>
      <text v-if="memoryDateSummary" class="cm-date-filter__summary">当前筛选：{{memoryDateSummary}}</text>
    </view>

    <loading v-if="memoryLoading && memoryRecords.length === 0 && !memoryProfile" fullscreen text="加载中..." />
    <empty-state v-else-if="!memoryProfile && memoryRecords.length === 0 && !memoryLoading" text="暂无记忆" />

    <template v-else>
      <view v-if="memoryProfile && memoryProfile.profileText" class="cm-memory-profile">
        <text class="cm-memory-profile__label">记忆画像</text>
        <text class="cm-memory-profile__text">{{memoryProfile.profileText}}</text>
      </view>

      <view v-if="memoryRecords.length > 0" class="cm-list">
        <view
          v-for="item in memoryRecords"
          :key="item.id"
          class="cm-memory-item"
        >
          <view class="cm-memory-item__meta">
            <text class="cm-memory-item__kind">{{item.memoryKind}}</text>
            <text class="cm-memory-item__time">{{item.updatedTimeStr}}</text>
          </view>
          <text class="cm-memory-item__summary">{{item.summary}}</text>
        </view>
      </view>

      <view v-if="memoryLoading" class="cm-load-more">
        <text>加载更多...</text>
      </view>
      <view v-else-if="!hasMoreMemory && memoryRecords.length > 0" class="cm-load-more">
        <text>没有更多了</text>
      </view>
    </template>
  </template>
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { onUnmounted, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { cloneMemoryProvider, type CloneMemoryState } from '../../../providers/clone-memory.provider';
import type { CloneSession } from '../../../domain/entities/clone-session.entity';
import type { CloneMemoryRecord, CloneMemoryProfile } from '../../../domain/entities/clone-memory.entity';
import { ensurePageReady } from '../../../utils/page-guard';

type SessionView = CloneSession & { lastActiveAtStr: string };
type MemoryView = CloneMemoryRecord & { updatedTimeStr: string };

const activeTab = ref<'session' | 'memory'>('session');
const sessions = ref<SessionView[]>([]);
const sessionsLoading = ref(false);
const hasMoreSessions = ref(true);
const sessionQuickRange = ref<number | null>(null);
const sessionDateSummary = ref('');
const memoryProfile = ref<CloneMemoryProfile | null>(null);
const memoryRecords = ref<MemoryView[]>([]);
const memoryLoading = ref(false);
const hasMoreMemory = ref(true);
const memoryQuickRange = ref<number | null>(null);
const memoryDateSummary = ref('');

let cleanup: (() => void) | null = null;

function toMillis(value?: number): number {
  if (!value) return 0;
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function formatTime(value?: number): string {
  const millis = toMillis(value);
  if (!millis) return '';
  const date = new Date(millis);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfDay(offsetDays = 0): number {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(offsetDays = 0): number {
  const date = new Date(startOfDay(offsetDays));
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function dateRange(days: number): { start: number; end: number } {
  if (days === 1) return { start: startOfDay(0), end: endOfDay(0) };
  if (days === 2) return { start: startOfDay(-1), end: endOfDay(-1) };
  return { start: startOfDay(-(days - 1)), end: endOfDay(0) };
}

function describeRange(start: number | null, end: number | null): string {
  if (!start || !end) return '';
  return `${formatTime(start).slice(0, 10)} 至 ${formatTime(end).slice(0, 10)}`;
}

function computeQuickRange(start: number | null, end: number | null): number | null {
  if (!start || !end) return null;
  const candidates = [1, 2, 7, 30];
  const normalizedStart = startOfDayFor(start);
  const normalizedEnd = endOfDayFor(end);
  return candidates.find((days) => {
    const range = dateRange(days);
    return startOfDayFor(range.start) === normalizedStart && endOfDayFor(range.end) === normalizedEnd;
  }) ?? null;
}

function startOfDayFor(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDayFor(value: number): number {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function syncState(state: CloneMemoryState): void {
  activeTab.value = state.activeTab;
  sessions.value = state.sessions.map((item) => ({
    ...item,
    lastActiveAtStr: formatTime(item.lastActiveAt),
  }));
  sessionsLoading.value = state.sessionsLoading;
  hasMoreSessions.value = state.sessionsTotal > state.sessions.length;
  sessionQuickRange.value = computeQuickRange(state.sessionStartTime, state.sessionEndTime);
  sessionDateSummary.value = describeRange(state.sessionStartTime, state.sessionEndTime);
  memoryProfile.value = state.memoryProfile;
  memoryRecords.value = state.memoryRecords.map((item) => ({
    ...item,
    updatedTimeStr: formatTime(item.updatedTime),
  }));
  memoryLoading.value = state.memoryLoading;
  hasMoreMemory.value = state.memoryTotal > state.memoryRecords.length;
  memoryQuickRange.value = computeQuickRange(state.memoryStartTime, state.memoryEndTime);
  memoryDateSummary.value = describeRange(state.memoryStartTime, state.memoryEndTime);
}

onLoad(async (query: Record<string, string> | undefined) => {
  const q = query || {};
  const ready = await ensurePageReady('/packageDevice/pages/clone-memory/index', q);
  if (!ready) return;
  const id = Number(q.cloneID) || 0;
  if (!id) {
    uni.showToast({ title: '缺少分身信息', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 500);
    return;
  }
  cleanup = cloneMemoryProvider.subscribe(syncState);
  cloneMemoryProvider.init(id);
});

function release(): void {
  cleanup?.();
  cleanup = null;
  cloneMemoryProvider.clear();
}

onUnload(release);
onUnmounted(release);

function handleTabChange(tab: 'session' | 'memory'): void {
  cloneMemoryProvider.switchTab(tab);
}

function handleScrollToLower(): void {
  if (activeTab.value === 'session') {
    cloneMemoryProvider.loadMoreSessions();
    return;
  }
  cloneMemoryProvider.loadMoreMemory();
}

function handleSessionQuickRange(days: number): void {
  const range = dateRange(days);
  cloneMemoryProvider.setSessionDateRange(range.start, range.end);
}

function handleMemoryQuickRange(days: number): void {
  const range = dateRange(days);
  cloneMemoryProvider.setMemoryDateRange(range.start, range.end);
}

function handleClearSessionDateRange(): void {
  cloneMemoryProvider.clearSessionDateRange();
}

function handleClearMemoryDateRange(): void {
  cloneMemoryProvider.clearMemoryDateRange();
}

function handleSessionTap(sessionID: string): void {
  if (!sessionID) return;
  uni.navigateTo({ url: `/packageDevice/pages/clone-session-detail/index?sessionID=${encodeURIComponent(sessionID)}` });
}
</script>

<style lang="scss" scoped>
.cm-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1rpx solid var(--divider);
}

.cm-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: var(--text-secondary);
}

.cm-tab--active {
  color: var(--color-primary);
  font-weight: 600;
}

.cm-tab--hover {
  opacity: 0.7;
}

.cm-body {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.cm-date-filter {
  margin: 12px 16px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 10px;
}

.cm-date-filter__quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cm-date-filter__label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.cm-date-filter__btn {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--page-bg);
  padding: 4px 10px;
  border-radius: 4px;
}

.cm-date-filter__btn--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.cm-date-filter__btn--text {
  color: var(--color-primary);
  background: transparent;
}

.cm-date-filter__summary {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.cm-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cm-session-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cm-session-card--hover {
  opacity: 0.85;
}

.cm-session-card__header,
.cm-session-card__meta,
.cm-memory-item__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cm-session-card__id {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.cm-session-card__channel {
  font-size: 12px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.cm-session-card__turns {
  font-size: 13px;
  color: var(--text-secondary);
}

.cm-session-card__time,
.cm-memory-item__time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.cm-memory-profile {
  margin: 12px 16px;
  padding: 14px;
  background: var(--card-bg);
  border-radius: 10px;
}

.cm-memory-profile__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8px;
}

.cm-memory-profile__text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.cm-memory-item {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-memory-item__kind {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: 4px;
}

.cm-memory-item__summary {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

.cm-load-more {
  padding: 16px;
  text-align: center;
}

.cm-load-more text {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
