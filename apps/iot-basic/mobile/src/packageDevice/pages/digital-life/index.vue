<template>
<app-navigation-bar title="数字生命管理" />

<view class="dl-tabs">
  <view
    :class="`dl-tab ${state.activeTab === 'clone' ? 'dl-tab--active' : ''}`"
    @tap="handleTabChange('clone')"
    hover-class="dl-tab--hover"
  >
    <text>Clone 体列表</text>
  </view>
  <view
    :class="`dl-tab ${state.activeTab === 'speaker' ? 'dl-tab--active' : ''}`"
    @tap="handleTabChange('speaker')"
    hover-class="dl-tab--hover"
  >
    <text>声纹列表</text>
  </view>
</view>

<scroll-view class="dl-body" scroll-y type="list">
  <!-- Clone 体列表 Tab -->
  <template v-if="state.activeTab === 'clone'">
    <loading v-if="state.loading" fullscreen text="加载中..." />

    <template v-else-if="!state.cloneGroup">
      <empty-state text="暂无数字生命数据" sub-text="请先选择项目" />
    </template>

    <template v-else>
      <!-- CloneGroup 信息卡片 -->
      <view class="dl-info-card">
        <view class="dl-info-card__header">
          <text class="dl-info-card__title">{{ state.cloneGroup.name }}</text>
          <text class="dl-info-card__tag">{{ state.cloneGroup.isDefault === 1 ? '默认' : '自定义' }}</text>
        </view>
        <text v-if="state.cloneGroup.description" class="dl-info-card__desc">{{ state.cloneGroup.description }}</text>
      </view>

      <!-- Clone 列表 -->
      <view class="dl-section">
        <text class="dl-section__title">关联的 Clone 体</text>

        <loading v-if="state.clonesLoading" text="加载中..." />

        <template v-else-if="state.clones.length === 0">
          <empty-state text="暂无 Clone 体" sub-text="绑定设备后将自动创建" />
        </template>

        <template v-else>
          <view class="dl-clone-list">
            <view
              v-for="item in state.clones"
              :key="item.id"
              class="dl-clone-card"
            >
              <view class="dl-clone-card__icon">
                <text class="dl-clone-card__icon-text">🤖</text>
              </view>
              <view class="dl-clone-card__info">
                <text class="dl-clone-card__name">{{ item.name }}</text>
                <text v-if="item.desc" class="dl-clone-card__desc">{{ item.desc }}</text>
                <text class="dl-clone-card__time">{{ formatTime(item.createdTime) }}</text>
              </view>
              <view class="dl-clone-card__status">
                <text :class="`dl-clone-card__status-dot ${item.status === 1 ? 'dl-clone-card__status-dot--active' : ''}`" />
                <text class="dl-clone-card__status-text">{{ item.status === 1 ? '启用' : '禁用' }}</text>
              </view>
            </view>
          </view>
        </template>
      </view>
    </template>
  </template>

  <!-- 声纹列表 Tab -->
  <template v-if="state.activeTab === 'speaker'">
    <loading v-if="state.speakersLoading" fullscreen text="加载中..." />

    <template v-else-if="!state.cloneGroup">
      <empty-state text="暂无数字生命数据" sub-text="请先选择项目" />
    </template>

    <template v-else-if="state.speakers.length === 0">
      <view class="dl-speaker-empty">
        <empty-state text="暂无声纹记录" sub-text="点击右上角 + 录制第一个声纹" />
      </view>
    </template>

    <template v-else>
      <view class="dl-speaker-list">
        <view
          v-for="item in state.speakers"
          :key="item.id"
          class="dl-speaker-card"
        >
          <view class="dl-speaker-card__main">
            <view class="dl-speaker-card__icon">
              <text class="dl-speaker-card__icon-text">🎤</text>
            </view>
            <view class="dl-speaker-card__info">
              <text class="dl-speaker-card__name">{{ item.speakerName }}</text>
              <text class="dl-speaker-card__time">{{ formatTime(item.createdTime) }}</text>
            </view>
            <view class="dl-speaker-card__status">
              <text :class="`dl-speaker-card__status-dot ${item.status === 1 ? 'dl-speaker-card__status-dot--active' : ''}`" />
              <text class="dl-speaker-card__status-text">{{ item.status === 1 ? '启用' : '禁用' }}</text>
            </view>
          </view>
          <view class="dl-speaker-card__actions">
            <view
              class="dl-speaker-card__action-btn dl-speaker-card__action-btn--delete"
              @tap="handleDeleteSpeaker(item)"
              hover-class="dl-speaker-card__action-btn--hover"
            >
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </template>
</scroll-view>

<!-- 添加声纹按钮（仅声纹列表 Tab 显示） -->
<view
  v-if="state.activeTab === 'speaker' && state.cloneGroup"
  class="dl-fab"
  @tap="handleAddSpeaker"
  hover-class="dl-fab--hover"
>
  <text class="dl-fab__text">+</text>
</view>

<safe-area />
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { digitalLifeProvider, type DigitalLifeState } from '../../../providers/digital-life.provider';
import type { CloneEntity } from '../../../domain/entities/clone.entity';
import type { SpeakerEmbeddingEntity } from '../../../domain/entities/speaker-embedding.entity';

const state = ref<DigitalLifeState>(digitalLifeProvider.getState());
let unsubscribe: (() => void) | null = null;

onLoad(() => {
  // 订阅状态变化
  unsubscribe = digitalLifeProvider.subscribe((s) => {
    state.value = s;
  });

  // 初始化
  digitalLifeProvider.init();
});

onShow(() => {
  // 每次显示页面时刷新声纹列表
  digitalLifeProvider.loadSpeakers();
});

onUnmounted(() => {
  unsubscribe?.();
  digitalLifeProvider.clear();
});

/**
 * 切换 Tab
 */
function handleTabChange(tab: 'clone' | 'speaker'): void {
  digitalLifeProvider.switchTab(tab);
}

/**
 * 添加声纹
 */
function handleAddSpeaker(): void {
  uni.navigateTo({
    url: '/packageDevice/pages/digital-life/speaker-record',
  });
}

/**
 * 删除声纹
 */
async function handleDeleteSpeaker(item: SpeakerEmbeddingEntity): Promise<void> {
  const { confirm } = await uni.showModal({
    title: '确认删除',
    content: `确定要删除声纹"${item.speakerName}"吗？`,
  });

  if (!confirm) return;

  const success = await digitalLifeProvider.deleteSpeaker(item.id);
  if (success) {
    uni.showToast({ title: '删除成功', icon: 'success' });
  }
}

/**
 * 格式化时间
 */
function formatTime(value?: number): string {
  if (!value) return '';
  const millis = value < 1_000_000_000_000 ? value * 1000 : value;
  const date = new Date(millis);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
</script>

<style lang="scss" scoped>
.dl-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1rpx solid var(--divider);
}

.dl-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: var(--text-secondary);
  position: relative;
}

.dl-tab--active {
  color: var(--color-primary);
  font-weight: 600;
}

.dl-tab--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 3px;
  background: var(--color-primary);
  border-radius: 2px;
}

.dl-tab--hover {
  opacity: 0.7;
}

.dl-body {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

/* CloneGroup 信息卡片 */
.dl-info-card {
  margin: 12px 16px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
}

.dl-info-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dl-info-card__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.dl-info-card__tag {
  font-size: 12px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: 4px;
}

.dl-info-card__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
}

/* Section */
.dl-section {
  margin: 12px 16px;
}

.dl-section__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

/* 声纹列表 */
.dl-speaker-empty {
  padding: 40px 0;
}

.dl-speaker-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dl-speaker-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px 16px;
}

.dl-speaker-card__main {
  display: flex;
  align-items: center;
}

.dl-speaker-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.dl-speaker-card__icon-text {
  font-size: 18px;
}

.dl-speaker-card__info {
  flex: 1;
  min-width: 0;
}

.dl-speaker-card__name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.dl-speaker-card__time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  display: block;
}

.dl-speaker-card__status {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.dl-speaker-card__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  margin-right: 6px;
}

.dl-speaker-card__status-dot--active {
  background: var(--color-success);
}

.dl-speaker-card__status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.dl-speaker-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1rpx solid var(--divider);
}

.dl-speaker-card__action-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
}

.dl-speaker-card__action-btn--delete {
  color: var(--color-danger);
  background: var(--color-error-bg);
}

.dl-speaker-card__action-btn--hover {
  opacity: 0.7;
}

/* Clone 列表 */
.dl-clone-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dl-clone-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
}

.dl-clone-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.dl-clone-card__icon-text {
  font-size: 18px;
}

.dl-clone-card__info {
  flex: 1;
  min-width: 0;
}

.dl-clone-card__name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
}

.dl-clone-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dl-clone-card__time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  display: block;
}

.dl-clone-card__status {
  display: flex;
  align-items: center;
  margin-left: 12px;
  flex-shrink: 0;
}

.dl-clone-card__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
  margin-right: 6px;
}

.dl-clone-card__status-dot--active {
  background: var(--color-success);
}

.dl-clone-card__status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* FAB 按钮 */
.dl-fab {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--color-primary-shadow);
  z-index: 100;
}

.dl-fab--hover {
  opacity: 0.85;
  transform: scale(0.95);
}

.dl-fab__text {
  font-size: 28px;
  color: var(--color-on-primary);
  line-height: 1;
}
</style>
