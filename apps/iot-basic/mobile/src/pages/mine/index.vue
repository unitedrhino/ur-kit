<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view class="mine-page" scroll-y type="list">
  <!-- 用户信息 -->
  <view class="mine-header" @tap="loggedIn ? handleProfile() : handleLogin()">
    <view class="mine-avatar">
      <image v-if="user && user.avatar" class="mine-avatar__image" :src="user.avatar" mode="aspectFill" />
      <text v-else class="mine-avatar__text">{{(user && user.nickName ? user.nickName[0] : '?')}}</text>
    </view>
    <view class="mine-user-info">
      <text class="mine-user__name">{{loggedIn && user ? user.nickName : '点击登录'}}</text>
      <text v-if="loggedIn && user" class="mine-user__id">ID: {{user.userID}}</text>
    </view>
    <text v-if="loggedIn" class="mine-user__arrow">›</text>
  </view>

  <!-- 组织与当前家庭切换 -->
  <view v-if="loggedIn && canSwitchTenant && !singleTenantMode" class="mine-menu">
    <view class="mine-menu__item mine-menu__item--tenant" @tap="handleSwitchTenant" hover-class="mine-menu__item--hover">
      <text class="mine-menu__label">组织切换</text>
      <view class="mine-menu__right">
        <text class="mine-menu__value">{{tenantName || '未选择'}}</text>
        <text class="mine-menu__arrow">›</text>
      </view>
    </view>
  </view>

  <view v-if="loggedIn" class="mine-menu">
    <view class="mine-menu__item mine-menu__item--family" @tap="handleSwitchFamily" hover-class="mine-menu__item--hover">
      <text class="mine-menu__label">当前{{TERM.project}}切换</text>
      <view class="mine-menu__right">
        <text class="mine-menu__value">{{familyName || '未选择'}}</text>
        <text class="mine-menu__arrow">›</text>
      </view>
    </view>
  </view>

  <!-- 功能列表 -->
  <view class="mine-menu">
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/family-manage/index')" hover-class="mine-menu__item--hover">
      <text class="mine-menu__label">{{TERM.projectManageTitle}}</text>
      <text class="mine-menu__arrow">›</text>
    </view>
    <view v-if="showDigitalLifeMenuItem" class="mine-menu__item" @tap="handleNavTo('/packageDevice/pages/digital-life/index')" hover-class="mine-menu__item--hover">
      <text class="mine-menu__label">数字生命管理</text>
      <text class="mine-menu__arrow">›</text>
    </view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/settings/index')" hover-class="mine-menu__item--hover">
      <text class="mine-menu__label">设置</text>
      <text class="mine-menu__arrow">›</text>
    </view>
  </view>

  <!-- 退出登录 -->
  <view v-if="loggedIn" class="mine-logout" @tap="handleLogout" hover-class="mine-logout--hover">
    <text class="mine-logout__text">退出登录</text>
  </view>

  <safe-area />
</scroll-view>

<!-- 组织选择层 -->
<view v-if="tenantPickerVisible && !singleTenantMode" class="mine-picker-mask" @tap="handleCloseTenantPicker">
  <view class="mine-picker-sheet" @tap.stop="noop">
    <view class="mine-picker-sheet__header">
      <text class="mine-picker-sheet__title">选择组织</text>
      <text class="mine-picker-sheet__close" @tap="handleCloseTenantPicker">×</text>
    </view>
    <scroll-view class="mine-picker-sheet__list" scroll-y>
      <view
        v-for="item in tenantList"
        :key="item.code"
        class="mine-picker-sheet__item"
        hover-class="mine-picker-sheet__item--hover"
        @tap="handleSelectTenant(item.code)"
      >
        <view class="mine-picker-sheet__item-main">
          <text class="mine-picker-sheet__item-name">{{item.name}}</text>
          <text v-if="item.code === currentTenantCode" class="mine-picker-sheet__item-current">当前</text>
        </view>
        <text v-if="item.code === currentTenantCode" class="mine-picker-sheet__check">✓</text>
      </view>
    </scroll-view>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { authProvider } from '../../providers/auth.provider';
import { tenantProvider } from '../../providers/tenant.provider';
import { currentFamilyProvider } from '../../providers/current-family.provider';
import { projectProvider } from '../../providers/project.provider';
import { TERM } from '../../config/terminology';
import { config } from '../../config';
import type { UserEntity } from '../../domain/entities/user.entity';
import type { TenantEntity } from '../../domain/entities/tenant.entity';
import { appContextProvider } from '../../providers/app-context.provider';

const user = ref<UserEntity | null>(null);
const loggedIn = ref(false);
const tenantName = ref('');
const familyName = ref('');
// 组织选择层依赖当前组织 code、可切换组织列表和弹层开关，避免小程序系统 actionSheet 弹出不稳定。
const currentTenantCode = ref('');
const tenantList = ref<TenantEntity[]>([]);
const tenantPickerVisible = ref(false);
const canSwitchTenant = ref(false);
const singleTenantMode = config.tenantMode === 'single';
const unsubscribes: Array<() => void> = [];
const DIGITAL_LIFE_MENU_VISIBLE_AFTER_BEIJING_TIME = Date.UTC(2026, 6, 17, 9, 0, 0);
const showDigitalLifeMenuItem = ref(isAfterBeijingDigitalLifeVisibleTime());
let digitalLifeMenuVisibilityTimer: ReturnType<typeof setTimeout> | null = null;

// 阻止点击选择层内容时冒泡关闭弹层。
function noop(): void {}

// isAfterBeijingDigitalLifeVisibleTime 判断数字生命入口是否已到北京时间 2026-07-17 17:00。
function isAfterBeijingDigitalLifeVisibleTime(now: Date = new Date()): boolean {
  return now.getTime() >= DIGITAL_LIFE_MENU_VISIBLE_AFTER_BEIJING_TIME;
}

// getDigitalLifeMenuRefreshDelay 计算距离北京时间 2026-07-17 17:00 的剩余毫秒数。
function getDigitalLifeMenuRefreshDelay(now: Date = new Date()): number {
  return Math.max(DIGITAL_LIFE_MENU_VISIBLE_AFTER_BEIJING_TIME - now.getTime(), 0);
}

// refreshDigitalLifeMenuVisibility 刷新入口可见性，并在未到时间时安排一次自动刷新。
function refreshDigitalLifeMenuVisibility(): void {
  if (digitalLifeMenuVisibilityTimer) {
    clearTimeout(digitalLifeMenuVisibilityTimer);
    digitalLifeMenuVisibilityTimer = null;
  }
  showDigitalLifeMenuItem.value = isAfterBeijingDigitalLifeVisibleTime();
  if (!showDigitalLifeMenuItem.value) {
    digitalLifeMenuVisibilityTimer = setTimeout(refreshDigitalLifeMenuVisibility, getDigitalLifeMenuRefreshDelay());
  }
}

onLoad(() => {
  refreshDigitalLifeMenuVisibility();
  unsubscribes.push(
    authProvider.subscribe((s) => {
      user.value = s.user;
      loggedIn.value = s.loggedIn;
    }),
    tenantProvider.subscribe((s) => {
      tenantName.value = s.current?.name || '';
      currentTenantCode.value = s.current?.code || '';
      tenantList.value = tenantProvider.getAvailableTenants();
      canSwitchTenant.value = !singleTenantMode && tenantList.value.length > 1;
    }),
    currentFamilyProvider.subscribe((s) => {
      familyName.value = s.projectName || '';
    }),
  );
  const cur = authProvider.getState();
  user.value = cur.user;
  loggedIn.value = cur.loggedIn;
  const tenantState = tenantProvider.getState();
  tenantName.value = tenantState.current?.name || '';
  currentTenantCode.value = tenantState.current?.code || '';
  tenantList.value = tenantProvider.getAvailableTenants();
  familyName.value = currentFamilyProvider.getState().projectName || '';
  canSwitchTenant.value = !singleTenantMode && tenantList.value.length > 1;
});
onShow(() => {
  refreshDigitalLifeMenuVisibility();
  if (authProvider.isLoggedIn()) {
    tenantProvider.loadTenants();
  }
});
onUnmounted(() => {
  if (digitalLifeMenuVisibilityTimer) {
    clearTimeout(digitalLifeMenuVisibilityTimer);
    digitalLifeMenuVisibilityTimer = null;
  }
  unsubscribes.forEach((fn) => fn());
});

function handleLogin() {
  uni.navigateTo({ url: '/packageUser/pages/login/index' });
}
function handleProfile() {
  uni.navigateTo({ url: '/packageUser/pages/profile/index' });
}
async function handleSwitchTenant() {
  if (singleTenantMode) {
    uni.switchTab({ url: '/pages/home/index' });
    return;
  }
  if (!loggedIn.value) {
    uni.navigateTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  const { current } = tenantProvider.getState();
  const list = tenantProvider.getAvailableTenants();
  tenantList.value = list;
  currentTenantCode.value = current?.code || '';
  if (list.length === 0) {
    uni.showToast({ title: '暂无可切换组织', icon: 'none' });
    return;
  }
  tenantPickerVisible.value = true;
}
function handleCloseTenantPicker() {
  tenantPickerVisible.value = false;
}

// handleSelectTenant 切换当前组织，并恢复首页上下文。
async function handleSelectTenant(code: string) {
  handleCloseTenantPicker();
  if (!code || code === currentTenantCode.value) return;
  tenantProvider.switchTenant(code);
  await appContextProvider.continueAfterLogin('/pages/home/index');
}
async function handleSwitchFamily() {
  if (!loggedIn.value) {
    uni.navigateTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  uni.showLoading({ title: '加载中', mask: true });
  try {
    await projectProvider.loadFirst();
  } finally {
    uni.hideLoading();
  }
  const { list } = projectProvider.getState();
  if (list.length === 0) {
    uni.showToast({ title: `暂无${TERM.project}`, icon: 'none' });
    return;
  }
  const currentID = currentFamilyProvider.getState().projectID;
  if (list.length > 6) {
    uni.navigateTo({ url: '/packageUser/pages/family-manage/index' });
    return;
  }
  const nameCount = new Map<string, number>();
  list.forEach((p) => nameCount.set(p.projectName, (nameCount.get(p.projectName) || 0) + 1));
  const itemList = list.map((p) => {
    const dup = (nameCount.get(p.projectName) || 0) > 1;
    const shortId = dup ? `（ID:${String(p.projectID).slice(-4)}）` : '';
    const suffix = p.projectID === currentID ? '（当前）' : '';
    return `${p.projectName}${shortId}${suffix}`;
  });
  uni.showActionSheet({
    itemList,
    success: (res: any) => {
      const selected = list[res.tapIndex];
      if (!selected || selected.projectID === currentID) return;
      currentFamilyProvider.switchFamily(selected.projectID, selected.projectName);
      uni.showToast({ title: `已切换到${selected.projectName}`, icon: 'success' });
    },
  });
}
function handleNavTo(url: string) {
  if (!loggedIn.value) {
    uni.navigateTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  uni.navigateTo({ url });
}
async function handleLogout() {
  const res = await uni.showModal({ title: '提示', content: '确定退出登录？' });
  if (!res.confirm) return;
  await authProvider.logout();
  uni.showToast({ title: '已退出', icon: 'success' });
}
/* eslint-disable */
// import { authProvider } from '../../providers/auth.provider';
// import { tenantProvider, type TenantState } from '../../providers/tenant.provider';
// import { currentFamilyProvider, type CurrentFamilyState } from '../../providers/current-family.provider';
// import { projectProvider, type ProjectListState } from '../../providers/project.provider';
// import { TERM } from '../../config/terminology';
// import type { UserEntity } from '../../domain/entities/user.entity';
// import { appContextService } from '../../services/app-context.service';
// 
// Page({
//   data: {
//     user: null as UserEntity | null,
//     loggedIn: false,
//     TERM,
//     tenantName: '',
//     familyName: '',
//     canSwitchTenant: false,
//   },
// 
//   unsubscribes: [] as (() => void)[],
// 
//   onLoad() {
//     this.unsubscribes.push(
//       authProvider.subscribe((s) => {
//         this.setData({ user: s.user, loggedIn: s.loggedIn });
//       }),
//       tenantProvider.subscribe((s: TenantState) => {
//         this.setData({
//           tenantName: s.current?.name || '',
//           canSwitchTenant: tenantProvider.getAvailableTenants().length > 0,
//         });
//       }),
//       currentFamilyProvider.subscribe((s: CurrentFamilyState) => {
//         this.setData({ familyName: s.projectName || '' });
//       }),
//     );
//     const current = authProvider.getState();
//     this.setData({
//       user: current.user,
//       loggedIn: current.loggedIn,
//       tenantName: tenantProvider.getState().current?.name || '',
//       familyName: currentFamilyProvider.getState().projectName || '',
//       canSwitchTenant: tenantProvider.getAvailableTenants().length > 0,
//     });
//   },
// 
//   onUnload() {
//     this.unsubscribes.forEach((fn) => fn());
//   },
// 
//   handleLogin() {
//     wx.navigateTo({ url: '/packageUser/pages/login/index' });
//   },
// 
//   /* ---- 切换组织 ---- */
//   async handleSwitchTenant() {
//     if (!this.data.loggedIn) {
//       wx.navigateTo({ url: '/packageUser/pages/login/index' });
//       return;
//     }
//     const { list, current } = tenantProvider.getState();
//     const itemList = list.map((item) => (item.code === current?.code ? `${item.name}（当前）` : item.name));
//     wx.showActionSheet({
//       itemList,
//       success: async (res) => {
//         const selected = list[res.tapIndex];
//         if (!selected || selected.code === current?.code) {
//           return;
//         }
//         tenantProvider.switchTenant(selected.code);
//         await appContextService.continueAfterLogin('/pages/home/index');
//       },
//     });
//   },
// 
//   /* ---- 切换当前家庭 ---- */
//   async handleSwitchFamily() {
//     if (!this.data.loggedIn) {
//       wx.navigateTo({ url: '/packageUser/pages/login/index' });
//       return;
//     }
//     wx.showLoading({ title: '加载中', mask: true });
//     try {
//       await projectProvider.loadFirst();
//     } finally {
//       wx.hideLoading();
//     }
//     const { list } = projectProvider.getState() as ProjectListState;
//     if (list.length === 0) {
//       wx.showToast({ title: `暂无${TERM.project}`, icon: 'none' });
//       return;
//     }
//     const currentID = currentFamilyProvider.getState().projectID;
//     // 数量超过 actionSheet 上限（6 项）时，降级跳转到家庭管理页选择
//     if (list.length > 6) {
//       wx.navigateTo({ url: '/packageUser/pages/family-manage/index' });
//       return;
//     }
//     // 重名场景下追加 projectID 短码做区分，避免 itemList 出现完全相同字符串导致弹窗参数校验失败
//     const nameCount = new Map<string, number>();
//     list.forEach((p) => nameCount.set(p.projectName, (nameCount.get(p.projectName) || 0) + 1));
//     const itemList = list.map((p) => {
//       const dup = (nameCount.get(p.projectName) || 0) > 1;
//       const shortId = dup ? `（ID:${String(p.projectID).slice(-4)}）` : '';
//       const suffix = p.projectID === currentID ? '（当前）' : '';
//       return `${p.projectName}${shortId}${suffix}`;
//     });
//     wx.showActionSheet({
//       itemList,
//       success: (res) => {
//         const selected = list[res.tapIndex];
//         if (!selected || selected.projectID === currentID) return;
//         currentFamilyProvider.switchFamily(selected.projectID, selected.projectName);
//         wx.showToast({ title: `已切换到${selected.projectName}`, icon: 'success' });
//       },
//     });
//   },
// 
//   handleNavTo(e: WechatMiniprogram.CustomEvent) {
//     const url = e.currentTarget.dataset.url as string;
//     if (!this.data.loggedIn) {
//       wx.navigateTo({ url: '/packageUser/pages/login/index' });
//       return;
//     }
//     wx.navigateTo({ url });
//   },
// 
//   async handleLogout() {
//     const { confirm } = await wx.showModal({ title: '提示', content: '确定退出登录？' });
//     if (!confirm) return;
//     await authProvider.logout();
//     wx.showToast({ title: '已退出', icon: 'success' });
//   },
// });
// 
</script>

<style lang="scss" scoped>
.mine-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.mine-header {
  display: flex;
  align-items: center;
  padding: 24px 16px;
  background: var(--card-bg);
  margin-bottom: 12px;
}

.mine-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  overflow: hidden;
}

.mine-avatar__image {
  width: 100%;
  height: 100%;
  display: block;
}

.mine-avatar__text {
  color: var(--color-on-primary);
  font-size: 22px;
  font-weight: bold;
}

.mine-user-info {
  flex: 1;
}

.mine-user__name {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.mine-user__id {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.mine-user__arrow {
  margin-left: auto;
  color: var(--text-tertiary);
  font-size: 20px;
}

.mine-menu {
  background: var(--card-bg);
  border-radius: 12px;
  margin: 0 16px 12px;
  overflow: hidden;
}

.mine-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1rpx solid var(--divider);
}

.mine-menu__item:last-child {
  border-bottom: none;
}

.mine-menu__item--hover {
  background: var(--color-bg-secondary);
}

.mine-menu__label {
  font-size: 15px;
  color: var(--text-primary);
}

.mine-menu__arrow {
  font-size: 18px;
  color: var(--text-tertiary);
}

.mine-menu__right {
  display: flex;
  align-items: center;
}

.mine-menu__value {
  font-size: 14px;
  color: var(--text-secondary);
  margin-right: 4px;
}

.mine-copy-btn {
  color: var(--color-primary);
}

.mine-logout {
  margin: 24px 16px;
  padding: 14px;
  text-align: center;
  background: var(--card-bg);
  border-radius: 12px;
}

.mine-logout--hover {
  background: var(--color-bg-secondary);
}

.mine-logout__text {
  font-size: 15px;
  color: var(--color-danger);
}

.mine-picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 99;
  background: var(--color-mask);
  display: flex;
  align-items: flex-end;
}

.mine-picker-sheet {
  width: 100%;
  max-height: 70vh;
  background: var(--card-bg);
  border-radius: 8px 8px 0 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  overflow: hidden;
}

.mine-picker-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1rpx solid var(--divider);
}

.mine-picker-sheet__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.mine-picker-sheet__close {
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  font-size: 22px;
  color: var(--text-tertiary);
}

.mine-picker-sheet__list {
  max-height: 52vh;
}

.mine-picker-sheet__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1rpx solid var(--divider);
}

.mine-picker-sheet__item:last-child {
  border-bottom: none;
}

.mine-picker-sheet__item--hover {
  background: var(--color-bg-secondary);
}

.mine-picker-sheet__item-main {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.mine-picker-sheet__item-name {
  font-size: 15px;
  color: var(--text-primary);
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mine-picker-sheet__item-current {
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.mine-picker-sheet__check {
  font-size: 16px;
  color: var(--color-primary);
}

</style>
