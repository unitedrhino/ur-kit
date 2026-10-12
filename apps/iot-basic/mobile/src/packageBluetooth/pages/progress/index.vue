<template>
<app-navigation-bar :title="changingNetwork ? '更换 Wi-Fi' : '一键配网'" />

<scroll-view class="progress-page" scroll-y type="list">
  <view class="steps">
    <text class="steps__item steps__item--done">1 准备设备</text>
    <text class="steps__item steps__item--done">2 选择 Wi-Fi</text>
    <text class="steps__item steps__item--active">3 {{changingNetwork ? '连接网络' : '完成添加'}}</text>
  </view>

  <view class="visual-card">
    <view class="visual-card__circle"><app-icon class="visual-card__icon" name="tabler:bluetooth" :size="36" /></view>
    <text class="visual-card__title">{{changingNetwork ? '正在连接新 Wi-Fi' : stage === 'binding_device' ? '正在完成设备添加' : '正在连接设备'}}</text>
    <text class="visual-card__desc">{{!changingNetwork && stage === 'binding_device' ? '网络已配置，设备正在重新上线并完成绑定，请保持页面打开。' : '请保持设备通电、手机靠近，连接完成后会自动显示结果。'}}</text>
    <view v-if="timeoutVisible" class="timeout-tip">
      <text v-if="remainingSeconds > 0" class="timeout-tip__text">正在等待设备完成联网，剩余 {{remainingSeconds}} 秒</text>
      <text v-else class="timeout-tip__text">等待时间较长，请稍候查看结果或取消重试</text>
    </view>
  </view>

  <view class="progress-card">
    <view v-for="(item, index) in progressItems" :key="item.stage" :class="`progress-item progress-item--${item.status}`">
      <view class="progress-item__dot">
        <view v-if="item.status === 'active'" class="progress-item__spinner" />
        <app-icon v-else-if="item.status === 'done'" class="progress-item__mark" name="tabler:check" :size="14" />
        <text v-else-if="item.status === 'failed'" class="progress-item__mark">!</text>
      </view>
      <view class="progress-item__content">
        <text class="progress-item__title">{{item.title}}</text>
        <text class="progress-item__desc">{{item.desc}}</text>
      </view>
    </view>
  </view>
</scroll-view>

<view class="footer">
  <view class="ghost-btn" @tap="handleCancel" hover-class="ghost-btn--hover">
    <text class="ghost-btn__text">取消配网</text>
  </view>
</view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { provisionProvider, type ProvisionProviderState, type ProvisionProgressItem } from '../../../providers/provision.provider'
import { ensurePageReady } from '../../../utils/page-guard'

const PROVISION_TIMEOUT_SECONDS = 30
const DEBUG_LOG_LIMIT = 80

const progressItems = ref<ProvisionProgressItem[]>([])
const stage = ref('waiting_device_online')
/** 换网以本次设备保存回执为准，不等待账号绑定。 */
const changingNetwork = ref(provisionProvider.getState().mode === 'changeNetwork')
const resultNavigated = ref(false)
/** cancelledByAction 区分按钮取消和页面被动退出，避免 onUnload 重复结束会话。 */
const cancelledByAction = ref(false)
const timeoutVisible = ref(false)
const remainingSeconds = ref(PROVISION_TIMEOUT_SECONDS)
const unsubscribes: Array<() => void> = []
let timeoutTimer: ReturnType<typeof setInterval> | null = null

function clearTimeoutCountdown() {
  if (timeoutTimer) { clearInterval(timeoutTimer); timeoutTimer = null }
  if (timeoutVisible.value && remainingSeconds.value > 0) timeoutVisible.value = false
}

function startTimeoutCountdown() {
  if (timeoutTimer) return
  timeoutVisible.value = true
  remainingSeconds.value = PROVISION_TIMEOUT_SECONDS
  timeoutTimer = setInterval(() => {
    const nextSeconds = Math.max(0, remainingSeconds.value - 1)
    remainingSeconds.value = nextSeconds
    if (nextSeconds === 0) { clearTimeoutCountdown(); timeoutVisible.value = true; remainingSeconds.value = 0 }
  }, 1000)
}

function syncState(state: ProvisionProviderState) {
  changingNetwork.value = state.mode === 'changeNetwork'
  progressItems.value = state.progressItems
  stage.value = state.stage
  if (state.stage === 'waiting_device_online' && !changingNetwork.value) startTimeoutCountdown()
  else clearTimeoutCountdown()
  if ((state.stage === 'success' || state.stage === 'failed') && !resultNavigated.value) {
    resultNavigated.value = true
    uni.redirectTo({ url: '/packageBluetooth/pages/result/index' })
  }
}

onLoad(async () => {
  const ready = await ensurePageReady('/packageBluetooth/pages/progress/index')
  if (!ready) return
  unsubscribes.push(provisionProvider.subscribe(syncState))
  const history = provisionProvider.getDebugLogHistory(DEBUG_LOG_LIMIT)
  unsubscribes.push(provisionProvider.subscribeDebugLogs((_line: string) => {
    // debug logs available via getDebugLogHistory if needed
  }))
  void history
})

onUnload(() => {
  clearTimeoutCountdown()
  unsubscribes.forEach(fn => fn())
  if (!resultNavigated.value && !cancelledByAction.value && stage.value !== 'success' && stage.value !== 'failed') {
    provisionProvider.cancel('PAGE_UNLOADED')
  }
})
onUnmounted(() => { clearTimeoutCountdown(); unsubscribes.forEach(fn => fn()) })

function handleCancel() {
  clearTimeoutCountdown()
  cancelledByAction.value = true
  provisionProvider.cancel()
  uni.navigateBack({ delta: 1 })
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageBluetooth/pages/progress/index', () => [
  { id: 'cancel', label: '取消配网', role: 'button', enabled: !resultNavigated.value, tap: handleCancel },
], () => ({ stage: stage.value }));
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.progress-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: hidden;
  padding: 16px;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
}

.steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.steps__item {
  font-size: 12px;
  color: var(--text-secondary);
}

.steps__item--active,
.steps__item--done {
  color: var(--color-primary);
  font-weight: 600;
}

.visual-card,
.progress-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px 20px 24px;
}

.visual-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 14px;
}

.visual-card__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 44px;
  background: var(--color-primary-light);
  margin-bottom: 16px;
}

.visual-card__icon {
  color: var(--color-primary);
}

.visual-card__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.visual-card__desc {
  display: block;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.timeout-tip {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-warning-bg);
}

.timeout-tip__text {
  display: block;
  text-align: center;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-warning);
}

.progress-card {
  display: flex;
  flex-direction: column;
  padding-bottom: 34px;
}

.debug-card {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 16px;
  background: var(--text-primary);
}

.debug-card__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-bg-secondary);
  margin-bottom: 6px;
}

.debug-card__desc {
  display: block;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-placeholder);
  margin-bottom: 12px;
}

.debug-empty {
  padding: 10px 0;
}

.debug-empty__text {
  font-size: 12px;
  color: var(--text-placeholder);
}

.debug-list {
  display: flex;
  flex-direction: column;
}

.debug-line {
  display: block;
  font-size: 11px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--text-placeholder);
  margin-bottom: 6px;
}

.progress-item {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.progress-item__dot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: var(--border-color);
}

.progress-item--active .progress-item__dot {
  background: transparent;
}

.progress-item--done .progress-item__dot {
  background: var(--color-success);
}

.progress-item--failed .progress-item__dot {
  background: var(--color-error);
}

.progress-item__mark {
  font-size: 13px;
  color: var(--color-on-primary);
}

.progress-item__spinner {
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  border: 2px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: progress-item-spin 0.8s linear infinite;
}

.progress-item__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  margin-left: 12px;
}

.progress-item__title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.progress-item__desc {
  display: block;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  color: var(--text-secondary);
}

@keyframes progress-item-spin {
  to { transform: rotate(360deg); }
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--card-bg);
}

.ghost-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 12px;
  background: var(--color-bg-secondary);
}

.ghost-btn--hover {
  opacity: 0.72;
}

.ghost-btn__text {
  font-size: 15px;
  color: var(--text-primary);
}

</style>
