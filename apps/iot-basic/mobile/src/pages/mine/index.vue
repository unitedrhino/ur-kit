<!-- 个人页与全局设备分享管理入口。 -->
<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view class="mine-page" scroll-y type="list">
  <view class="mobile-heading"><text class="mobile-heading__title">我的</text></view>
  <!-- 用户信息 -->
  <view class="mine-header" @tap="loggedIn ? handleProfile() : handleLogin()">
    <view class="mine-avatar">
      <image v-if="user && user.avatar" class="mine-avatar__image" :src="user.avatar" mode="aspectFill" />
      <text v-else class="mine-avatar__text">{{(user && user.nickName ? user.nickName[0] : '?')}}</text>
    </view>
    <view class="mine-user-info">
      <text class="mine-user__name">{{loggedIn && user ? user.nickName : '点击登录'}}</text>
      <text v-if="loggedIn && user" class="mine-user__id">账号：{{ user.userName || user.userID }}</text>
    </view>
    <text v-if="loggedIn" class="mine-user__arrow">›</text>
  </view>

  <!-- 组织与当前家庭切换 -->
  <view v-if="loggedIn && !singleTenantMode" class="mine-menu">
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
      <text class="mine-menu__label">当前{{TERM.project}}</text>
      <view class="mine-menu__right">
        <text class="mine-menu__value">{{familyName || '未选择'}}</text>
        <text class="mine-menu__arrow">›</text>
      </view>
    </view>
  </view>

  <view class="mine-section-title"><text>空间管理</text></view>
  <view class="mine-menu">
    <view v-if="loggedIn && familyID" class="mine-menu__item" @tap="handleAreaManage"><app-icon name="tabler:layout-grid" :size="22" /><text class="mine-menu__label">{{ TERM.areaManageTitle }}</text><text class="mine-menu__arrow">›</text></view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/family-manage/index')"><app-icon name="tabler:home" :size="22" /><text class="mine-menu__label">{{ TERM.projectManageTitle }}</text><text class="mine-menu__arrow">›</text></view>
    <view v-if="loggedIn && familyID" class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/family-members/index?projectID=' + familyID)"><app-icon name="tabler:users" :size="22" /><text class="mine-menu__label">{{ TERM.project }}成员</text><text class="mine-menu__arrow">›</text></view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/group/index')"><app-icon name="tabler:devices" :size="22" /><text class="mine-menu__label">设备分组</text><text class="mine-menu__arrow">›</text></view>
  </view>
  <view class="mine-section-title"><text>设备与服务</text></view>
  <view class="mine-menu">
    <view class="mine-menu__item" @tap="handleNavTo('/packageDevice/pages/share-manage/index')"><app-icon name="tabler:share" :size="22" /><view class="mine-menu__label"><text>设备分享</text><text class="mine-menu__description">分享与接收</text></view><text class="mine-menu__arrow">›</text></view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/alarm-list/index')"><app-icon name="tabler:bell" :size="22" /><text class="mine-menu__label">告警记录</text><text class="mine-menu__arrow">›</text></view>
    <view v-if="showDigitalLifeMenuItem" class="mine-menu__item" @tap="handleNavTo('/packageDevice/pages/digital-life/index')"><app-icon name="tabler:microphone" :size="22" /><text class="mine-menu__label">数字生命管理</text><text class="mine-menu__arrow">›</text></view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/account-security/index')"><app-icon name="tabler:user" :size="22" /><text class="mine-menu__label">账号与安全</text><text class="mine-menu__arrow">›</text></view>
    <view class="mine-menu__item" @tap="handleNavTo('/packageUser/pages/settings/index')"><app-icon name="tabler:settings" :size="22" /><text class="mine-menu__label">设置</text><text class="mine-menu__arrow">›</text></view>
  </view>

  <!-- 退出登录 -->
  <view v-if="loggedIn" class="mine-logout" @tap="handleLogout" hover-class="mine-logout--hover">
    <text class="mine-logout__text">退出登录</text>
  </view>

  <view class="mobile-tab-content" /><safe-area />
</scroll-view>

<!-- 项目选择使用完整列表，保留当前项目和同名项目区分。 -->
<view v-if="projectPickerVisible" class="mine-picker-mask" @tap="projectPickerVisible = false">
  <view class="mine-picker-sheet" role="dialog" :aria-label="`选择${TERM.project}`" @tap.stop="noop">
    <view class="mine-picker-sheet__header"><view><text class="mine-picker-sheet__title">选择{{ TERM.project }}</text><text class="mine-picker-sheet__hint">切换后查看对应项目的设备和区域</text></view><view class="mine-picker-sheet__close" role="button" aria-label="关闭" @tap="projectPickerVisible = false">×</view></view>
    <scroll-view class="mine-picker-sheet__list" scroll-y>
      <view v-for="item in projectChoices" :key="item.projectID" class="mine-picker-sheet__item" role="button" @tap="handleSelectProject(item)">
        <view class="mine-picker-sheet__item-main"><app-icon name="tabler:home" :size="20" color="var(--color-primary)" /><view class="mine-picker-sheet__project"><text class="mine-picker-sheet__item-name">{{ item.projectName }}</text><text v-if="projectNameIsDuplicate(item.projectName)" class="mine-picker-sheet__item-sub">编号尾号 {{ item.projectID.slice(-4) }}</text></view><text v-if="item.projectID === familyID" class="mine-picker-sheet__item-current">当前</text></view>
        <app-icon v-if="item.projectID === familyID" name="tabler:check" :size="20" color="var(--color-primary)" />
      </view>
    </scroll-view>
  </view>
</view>

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

<mobile-tab-bar active="pages/mine/index" />

</template>

<script setup lang="ts">
import MobileTabBar from '../../components/mobile-tab-bar/mobile-tab-bar.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { authProvider } from '../../providers/auth.provider';
import { tenantProvider } from '../../providers/tenant.provider';
import { currentFamilyProvider } from '../../providers/current-family.provider';
import { projectService } from '../../services/project.service';
import AppIcon from '../../components/app-icon/app-icon.vue';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { TERM } from '../../config/terminology';
import { config } from '../../config';
import type { UserEntity } from '../../domain/entities/user.entity';
import type { TenantEntity } from '../../domain/entities/tenant.entity';
import { appContextProvider } from '../../providers/app-context.provider';

const user = ref<UserEntity | null>(null);
const loggedIn = ref(false);
const tenantName = ref('');
const familyName = ref('');
/** familyID 控制当前项目区域入口，单台设备分享不获得项目区域入口。 */
const familyID = ref('');
// 组织选择层依赖当前组织 code、可切换组织列表和弹层开关，避免小程序系统 actionSheet 弹出不稳定。
const currentTenantCode = ref('');
const tenantList = ref<TenantEntity[]>([]);
const tenantPickerVisible = ref(false);
/** 项目弹窗使用独立列表，避免复用带筛选的项目管理状态。 */
const projectPickerVisible = ref(false);
const projectChoices = ref<ProjectEntity[]>([]);
let projectPickerRevision = 0;
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
      // 组织变化后丢弃旧项目列表，避免在新组织上下文中选择旧项目。
      if ((s.current?.code || '') !== currentTenantCode.value) { projectPickerRevision++; projectPickerVisible.value = false; projectChoices.value = []; }
      tenantName.value = s.current?.name || '';
      currentTenantCode.value = s.current?.code || '';
      tenantList.value = tenantProvider.getAvailableTenants();
    }),
    currentFamilyProvider.subscribe((s) => {
      familyName.value = s.projectName || '';
      familyID.value = s.projectID || '';
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
  familyID.value = currentFamilyProvider.getState().projectID || '';
});
onShow(() => {
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false });
  // #endif
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
  projectPickerRevision++;
  unsubscribes.forEach((fn) => fn());
});

function handleLogin() {
  uni.navigateTo({ url: '/packageUser/pages/login/index' });
}
/** handleAreaManage 打开当前项目的区域管理，不切换或扩大项目权限。 */
function handleAreaManage(): void {
  const current = currentFamilyProvider.getState();
  if (!current.projectID) return;
  handleNavTo(`/packageUser/pages/room-manage/index?projectID=${current.projectID}&projectName=${encodeURIComponent(current.projectName)}`);
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
/** 读取全部可访问项目，避免列表超过一页时遗漏或跳到其他页面。 */
async function handleSwitchFamily() {
  if (!loggedIn.value) { uni.navigateTo({ url: '/packageUser/pages/login/index' }); return; }
  const revision = ++projectPickerRevision;
  const tenantCode = tenantProvider.getState().current?.code || '';
  uni.showLoading({ title: '加载中', mask: true });
  let loadError = '';
  try {
    const list: ProjectEntity[] = [];
    for (let page = 1; page <= 200; page++) {
      const result = await projectService.getList(page, 100);
      if (revision !== projectPickerRevision || tenantCode !== (tenantProvider.getState().current?.code || '')) return;
      list.push(...result.list);
      if (result.total > 0 ? list.length >= result.total : result.list.length < 100) break;
      if (!result.list.length || page === 200) throw new Error('项目列表未完整加载，请重试');
    }
    if (!list.length) loadError = `暂无${TERM.project}`;
    else { projectChoices.value = list; projectPickerVisible.value = true; }
  } catch (err) {
    if (revision === projectPickerRevision) loadError = (err as Error).message || '项目加载失败';
  } finally {
    uni.hideLoading();
    if (loadError) uni.showToast({ title: loadError, icon: 'none' });
  }
}
/** 同名项目显示编号尾号，避免选择时混淆。 */
function projectNameIsDuplicate(name: string): boolean { return projectChoices.value.filter(item => item.projectName === name).length > 1; }
/** 选择已有项目后复用当前项目上下文与数据刷新流程。 */
function handleSelectProject(item: ProjectEntity): void {
  projectPickerVisible.value = false;
  if (item.projectID === currentFamilyProvider.getState().projectID) return;
  currentFamilyProvider.switchFamily(item.projectID, item.projectName);
  uni.showToast({ title: `已切换到${item.projectName}`, icon: 'success' });
}

function handleNavTo(url: string) {
  if (!loggedIn.value) {
    uni.navigateTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  uni.navigateTo({ url });
}
/** handleLogout 明确确认后清理登录状态并进入登录页，让退出结果可见。 */
async function handleLogout() {
  const res = await uni.showModal({ title: '退出登录', content: '确定退出当前账号吗？', cancelText: '取消', confirmText: '退出' });
  if (!res.confirm) return;
  try {
    await authProvider.logout();
    uni.reLaunch({ url: '/packageUser/pages/login/index' });
  } catch {
    uni.showToast({ title: '退出失败，请重试', icon: 'none' });
  }
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
  background: transparent;
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
  font-size: var(--font-section);
  font-weight: bold;
}

.mine-user-info {
  flex: 1;
}

.mine-user__name {
  display: block;
  font-size: var(--font-label);
  font-weight: 600;
  color: var(--text-primary);
}

.mine-user__id {
  display: block;
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: 4px;
}

.mine-user__arrow {
  margin-left: auto;
  color: var(--text-tertiary);
  font-size: var(--font-section);
}

.mine-menu {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
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
  font-size: var(--font-body);
  color: var(--text-primary);
}

.mine-menu__arrow {
  font-size: var(--font-label);
  color: var(--text-tertiary);
}

.mine-menu__right {
  display: flex;
  align-items: center;
}

.mine-menu__value {
  font-size: var(--font-body);
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
  font-size: var(--font-body);
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
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.mine-picker-sheet {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 32px);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding-bottom: 12px;
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
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--text-primary);
}

.mine-picker-sheet__close {
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  font-size: var(--font-section);
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

.mine-picker-sheet__hint { display: block; margin-top: 4px; color: var(--text-secondary); font-size: var(--font-caption); font-weight: 400; }
.mine-picker-sheet__project { min-width: 0; display: flex; flex-direction: column; }
.mine-picker-sheet__item-sub { margin-top: 3px; color: var(--text-secondary); font-size: var(--font-caption); }
.mine-picker-sheet__item-main {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.mine-picker-sheet__item-name {
  font-size: var(--font-body);
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
  font-size: var(--font-caption);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.mine-picker-sheet__check {
  font-size: var(--font-body);
  color: var(--color-primary);
}


.mine-section-title { margin: 24px 20px 12px; font-size: var(--font-section); font-weight: 650; }
.mine-header { margin: 0 16px 20px; padding: 24px 20px; background: var(--card-bg); border-radius: var(--radius-lg); }
.mine-user__name { font-size: 22px; }
.mine-user__id { font-size: var(--font-caption); word-break: break-all; }
.mine-menu__item { gap: 14px; min-height: 56px; box-sizing: border-box; }
.mine-menu__item > .app-icon { color: var(--color-primary); }
.mine-menu__label { flex: 1; min-width: 0; font-size: var(--font-body); }
.mine-menu__description { display: block; font-size: var(--font-caption); color: var(--text-secondary); margin-top: 4px; }
.mine-menu__right { max-width: 60%; min-width: 0; }
</style>
