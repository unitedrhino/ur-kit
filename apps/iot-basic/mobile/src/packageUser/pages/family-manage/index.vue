<template>
<app-navigation-bar :title="mode === 'select' ? '选择' + TERM.project : TERM.projectManageTitle" />

<scroll-view
  class="fm-page"
  :style="`height: ${pageHeight};`"
  scroll-y
  type="list"
  refresher-enabled
  :refresher-triggered="refreshing"
  @refresherrefresh="onPullDownRefresh"
  @scrolltolower="handleScrollToLower"
>
  <!-- 搜索栏 -->
  <view class="fm-search">
    <input
      class="fm-search__input"
      :placeholder="`搜索${TERM.project}名称`"
      v-model="searchValue"
      @confirm="handleSearch"
      confirm-type="search"
    />
  </view>

  <!-- 状态筛选 -->
  <view class="fm-filter">
    <text
      :class="`fm-filter__tag ${filterStatus === 0 ? 'fm-filter__tag--active' : ''}`"
      @tap="handleFilterStatus(0)"
    >全部</text>
    <text
      :class="`fm-filter__tag ${filterStatus === 1 ? 'fm-filter__tag--active' : ''}`"
      @tap="handleFilterStatus(1)"
    >{{TERM.statusNormal}}</text>
    <text
      :class="`fm-filter__tag ${filterStatus === 2 ? 'fm-filter__tag--active' : ''}`"
      @tap="handleFilterStatus(2)"
    >{{TERM.statusDisabled}}</text>
  </view>

  <!-- 列表 -->
  <loading v-if="loading && projects.length === 0" text="加载中..." />

  <template v-else-if="projects.length > 0">
    <view
      v-for="(item, index) in projects" :key="item.projectID"
      :class="`fm-card ${item.projectID === currentFamilyID ? 'fm-card--current' : ''}`"
    >
      <view class="fm-card__body" @tap="handleSwitchFamily(item)">
        <view class="fm-card__header">
          <text class="fm-card__name">{{item.projectName}}</text>
          <text v-if="item.projectID === currentFamilyID" class="fm-card__badge">当前</text>
          <text v-if="item.status === 2" class="fm-card__status--disabled">{{TERM.statusDisabled}}</text>
        </view>
        <view class="fm-card__stats">
          <text class="fm-card__stat">{{TERM.area}} {{item.areaCount}}</text>
          <text class="fm-card__stat">设备 {{item.deviceCount}}</text>
        </view>
      </view>
      <view v-if="mode === 'manage'" class="fm-card__actions">
        <view class="fm-card__action" @tap.stop="handleRoomManage(item)">
          <text>{{TERM.area}}</text>
        </view>
        <view class="fm-card__action" @tap.stop="handleEdit(item)">
          <text>编辑</text>
        </view>
        <view class="fm-card__action fm-card__action--danger" @tap.stop="handleDelete(item)">
          <text>删除</text>
        </view>
      </view>
    </view>
  </template>

  <empty-state v-else :text="TERM.projectEmptyText" :buttonText="TERM.projectCreateTitle" @action="handleCreate" />

  <view v-if="loading && projects.length > 0" class="fm-loading-more">
    <loading text="加载更多..." />
  </view>

  <view class="fm-bottom-spacer" :style="`height: ${bottomSpacerHeight}px;`"></view>
</scroll-view>

<!-- 新建按钮（列表不为空时显示） -->
<view v-if="projects.length > 0" class="fm-fab" @tap="handleCreate" hover-class="fm-fab--hover">
  <app-icon class="fm-fab__icon" name="tabler:plus" :size="28" color="var(--color-on-primary)" />
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { projectProvider, type ProjectListState } from '../../../providers/project.provider'
import { currentFamilyProvider, type CurrentFamilyState } from '../../../providers/current-family.provider'
import { authProvider } from '../../../providers/auth.provider'
import { tenantProvider } from '../../../providers/tenant.provider'
import { TERM } from '../../../config/terminology'
import type { ProjectEntity } from '../../../domain/entities/project.entity'
import { getSystemInfo } from '../../../utils/platform'
import { suggestFamilyName } from '../../../utils/family-name'
import { appContextProvider } from '../../../providers/app-context.provider'

const mode = ref<'manage' | 'select'>('manage')
const projects = ref<ProjectEntity[]>([])
const loading = ref(true)
const refreshing = ref(false)
const hasMore = ref(true)
const currentFamilyID = ref('')
const searchValue = ref('')
const filterStatus = ref(0)
const pageHeight = ref('100vh')
const bottomSpacerHeight = ref(120)
const unsubscribes: Array<() => void> = []

onLoad((options: Record<string, string | undefined> = {}) => {
  const m = options.mode === 'select' ? 'select' : 'manage'
  const sys = getSystemInfo()
  const navHeight = (sys.statusBarHeight || 0) + (sys.navBarHeight || 0)
  mode.value = m
  pageHeight.value = `calc(100vh - ${navHeight}px)`
  bottomSpacerHeight.value = 96 + (sys.safeAreaBottom || 0)
  unsubscribes.push(
    projectProvider.subscribe((s: ProjectListState) => {
      projects.value = s.list
      loading.value = s.pageState.loading
      hasMore.value = s.pageState.hasMore
    }),
    currentFamilyProvider.subscribe((s: CurrentFamilyState) => {
      currentFamilyID.value = s.projectID
    })
  )
  const cur = currentFamilyProvider.getState()
  currentFamilyID.value = cur.projectID
  const projectState = projectProvider.getState()
  projects.value = projectState.list
  loading.value = projectState.pageState.loading
  hasMore.value = projectState.pageState.hasMore
  projectProvider.loadFirst()
})

onShow(() => { projectProvider.loadFirst() })
onUnload(() => { unsubscribes.forEach(fn => fn()) })
onUnmounted(() => { unsubscribes.forEach(fn => fn()) })

function onPullDownRefresh() {
  refreshing.value = true
  projectProvider.loadFirst().finally(() => { refreshing.value = false })
}

function handleScrollToLower() { projectProvider.loadMore() }

function handleSearch() {
  projectProvider.setFilter(searchValue.value, filterStatus.value)
  projectProvider.loadFirst()
}

function handleFilterStatus(status: number) {
  filterStatus.value = status
  projectProvider.setFilter(searchValue.value, status)
  projectProvider.loadFirst()
}

function handleCreate() {
  const authState = authProvider.getState()
  const tenantState = tenantProvider.getState()
  const suggestedName = suggestFamilyName({
    nickName: authState.user?.nickName,
    tenantName: tenantState.current?.name,
    existingNames: projects.value.map(p => p.projectName),
  })
  uni.navigateTo({ url: `/packageUser/pages/family-edit/index?mode=${mode.value}&suggestedName=${encodeURIComponent(suggestedName)}` })
}

function handleEdit(item: ProjectEntity) {
  uni.navigateTo({ url: `/packageUser/pages/family-edit/index?projectID=${item.projectID}&projectName=${encodeURIComponent(item.projectName)}` })
}

async function handleDelete(item: ProjectEntity) {
  if (projects.value.length <= 1) { uni.showToast({ title: TERM.projectDeleteLastMsg, icon: 'none', duration: 2500 }); return }
  if (item.deviceCount > 0) { uni.showToast({ title: TERM.projectDeleteBlockDeviceMsg, icon: 'none', duration: 2500 }); return }
  if (item.areaCount > 0) { uni.showToast({ title: TERM.projectDeleteBlockMsg, icon: 'none', duration: 2500 }); return }
  const { confirm } = await uni.showModal({ title: '提示', content: TERM.projectDeleteConfirmMsg })
  if (!confirm) return
  try {
    await projectProvider.deleteProject(item.projectID)
    if (currentFamilyProvider.getState().projectID === item.projectID) {
      const remaining = projects.value.filter(p => p.projectID !== item.projectID)
      if (remaining.length > 0) currentFamilyProvider.switchFamily(remaining[0].projectID, remaining[0].projectName)
      else currentFamilyProvider.clear()
    }
    uni.showToast({ title: '已删除', icon: 'success' })
  } catch (err: unknown) {
    uni.showToast({ title: (err as Error).message || '删除失败', icon: 'none' })
  }
}

function handleSwitchFamily(item: ProjectEntity) {
  currentFamilyProvider.switchFamily(item.projectID, item.projectName)
  if (mode.value === 'select') { appContextProvider.resumePendingRoute('/pages/home/index'); return }
  uni.showToast({ title: `已切换到${item.projectName}`, icon: 'success' })
}

function handleRoomManage(item: ProjectEntity) {
  uni.navigateTo({ url: `/packageUser/pages/room-manage/index?projectID=${item.projectID}&projectName=${encodeURIComponent(item.projectName)}` })
}
</script>

<style lang="scss" scoped>
.fm-page {
  background: var(--page-bg);
}

.fm-bottom-spacer {
  width: 100%;
  flex-shrink: 0;
}

/* 搜索 */
.fm-search {
  padding: 12px 16px 0;
}
.fm-search__input {
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text-primary);
}

/* 状态筛选 */
.fm-filter {
  display: flex;
  padding: 10px 16px;
  gap: 8px;
}
.fm-filter__tag {
  padding: 4px 14px;
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--card-bg);
}
.fm-filter__tag--active {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

/* 卡片 */
.fm-card {
  margin: 8px 16px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
  overflow: hidden;
}
.fm-card--current {
  border-left: 4px solid var(--color-primary);
}
.fm-card__body {
  padding: 14px 16px 10px;
}
.fm-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fm-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}
.fm-card__badge {
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: 10px;
}
.fm-card__status--disabled {
  font-size: 11px;
  color: var(--color-danger);
  background: var(--color-error-bg);
  padding: 2px 8px;
  border-radius: 10px;
}
.fm-card__stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
.fm-card__stat {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 操作栏 */
.fm-card__actions {
  display: flex;
  border-top: 1rpx solid var(--divider);
}
.fm-card__action {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--color-primary);
  border-right: 1rpx solid var(--divider);
}
.fm-card__action:last-child {
  border-right: none;
}
.fm-card__action--danger {
  color: var(--color-danger);
}

/* FAB */
.fm-fab {
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
.fm-fab--hover {
  opacity: 0.8;
}
.fm-fab__icon {
  color: var(--color-on-primary);
}

/* 加载更多 */
.fm-loading-more {
  padding: 16px 0;
  display: flex;
  justify-content: center;
}

</style>
