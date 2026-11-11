<!-- 设备列表与搜索，显示实际收到的设备分享标识。 -->
<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view class="device-page" :style="`height: ${pageHeight};`" scroll-y type="list" @scrolltolower="onReachBottom">
  <view class="mobile-heading"><text class="mobile-heading__title">我的设备</text><view class="mobile-heading__action" role="button" aria-label="添加设备" @tap="handleAdd"><app-icon name="tabler:plus" :size="26" /></view></view>
  <!-- 搜索栏 -->
  <app-search-bar
    :modelValue="searchKey"
    placeholder="搜索设备"
    @confirm="handleSearch"
  />

  <!-- 设备列表 -->
  <view class="device-list">
    <loading v-if="loading && devices.length === 0" text="加载中..." />

    <view v-else-if="devices.length > 0" class="mobile-card-grid">
      <view class="mobile-card-cell" v-for="(item, index) in devices" :key="JSON.stringify([item.productID, item.deviceName])">
      <device-card
        :deviceName="item.deviceName"
        :deviceAlias="item.deviceAlias"
        :productName="item.productName"
        :productID="item.productID"
        :isShared="item.isShared"
        :status="item.status"
        :deviceImg="item.deviceImg" :productImg="item.productImg"
        :deviceType="item.deviceType"
        :allowLongPress="true"
        :selectionMode="selectionActive"
        :selected="isDeviceSelected(item)"
        @longpress="beginDeviceSelection(item)"
        @select="handleListCardTap(item)"
      />
      </view>
    </view>

    <empty-state v-else icon="no-device" text="暂无设备" buttonText="添加设备" @action="handleAdd" />

    <view v-if="!hasMore && devices.length > 0" class="device-list__end">
      <text>没有更多了</text>
    </view>

    <view v-if="devices.length > 0" class="device-list__bottom-space"></view>
  </view>

  <view class="mobile-tab-content" /><safe-area />
</scroll-view>



<device-selection-bar v-if="selectionActive" :items="selectedDevices" :projectID="currentProjectID" @close="clearDeviceSelection" @moved="handleSelectedDevicesMoved" />
<mobile-tab-bar v-else active="pages/device/index" />

</template>

<script setup lang="ts">
import MobileTabBar from '../../components/mobile-tab-bar/mobile-tab-bar.vue';
import DeviceSelectionBar from '../../components/device-selection-bar/device-selection-bar.vue';
import { useDeviceSelection } from '../../utils/use-device-selection';
import { currentFamilyProvider } from '../../providers/current-family.provider';
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

/** 选择状态和项目上下文只在当前设备页存活。 */
const { active: selectionActive, selected: selectedDevices, isSelected: isDeviceSelected, begin: beginDeviceSelection, toggle: toggleDeviceSelection, clear: clearDeviceSelection, retain: retainDeviceSelection } = useDeviceSelection();
const currentProjectID = ref(currentFamilyProvider.getState().projectID);
let selectionContext = `${currentFamilyProvider.getState().currentTenantCode}:${currentProjectID.value}`;
/** handleListCardTap 区分勾选和打开设备。 */
function handleListCardTap(device: DeviceEntity): void { if (selectionActive.value) toggleDeviceSelection(device); else handleDeviceTap(device); }
/** handleSelectedDevicesMoved 刷新列表并保留失败设备供重试。 */
async function handleSelectedDevicesMoved(failed: DeviceEntity[]): Promise<void> { retainDeviceSelection(failed); await deviceListProvider.loadFirst(); }
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
    currentFamilyProvider.subscribe((state) => {
      const next = `${state.currentTenantCode}:${state.projectID}`;
      if (selectionContext !== next) clearDeviceSelection();
      selectionContext = next;
      currentProjectID.value = state.projectID;
    }),
    deviceListProvider.subscribe((s) => {
      devices.value = s.list;
      loading.value = s.pageState.loading;
      hasMore.value = s.pageState.hasMore;
    }),
  );
  syncDeviceState();
});

onShow(async () => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false });
  // #endif
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
  background: transparent;
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
  font-size: var(--font-caption);
  color: var(--text-tertiary);
}

.device-list__bottom-space {
  height: calc(96px + env(safe-area-inset-bottom));
}

</style>
