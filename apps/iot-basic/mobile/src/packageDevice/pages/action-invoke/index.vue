<template>
<app-navigation-bar :title="action?.name || '执行行为'" />

<scroll-view class="ai-page" scroll-y type="list" :show-scrollbar="false">
  <view v-if="action" class="ai-header">
    <text class="ai-title">{{action.name || '执行行为'}}</text>
    <text class="ai-subtitle">{{action.identifier}}</text>
  </view>

  <view v-if="action" class="ai-body">
    <view v-if="action.input.length === 0" class="ai-empty">
      <text>该行为无需参数</text>
    </view>
    <property-control
      v-for="(p, index) in action.input" :key="p.identifier"
      :label="p.name"
      :dataID="p.identifier"
      :define="p.define"
      :value="drafts[p.identifier]"
      mode="rw"
      :autoCommit="true"
      @change="handleParamChange"
    />
  </view>

  <view class="ai-spacer" />
</scroll-view>

<view class="ai-footer">
  <view
    :class="`ai-btn ai-btn--primary ${submitting ? 'ai-btn--disabled' : ''}`"
    @tap="submitting ? null : handleInvoke()"
    hover-class="ai-btn--hover"
  >
    <text>{{submitting ? '执行中...' : '执行'}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceDetailProvider } from '../../../providers/device-detail.provider';
import type { ActionItem } from '../../../domain/models/device-control.model';
import {
  buildActionParamDefaults,
  getActionParamMemory,
  saveActionParamMemory,
} from '../../../services/action-param-memory.service';
import { ensurePageReady } from '../../../utils/page-guard';

const action = ref<ActionItem | null>(null);
const drafts = ref<Record<string, unknown>>({});
const memoryDevice = ref<{ deviceName: string; productID: string } | null>(null);
const submitting = ref(false);

onLoad(async (o: any) => {
  const options = (o || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageDevice/pages/action-invoke/index', options);
  if (!ready) return;
  const actionID = options.actionID || '';
  const state = deviceDetailProvider.getState();
  const a = state.controlModel?.actions.find((x) => x.identifier === actionID) || null;
  if (!a) {
    uni.showToast({ title: '行为不存在', icon: 'none' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500);
    return;
  }
  const loadedDevice = state.device
    ? { deviceName: state.device.deviceName, productID: state.device.productID }
    : { deviceName: options.deviceName || '', productID: options.productID || '' };
  memoryDevice.value = loadedDevice.productID && loadedDevice.deviceName ? loadedDevice : null;
  const memory = memoryDevice.value ? getActionParamMemory(memoryDevice.value, a) : null;
  action.value = a;
  drafts.value = memory?.params || buildActionParamDefaults(a);
  uni.setNavigationBarTitle({ title: a.name || '执行行为' });
});

/** handleParamChange 记录行为参数表单草稿。 */
function handleParamChange(e: any) {
  const payload = (e && e.detail) ? e.detail : e;
  if (!payload || !payload.dataID) return;
  drafts.value = { ...drafts.value, [payload.dataID]: payload.rawValue };
}
/** handleInvoke 执行行为，成功后把本次入参写入本地记忆。 */
async function handleInvoke() {
  if (!action.value || submitting.value) return;
  submitting.value = true;
  try {
    await deviceDetailProvider.invokeAction(action.value, drafts.value);
    if (memoryDevice.value && action.value.input.length > 0) {
      saveActionParamMemory(memoryDevice.value, action.value, drafts.value);
    }
    uni.showToast({ title: '已触发', icon: 'success' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500);
  } catch {
    uni.showToast({ title: '触发失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
/* eslint-disable */
// import { deviceDetailProvider } from '../../../providers/device-detail.provider';
// import type { ActionItem } from '../../../domain/models/device-control.model';
// import { ensurePageReady } from '../../../utils/page-guard';
// 
// Page({
//   data: {
//     action: null as ActionItem | null,
//     drafts: {} as Record<string, unknown>,
//     submitting: false,
//   },
// 
//   async onLoad(options: Record<string, string>) {
//     const ready = await ensurePageReady('/packageDevice/pages/action-invoke/index', options);
//     if (!ready) {
//       return;
//     }
//     const actionID = options.actionID || '';
//     const state = deviceDetailProvider.getState();
//     const action = state.controlModel?.actions.find((a) => a.identifier === actionID) || null;
//     if (!action) {
//       wx.showToast({ title: '行为不存在', icon: 'none' });
//       setTimeout(() => wx.navigateBack(), 500);
//       return;
//     }
//     const drafts: Record<string, unknown> = {};
//     action.input.forEach((p) => {
//       if (p.define.type === 'bool') drafts[p.identifier] = false;
//       else if (p.define.type === 'timestamp') drafts[p.identifier] = Date.now();
//       else drafts[p.identifier] = '';
//     });
//     this.setData({ action, drafts });
//     wx.setNavigationBarTitle({ title: action.name || '执行行为' });
//   },
// 
//   handleParamChange(
//     e: WechatMiniprogram.CustomEvent<{ dataID: string; rawValue: unknown }>,
//   ) {
//     const { dataID, rawValue } = e.detail;
//     const drafts = { ...this.data.drafts, [dataID]: rawValue };
//     this.setData({ drafts });
//   },
// 
//   async handleInvoke() {
//     const action = this.data.action;
//     if (!action || this.data.submitting) return;
//     this.setData({ submitting: true });
//     try {
//       await deviceDetailProvider.invokeAction(action, this.data.drafts);
//       wx.showToast({ title: '已触发', icon: 'success' });
//       setTimeout(() => wx.navigateBack(), 500);
//     } catch {
//       wx.showToast({ title: '触发失败', icon: 'none' });
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

.ai-page {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.ai-header {
  padding: 32rpx 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
}

.ai-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--text-secondary);
}

.ai-body {
  margin-top: 16rpx;
  padding: 16rpx 32rpx;
  background: var(--card-bg);
}

.ai-empty {
  padding: 64rpx 0;
  display: flex;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 28rpx;
}

.ai-spacer {
  height: 200rpx;
}

.ai-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--divider);
}

.ai-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.ai-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.ai-btn--hover {
  opacity: 0.85;
}

.ai-btn--disabled {
  opacity: 0.5;
}

</style>
