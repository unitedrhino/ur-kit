<template>
<app-navigation-bar :title="changingNetwork ? '更换 Wi-Fi' : '一键配网'" />

<scroll-view class="result-page" scroll-y type="list">
  <view :class="`result-card result-card--${resultStatus}`">
    <view class="result-icon"><app-icon class="result-icon__text" :name="success ? 'tabler:circle-check' : failure ? 'tabler:circle-x' : 'tabler:loader-2'" :size="34" /></view>
    <text class="result-title">{{title}}</text>
    <text class="result-message">{{message}}</text>
    <text v-if="locationWarning" class="result-warning">{{locationWarning}}</text>
    <view v-if="success && boundDeviceName && !changingNetwork" class="device-location-prompt" @tap="handleToggleDeviceLocation" hover-class="device-location-prompt--hover">
      <view :class="`device-location-check ${deviceLocationChecked ? 'device-location-check--active' : ''}`">
        <app-icon v-if="deviceLocationChecked" name="tabler:check" :size="12" color="var(--color-on-primary)" />
      </view>
      <text class="device-location-prompt__text">保存设备安装位置</text>
    </view>
  </view>

  <view v-if="failure" class="tips-card">
    <text class="tips-card__title">你可以尝试</text>
    <text class="tips-card__item">1. 检查设备是否处于配网模式</text>
    <text class="tips-card__item">2. 检查 WiFi 密码是否正确</text>
    <text class="tips-card__item">3. 确认手机和设备靠近路由器</text>
  </view>
</scroll-view>

<view class="footer">
  <template v-if="success">
    <view class="primary-btn" @tap="handleDone" hover-class="primary-btn--hover">
      <text class="primary-btn__text">完成</text>
    </view>
  </template>
  <template v-else-if="failure">
    <view class="primary-btn" @tap="handleRetry" hover-class="primary-btn--hover">
      <text class="primary-btn__text">{{changingNetwork ? '重新开启换网' : '重试'}}</text>
    </view>
    <view class="ghost-btn" @tap="handleBackWifi" hover-class="ghost-btn--hover">
      <text class="ghost-btn__text">返回上一步</text>
    </view>
  </template>
  <template v-else>
    <view class="ghost-btn" @tap="handleBackWifi" hover-class="ghost-btn--hover">
      <text class="ghost-btn__text">返回上一步</text>
    </view>
  </template>
</view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { computed, ref, onUnmounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { provisionProvider, type ProvisionProviderState } from '../../../providers/provision.provider'
import { ensurePageReady } from '../../../utils/page-guard'
import type { ProvisionFailure } from '../../../domain/models/provision-failure.model'
import { locationService } from '../../../services/location.service'
import { deviceService } from '../../../services/device.service'

const initialState = provisionProvider.getState()
/** 换网不得顺带修改安装位置等设备资料。 */
const changingNetwork = ref(initialState.mode === 'changeNetwork')
const success = ref(initialState.result.success)
const title = ref(initialState.result.title)
const message = ref(initialState.result.message)
const locationWarning = ref(initialState.result.locationWarning)
const failure = ref<ProvisionFailure | null>(initialState.result.failure)
const loading = ref(false)
const deviceLocationChecked = ref(true)
const boundProductID = ref(initialState.result.boundDevice?.productID || '')
const boundDeviceName = ref(initialState.result.boundDevice?.deviceName || '')
const unsubscribes: Array<() => void> = []
const resultStatus = computed(() => {
  if (success.value) return 'success'
  if (failure.value) return 'failed'
  return 'pending'
})

// syncResultState 将结果页首屏和后续订阅统一到同一份配网状态，避免成功页短暂露出失败态。
function syncResultState(state: ProvisionProviderState) {
  changingNetwork.value = state.mode === 'changeNetwork'
  success.value = state.result.success
  title.value = state.result.title
  message.value = state.result.message
  locationWarning.value = state.result.locationWarning
  failure.value = state.result.failure
  boundProductID.value = state.result.boundDevice?.productID || ''
  boundDeviceName.value = state.result.boundDevice?.deviceName || ''
}

onLoad(async () => {
  const ready = await ensurePageReady('/packageBluetooth/pages/result/index')
  if (!ready) return
  syncResultState(provisionProvider.getState())
  unsubscribes.push(provisionProvider.subscribe(syncResultState))
})

onUnload(() => { unsubscribes.forEach(fn => fn()) })
onUnmounted(() => { unsubscribes.forEach(fn => fn()) })

function handleRetry() {
  handleBackWifi()
}

/** 换网失败必须重新开启设备窗口，不能复用已失败的请求 ID。 */
function handleBackWifi() {
  if (changingNetwork.value) {
    const target = provisionProvider.getState().networkTarget
    provisionProvider.cancel('RESTART_NETWORK_CHANGE')
    if (target) {
      uni.redirectTo({ url: '/packageDevice/pages/settings/index?productID=' + encodeURIComponent(target.productID) + '&deviceName=' + encodeURIComponent(target.deviceName) })
    } else {
      uni.switchTab({ url: '/pages/device/index' })
    }
    return
  }
  uni.redirectTo({ url: '/packageBluetooth/pages/wifi/index' })
}
function handleToggleDeviceLocation() { deviceLocationChecked.value = !deviceLocationChecked.value }

async function handleSaveDeviceLocation() {
  if (changingNetwork.value) return
  if (!deviceLocationChecked.value || !boundProductID.value || !boundDeviceName.value) return
  const position = await locationService.getCurrentLocation()
  await deviceService.update({
    productID: boundProductID.value,
    deviceName: boundDeviceName.value,
    position,
  })
}

async function handleDone() {
  if (loading.value) return
  loading.value = true
  try {
    await handleSaveDeviceLocation()
  } catch {
    locationWarning.value = '设备已绑定，位置保存失败，可稍后在设备设置中补录'
    uni.showToast({ title: '位置保存失败，可稍后补录', icon: 'none' })
  } finally {
    loading.value = false
    setTimeout(() => uni.switchTab({ url: '/pages/device/index' }), locationWarning.value ? 600 : 0)
  }
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageBluetooth/pages/result/index', () => [
  ...(success.value ? [{ id: 'done', label: '完成', role: 'button' as const, enabled: !loading.value, tap: handleDone }] : [
    { id: 'back', label: '返回上一步', role: 'button' as const, enabled: !loading.value, tap: handleBackWifi },
    ...(failure.value ? [{ id: 'retry', label: '重试', role: 'button' as const, enabled: !loading.value, tap: handleRetry }] : []),
  ]),
], () => ({ success: success.value, title: title.value, mode: changingNetwork.value ? 'changeNetwork' : 'bind' }));
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.result-page {
  flex: 1;
  min-height: 0;
  overflow-y: hidden;
  padding: 16px;
  margin-bottom: calc(210rpx + env(safe-area-inset-bottom));
}

.result-card,
.tips-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px 20px;
}

.result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 36px;
  margin-bottom: 18px;
}

.result-card--success .result-icon {
  background: var(--color-success-bg);
}

.result-card--failed .result-icon {
  background: var(--color-error-bg);
}

.result-card--pending .result-icon {
  background: var(--color-primary-light);
}

.result-icon__text {
  color: var(--color-success);
}

.result-card--failed .result-icon__text {
  color: var(--color-error);
}

.result-card--pending .result-icon__text {
  color: var(--color-primary);
}

.result-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.result-message {
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.result-code {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.result-warning {
  margin-top: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-warning-bg);
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-warning);
}

.device-location-prompt {
  display: flex;
  align-items: center;
  margin-top: 14px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--color-bg-secondary);
}

.device-location-prompt--hover {
  opacity: 0.72;
}

.device-location-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  border: 1px solid var(--border-color);
}

.device-location-check--active {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.device-location-prompt__text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.tips-card {
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
}

.tips-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.tips-card__item {
  font-size: 13px;
  color: var(--text-secondary);
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--card-bg);
}

.primary-btn,
.ghost-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  border-radius: 14px;
}

.primary-btn {
  background: var(--color-primary);
}

.ghost-btn {
  background: var(--color-bg-secondary);
}

.primary-btn--hover,
.ghost-btn--hover {
  opacity: 0.72;
}

.primary-btn__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-on-primary);
}

.ghost-btn__text {
  font-size: 15px;
  color: var(--text-primary);
}

</style>
