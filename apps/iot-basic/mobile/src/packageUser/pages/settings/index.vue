<template>
<app-navigation-bar title="设置" />

<scroll-view class="settings-page" scroll-y type="list">
  <view class="settings-group">
    <view class="settings-item" @tap="handleNavTo('/packageUser/pages/account-security/index')" hover-class="settings-item--hover">
      <text class="settings-item__label">账号与安全</text>
      <text class="settings-item__arrow">›</text>
    </view>
    <view class="settings-item" @tap="handleNavTo('/packageUser/pages/notify-settings/index')" hover-class="settings-item--hover">
      <text class="settings-item__label">通知设置</text>
      <text class="settings-item__arrow">›</text>
    </view>
    <view class="settings-item" @tap="handleNavTo('/packageUser/pages/voiceprint-agreement/index')" hover-class="settings-item--hover">
      <text class="settings-item__label">声纹授权协议</text>
      <text class="settings-item__arrow">›</text>
    </view>
    <view class="settings-item" @tap="handleClearCache" hover-class="settings-item--hover">
      <text class="settings-item__label">清除缓存</text>
      <text class="settings-item__arrow">›</text>
    </view>
  </view>
  <view class="settings-group">
    <view class="settings-item"><text class="settings-item__label">调试实例 ID</text></view>
    <view class="settings-item"><text selectable class="settings-item__label">{{ instanceID }}</text></view>
    <view class="settings-item"><text class="settings-item__label">调试状态：{{ active ? '进行中' : '未开启' }}</text></view>
    <view v-if="active" class="settings-item" @tap="stopDebug"><text class="settings-item__label">停止调试</text></view>
  </view>
  <safe-area />
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { onLoad } from '@dcloudio/uni-app';
import { ensurePageReady } from '../../../utils/page-guard';
import { onMounted, onUnmounted, ref } from 'vue';
import { clientDebugService } from '../../../services/client-debug.service';

const instanceID = clientDebugService.getInstanceID();
const active = ref(clientDebugService.isActive());
let unsubscribe: (() => void) | undefined;
onMounted(() => { unsubscribe = clientDebugService.subscribe(() => { active.value = clientDebugService.isActive(); }); });
onUnmounted(() => unsubscribe?.());

function stopDebug() { clientDebugService.stop(); }

onLoad(async () => {
  await ensurePageReady('/packageUser/pages/settings/index');
});

function handleClearCache() {
  uni.showModal({
    title: '提示',
    content: '确定清除缓存？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync();
        uni.showToast({ title: '已清除', icon: 'success' });
      }
    },
  });
}

function handleNavTo(url: string) {
  uni.navigateTo({ url });
}
</script>

<style lang="scss" scoped>
.settings-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.settings-group { margin: 16px; background: var(--card-bg); border-radius: 12px; overflow: hidden; }
.settings-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1rpx solid var(--divider); }
.settings-item:last-child { border-bottom: none; }
.settings-item--hover { background: var(--color-bg-secondary); }
.settings-item__label { font-size: 15px; color: var(--text-primary); }
.settings-item__arrow { color: var(--text-tertiary); font-size: 18px; }

</style>
