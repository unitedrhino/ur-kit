<template>
<app-navigation-bar :title="changingNetwork ? 'Wi-Fi 管理' : '添加设备'" />

<scroll-view class="provision-page" scroll-y type="list">
  <view class="steps">
    <text class="steps__item steps__item--active">1 准备设备</text>
    <text class="steps__item">2 选择 Wi-Fi</text>
    <text class="steps__item">3 {{changingNetwork ? '连接网络' : '完成添加'}}</text>
  </view>

  <view class="card hero-card">
    <text class="hero-card__title">{{changingNetwork ? '给设备连接一个新网络' : '让设备准备好连接'}}</text>
    <text class="hero-card__desc">{{changingNetwork ? '不用删除设备，也不用恢复出厂。原来的网络和设备绑定都会保留。' : '请按设备说明开启配网模式，无需先恢复出厂。'}}</text>
    <view class="guide-box">
      <text class="guide-box__title">操作提示</text>
      <text class="guide-box__text">1. 给设备接通电源，手机靠近设备并开启蓝牙</text>
      <text class="guide-box__text">{{changingNetwork ? '2. Watcher：点屏幕“菜单”或长按滚轮 2 秒，进入“网络与绑定 → 更换 Wi-Fi”' : '2. Watcher：打开“菜单 → 网络与绑定 → 配网并绑定”；其他设备按说明操作'}}</text>
      <text class="guide-box__text">3. 看到设备提示等待手机后，点击下面的按钮继续</text>
    </view>
  </view>

  <view class="confirm-row" @tap="handleToggleReady" hover-class="confirm-row--hover">
    <view :class="`checkbox ${checked ? 'checkbox--checked' : ''}`">
      <app-icon v-if="checked" class="checkbox__mark" name="tabler:check" :size="13" color="var(--color-on-primary)" />
    </view>
    <text class="confirm-row__text">设备已准备好，等待手机连接</text>
  </view>
</scroll-view>

<view class="footer">
  <view :class="`primary-btn ${checked ? '' : 'primary-btn--disabled'}`" @tap="handleNext" hover-class="primary-btn--hover">
    <text class="primary-btn__text">选择 Wi-Fi</text>
  </view>
</view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref, onUnmounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { provisionProvider, type ProvisionProviderState } from '../../../providers/provision.provider'
import { ensurePageReady } from '../../../utils/page-guard'

const checked = ref(false)
/** 换网沿用设置页已授权的会话，绝不重置成首次绑定。 */
const changingNetwork = ref(false)
const unsubscribes: Array<() => void> = []

onLoad(async (query: Record<string, string | undefined> = {}) => {
  const ready = await ensurePageReady('/packageBluetooth/pages/prepare/index')
  if (!ready) return
  changingNetwork.value = query.changeNetwork === '1'
  if (changingNetwork.value) {
    if (provisionProvider.getState().mode !== 'changeNetwork') {
      uni.showToast({ title: '请从设备设置重新进入', icon: 'none' })
      uni.navigateBack({ delta: 1 })
      return
    }
  } else {
    provisionProvider.startSession()
  }
  unsubscribes.push(provisionProvider.subscribe((_state: ProvisionProviderState) => {}))
})

onUnload(() => { unsubscribes.forEach(fn => fn()) })
onUnmounted(() => { unsubscribes.forEach(fn => fn()) })

function handleToggleReady() { checked.value = !checked.value }

function handleNext() {
  if (!checked.value) { uni.showToast({ title: '请先确认设备已进入配网模式', icon: 'none' }); return }
  provisionProvider.confirmPrepared()
  uni.navigateTo({ url: '/packageBluetooth/pages/wifi/index' + (changingNetwork.value ? '?changeNetwork=1' : '') })
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageBluetooth/pages/prepare/index', () => [
  { id: 'device-ready', label: '设备已进入配网模式', role: 'button', enabled: true, tap: handleToggleReady },
  { id: 'next', label: '下一步', role: 'button', enabled: checked.value, tap: handleNext },
]);
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.provision-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: hidden;
  padding: 16px;
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
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

.steps__item--active {
  color: var(--color-primary);
  font-weight: 600;
}

.card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
}

.hero-card__title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.hero-card__desc {
  display: block;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-all;
  color: var(--text-secondary);
}

.guide-box {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  padding: 14px 14px 18px;
  border-radius: 12px;
  background: var(--color-primary-light);
}

.guide-box__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.guide-box__text {
  display: block;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.confirm-row {
  display: flex;
  align-items: center;
  margin-top: 18px;
  padding: 16px;
  border-radius: 14px;
  background: var(--card-bg);
}

.confirm-row--hover {
  opacity: 0.72;
}

.checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.checkbox--checked {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.checkbox__mark {
  color: var(--color-on-primary);
}

.confirm-row__text {
  margin-left: 10px;
  font-size: 15px;
  color: var(--text-primary);
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--card-bg);
}

.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-radius: 14px;
  background: var(--color-primary);
}

.primary-btn--hover {
  opacity: 0.78;
}

.primary-btn--disabled {
  background: var(--color-primary-light);
}

.primary-btn__text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-on-primary);
}

</style>
