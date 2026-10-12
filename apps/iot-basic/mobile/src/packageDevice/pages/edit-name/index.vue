<template>
<app-navigation-bar title="设备名" />

<scroll-view class="en-body" scroll-y type="list" :show-scrollbar="false">
  <view class="en-form">
    <view class="en-field">
      <text class="en-field__label">设备名</text>
      <input
        class="en-field__input"
        :value="name"
        placeholder="请输入设备名"
        maxlength="30"
        :focus="true"
        @blur="handleNameBlur"
      />
    </view>
  </view>
</scroll-view>

<view class="en-footer">
  <view
    :class="`en-btn en-btn--primary ${submitting ? 'en-btn--disabled' : ''}`"
    @tap="submitting ? null : handleSubmit()"
    hover-class="en-btn--hover"
  >
    <text>{{submitting ? '保存中...' : '保存'}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceService } from '../../../services/device.service';
import { ensurePageReady } from '../../../utils/page-guard';

const productID = ref('');
const deviceName = ref('');
const name = ref('');
const original = ref('');
const submitting = ref(false);

onLoad(async (o: any) => {
  const options = (o || {}) as Record<string, string | undefined>;
  const ready = await ensurePageReady('/packageDevice/pages/edit-name/index', options as Record<string, string>);
  if (!ready) return;
  productID.value = options.productID || '';
  deviceName.value = options.deviceName || '';
  const current = decodeURIComponent(options.current || '');
  name.value = current;
  original.value = current;
});
/** 失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框的编辑态显示；保存按钮 tap 时 blur 已先触发 */
function handleNameBlur(e: any) { name.value = e.detail.value; }
async function handleSubmit() {
  const n = (name.value || '').trim();
  if (!n) { uni.showToast({ title: '请输入设备名', icon: 'none' }); return; }
  if (n === original.value) { uni.navigateBack({ delta: 1 }); return; }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await deviceService.update({ productID: productID.value, deviceName: deviceName.value, deviceAlias: n });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
/* eslint-disable */
// import { deviceService } from '../../../services/device.service';
// import { ensurePageReady } from '../../../utils/page-guard';
// 
// Page({
//   data: {
//     productID: '',
//     deviceName: '',
//     name: '',
//     original: '',
//     submitting: false,
//   },
// 
//   async onLoad(options: Record<string, string | undefined>) {
//     const ready = await ensurePageReady('/packageDevice/pages/edit-name/index', options);
//     if (!ready) return;
//     const productID = options.productID || '';
//     const deviceName = options.deviceName || '';
//     const current = decodeURIComponent(options.current || '');
//     this.setData({
//       productID,
//       deviceName,
//       name: current,
//       original: current,
//     });
//   },
// 
//   handleInput(e: WechatMiniprogram.CustomEvent) {
//     this.setData({ name: e.detail.value });
//   },
// 
//   async handleSubmit() {
//     const name = (this.data.name || '').trim();
//     if (!name) {
//       wx.showToast({ title: '请输入设备名', icon: 'none' });
//       return;
//     }
//     if (name === this.data.original) {
//       wx.navigateBack();
//       return;
//     }
//     if (this.data.submitting) return;
//     this.setData({ submitting: true });
//     try {
//       await deviceService.update({
//         productID: this.data.productID,
//         deviceName: this.data.deviceName,
//         deviceAlias: name,
//       });
//       wx.showToast({ title: '已保存', icon: 'success' });
//       setTimeout(() => wx.navigateBack(), 500);
//     } catch (err: unknown) {
//       wx.showToast({ title: (err as Error).message || '保存失败', icon: 'none' });
//     } finally {
//       this.setData({ submitting: false });
//     }
//   },
// });
// 
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.en-body {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.en-form {
  margin: 24rpx 32rpx 0;
  background: var(--card-bg);
  border-radius: 24rpx;
  padding: 8rpx 32rpx;
}

.en-field {
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
}

.en-field__label {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 16rpx;
}

.en-field__input {
  font-size: 30rpx;
  color: var(--text-primary);
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--divider);
}

.en-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--divider);
}

.en-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.en-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.en-btn--hover {
  opacity: 0.85;
}

.en-btn--disabled {
  opacity: 0.5;
}

</style>
