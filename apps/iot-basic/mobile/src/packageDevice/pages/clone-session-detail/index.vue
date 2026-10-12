<template>
<app-navigation-bar title="会话详情" />

<scroll-view class="csd-body" scroll-y type="list" @scrolltolower="handleScrollToLower">
  <loading v-if="messagesLoading && messages.length === 0" fullscreen text="加载中..." />
  <empty-state v-else-if="messages.length === 0 && !messagesLoading" text="暂无消息记录" />

  <template v-else>
    <view class="csd-msg-list">
      <template v-for="(item, index) in messages" :key="`${index}-${item.turnIndex || ''}`">
        <view v-if="item.summary" class="csd-summary">
          <view class="csd-summary__line"></view>
          <text class="csd-summary__text">摘要：{{item.summary}}</text>
          <view class="csd-summary__line"></view>
        </view>

        <view v-if="item.userInput" class="csd-msg csd-msg--user">
          <view class="csd-bubble csd-bubble--user">
            <text class="csd-bubble__text">{{item.userInput}}</text>
          </view>
        </view>

        <view v-if="item.aiResponse" class="csd-msg csd-msg--assistant">
          <view class="csd-bubble csd-bubble--assistant">
            <text class="csd-bubble__label">助手</text>
            <text class="csd-bubble__text">{{item.aiResponse}}</text>
          </view>
        </view>
      </template>
    </view>

    <view v-if="messagesLoading" class="csd-load-more">
      <text>加载更多...</text>
    </view>
    <view v-else-if="!hasMoreMessages && messages.length > 0" class="csd-load-more">
      <text>没有更多了</text>
    </view>
  </template>
</scroll-view>

<safe-area />
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { onUnmounted, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { cloneMemoryProvider, type CloneMemoryState } from '../../../providers/clone-memory.provider';
import type { CloneSessionMessage } from '../../../domain/entities/clone-session-message.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const messages = ref<CloneSessionMessage[]>([]);
const messagesLoading = ref(false);
const hasMoreMessages = ref(true);
let cleanup: (() => void) | null = null;

function syncState(state: CloneMemoryState): void {
  messages.value = state.sessionMessages;
  messagesLoading.value = state.sessionMessagesLoading;
  hasMoreMessages.value = state.sessionMessagesTotal > state.sessionMessages.length;
}

onLoad(async (query: Record<string, string> | undefined) => {
  const q = query || {};
  const ready = await ensurePageReady('/packageDevice/pages/clone-session-detail/index', q);
  if (!ready) return;
  const sessionID = q.sessionID || '';
  if (!sessionID) {
    uni.showToast({ title: '缺少会话信息', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 500);
    return;
  }
  cleanup = cloneMemoryProvider.subscribe(syncState);
  void cloneMemoryProvider.loadSessionMessages(sessionID, 1);
});

function release(): void {
  cleanup?.();
  cleanup = null;
  cloneMemoryProvider.clearSessionMessages();
}

onUnload(release);
onUnmounted(release);

function handleScrollToLower(): void {
  cloneMemoryProvider.loadMoreSessionMessages();
}
</script>

<style lang="scss" scoped>
.csd-body {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.csd-msg-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.csd-msg {
  display: flex;
  width: 100%;
}

.csd-msg--user {
  justify-content: flex-end;
}

.csd-msg--assistant {
  justify-content: flex-start;
}

.csd-bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.csd-bubble--user {
  background: var(--color-primary);
  border-top-right-radius: 4px;
}

.csd-bubble--assistant {
  background: var(--card-bg);
  border-top-left-radius: 4px;
}

.csd-bubble__label {
  font-size: 11px;
  color: var(--text-secondary);
}

.csd-bubble__text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-on-primary);
}

.csd-bubble--assistant .csd-bubble__text {
  color: var(--text-primary);
}

.csd-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.csd-summary__line {
  flex: 1;
  height: 1rpx;
  background: var(--divider);
}

.csd-summary__text {
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--page-bg);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.csd-load-more {
  padding: 16px;
  text-align: center;
}

.csd-load-more text {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
