<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view
  class="scene-page"
  :style="`height: ${pageHeight};`"
  scroll-y
  type="list"
  @scrolltolower="onLoadMore"
>
  <!-- 搜索栏 -->
  <app-search-bar
    :modelValue="keyword"
    placeholder="搜索场景"
    @input="handleSearch"
  />

  <!-- Tab 筛选 -->
  <view class="scene-tabs">
    <view
      :class="`scene-tab ${activeTab === index ? 'scene-tab--active' : ''}`"
      v-for="(item, index) in tabs" :key="item.type"
      @tap="handleTabChange(index)"
    >
      <text class="scene-tab__text">{{item.label}}</text>
    </view>
  </view>

  <!-- 加载中 -->
  <loading v-if="loading && scenes.length === 0" text="加载中..." />

  <!-- 场景列表 -->
  <template v-else-if="scenes.length > 0">
    <view class="scene-list">
      <view
        class="scene-card"
        v-for="item in scenes" :key="item.id"
        @tap="handleSceneTap(item.id)"
        hover-class="scene-card--hover"
      >
        <!-- 左侧类型图标 -->
        <view :class="`scene-card__icon scene-card__icon--${item.type || 'manual'}`">
          <app-icon class="scene-card__icon-text" :name="item.type === 'auto' ? 'tabler:bolt' : 'tabler:player-play'" :size="18" />
        </view>

        <!-- 中间信息 -->
        <view class="scene-card__info">
          <view class="scene-card__header">
            <text class="scene-card__name">{{item.name}}</text>
            <view v-if="item.status === 3" class="scene-card__badge scene-card__badge--error">
              <text class="scene-card__badge-text">异常</text>
            </view>
          </view>
          <text class="scene-card__desc">{{item.desc || '暂无描述'}}</text>
          <view class="scene-card__meta">
            <text class="scene-card__meta-text">{{item.type === 'auto' ? '自动化' : '手动触发'}}</text>
            <text v-if="item.lastRunTime" class="scene-card__meta-text scene-card__meta-dot">·</text>
            <text v-if="item.lastRunTime" class="scene-card__meta-text">上次: {{item.lastRunTimeText}}</text>
          </view>
        </view>

        <!-- 右侧操作 -->
        <view
          class="scene-card__action"
          @tap.stop="item.type === 'auto' ? handleToggleStatus(item.id, item.status) : handleTrigger(item.id)"
        >
          <!-- 自动化场景显示开关 -->
          <template v-if="item.type === 'auto'">
            <view :class="`scene-switch ${item.status === 1 ? 'scene-switch--on' : ''}`">
              <view class="scene-switch__thumb"></view>
            </view>
          </template>
          <!-- 手动场景显示执行按钮 -->
          <template v-else>
            <view class="scene-card__trigger" hover-class="scene-card__trigger--hover">
              <text class="scene-card__trigger-text">执行</text>
            </view>
          </template>
        </view>
      </view>
    </view>
  </template>

  <!-- 空状态 -->
  <empty-state v-else icon="no-scene" text="暂无场景" buttonText="创建场景" @action="handleCreate" />

  <!-- 底部提示 -->
  <view v-if="!hasMore && scenes.length > 0" class="scene-end">
    <text class="scene-end__text">没有更多了</text>
  </view>

  <view v-if="scenes.length > 0" class="scene-list__bottom-space"></view>
</scroll-view>

<!-- 浮动添加按钮（列表不为空时显示） -->
<view v-if="scenes.length > 0" class="scene-fab" @tap="handleCreate" hover-class="scene-fab--hover">
  <app-icon class="scene-fab__icon" name="tabler:plus" :size="32" color="var(--color-on-primary)" />
</view>

<view v-if="createSheetVisible" class="create-sheet-mask" @tap="closeCreateSheet" />
<view :class="`create-type-sheet ${createSheetVisible ? 'create-type-sheet--visible' : ''}`">
  <text class="create-type-sheet__heading">新建场景</text>
  <view class="create-type-sheet__group">
    <view class="create-type-sheet__option" @tap="createScene('manual')">
      <text class="create-type-sheet__title">手动控制</text>
      <text class="create-type-sheet__arrow">›</text>
    </view>
    <view class="create-type-sheet__option" @tap="createScene('auto')">
      <text class="create-type-sheet__title">自动化</text>
      <text class="create-type-sheet__arrow">›</text>
    </view>
  </view>
  <button class="create-type-sheet__cancel" @tap="closeCreateSheet">取消</button>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import AppSearchBar from '../../components/app-search-bar/app-search-bar.vue';
import EmptyState from '../../components/empty-state/empty-state.vue';
import Loading from '../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { sceneProvider } from '../../providers/scene.provider';
import type { SceneEntity } from '../../domain/entities/scene.entity';
import { ensurePageReady } from '../../utils/page-guard';
import { getSystemInfo } from '../../utils/platform';

function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp * 1000);
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}-${D} ${h}:${m}`;
}

interface SceneView extends SceneEntity {
  lastRunTimeText: string;
}

const scenes = ref<SceneView[]>([]);
const loading = ref(true);
const hasMore = ref(true);
const activeTab = ref(0);
const tabs = ref([
  { label: '全部', type: '' },
  { label: '手动场景', type: 'manual' },
  { label: '自动化', type: 'auto' },
]);
const keyword = ref('');
const createSheetVisible = ref(false);
const unsubscribes: Array<() => void> = [];
let searchTimer: any = null;
const sys = getSystemInfo();
const pageHeight = `calc(100vh - ${(sys.statusBarHeight || 0) + (sys.navBarHeight || 0)}px)`;

onLoad(() => {
  unsubscribes.push(
    sceneProvider.subscribe((s) => {
      scenes.value = s.list.map((item) => ({
        ...item,
        lastRunTimeText: formatTime(item.lastRunTime),
      }));
      loading.value = s.pageState.loading;
      hasMore.value = s.pageState.hasMore;
    }),
  );
});
onShow(async () => {
  const ready = await ensurePageReady('/pages/scene/index');
  if (!ready) {
    loading.value = false;
    return;
  }
  if (unsubscribes.length > 0) sceneProvider.loadFirst();
});
onUnmounted(() => {
  unsubscribes.forEach((fn) => fn());
  if (searchTimer) clearTimeout(searchTimer);
});

function handleTabChange(index: number) {
  const type = tabs.value[index].type;
  activeTab.value = index;
  sceneProvider.setFilter({ type: (type as 'auto' | 'manual') || undefined });
}
function handleSearch(k: string) {
  keyword.value = k;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    sceneProvider.setFilter({ keyword: k || undefined });
  }, 300);
}
function onLoadMore() { sceneProvider.loadMore(); }
function handleSceneTap(id: string) {
  uni.navigateTo({ url: `/packageScene/pages/detail/index?id=${id}` });
}
function handleTrigger(id: string) {
  sceneProvider.trigger(id);
  uni.showToast({ title: '已触发', icon: 'success' });
}
function handleToggleStatus(id: string, status: number) {
  sceneProvider.toggleStatus(id, status);
}
function handleCreate() {
  createSheetVisible.value = true;
}
function closeCreateSheet() {
  createSheetVisible.value = false;
}
function createScene(type: 'manual' | 'auto') {
  createSheetVisible.value = false;
  uni.navigateTo({ url: `/packageScene/pages/create/index?type=${type}` });
}
/* eslint-disable */
// import { sceneProvider } from '../../providers/scene.provider';
// import type { SceneEntity } from '../../domain/entities/scene.entity';
// import { ensurePageReady } from '../../utils/page-guard';
// 
// function formatTime(timestamp: number): string {
//   if (!timestamp) return '';
//   const d = new Date(timestamp * 1000);
//   const M = String(d.getMonth() + 1).padStart(2, '0');
//   const D = String(d.getDate()).padStart(2, '0');
//   const h = String(d.getHours()).padStart(2, '0');
//   const m = String(d.getMinutes()).padStart(2, '0');
//   return `${M}-${D} ${h}:${m}`;
// }
// 
// interface SceneView extends SceneEntity {
//   lastRunTimeText: string;
// }
// 
// Page({
//   data: {
//     scenes: [] as SceneView[],
//     loading: true,
//     hasMore: true,
//     activeTab: 0,
//     tabs: [
//       { label: '全部', type: '' },
//       { label: '手动场景', type: 'manual' },
//       { label: '自动化', type: 'auto' },
//     ],
//     keyword: '',
//     refreshing: false,
//   },
// 
//   unsubscribes: [] as (() => void)[],
//   _searchTimer: null as any,
// 
//   onLoad() {
//     this.unsubscribes.push(
//       sceneProvider.subscribe((s) => {
//         const scenes: SceneView[] = s.list.map((item) => ({
//           ...item,
//           lastRunTimeText: formatTime(item.lastRunTime),
//         }));
//         this.setData({
//           scenes,
//           loading: s.pageState.loading,
//           hasMore: s.pageState.hasMore,
//         });
//       }),
//     );
//   },
// 
//   onUnload() {
//     this.unsubscribes.forEach((fn) => fn());
//     if (this._searchTimer) clearTimeout(this._searchTimer);
//   },
// 
//   async onShow() {
//     const ready = await ensurePageReady('/pages/scene/index');
//     if (!ready) {
//       this.setData({ loading: false, refreshing: false });
//       return;
//     }
//     // 从创建/编辑页返回时刷新列表
//     if (this.unsubscribes.length > 0) {
//       sceneProvider.loadFirst();
//     }
//   },
// 
//   handleTabChange(e: WechatMiniprogram.CustomEvent) {
//     const index = e.currentTarget.dataset.index as number;
//     const type = this.data.tabs[index].type;
//     this.setData({ activeTab: index });
//     sceneProvider.setFilter({ type: (type as 'auto' | 'manual') || undefined });
//   },
// 
//   handleSearch(e: WechatMiniprogram.Input) {
//     const keyword = e.detail.value;
//     this.setData({ keyword });
//     if (this._searchTimer) clearTimeout(this._searchTimer);
//     this._searchTimer = setTimeout(() => {
//       sceneProvider.setFilter({ keyword: keyword || undefined });
//     }, 300);
//   },
// 
//   onRefresh() {
//     this.setData({ refreshing: true });
//     sceneProvider.loadFirst().finally(() => {
//       this.setData({ refreshing: false });
//     });
//   },
// 
//   onLoadMore() {
//     sceneProvider.loadMore();
//   },
// 
//   handleSceneTap(e: WechatMiniprogram.CustomEvent) {
//     const id = e.currentTarget.dataset.id as string;
//     wx.navigateTo({ url: `/packageScene/pages/detail/index?id=${id}` });
//   },
// 
//   handleTrigger(e: WechatMiniprogram.CustomEvent) {
//     const id = e.currentTarget.dataset.id as string;
//     sceneProvider.trigger(id);
//     wx.showToast({ title: '已触发', icon: 'success' });
//   },
// 
//   handleToggleStatus(e: WechatMiniprogram.CustomEvent) {
//     const { id, status } = e.currentTarget.dataset;
//     sceneProvider.toggleStatus(id, status);
//   },
// 
//   handleCreate() {
//     wx.navigateTo({ url: '/packageScene/pages/create/index' });
//   },
// });
// 
</script>

<style lang="scss" scoped>
/* ============================================
   场景列表页样式
   ============================================ */

.scene-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

/* 顶部添加按钮 */
.scene-add-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scene-add-icon {
  font-size: 24px;
  font-weight: 300;
  color: var(--text-primary);
}

.scene-add-btn--hover {
  opacity: 0.5;
}

/* ---- Tab 筛选栏 ---- */
.scene-tabs {
  display: flex;
  padding: 12px 16px 4px;
}

.scene-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  border-radius: var(--radius-full, 9999px);
}

.scene-tab__text {
  font-size: 13px;
  color: var(--text-secondary);
}

.scene-tab--active {
  background: var(--color-primary-light);
}

.scene-tab--active .scene-tab__text {
  color: var(--color-primary);
  font-weight: 500;
}

/* ---- 场景列表 ---- */
.scene-list {
  padding: 8px 16px 0;
}

/* ---- 场景卡片 ---- */
.scene-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  margin-bottom: 10px;
}

.scene-card--hover {
  opacity: 0.7;
}

/* 左侧图标 */
.scene-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.scene-card__icon--manual {
  background: var(--color-primary-light);
}

.scene-card__icon--auto {
  background: var(--color-warning-bg);
}

.scene-card__icon-text {
  color: var(--color-primary);
}

/* 中间信息区 */
.scene-card__info {
  flex: 1;
  min-width: 0;
}

.scene-card__header {
  display: flex;
  align-items: center;
}

.scene-card__name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.scene-card__badge {
  flex-shrink: 0;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: var(--radius-sm, 8px);
}

.scene-card__badge--error {
  background: var(--color-error-bg);
}

.scene-card__badge-text {
  font-size: 10px;
  color: var(--color-error);
}

.scene-card__desc {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-card__meta {
  display: flex;
  align-items: center;
  margin-top: 6px;
}

.scene-card__meta-text {
  font-size: 11px;
  color: var(--text-placeholder);
}

.scene-card__meta-dot {
  margin: 0 4px;
}

/* 右侧操作区 */
.scene-card__action {
  flex-shrink: 0;
  margin-left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 执行按钮 */
.scene-card__trigger {
  padding: 6px 16px;
  background: var(--color-primary);
  border-radius: var(--radius-full, 9999px);
}

.scene-card__trigger--hover {
  opacity: 0.7;
}

.scene-card__trigger-text {
  font-size: 13px;
  color: var(--color-on-primary);
}

/* 自定义开关 */
.scene-switch {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  background: var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 2px;
  transition: background 0.2s;
}

.scene-switch--on {
  background: var(--color-primary);
}

.scene-switch__thumb {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: var(--card-bg);
  transition: margin-left 0.2s;
}

.scene-switch--on .scene-switch__thumb {
  margin-left: 18px;
}

/* ---- 底部提示 ---- */
.scene-end {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.scene-end__text {
  font-size: 13px;
  color: var(--text-placeholder);
}

.scene-list__bottom-space {
  width: 100%;
  height: calc(96px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

/* ---- 浮动添加按钮 ---- */
.scene-fab {
  position: fixed;
  right: 24px;
  bottom: 32px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px var(--color-primary-shadow);
  z-index: 100;
}

.scene-fab--hover {
  opacity: 0.85;
}

.scene-fab__icon {
  color: var(--color-on-primary);
}

.create-sheet-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 180;
  background: var(--color-mask);
}

.create-type-sheet {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 181;
  padding: 16px 12px calc(12px + env(safe-area-inset-bottom));
  border-radius: 18px;
  background: var(--page-bg);
  box-shadow: 0 -8px 28px var(--color-shadow);
  transform: translateY(110%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.create-type-sheet--visible {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.create-type-sheet__heading {
  display: block;
  margin: 0 4px 12px;
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 700;
}

.create-type-sheet__group {
  overflow: hidden;
  border-radius: var(--radius-md, 12px);
  background: var(--card-bg);
}

.create-type-sheet__option {
  min-height: 58px;
  padding: 0 16px 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.create-type-sheet__option:last-child {
  border-bottom: 0;
}

.create-type-sheet__title {
  color: var(--text-primary);
  font-size: 17px;
  font-weight: 700;
}

.create-type-sheet__arrow {
  margin-left: 10px;
  color: var(--text-placeholder);
  font-size: 28px;
  line-height: 1;
}

.create-type-sheet__cancel {
  height: 48px;
  margin-top: 10px;
  border-radius: var(--radius-md, 12px);
  color: var(--text-primary);
  background: var(--card-bg);
  font-size: 16px;
  font-weight: 650;
  line-height: 48px;
}

</style>
