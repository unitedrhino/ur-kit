<template>
<app-navigation-bar :title="title" :back="mode !== 'select'" />

<scroll-view
  class="tm-page"
  :style="`height: ${pageHeight};`"
  scroll-y
  type="list"
>
  <view class="tm-header">
    <text class="tm-header__title">{{mode === 'select' ? '请选择一个组织继续' : '我的组织'}}</text>
    <text v-if="!singleTenantMode" class="tm-header__desc">只展示你已经加入的组织，也可以通过邀请码加入</text>
  </view>

  <view v-if="!singleTenantMode" class="tm-toolbar">
    <view class="tm-toolbar__btn tm-toolbar__btn--primary" @tap="handleJoin">
      <text>输入邀请码加入</text>
    </view>
  </view>

  <loading v-if="loading && tenants.length === 0" text="加载中..." />

  <template v-else-if="tenants.length > 0">
    <view
      v-for="(item, index) in tenants" :key="item.code"
      :class="`tm-card ${item.code === currentTenantCode ? 'tm-card--current' : ''}`"
      @tap="handleSwitchTenant(item)"
    >
      <view class="tm-card__body">
        <view class="tm-card__header">
          <text class="tm-card__name">{{item.name}}</text>
          <text v-if="item.code === currentTenantCode" class="tm-card__badge">当前</text>
          <text v-if="item.isOwner" class="tm-card__badge tm-card__badge--ghost">拥有者</text>
        </view>
        <text class="tm-card__code">{{item.code}}</text>
        <text class="tm-card__desc">{{item.desc || '暂无描述'}}</text>
      </view>
    </view>
  </template>

  <empty-state v-else text="暂无可用组织" />

  <view class="tm-bottom-spacer" :style="`height: ${bottomSpacerHeight}px;`"></view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { tenantProvider, type TenantState } from '../../../providers/tenant.provider'
import { appContextProvider } from '../../../providers/app-context.provider'
import type { TenantEntity } from '../../../domain/entities/tenant.entity'
import { getSystemInfo } from '../../../utils/platform'
import { parseInviteTenantCode } from '../../../utils/tenant-source'
import { config } from '../../../config'

const mode = ref<'manage' | 'select'>('manage')
const title = ref('组织管理')
const tenants = ref<TenantEntity[]>([])
const loading = ref(true)
const currentTenantCode = ref('')
const pageHeight = ref('100vh')
const bottomSpacerHeight = ref(120)
const singleTenantMode = config.tenantMode === 'single'
const unsubscribes: Array<() => void> = []

onLoad((options: Record<string, string | undefined> = {}) => {
  if (singleTenantMode) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  const m = options.mode === 'select' ? 'select' : 'manage'
  const sys = getSystemInfo()
  const navHeight = (sys.statusBarHeight || 0) + (sys.navBarHeight || 0)
  mode.value = m
  title.value = m === 'select' ? '选择组织' : '组织管理'
  pageHeight.value = `calc(100vh - ${navHeight}px)`
  bottomSpacerHeight.value = 96 + (sys.safeAreaBottom || 0)
  unsubscribes.push(
    tenantProvider.subscribe((state: TenantState) => {
      tenants.value = state.list
      loading.value = state.loading
      currentTenantCode.value = state.current?.code || ''
    })
  )
  const state = tenantProvider.getState()
  tenants.value = state.list
  loading.value = state.loading
  currentTenantCode.value = state.current?.code || ''
  tenantProvider.loadTenants()
})

onShow(() => {
  if (singleTenantMode) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  tenantProvider.loadTenants()
})
onUnload(() => { unsubscribes.forEach(fn => fn()) })
onUnmounted(() => { unsubscribes.forEach(fn => fn()) })

async function handleSwitchTenant(item: TenantEntity) {
  if (!item?.code || item.code === currentTenantCode.value) return
  if (!tenantProvider.switchTenant(item.code)) return
  if (mode.value === 'select') {
    await appContextProvider.continueAfterLogin('/pages/home/index')
    return
  }
  uni.showToast({ title: `已切换到${item.name}`, icon: 'success' })
}

async function handleJoin() {
  if (singleTenantMode) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  try {
    const result = await uni.showModal({ title: '加入组织', editable: true, placeholderText: '请输入邀请码' })
    const inviteCode = (result.content || '').trim()
    if (!result.confirm || !inviteCode) return
    await tenantProvider.joinTenantByInviteCode(inviteCode)
    const tenantCode = parseInviteTenantCode(inviteCode)
    if (tenantCode) {
      tenantProvider.switchTenant(tenantCode)
    }
    uni.showToast({ title: '加入成功', icon: 'success' })
    if (mode.value === 'select') await appContextProvider.continueAfterLogin('/pages/home/index')
  } catch (error) {
    uni.showToast({ title: (error as Error).message || '加入失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-secondary);
}

.tm-page {
  box-sizing: border-box;
  padding: 24rpx;
}

.tm-header {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx 8rpx 24rpx;
}

.tm-header__title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.tm-header__desc {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.tm-toolbar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tm-toolbar__btn {
  flex: 1;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 500;
}

.tm-toolbar__btn--ghost {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 2rpx solid var(--border-color);
}

.tm-toolbar__btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.tm-card {
  background: var(--card-bg);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
}

.tm-card--current {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2rpx var(--color-primary-light);
}

.tm-card__body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tm-card__header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.tm-card__name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.tm-card__badge {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 20rpx;
}

.tm-card__badge--ghost {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.tm-card__code {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.tm-card__desc {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.tm-card__actions {
  display: flex;
  gap: 24rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid var(--color-bg-secondary);
}

.tm-card__action {
  min-width: 96rpx;
  min-height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: var(--color-primary);
}

.tm-card__action--danger {
  color: var(--color-error);
}

.tm-bottom-spacer {
  width: 100%;
}

</style>
