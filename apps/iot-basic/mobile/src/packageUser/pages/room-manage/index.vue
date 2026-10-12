<template>
<app-navigation-bar :title="`${projectName} - ${TERM.areaManageTitle}`" />

<scroll-view
  class="rm-page"
  scroll-y
  type="list"
  refresher-enabled
  @refresherrefresh="onPullDownRefresh"
  @scrolltolower="handleScrollToLower"
>
  <!-- 搜索栏 -->
  <view class="rm-search">
    <input
      class="rm-search__input"
      :placeholder="`搜索${TERM.area}名称`"
      v-model="searchValue"
      @confirm="handleSearch"
      confirm-type="search"
    />
  </view>

  <!-- 列表 -->
  <loading v-if="loading && areas.length === 0" text="加载中..." />

  <template v-else-if="areas.length > 0">
    <view
      v-for="(item, index) in areas" :key="item.areaID"
      class="rm-card"
    >
      <view class="rm-card__body">
        <view class="rm-card__header">
          <app-icon class="rm-card__icon" :name="normalizeAreaIcon(item.areaImg)" :size="'40rpx'" />
          <text class="rm-card__name">{{item.areaName}}</text>
        </view>
        <view class="rm-card__stats">
          <text class="rm-card__stat">设备 {{item.deviceCount}}</text>
        </view>
      </view>
      <view class="rm-card__actions">
        <view class="rm-card__action" @tap.stop="handleEdit(item)">
          <text>编辑</text>
        </view>
        <view class="rm-card__action rm-card__action--danger" @tap.stop="handleDelete(item)">
          <text>删除</text>
        </view>
      </view>
    </view>
  </template>

  <empty-state v-else :text="TERM.areaEmptyText" :buttonText="TERM.areaCreateTitle" @action="handleCreate" />

  <view v-if="loading && areas.length > 0" class="rm-loading-more">
    <loading text="加载更多..." />
  </view>

  <view class="rm-bottom-spacer"></view>
</scroll-view>

<!-- FAB（列表不为空时显示） -->
<view v-if="areas.length > 0" class="rm-fab" @tap="handleCreate" hover-class="rm-fab--hover">
  <app-icon class="rm-fab__icon" name="tabler:plus" :size="28" color="var(--color-on-primary)" />
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { areaProvider, type AreaListState } from '../../../providers/area.provider'
import { TERM } from '../../../config/terminology'
import { normalizeAreaIcon } from '../../../config/area-icons'
import type { AreaEntity } from '../../../domain/entities/area.entity'
import { ensurePageReady } from '../../../utils/page-guard'

const projectID = ref('')
const projectName = ref('')
const areas = ref<AreaEntity[]>([])
const loading = ref(true)
const hasMore = ref(true)
const searchValue = ref('')
const unsubscribes: Array<() => void> = []

onLoad(async (options: Record<string, string | undefined> = {}) => {
  const ready = await ensurePageReady('/packageUser/pages/room-manage/index', options)
  if (!ready) { loading.value = false; return }
  const pid = options.projectID || ''
  const pname = decodeURIComponent(options.projectName || '')
  projectID.value = pid
  projectName.value = pname
  unsubscribes.push(
    areaProvider.subscribe((s: AreaListState) => {
      areas.value = s.list
      loading.value = s.pageState.loading
      hasMore.value = s.pageState.hasMore
    })
  )
  areaProvider.setProjectID(pid)
  areaProvider.loadFirst()
})

onShow(() => {
  if (projectID.value) areaProvider.loadFirst()
})

onUnload(() => { unsubscribes.forEach(fn => fn()) })
onUnmounted(() => { unsubscribes.forEach(fn => fn()) })

function onPullDownRefresh() {
  areaProvider.loadFirst().then(() => uni.stopPullDownRefresh(), () => uni.stopPullDownRefresh())
}

function handleScrollToLower() { areaProvider.loadMore() }

function handleSearch() {
  areaProvider.setFilter(searchValue.value)
  areaProvider.loadFirst()
}

function handleCreate() {
  uni.navigateTo({ url: `/packageUser/pages/room-edit/index?projectID=${projectID.value}` })
}

function handleEdit(item: AreaEntity) {
  uni.navigateTo({ url: `/packageUser/pages/room-edit/index?projectID=${projectID.value}&areaID=${item.areaID}&areaName=${encodeURIComponent(item.areaName)}` })
}

async function handleDelete(item: AreaEntity) {
  if (item.deviceCount > 0) {
    uni.showToast({ title: TERM.areaDeleteBlockMsg, icon: 'none', duration: 2500 })
    return
  }
  const { confirm } = await uni.showModal({ title: '提示', content: TERM.areaDeleteConfirmMsg })
  if (!confirm) return
  try {
    await areaProvider.deleteArea(item.areaID)
    uni.showToast({ title: '已删除', icon: 'success' })
  } catch (err: unknown) {
    uni.showToast({ title: (err as Error).message || '删除失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.rm-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.rm-bottom-spacer {
  width: 100%;
  height: calc(96px + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

.rm-search {
  padding: 12px 16px 0;
}
.rm-search__input {
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text-primary);
}

.rm-card {
  margin: 8px 16px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
}
.rm-card__body {
  padding: 14px 16px 10px;
}
.rm-card__header {
  display: flex;
  align-items: center;
}
.rm-card__icon {
  color: var(--text-primary);
  margin-right: 8px;
}
.rm-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}
.rm-card__stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
.rm-card__stat {
  font-size: 13px;
  color: var(--text-secondary);
}

.rm-card__actions {
  display: flex;
  border-top: 1rpx solid var(--divider);
}
.rm-card__action {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-primary);
  border-right: 1rpx solid var(--divider);
}
.rm-card__action:last-child {
  border-right: none;
}
.rm-card__action--danger {
  color: var(--color-danger);
}

/* FAB */
.rm-fab {
  position: fixed;
  right: 24px;
  bottom: calc(32px + env(safe-area-inset-bottom));
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--color-primary-shadow);
}
.rm-fab--hover {
  opacity: 0.8;
}
.rm-fab__icon {
  color: var(--color-on-primary);
}

.rm-loading-more {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

</style>
