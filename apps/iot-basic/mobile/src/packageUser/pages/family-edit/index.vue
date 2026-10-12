<template>
<app-navigation-bar :title="title" />

<scroll-view class="fe-body" scroll-y type="list" :show-scrollbar="false">
  <view class="fe-form">
    <view v-if="source === 'guard' && !editingID && !singleTenantMode" class="fe-helper">
      <text class="fe-helper__text">当前组织不合适？</text>
      <text class="fe-helper__link" @tap="handleSwitchTenant">切换组织</text>
    </view>

    <view class="fe-field">
      <text class="fe-field__label">{{TERM.project}}名称</text>
      <input
        class="fe-field__input"
        :value="name"
        :placeholder="`请输入${TERM.project}名称`"
        maxlength="30"
        :focus="true"
        @blur="handleNameBlur"
      />
    </view>

    <view v-if="!editingID" class="fe-location">
      <view class="fe-location__head" @tap="handleToggleFamilyLocation" hover-class="fe-location__head--hover">
        <view :class="`fe-location__check ${familyLocationChecked ? 'fe-location__check--active' : ''}`">
          <app-icon v-if="familyLocationChecked" name="tabler:check" :size="'24rpx'" color="var(--color-on-primary)" />
        </view>
        <view class="fe-location__main">
          <text class="fe-location__title">{{TERM.project}}位置</text>
          <text class="fe-location__desc">默认使用当前位置，便于后续管理设备所在地点。</text>
        </view>
      </view>
      <view v-if="familyLocationChecked" class="fe-location__panel">
        <text class="fe-location__value">{{familyLocationText}}</text>
        <text v-if="familyLocationError" class="fe-location__error">{{familyLocationError}}</text>
        <view class="fe-location__actions">
          <view class="fe-location__btn" @tap="handleFetchFamilyLocation" hover-class="fe-location__btn--hover">
            <loading v-if="familyLocationLoading" :size="16" color="var(--color-primary)" />
            <text v-else class="fe-location__btn-text">{{familyLocation ? '重新获取' : '获取当前位置'}}</text>
          </view>
          <view class="fe-location__btn fe-location__btn--ghost" @tap="handleSkipFamilyLocation" hover-class="fe-location__btn--hover">
            <text class="fe-location__btn-text fe-location__btn-text--ghost">手动跳过</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</scroll-view>

<view class="fe-footer">
  <view
    :class="`fe-btn fe-btn--primary ${submitting ? 'fe-btn--disabled' : ''}`"
    @tap="handleSubmitTap"
    hover-class="fe-btn--hover"
  >
    <text>{{submitting ? '保存中...' : '保存'}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectProvider } from '../../../providers/project.provider'
import { currentFamilyProvider } from '../../../providers/current-family.provider'
import { TERM } from '../../../config/terminology'
import { config } from '../../../config'
import { appContextProvider } from '../../../providers/app-context.provider'
import { locationService } from '../../../services/location.service'
import { formatGeoPoint, LocationError, type GeoPoint } from '../../../domain/models/location.model'

const mode = ref<'manage' | 'select'>('manage')
const source = ref<'' | 'guard'>('')
const title = ref('')
const editingID = ref('')
const name = ref('')
const submitting = ref(false)
const familyLocationChecked = ref(true)
const familyLocation = ref<GeoPoint | null>(null)
const familyLocationText = ref('尚未获取当前位置')
const familyLocationError = ref('')
const familyLocationLoading = ref(false)
const singleTenantMode = config.tenantMode === 'single'

onLoad((options: Record<string, string | undefined> = {}) => {
  const m = options.mode === 'select' ? 'select' : 'manage'
  const s = options.source === 'guard' ? 'guard' : ''
  const id = options.projectID || ''
  const origName = decodeURIComponent(options.projectName || '')
  const suggestedName = decodeURIComponent(options.suggestedName || '')
  mode.value = m
  source.value = s as '' | 'guard'
  editingID.value = id
  name.value = origName || suggestedName
  title.value = id ? TERM.projectEditTitle : TERM.projectCreateTitle
})

/** 名称输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于保存按钮 tap，保存处拿到最新值 */
function handleNameBlur(e: any) { name.value = e.detail.value }

function handleSwitchTenant() {
  if (singleTenantMode) {
    uni.switchTab({ url: '/pages/home/index' })
    return
  }
  uni.navigateTo({ url: '/packageUser/pages/tenant-manage/index?mode=select' })
}

function syncFamilyLocationText() {
  familyLocationText.value = familyLocation.value
    ? `已获取当前位置：${formatGeoPoint(familyLocation.value)}`
    : '尚未获取当前位置'
}

function handleToggleFamilyLocation() {
  familyLocationChecked.value = !familyLocationChecked.value
  if (!familyLocationChecked.value) familyLocationError.value = ''
}

function handleSkipFamilyLocation() {
  familyLocationChecked.value = false
  familyLocationError.value = ''
}

function handleSubmitTap() {
  if (submitting.value) return
  void handleSubmit()
}

function promptFamilyLocationSetting() {
  uni.showModal({
    title: '开启定位权限',
    content: `开启后可将当前位置保存为${TERM.project}位置。`,
    confirmText: '去开启',
    cancelText: '稍后',
    success: (res) => {
      if (!res.confirm) return
      uni.openSetting({
        success: (setting) => {
          if (setting.authSetting['scope.userLocation'] === true) void handleFetchFamilyLocation()
        },
      })
    },
  })
}

async function handleFetchFamilyLocation(): Promise<boolean> {
  if (familyLocationLoading.value) return !!familyLocation.value
  familyLocationLoading.value = true
  familyLocationError.value = ''
  try {
    familyLocation.value = await locationService.getCurrentLocation()
    syncFamilyLocationText()
    return true
  } catch (err) {
    familyLocation.value = null
    syncFamilyLocationText()
    if (err instanceof LocationError && err.code === 'LOCATION_PERMISSION_DENIED') {
      familyLocationError.value = '定位权限未开启，允许后可保存当前位置。'
      promptFamilyLocationSetting()
    } else {
      familyLocationError.value = (err as Error).message || '暂时无法获取当前位置'
    }
    return false
  } finally {
    familyLocationLoading.value = false
  }
}

async function handleSubmit() {
  const n = (name.value || '').trim()
  if (!n) { uni.showToast({ title: `请输入${TERM.project}名称`, icon: 'none' }); return }
  if (submitting.value) return
  submitting.value = true
  try {
    if (editingID.value) {
      await projectProvider.updateProject({ projectID: editingID.value, projectName: n })
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      if (familyLocationChecked.value && !familyLocation.value) {
        const ok = await handleFetchFamilyLocation()
        if (!ok) {
          familyLocationChecked.value = false
          uni.showToast({ title: '定位失败，已不带位置创建', icon: 'none' })
        }
      }
      const projectID = await projectProvider.createProject({
        projectName: n,
        position: familyLocationChecked.value && familyLocation.value ? familyLocation.value : undefined,
      })
      currentFamilyProvider.switchFamily(projectID, n)
      uni.showToast({ title: '已创建', icon: 'success' })
      if (mode.value === 'select' || source.value === 'guard') {
        // 守卫页由 redirectTo 进入，创建首个家庭后需要恢复原目标路由。
        setTimeout(() => appContextProvider.resumePendingRoute('/pages/home/index'), 500)
        return
      }
    }
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500)
  } catch (err: unknown) {
    uni.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.fe-body {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.fe-form {
  margin: 24rpx 32rpx 0;
  background: var(--card-bg);
  border-radius: 24rpx;
  padding: 8rpx 32rpx;
}

.fe-helper {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  padding: 24rpx 0 8rpx;
}

.fe-helper__text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.fe-helper__link {
  font-size: 24rpx;
  color: var(--color-primary);
}

.fe-field {
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
}

.fe-location {
  padding: 24rpx 0 28rpx;
  border-top: 1rpx solid var(--border-color);
}

.fe-location__head {
  display: flex;
  align-items: flex-start;
}

.fe-location__head--hover {
  opacity: 0.72;
}

.fe-location__check {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-top: 4rpx;
  border-radius: 18rpx;
  border: 1rpx solid var(--border-color);
}

.fe-location__check--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.fe-location__main {
  flex: 1;
  min-width: 0;
  margin-left: 16rpx;
}

.fe-location__title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.fe-location__desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-secondary);
}

.fe-location__panel {
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: var(--color-bg-secondary);
}

.fe-location__value {
  display: block;
  font-size: 26rpx;
  line-height: 1.5;
  color: var(--text-primary);
}

.fe-location__error {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--color-warning);
}

.fe-location__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

.fe-location__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 72rpx;
  border-radius: 18rpx;
  background: var(--color-primary-light);
}

.fe-location__btn--ghost {
  background: var(--card-bg);
}

.fe-location__btn--hover {
  opacity: 0.72;
}

.fe-location__btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-primary);
}

.fe-location__btn-text--ghost {
  color: var(--text-secondary);
}

.fe-field__label {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 16rpx;
}

.fe-field__input {
  font-size: 30rpx;
  color: var(--text-primary);
  padding: 16rpx 0;
}

.fe-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--divider);
}

.fe-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.fe-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.fe-btn--hover {
  opacity: 0.85;
}

.fe-btn--disabled {
  opacity: 0.5;
}

</style>
