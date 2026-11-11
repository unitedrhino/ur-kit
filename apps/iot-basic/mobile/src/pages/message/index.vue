<!-- 消息中心：展示当前账号收到的站内通知，作为主导航第二个入口。 -->
<template>
  <app-navigation-bar :brand="true" :back="false" />
  <scroll-view class="message-page" scroll-y type="list" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="handleRefresh" @scrolltolower="handleLoadMore">
    <view class="message-hero">
      <view class="message-hero__icon"><app-icon name="tabler:message-circle" :size="26" color="var(--color-on-primary)" /></view>
      <view class="message-hero__body"><text class="message-hero__title">消息中心</text><text class="message-hero__desc">查看设备告警和项目动态</text></view>
      <view v-if="unreadCount > 0" class="message-hero__count">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
    </view>
    <view class="message-filter">
      <view class="message-filter__tabs">
        <view v-for="item in filterOptions" :key="item.value" :class="['message-filter__tab', { 'message-filter__tab--active': filter === item.value }]" @tap="handleFilter(item.value)"><text>{{ item.label }}</text><text v-if="item.value === 'unread' && unreadCount > 0" class="message-filter__tab-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</text></view>
      </view>
      <view v-if="unreadCount > 0" class="message-filter__read-all" @tap="handleMarkAllRead"><text>{{ markingAll ? '处理中…' : '一键已读' }}</text></view>
    </view>
    <loading v-if="loading && records.length === 0" text="加载消息…" />
    <view v-else-if="error" class="message-error">
      <app-icon name="tabler:database-off" :size="24" color="var(--color-danger)" />
      <text class="message-error__text">{{ error }}</text>
      <view class="message-error__retry" @tap="handleRetry"><text>重新加载</text></view>
    </view>
    <view v-else-if="records.length > 0" class="message-list">
      <view v-for="item in records" :key="item.id" :class="`message-card ${item.isRead === 2 ? 'message-card--unread' : ''}`" @tap="handleMessageTap(item)">
        <view class="message-card__icon"><app-icon name="tabler:bell" :size="20" color="var(--color-primary)" /></view>
        <view class="message-card__body"><view class="message-card__head"><text class="message-card__title">{{ item.subject }}</text><text v-if="item.isRead === 2" class="message-card__unread">未读</text><text class="message-card__expand">{{ expandedID === item.id ? '收起' : '详情' }}</text></view><text class="message-card__target">{{ item.notifyName || '场景通知' }}</text><text class="message-card__content">{{ messagePreview(item.body) }}</text><message-markdown v-if="expandedID === item.id" :content="item.body" /><text class="message-card__time">{{ formatMessageTime(item.notifyTime || item.createdTime) }}</text></view>
      </view>
    </view>
    <empty-state v-else icon="no-data" text="暂无消息" />
    <view v-if="records.length > 0 && !hasMore" class="message-end">没有更多消息了</view>
    <safe-area />
  </scroll-view>
  <mobile-tab-bar active="pages/message/index" />
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppIcon from '../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../components/empty-state/empty-state.vue';
import Loading from '../../components/loading/loading.vue';
import MobileTabBar from '../../components/mobile-tab-bar/mobile-tab-bar.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import MessageMarkdown from '../../components/message-markdown/message-markdown.vue';
import { messageProvider, type MessageFilter } from '../../providers/message.provider';
import type { MessageRecordEntity } from '../../domain/entities/message.entity';
import { ensurePageReady } from '../../utils/page-guard';

const records = ref<MessageRecordEntity[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const hasMore = ref(true);
const unreadCount = ref(0);
const error = ref('');
const expandedID = ref('');
const filter = ref<MessageFilter>('all');
const markingAll = ref(false);
const filterOptions: Array<{ value: MessageFilter; label: string }> = [{ value: 'all', label: '全部' }, { value: 'unread', label: '未读' }, { value: 'read', label: '已读' }];
let unsubscribe: (() => void) | null = null;

function syncState(): void {
  const state = messageProvider.getState();
  records.value = state.records;
  loading.value = state.pageState.loading;
  hasMore.value = state.pageState.hasMore;
  unreadCount.value = state.unreadCount;
  filter.value = state.filter;
  error.value = state.error;
}

onLoad(async () => {
  unsubscribe = messageProvider.subscribe(syncState);
  const ready = await ensurePageReady('/pages/message/index');
  if (!ready) { loading.value = false; return; }
  syncState();
  await messageProvider.loadFirst();
});

onShow(() => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false });
  // #endif
});
onUnmounted(() => { unsubscribe?.(); unsubscribe = null; });

async function handleRefresh(): Promise<void> {
  if (refreshing.value) return;
  refreshing.value = true;
  try { await messageProvider.loadFirst(); } finally { refreshing.value = false; uni.stopPullDownRefresh(); }
}
function handleLoadMore(): void { if (hasMore.value) void messageProvider.loadMore(); }
function handleRetry(): void { void messageProvider.loadFirst(); }
function handleFilter(value: MessageFilter): void { void messageProvider.setFilter(value); }
async function handleMarkAllRead(): Promise<void> {
  if (markingAll.value || unreadCount.value === 0) return;
  markingAll.value = true;
  try { await messageProvider.markAllRead(); } finally { markingAll.value = false; }
}
async function handleMessageTap(item: MessageRecordEntity): Promise<void> {
  expandedID.value = expandedID.value === item.id ? '' : item.id;
  if (item.isRead === 2) await messageProvider.markRead(item.id);
}
/** 折叠状态只展示正文首行摘要，避免把 Markdown 标记直接铺在列表中。 */
function messagePreview(value: string): string {
  const first = String(value || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '收到一条新的平台消息';
  return first.replace(/^#{1,3}\s+/, '').replace(/^[-*]\s+/, '').replace(/^!\[[^\]]*\]\([^)]*\)$/, '图片消息').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
}
function formatMessageTime(value: string | number): string { const timestamp = Number(value || 0); if (!timestamp) return '刚刚'; const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp); return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
</script>

<style lang="scss" scoped>
.message-page{min-height:100vh;box-sizing:border-box;padding:16px;background:var(--page-gradient)}.message-hero{display:flex;align-items:center;gap:12px;padding:18px;border-radius:var(--radius-lg);background:var(--card-bg);box-shadow:0 8px 24px var(--color-shadow)}.message-hero__icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:16px;background:var(--color-primary)}.message-hero__body{flex:1;display:flex;flex-direction:column;gap:4px}.message-hero__title{font-size:var(--font-section);font-weight:600;color:var(--text-primary)}.message-hero__desc{font-size:var(--font-caption);color:var(--text-secondary)}.message-hero__count{min-width:24px;padding:4px 7px;text-align:center;border-radius:var(--radius-full);color:var(--color-on-primary);background:var(--color-danger);font-size:var(--font-caption)}.message-filter{display:flex;align-items:center;justify-content:space-between;margin:18px 2px 10px;gap:10px}.message-filter__tabs{display:flex;align-items:center;gap:6px}.message-filter__tab{display:flex;align-items:center;gap:4px;padding:7px 10px;border-radius:var(--radius-full);font-size:var(--font-caption);color:var(--text-secondary)}.message-filter__tab--active{font-weight:600;color:var(--color-primary);background:var(--color-primary-light)}.message-filter__tab-count{min-width:16px;padding:1px 4px;text-align:center;border-radius:var(--radius-full);font-size:10px;color:var(--color-on-primary);background:var(--color-danger)}.message-filter__read-all{padding:7px 10px;border-radius:var(--radius-full);font-size:var(--font-caption);color:var(--color-primary);background:var(--color-primary-light)}.message-list{display:flex;flex-direction:column;gap:10px}.message-card{display:flex;gap:12px;padding:15px;border-radius:var(--radius-lg);background:var(--card-bg)}.message-card--unread{box-shadow:0 0 0 1px var(--color-primary-light)}.message-card__icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:12px;background:var(--color-primary-light)}.message-card__body{min-width:0;flex:1}.message-card__head{display:flex;align-items:center;gap:8px}.message-card__title{min-width:0;flex:1;font-size:var(--font-body);font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.message-card__unread{padding:2px 6px;border-radius:6px;font-size:10px;color:var(--color-danger);background:var(--color-error-bg)}.message-card__expand{font-size:var(--font-caption);color:var(--color-primary)}.message-card__target,.message-card__content,.message-card__time{display:block;margin-top:6px;font-size:var(--font-caption);line-height:1.45;color:var(--text-secondary)}.message-card__time{color:var(--text-tertiary)}.message-error{display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 20px;border-radius:var(--radius-lg);background:var(--card-bg)}.message-error__text{font-size:var(--font-body);color:var(--text-secondary);text-align:center}.message-error__retry{padding:8px 20px;border-radius:var(--radius-full);background:var(--color-primary);color:var(--color-on-primary);font-size:var(--font-caption)}.message-end{text-align:center;padding:18px;color:var(--text-tertiary);font-size:var(--font-caption)}
</style>
