<template>
<app-navigation-bar title="设备分享" />

<scroll-view class="share-page" scroll-y type="list">
  <view class="share-info">
    <text class="share-info__label">设备名称</text>
    <text class="share-info__value">{{deviceName}}</text>
  </view>
  <view class="share-btn" @tap="handleShareToUser" hover-class="share-btn--hover">
    <text class="share-btn__text">分享给好友</text>
  </view>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { ensurePageReady } from '../../../utils/page-guard';

const productID = ref('');
const deviceName = ref('');
onLoad(async (q: any) => {
  const query = (q || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageDevice/pages/share/index', query);
  if (!ready) return;
  productID.value = query.productID || '';
  deviceName.value = query.deviceName || '';
});
function handleShareToUser() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}
/* eslint-disable */
// import { ensurePageReady } from '../../../utils/page-guard';
// 
// Page({
//   data: {
//     productID: '',
//     deviceName: '',
//   },
// 
//   async onLoad(query: Record<string, string>) {
//     const ready = await ensurePageReady('/packageDevice/pages/share/index', query);
//     if (!ready) {
//       return;
//     }
//     this.setData({ productID: query.productID, deviceName: query.deviceName });
//   },
// 
//   handleShareToUser() {
//     // TODO: implement device sharing
//     wx.showToast({ title: '功能开发中', icon: 'none' });
//   },
// });
// 
</script>

<style lang="scss" scoped>
.share-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.share-info {
  margin: 16px;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
}

.share-info__label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.share-info__value {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.share-btn {
  margin: 24px 16px;
  padding: 14px;
  text-align: center;
  background: var(--color-primary);
  border-radius: 12px;
}

.share-btn--hover {
  opacity: 0.7;
}

.share-btn__text {
  color: var(--color-on-primary);
  font-size: 16px;
  font-weight: 500;
}

</style>
