<template>
<app-navigation-bar title="通知设置" />

<scroll-view class="notify-page" scroll-y type="list">
  <view class="notify-section">
    <view class="notify-item">
      <text class="notify-item__label">推送通知</text>
      <switch :checked="enablePush" @change="(e: any) => handleToggle('enablePush', e)" />
    </view>
    <view class="notify-item">
      <text class="notify-item__label">告警通知</text>
      <switch :checked="enableAlarm" @change="(e: any) => handleToggle('enableAlarm', e)" />
    </view>
    <view class="notify-item">
      <text class="notify-item__label">设备状态变更</text>
      <switch :checked="enableDevice" @change="(e: any) => handleToggle('enableDevice', e)" />
    </view>
  </view>

  <view class="notify-subscribe" @tap="handleSubscribe" hover-class="notify-subscribe--hover">
    <text class="notify-subscribe__text">订阅微信消息</text>
  </view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { notificationService } from '../../../services/notification.service';
import type { NotifyConfigEntity } from '../../../domain/entities/notify-config.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const enablePush = ref(true);
const enableAlarm = ref(true);
const enableDevice = ref(true);
const configs = ref<NotifyConfigEntity[]>([]);

onLoad(async () => {
  const ready = await ensurePageReady('/packageUser/pages/notify-settings/index');
  if (!ready) return;
  configs.value = await notificationService.getConfigs();
});

function handleToggle(key: 'enablePush' | 'enableAlarm' | 'enableDevice', e: any) {
  const v = !!(e && e.detail && e.detail.value);
  if (key === 'enablePush') enablePush.value = v;
  else if (key === 'enableAlarm') enableAlarm.value = v;
  else enableDevice.value = v;
  // TODO: save to server
}

async function handleSubscribe() {
  try {
    await notificationService.requestSubscribe(configs.value);
    uni.showToast({ title: '订阅成功', icon: 'success' });
  } catch {
    uni.showToast({ title: '订阅失败', icon: 'none' });
  }
}
</script>

<style lang="scss" scoped>
.notify-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.notify-section { margin: 16px; background: var(--card-bg); border-radius: 12px; overflow: hidden; }
.notify-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1rpx solid var(--divider); }
.notify-item:last-child { border-bottom: none; }
.notify-item__label { font-size: 15px; color: var(--text-primary); }
.notify-subscribe { margin: 24px 16px; padding: 14px; text-align: center; background: var(--color-primary); border-radius: 12px; }
.notify-subscribe--hover { opacity: 0.7; }
.notify-subscribe__text { color: var(--color-on-primary); font-size: 16px; font-weight: 500; }

</style>
