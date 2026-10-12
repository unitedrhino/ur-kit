<template>
<app-navigation-bar :brand="true" :back="false" />

<view class="home-subnav">
  <view class="home-nav-left" @tap="handleToggleFamilyMenu" hover-class="home-nav-left--hover">
    <text class="home-nav-left__text">{{currentFamilyName || '未选择' + TERM.project}}</text>
    <app-icon class="home-nav-left__arrow" name="tabler:chevron-down" :size="18" />
  </view>
  <view class="home-nav-right">
    <view @tap="handleAlarmTap" class="home-alarm-icon">
      <alarm-badge :count="unreadAlarm" />
    </view>
    <view class="home-nav-add" @tap="handleToggleAddMenu" hover-class="home-nav-add--hover">
      <app-icon class="home-nav-add__icon" name="tabler:plus" :size="28" />
    </view>
  </view>
</view>

<scroll-view
  class="home-page"
  :style="`height: ${scrollHeight};`"
  scroll-y
  type="list"
>
  <view v-if="!loggedIn" class="home-welcome__login" @tap="handleLoginTap" hover-class="home-shortcut--hover">
    <text class="home-welcome__login-text">登录后查看你的设备  ›</text>
  </view>

  <!-- 我的设备 -->
  <view class="home-section">
    <loading v-if="loading" text="加载中..." />

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

    <empty-state v-else text="还没有设备" buttonText="添加设备" @action="handleAddDevice" />

    <view v-if="devices.length > 0" class="home-device-list__bottom-space"></view>
  </view>

  <safe-area />
</scroll-view>

<!-- 家庭下拉菜单 -->
<view v-if="familyMenuVisible" class="home-popover-mask" @tap="handleCloseMenus">
  <view class="home-popover home-popover--left" :style="`top: ${popoverTop}px;`" @tap.stop="noop">
    <view v-if="!singleTenantMode" class="home-popover__header">
      <text class="home-popover__header-text">{{tenantName || '我的组织'}}</text>
    </view>
    <scroll-view class="home-popover__list" scroll-y :style="`max-height: ${popoverListMaxHeight}px;`">
      <view
        v-for="item in familyList" :key="item.projectID"
        class="home-popover__item"
        hover-class="home-popover__item--hover"
        @tap="handleSelectFamily(item.projectID, item.projectName)"
      >
        <text class="home-popover__item-text">{{item.projectName}}</text>
        <app-icon v-if="item.projectID === currentFamilyID" class="home-popover__item-check" name="tabler:check" :size="14" />
      </view>
      <view v-if="familyList.length === 0" class="home-popover__empty">
        <text class="home-popover__empty-text">暂无{{TERM.project}}</text>
      </view>
    </scroll-view>
    <view class="home-popover__divider"></view>
    <view class="home-popover__item home-popover__item--footer" hover-class="home-popover__item--hover" @tap="handleFamilyManage">
      <text class="home-popover__item-text">{{TERM.projectManageTitle}}</text>
      <app-icon class="home-popover__item-suffix" name="tabler:settings" :size="14" />
    </view>
  </view>
</view>

<!-- 添加菜单 -->
<view v-if="addMenuVisible" class="home-popover-mask" @tap="handleCloseMenus">
  <view class="home-popover home-popover--right" :style="`top: ${popoverTop}px;`" @tap.stop="noop">
    <view class="home-popover__item" hover-class="home-popover__item--hover" @tap="handleScan">
      <view class="home-popover__item-left">
        <app-icon class="home-popover__item-icon" name="tabler:camera" :size="16" />
        <text class="home-popover__item-text">扫一扫</text>
      </view>
      <app-icon class="home-popover__chevron" name="tabler:chevron-right" :size="16" />
    </view>
    <view class="home-popover__divider home-popover__divider--inset"></view>
    <view class="home-popover__item" hover-class="home-popover__item--hover" @tap="handleAddDevice">
      <view class="home-popover__item-left">
        <app-icon class="home-popover__item-icon" name="tabler:plus" :size="16" />
        <text class="home-popover__item-text">添加设备</text>
      </view>
      <app-icon class="home-popover__chevron" name="tabler:chevron-right" :size="16" />
    </view>
    <view class="home-popover__divider home-popover__divider--inset"></view>
    <view class="home-popover__item" hover-class="home-popover__item--hover" @tap="handleRefresh">
      <view class="home-popover__item-left">
        <app-icon class="home-popover__item-icon" name="tabler:refresh" :size="16" />
        <text class="home-popover__item-text">刷新</text>
      </view>
      <app-icon class="home-popover__chevron" name="tabler:chevron-right" :size="16" />
    </view>
  </view>
</view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../utils/use-client-debug-page';
import AppIcon from '../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import DeviceCard from '../../components/device-card/device-card.vue';
import EmptyState from '../../components/empty-state/empty-state.vue';
import Loading from '../../components/loading/loading.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { deviceListProvider } from '../../providers/device-list.provider';
import { alarmProvider } from '../../providers/alarm.provider';
import { authProvider } from '../../providers/auth.provider';
import { currentFamilyProvider } from '../../providers/current-family.provider';
import { projectProvider } from '../../providers/project.provider';
import { tenantProvider } from '../../providers/tenant.provider';
import { deviceService } from '../../services/device.service';
import { ensureScanCameraReady } from '../../services/scan-permission.service';
import { parseDeviceQr } from '../../utils/device-qr';
import { getSystemInfo } from '../../utils/platform';
import { TERM } from '../../config/terminology';
import { config } from '../../config';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { ensurePageReady, ensureLoggedInForAction } from '../../utils/page-guard';

const devices = ref<DeviceEntity[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const unreadAlarm = ref(0);
const userName = ref('');
const currentFamilyName = ref('');
const currentFamilyID = ref('');
const tenantName = ref('');
const loggedIn = ref(false);
const familyList = ref<ProjectEntity[]>([]);
const familyMenuVisible = ref(false);
const addMenuVisible = ref(false);
const singleTenantMode = config.tenantMode === 'single';

const sys = getSystemInfo();
const navBarHeight = (sys.statusBarHeight || 0) + (sys.navBarHeight || 0);
const subnavHeight = 56;
const popoverTop = navBarHeight + subnavHeight;
const scrollHeight = `calc(100vh - ${popoverTop}px)`;
const popoverListMaxHeight = Math.max(200, Math.floor((sys.screenHeight || 600) * 0.5));

const unsubscribes: Array<() => void> = [];

function noop(): void {}

onLoad(() => {
  const auth = authProvider.getState();
  userName.value = auth.user?.nickName || '';
  loggedIn.value = auth.loggedIn;

  unsubscribes.push(
    authProvider.subscribe((s) => {
      userName.value = s.user?.nickName || '';
      loggedIn.value = s.loggedIn;
    }),
    deviceListProvider.subscribe((s) => {
      devices.value = s.list;
      loading.value = s.pageState.loading;
    }),
    alarmProvider.subscribe((s) => {
      unreadAlarm.value = s.unreadCount;
    }),
    currentFamilyProvider.subscribe((s) => {
      currentFamilyName.value = s.projectName;
      currentFamilyID.value = s.projectID;
    }),
    projectProvider.subscribe((s) => {
      familyList.value = s.list;
    }),
    tenantProvider.subscribe((s) => {
      tenantName.value = s.current?.name || '';
    }),
  );
  const curFamily = currentFamilyProvider.getState();
  currentFamilyName.value = curFamily.projectName;
  currentFamilyID.value = curFamily.projectID;
  tenantName.value = tenantProvider.getState().current?.name || '';
  familyList.value = projectProvider.getState().list;
});

onShow(async () => {
  const ready = await ensurePageReady('/pages/home/index');
  if (!ready) {
    loading.value = false;
    refreshing.value = false;
    return;
  }
  if (authProvider.isLoggedIn()) {
    deviceListProvider.loadFirst();
    projectProvider.loadFirst();
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  unsubscribes.forEach((fn) => fn());
});

function onPullDownRefresh() {
  if (authProvider.isLoggedIn()) {
    refreshing.value = true;
    deviceListProvider.loadFirst().then(
      () => { refreshing.value = false; },
      () => { refreshing.value = false; },
    );
  } else {
    refreshing.value = false;
  }
}
function handleDeviceTap(e: any) {
  const payload = (e && e.detail) ? e.detail : e;
  const { productID, deviceName } = payload || {};
  if (!productID || !deviceName) return;
  if (!ensureLoggedInForAction(`/packageDevice/pages/detail/index`, { productID, deviceName })) return;
  uni.navigateTo({ url: `/packageDevice/pages/detail/index?productID=${productID}&deviceName=${deviceName}` });
}
function handleAlarmTap() {
  if (!ensureLoggedInForAction('/pages/scene/index')) return;
  uni.switchTab({ url: '/pages/scene/index' });
}
function handleAddDevice() {
  handleCloseMenus();
  if (!ensureLoggedInForAction('/packageDevice/pages/bind/index')) return;
  uni.navigateTo({ url: '/packageDevice/pages/bind/index' });
}
function handleFamilyManage() {
  handleCloseMenus();
  if (!ensureLoggedInForAction('/packageUser/pages/family-manage/index')) return;
  uni.navigateTo({ url: '/packageUser/pages/family-manage/index' });
}
function handleLoginTap() {
  uni.navigateTo({ url: '/packageUser/pages/login/index' });
}

function handleCloseMenus() {
  familyMenuVisible.value = false;
  addMenuVisible.value = false;
}

function handleToggleFamilyMenu() {
  if (!ensureLoggedInForAction()) return;
  addMenuVisible.value = false;
  familyMenuVisible.value = !familyMenuVisible.value;
  if (familyMenuVisible.value) {
    projectProvider.loadFirst();
  }
}

function handleToggleAddMenu() {
  if (!ensureLoggedInForAction()) return;
  familyMenuVisible.value = false;
  addMenuVisible.value = !addMenuVisible.value;
}

function handleSelectFamily(projectID: string, projectName: string) {
  handleCloseMenus();
  if (projectID === currentFamilyID.value) return;
  currentFamilyProvider.switchFamily(projectID, projectName);
}

function handleRefresh() {
  handleCloseMenus();
  if (!ensureLoggedInForAction()) return;
  deviceListProvider.loadFirst();
}

/** 触发扫码绑定流程，App Android 先主动申请相机权限。 */
async function handleScan() {
  handleCloseMenus();
  if (!ensureLoggedInForAction('/packageDevice/pages/bind/index')) return;
  const cameraReady = await ensureScanCameraReady();
  if (!cameraReady) return;

  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    onlyFromCamera: false,
    success: (res) => {
      const payload = parseDeviceQr(res.result || '');
      if (!payload) {
        uni.showToast({ title: '二维码格式不正确', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '绑定中...', mask: true });
      deviceService
        .bindWithLevelHandling(payload.productID, payload.deviceName)
        .then(() => {
          uni.hideLoading();
          uni.showToast({ title: '绑定成功', icon: 'success' });
          deviceListProvider.loadFirst();
        })
        .catch((err: Error) => {
          uni.hideLoading();
          uni.showToast({ title: err.message || '绑定失败', icon: 'none' });
        });
    },
    fail: (err) => {
      const msg = (err && (err as { errMsg?: string }).errMsg) || '';
      if (msg.indexOf('cancel') >= 0) return;
      uni.showToast({ title: '扫码失败', icon: 'none' });
    },
  });
}

defineExpose({});
/* eslint-disable */
// import { deviceListProvider } from '../../providers/device-list.provider';
// import { alarmProvider } from '../../providers/alarm.provider';
// import { authProvider } from '../../providers/auth.provider';
// import { currentFamilyProvider } from '../../providers/current-family.provider';
// import { TERM } from '../../config/terminology';
// import type { DeviceEntity } from '../../domain/entities/device.entity';
// import { ensurePageReady, ensureLoggedInForAction } from '../../utils/page-guard';
// 
// Page({
//   data: {
//     devices: [] as DeviceEntity[],
//     loading: true,
//     refreshing: false,
//     unreadAlarm: 0,
//     userName: '',
//     TERM,
//     currentFamilyName: '',
//     loggedIn: false,
//   },
// 
//   unsubscribes: [] as (() => void)[],
// 
//   onLoad() {
//     const auth = authProvider.getState();
//     this.setData({ userName: auth.user?.nickName || '', loggedIn: auth.loggedIn });
// 
//     this.unsubscribes.push(
//       authProvider.subscribe((s) => {
//         this.setData({ userName: s.user?.nickName || '', loggedIn: s.loggedIn });
//       }),
//       deviceListProvider.subscribe((s) => {
//         this.setData({ devices: s.list, loading: s.pageState.loading });
//       }),
//       alarmProvider.subscribe((s) => {
//         this.setData({ unreadAlarm: s.unreadCount });
//       }),
//       currentFamilyProvider.subscribe((s) => {
//         this.setData({ currentFamilyName: s.projectName });
//       }),
//     );
// 
//     const cur = currentFamilyProvider.getState();
//     this.setData({ currentFamilyName: cur.projectName });
//   },
// 
//   async onShow() {
//     const ready = await ensurePageReady('/pages/home/index');
//     if (!ready) {
//       this.setData({ loading: false, refreshing: false });
//       return;
//     }
//     if (authProvider.isLoggedIn()) {
//       deviceListProvider.loadFirst();
//     } else {
//       this.setData({ loading: false });
//     }
//   },
// 
//   onUnload() {
//     this.unsubscribes.forEach((fn) => fn());
//   },
// 
//   onPullDownRefresh() {
//     if (authProvider.isLoggedIn()) {
//       this.setData({ refreshing: true });
//       deviceListProvider.loadFirst().then(
//         () => {
//           this.setData({ refreshing: false });
//         },
//         () => {
//           this.setData({ refreshing: false });
//         },
//       );
//     } else {
//       this.setData({ refreshing: false });
//     }
//   },
// 
//   handleDeviceTap(e: WechatMiniprogram.CustomEvent<{ productID: string; deviceName: string }>) {
//     const { productID, deviceName } = e.detail;
//     const url = `/packageDevice/pages/detail/index?productID=${productID}&deviceName=${deviceName}`;
//     if (!ensureLoggedInForAction(`/packageDevice/pages/detail/index`, { productID, deviceName })) return;
//     wx.navigateTo({ url });
//   },
// 
//   handleAlarmTap() {
//     if (!ensureLoggedInForAction('/pages/scene/index')) return;
//     wx.navigateTo({ url: '/pages/scene/index' });
//   },
// 
//   handleAddDevice() {
//     if (!ensureLoggedInForAction('/packageDevice/pages/bind/index')) return;
//     wx.navigateTo({ url: '/packageDevice/pages/bind/index' });
//   },
// 
//   handleFamilyManage() {
//     if (!ensureLoggedInForAction('/packageUser/pages/family-manage/index')) return;
//     wx.navigateTo({ url: '/packageUser/pages/family-manage/index' });
//   },
// 
//   handleLoginTap() {
//     wx.navigateTo({ url: '/packageUser/pages/login/index' });
//   },
// });
// 
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('pages/home/index', () =>
  loading.value || !loggedIn.value || familyMenuVisible.value || addMenuVisible.value ? [] :
    devices.value.map((item, index) => ({ id: 'device-' + index, label: item.deviceName + ' (' + item.productID + ')',
      role: 'button' as const, enabled: true, tap: () => handleDeviceTap({ productID: item.productID, deviceName: item.deviceName }) })));
</script>

<style lang="scss" scoped>
.home-page {
  background: var(--page-bg);
  position: relative;
  z-index: 1;
}

.home-welcome {
  padding: 24px 16px 16px;
}

.home-welcome__text {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.home-welcome__sub {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.home-welcome__login {
  display: inline-flex;
  align-self: flex-start;
  margin-top: 12px;
  padding: 8px 14px;
  background: var(--color-primary-light);
  border-radius: 999px;
}

.home-welcome__login-text {
  font-size: 13px;
  color: var(--color-primary);
}

.home-alarm-icon {
  padding: 8px;
}

.home-shortcuts {
  display: flex;
  padding: 0 16px 16px;
}

.home-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  background: var(--card-bg);
  border-radius: 12px;
  margin-right: 12px;
}

.home-shortcut--hover {
  opacity: 0.7;
}

.home-shortcut__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-light);
  margin-bottom: 6px;
}

.home-shortcut__icon--add {
  position: relative;
}

.home-shortcut__icon--add::after {
  content: '+';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: var(--color-primary);
}

.home-shortcut__icon--family {
  position: relative;
}

.home-shortcut__icon--family::after {
  content: '⌂';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  color: var(--color-primary);
}

.home-current-family {
  display: flex;
  align-items: center;
  margin: 0 16px 12px;
  padding: 12px 14px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
}

.home-current-family__label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 8px;
}

.home-current-family__name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.home-current-family__arrow {
  font-size: 18px;
  color: var(--text-tertiary);
}

.home-shortcut__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.home-section {
  padding: 0 16px;
}

.home-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.home-section__title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.home-section__count {
  font-size: 13px;
  color: var(--text-secondary);
}

.home-device-list__bottom-space {
  height: 64px;
}

.home-subnav {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 8px 16px 4px;
  background: var(--page-bg);
}

.home-nav-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  min-height: 44px;
  margin-right: 12px;
  padding: 4px 8px 4px 0;
  border-radius: 6px;
}

.home-nav-left--hover {
  background: var(--color-shadow);
}

.home-nav-left__text {
  min-width: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-nav-left__arrow {
  color: var(--text-secondary);
  margin-left: 6px;
}

.home-nav-right {
  display: flex;
  align-items: center;
}

.home-nav-add {
  margin-left: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: var(--color-primary-light);
  box-shadow: 0 2px 6px var(--color-primary-light);
}

.home-nav-add--hover {
  background: var(--color-shadow);
}

.home-nav-add__icon {
  color: var(--text-primary);
}

.home-popover-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: var(--color-shadow);
}

.home-popover {
  position: fixed;
  z-index: 1000;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--color-shadow);
  min-width: 176px;
  padding: 6px 0;
}

.home-popover--left {
  left: 12px;
  max-width: 240px;
}

.home-popover--right {
  right: 12px;
  width: 160px;
}

.home-popover__header {
  padding: 8px 16px 6px;
}

.home-popover__header-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.home-popover__list {
  padding: 0;
}

.home-popover__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  padding: 0 16px;
}

.home-popover__item--hover {
  background: var(--color-primary-light);
}

.home-popover__item--footer {
  padding-top: 12px;
  padding-bottom: 12px;
}

.home-popover__item-text {
  font-size: 14px;
  color: var(--text-primary);
}

.home-popover__item-left {
  display: flex;
  align-items: center;
}

.home-popover__item-icon {
  margin-right: 10px;
  color: var(--text-secondary);
}

.home-popover__chevron {
  color: var(--text-secondary);
}

.home-popover__item-check {
  color: var(--color-primary);
  margin-left: 12px;
}

.home-popover__item-suffix {
  color: var(--text-secondary);
  margin-left: 12px;
}

.home-popover__divider {
  height: 1px;
  background: var(--border-color);
}

.home-popover__divider--inset {
  margin: 0 16px;
}

.home-popover__empty {
  padding: 16px;
  align-items: center;
}

.home-popover__empty-text {
  font-size: 13px;
  color: var(--text-secondary);
}

</style>
