<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view class="device-page" :style="`height: ${pageHeight};`" scroll-y type="list" @scrolltolower="onReachBottom">
  <!-- 搜索栏 -->
  <app-search-bar
    :modelValue="searchKey"
    placeholder="搜索设备"
    @confirm="handleSearch"
  />

  <!-- 设备列表 -->
  <view class="device-list">
    <loading v-if="loading && devices.length === 0" text="加载中..." />

    <template v-else-if="devices.length > 0">
      <device-card
        v-for="(item, index) in devices" :key="item.deviceName"
        :deviceName="item.deviceName"
        :deviceAlias="item.deviceAlias"
        :productName="item.productName"
        :productID="item.productID"
        :status="item.status"
        :productImg="item.productImg"
        @select="handleDeviceTap"
      />
    </template>

    <empty-state v-else icon="no-device" text="暂无设备" buttonText="添加设备" @action="handleAdd" />

    <view v-if="!hasMore && devices.length > 0" class="device-list__end">
      <text>没有更多了</text>
    </view>

    <view v-if="devices.length > 0" class="device-list__bottom-space"></view>
  </view>

  <safe-area />
</scroll-view>

<view v-if="devices.length > 0" class="device-fab" @tap="handleAdd" hover-class="device-fab--hover" aria-label="添加设备">
  <app-icon class="device-fab__icon" name="tabler:plus" :size="32" color="var(--color-on-primary)" />
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow, onReachBottom as onRB } from '@dcloudio/uni-app';
import AppSearchBar from '../../components/app-search-bar/app-search-bar.vue';
import DeviceCard from '../../components/device-card/device-card.vue';
import EmptyState from '../../components/empty-state/empty-state.vue';
import Loading from '../../components/loading/loading.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import { deviceListProvider } from '../../providers/device-list.provider';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import { ensurePageReady } from '../../utils/page-guard';
import { getSystemInfo } from '../../utils/platform';

const devices = ref<DeviceEntity[]>([]);
const loading = ref(true);
const hasMore = ref(true);
const searchKey = ref('');
const unsubscribes: Array<() => void> = [];
const sys = getSystemInfo();
const pageHeight = `calc(100vh - ${(sys.statusBarHeight || 0) + (sys.navBarHeight || 0)}px)`;

function syncDeviceState() {
  const state = deviceListProvider.getState();
  devices.value = state.list;
  loading.value = state.pageState.loading;
  hasMore.value = state.pageState.hasMore;
}

onLoad(() => {
  unsubscribes.push(
    deviceListProvider.subscribe((s) => {
      devices.value = s.list;
      loading.value = s.pageState.loading;
      hasMore.value = s.pageState.hasMore;
    }),
  );
  syncDeviceState();
});

onShow(async () => {
  const ready = await ensurePageReady('/pages/device/index');
  if (!ready) {
    loading.value = false;
    return;
  }
  if (unsubscribes.length > 0) {
    await deviceListProvider.loadFirst();
    syncDeviceState();
  }
});

onUnmounted(() => unsubscribes.forEach((fn) => fn()));

function onReachBottom() {
  deviceListProvider.loadMore();
}
onRB(() => onReachBottom());

function handleSearch(key: string) {
  searchKey.value = key;
  deviceListProvider.setFilter({ deviceName: key || undefined });
  deviceListProvider.loadFirst();
}

function handleDeviceTap(e: any) {
  const payload = (e && e.detail) ? e.detail : e;
  const { productID, deviceName } = payload || {};
  if (!productID || !deviceName) return;
  uni.navigateTo({ url: `/packageDevice/pages/detail/index?productID=${productID}&deviceName=${deviceName}` });
}

function handleAdd() {
  uni.navigateTo({ url: '/packageDevice/pages/bind/index' });
}
/* eslint-disable */
// import { deviceListProvider } from '../../providers/device-list.provider';
// import type { DeviceEntity } from '../../domain/entities/device.entity';
// import { ensurePageReady } from '../../utils/page-guard';
// 
// Page({
//   data: {
//     devices: [] as DeviceEntity[],
//     loading: true,
//     hasMore: true,
//     searchKey: '',
//   },
// 
//   unsubscribes: [] as (() => void)[],
// 
//   onLoad() {
//     this.unsubscribes.push(
//       deviceListProvider.subscribe((s) => {
//         this.setData({ devices: s.list, loading: s.pageState.loading, hasMore: s.pageState.hasMore });
//       }),
//     );
//   },
// 
//   async onShow() {
//     const ready = await ensurePageReady('/pages/device/index');
//     if (!ready) {
//       this.setData({ loading: false });
//       return;
//     }
//     // 非首次进入时刷新（从绑定/详情页返回）
//     if (this.unsubscribes.length > 0) {
//       deviceListProvider.loadFirst();
//     }
//   },
// 
//   onUnload() {
//     this.unsubscribes.forEach((fn) => fn());
//   },
// 
//   onPullDownRefresh() {
//     deviceListProvider.loadFirst().finally(() => wx.stopPullDownRefresh());
//   },
// 
//   onReachBottom() {
//     deviceListProvider.loadMore();
//   },
// 
//   handleSearch(e: WechatMiniprogram.Input) {
//     const key = e.detail.value;
//     this.setData({ searchKey: key });
//     deviceListProvider.setFilter({ deviceName: key || undefined });
//     deviceListProvider.loadFirst();
//   },
// 
//   handleDeviceTap(e: WechatMiniprogram.CustomEvent<{ productID: string; deviceName: string }>) {
//     const { productID, deviceName } = e.detail;
//     wx.navigateTo({ url: `/packageDevice/pages/detail/index?productID=${productID}&deviceName=${deviceName}` });
//   },
// 
//   handleAdd() {
//     wx.navigateTo({ url: '/packageDevice/pages/bind/index' });
//   },
// });
// 
</script>

<style lang="scss" scoped>
.device-page {
  background: var(--page-bg);
}

.device-fab {
  position: fixed;
  right: 24px;
  bottom: 32px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px var(--color-primary-shadow);
  z-index: 100;
}

.device-fab--hover {
  opacity: 0.85;
}

.device-fab__icon {
  color: var(--color-on-primary);
}

.device-list {
  padding: 0 16px;
}

.device-list__end {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.device-list__bottom-space {
  height: calc(96px + env(safe-area-inset-bottom));
}

</style>
