<!-- 首页设备列表与当前项目切换，显示实际收到的设备分享标识。 -->
<template>
<app-navigation-bar :brand="true" :back="false" />

<scroll-view class="home-page" :style="`height: ${scrollHeight};`" scroll-y type="list" :refresher-enabled="loggedIn" :refresher-triggered="refreshing" @refresherrefresh="handlePullDownRefresh" @scrolltolower="loadMoreHomeDevices">
  <view class="mobile-heading">
    <text class="mobile-heading__title">智慧空间</text>
    <view class="home-nav-right">
      <view class="home-alarm-icon" aria-label="告警记录" @tap="handleAlarmTap"><alarm-badge :count="unreadAlarm" /></view>
      <view class="mobile-heading__action" role="button" aria-label="添加" @tap="handleToggleAddMenu"><app-icon name="tabler:plus" :size="26" /></view>
    </view>
  </view>
  <view class="home-project" role="button" @tap="handleToggleFamilyMenu">
    <app-icon name="tabler:home" :size="20" />
    <text>{{ currentFamilyName || (loggedIn ? '收到的设备' : '选择' + TERM.project) }}</text>
    <app-icon name="tabler:chevron-down" :size="18" />
  </view>
  <view v-if="!loggedIn" class="home-welcome__login" @tap="handleLoginTap"><text class="home-welcome__login-text">登录后查看你的设备 ›</text></view>
  <view class="home-content">
    <template v-if="loggedIn && currentFamilyID">
      <view class="home-area-nav">
        <scroll-view class="home-area-tabs" scroll-x :show-scrollbar="false">
          <view class="home-area-tabs__inner">
            <view :class="['home-area-tab', { 'home-area-tab--active': !selectedAreaID }]" @tap="selectHomeArea('')"><text>全部</text></view>
            <view v-for="area in homeAreaTabs" :key="area.areaID" :class="['home-area-tab', { 'home-area-tab--active': selectedRootAreaID === area.areaID }]" @tap="selectHomeArea(area.areaID)"><text>{{ area.areaName }}</text></view>
          </view>
        </scroll-view>
        <view class="home-area-menu-button" role="button" aria-label="区域菜单" @tap="areaMenuVisible = true"><text>☰</text></view>
      </view>
      <text v-if="areaError" class="home-area-error" @tap="loadHomeAreas">{{ areaError }} · 点击重试</text>
    </template>
    <view v-if="selectedAreaID && selectedAreaPath.length && selectedAreaTree.length > 1" class="home-area-context">
      <view class="home-area-path">
        <text class="home-area-path__link" @tap="selectHomeArea('')">全部</text>
        <template v-for="(area, index) in selectedAreaPath" :key="area.areaID">
          <text class="home-area-path__separator">›</text>
          <text :class="index === selectedAreaPath.length - 1 ? 'home-area-path__current' : 'home-area-path__link'" @tap="selectHomeArea(area.areaID)">{{ area.areaName }}</text>
        </template>
      </view>
      <view v-if="selectedAreaTree.length > 1" class="home-area-tree">
        <view class="home-area-tree__heading">
          <text>区域</text>
          <view class="home-area-scope" :class="{ 'home-area-scope--active': includeSubareas }" role="switch" :aria-checked="includeSubareas" :aria-label="includeSubareas ? '已包含下级区域设备' : '仅显示当前区域设备'" @tap="toggleIncludeSubareas">
            <app-icon :name="includeSubareas ? 'tabler:check' : 'tabler:plus'" :size="15" /><text>含下级</text>
          </view>
        </view>
        <scroll-view class="home-area-tree__list" scroll-y>
          <area-tree :key="selectedRootAreaID" :areas="selectedAreaTree" :selected-id="selectedAreaID" @select="selectHomeArea($event.areaID)" />
        </scroll-view>
      </view>
    </view>
    <view class="mobile-section-heading"><text class="mobile-section-heading__title">{{ selectedAreaName || (currentFamilyID ? '全部设备' : '收到的设备') }}</text><text class="mobile-section-heading__link" @tap="openDeviceList">设备列表 ›</text></view>
    <loading v-if="displayLoading && displayDevices.length === 0" text="加载中…" />
    <text v-else-if="selectedAreaID && areaDeviceError" class="home-area-error" @tap="loadAreaDevices(true)">{{ areaDeviceError }} · 点击重试</text>
    <view v-else-if="displayDevices.length > 0" class="mobile-card-grid">
      <view v-for="item in displayDevices" :key="JSON.stringify([item.productID, item.deviceName])" class="mobile-card-cell">
        <device-card :deviceName="item.deviceName" :deviceAlias="item.deviceAlias" :productName="item.productName" :productID="item.productID" :deviceType="item.deviceType" :areaName="deviceAreaName(item)" :isShared="item.isShared" :status="item.status" :deviceImg="item.deviceImg" :productImg="item.productImg" :allowLongPress="true" :selectionMode="selectionActive" :selected="isDeviceSelected(item)" @longpress="beginDeviceSelection(item)" @select="handleHomeCardTap(item)" />
      </view>
    </view>
    <empty-state v-else :text="selectedAreaID ? (includeSubareas ? '该区域及下级暂无设备' : '该区域还没有设备') : '还没有设备'" :buttonText="selectedAreaID ? '' : '添加设备'" @action="handleAddDevice" />
    <text v-if="displayHasMore" class="home-load-more" @tap="loadMoreHomeDevices">加载更多</text>
    <view v-if="loggedIn && currentFamilyID" class="home-scene-entry" @tap="openScenes">
      <app-icon name="tabler:home-bolt" :size="28" color="var(--navigation-active)" />
      <view class="home-scene-entry__body"><text class="home-area__name">场景联动</text><text class="home-area__meta">管理手动场景与自动化</text></view>
      <app-icon name="tabler:chevron-right" :size="18" />
    </view>
  </view>
  <view class="mobile-tab-content" /><safe-area />
</scroll-view>

<!-- 区域列表使用真实区域与统计，点击后切换设备范围。 -->
<view v-if="areaMenuVisible" class="home-popover-mask" @tap="areaMenuVisible = false">
  <view class="home-popover home-popover--right home-popover--areas" :style="`top: ${popoverTop}px;`" @tap.stop="noop">
    <view class="home-areas-heading"><text>选择区域</text><text class="home-areas-heading__tip">展开查看下级</text></view>
    <scroll-view class="home-popover__list" scroll-y :style="`max-height: ${popoverListMaxHeight}px;`">
      <view class="home-popover__item" @tap="selectHomeArea('')"><text class="home-popover__item-text">全部设备</text><text>{{ deviceTotal }}</text></view>
      <area-tree :areas="homeAreas" :selected-id="selectedAreaID" :show-count="true" @select="selectHomeArea($event.areaID)" />
    </scroll-view>
    <view class="home-popover__divider"></view>
    <view class="home-popover__item" @tap="openAreas()"><text class="home-popover__item-text">{{ TERM.areaManageTitle }}</text><app-icon name="tabler:settings" :size="18" /></view>
  </view>
</view>

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
    <view class="home-popover__item" hover-class="home-popover__item--hover" @tap="handleAddDevice">
      <view class="home-popover__item-left">
        <app-icon class="home-popover__item-icon" name="tabler:plus" :size="16" />
        <text class="home-popover__item-text">添加设备</text>
      </view>
      <app-icon class="home-popover__chevron" name="tabler:chevron-right" :size="16" />
    </view>
    <view class="home-popover__item" hover-class="home-popover__item--hover" @tap="handleScan">
      <view class="home-popover__item-left">
        <app-icon class="home-popover__item-icon" name="tabler:camera" :size="16" />
        <text class="home-popover__item-text">扫一扫</text>
      </view>
      <app-icon class="home-popover__chevron" name="tabler:chevron-right" :size="16" />
    </view>
    <view class="home-popover__divider home-popover__divider--inset"></view>
    <view class="home-popover__item" @tap="createHomeScene('manual')"><text class="home-popover__item-text">手动控制</text><app-icon name="tabler:chevron-right" :size="16" /></view>
    <view class="home-popover__item" @tap="createHomeScene('auto')"><text class="home-popover__item-text">自动化</text><app-icon name="tabler:chevron-right" :size="16" /></view>
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



<device-selection-bar v-if="selectionActive" :items="selectedDevices" :projectID="currentFamilyID" @close="clearDeviceSelection" @moved="handleSelectedDevicesMoved" />
<mobile-tab-bar v-else active="pages/home/index" />

</template>

<script setup lang="ts">
import MobileTabBar from '../../components/mobile-tab-bar/mobile-tab-bar.vue';
import DeviceSelectionBar from '../../components/device-selection-bar/device-selection-bar.vue';
import { useDeviceSelection } from '../../utils/use-device-selection';
import { useClientDebugPage } from '../../utils/use-client-debug-page';
import AppIcon from '../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../components/app-navigation-bar/app-navigation-bar.vue';
import DeviceCard from '../../components/device-card/device-card.vue';
import AreaTree from '../../components/area-tree/area-tree.vue';
import { getAreaPath, getAreaSubtree } from '../../utils/area-tree';
import EmptyState from '../../components/empty-state/empty-state.vue';
import Loading from '../../components/loading/loading.vue';
import SafeArea from '../../components/safe-area/safe-area.vue';
import { computed, ref, onUnmounted } from 'vue';
import { onLoad, onShow, onReady } from '@dcloudio/uni-app';
import { areaService } from '../../services/area.service';
import type { AreaEntity } from '../../domain/entities/area.entity';
import { deviceListProvider } from '../../providers/device-list.provider';
import { alarmProvider } from '../../providers/alarm.provider';
import { messageProvider } from '../../providers/message.provider';
import { authProvider } from '../../providers/auth.provider';
import { currentFamilyProvider } from '../../providers/current-family.provider';
import { projectProvider } from '../../providers/project.provider';
import { tenantProvider } from '../../providers/tenant.provider';
import { deviceService } from '../../services/device.service';
import { getSystemInfo } from '../../utils/platform';
import { TERM } from '../../config/terminology';
import { config } from '../../config';
import type { DeviceEntity } from '../../domain/entities/device.entity';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import { ensurePageReady, ensureLoggedInForAction } from '../../utils/page-guard';
// #ifdef MP-WEIXIN
import { ensureScanCameraReady } from '../../services/scan-permission.service';
import { parseDeviceShareQr } from '../../services/device-share-link.service';
import { parseProjectInviteQr } from '../../services/project-invite.service';
// #endif

/** 首页区域使用独立状态，避免覆盖区域管理页的层级与筛选。 */
const homeAreas = ref<AreaEntity[]>([]);
const areaTotal = ref(0);
const areaLoading = ref(false);
const areaError = ref('');
const canManageAreas = ref(false);
let areaRevision = 0;
/** 首页按区域独立分页，避免污染设备页及共享设备的全局筛选。 */
const selectedAreaID = ref('');
const areaMenuVisible = ref(false);
/** 默认合并当前区域及所有下级的设备。 */
const includeSubareas = ref(true);
const areaDevices = ref<DeviceEntity[]>([]);
const allDevicesHasMore = ref(false);
const areaDeviceLoading = ref(false);
const areaDeviceError = ref('');
const areaDevicePage = ref(0);
const areaDeviceHasMore = ref(false);
let areaDeviceRevision = 0;
/** homeContextKey 区分企业及项目，避免切换后保留旧区域。 */
let homeContextKey = '';
const selectedAreaName = computed(() => homeAreas.value.find(area => area.areaID === selectedAreaID.value)?.areaName || '');
/** 当前区域完整路径与下级树直接展示，方便逐级返回或进入。 */
const selectedAreaPath = computed(() => getAreaPath(homeAreas.value, selectedAreaID.value));
/** 一级区域保持高亮，切换下级时区域树内容和折叠状态保持稳定。 */
const selectedRootAreaID = computed(() => selectedAreaPath.value[0]?.areaID || '');
const selectedAreaTree = computed(() => getAreaSubtree(homeAreas.value, selectedRootAreaID.value));
/** 横向入口只展示一级区域，孤儿区域作为可访问的一级入口。 */
const homeAreaTabs = computed(() => { const ids = new Set(homeAreas.value.map(area => area.areaID)); return homeAreas.value.filter(area => !ids.has(area.parentAreaID)); });
const displayDevices = computed(() => selectedAreaID.value ? areaDevices.value : devices.value);
const displayLoading = computed(() => selectedAreaID.value ? areaDeviceLoading.value : loading.value);
const displayHasMore = computed(() => selectedAreaID.value ? areaDeviceHasMore.value : allDevicesHasMore.value);
/** deviceAreaName 只为当前项目设备显示区域，跨项目分享不借用本项目区域名称。 */
function deviceAreaName(device: DeviceEntity): string {
  if (device.projectID !== currentFamilyID.value) return '';
  return homeAreas.value.find(area => area.areaID === device.areaID)?.areaName || '';
}
/** selectHomeArea 切换范围时丢弃旧请求，全部设备沿用现有权限与分享逻辑。 */
function selectHomeArea(areaID: string): void {
  areaMenuVisible.value = false;
  selectedAreaID.value = areaID;
  areaDeviceRevision++;
  areaDevices.value = []; areaDevicePage.value = 0; areaDeviceHasMore.value = false; areaDeviceError.value = '';
  if (areaID) void loadAreaDevices(true);
}
/** toggleIncludeSubareas 切换范围后重置分页，避免旧结果混入新范围。 */
function toggleIncludeSubareas(): void {
  includeSubareas.value = !includeSubareas.value;
  areaDevices.value = []; areaDevicePage.value = 0; areaDeviceHasMore.value = false;
  void loadAreaDevices(true);
}
/** loadAreaDevices 按区域集合读取分页，旧区域或旧项目的迟到响应不覆盖当前页面。 */
async function loadAreaDevices(reset = false): Promise<void> {
  const areaID = selectedAreaID.value;
  const projectID = currentFamilyID.value;
  if (!areaID || !projectID || (areaDeviceLoading.value && !reset)) return;
  const revision = reset ? ++areaDeviceRevision : areaDeviceRevision;
  const page = reset ? 1 : areaDevicePage.value + 1;
  areaDeviceLoading.value = true; areaDeviceError.value = '';
  try {
    if (includeSubareas.value && (areaLoading.value || areaError.value)) throw new Error('区域列表未加载完成，请重试');
    const ids = includeSubareas.value ? getAreaSubtree(homeAreas.value, areaID).map(area => area.areaID) : [areaID];
    if (!ids.length) throw new Error('未找到当前区域，请重试');
    const allowed = new Set(ids);
    const result = await deviceService.getList({ projectID, page, size: 20, areaIDs: ids });
    if (revision !== areaDeviceRevision || areaID !== selectedAreaID.value || projectID !== currentFamilyID.value) return;
    // 后端可能附带跨项目分享；区域视图仅保留当前项目及所选区域范围内的设备。
    const list = result.list.filter(item => item.projectID === projectID && allowed.has(item.areaID));
    areaDevices.value = reset ? list : [...areaDevices.value, ...list];
    areaDevicePage.value = page;
    areaDeviceHasMore.value = result.list.length > 0 && page * 20 < result.total;
  } catch (error) {
    if (revision === areaDeviceRevision) areaDeviceError.value = (error as Error).message || '设备加载失败';
  } finally { if (revision === areaDeviceRevision) areaDeviceLoading.value = false; }
}
/** loadMoreHomeDevices 按当前选择加载下一页。 */
function loadMoreHomeDevices(): void {
  if (selectedAreaID.value) { if (areaDeviceHasMore.value) void loadAreaDevices(); }
  else if (deviceListProvider.getState().pageState.hasMore) void deviceListProvider.loadMore();
}
/** 设备统计使用当前可见列表的服务端总数，包含跨项目收到的分享。 */
const deviceTotal = ref(0);
const overviewDeviceCount = computed(() => deviceTotal.value);
const overviewOnlineCount = computed(() => devices.value.filter(item => item.status === 2).length);
/** loadHomeAreas 在项目或账号切换时忽略旧请求，不带入上一个空间的数据。 */
async function loadHomeAreas(): Promise<void> {
  const revision = ++areaRevision;
  const projectID = currentFamilyID.value;
  homeAreas.value = []; areaTotal.value = 0; canManageAreas.value = false; areaError.value = '';
  if (!projectID || !loggedIn.value) { areaLoading.value = false; return; }
  areaLoading.value = true;
  try {
    const [result, canManage] = await Promise.all([
      areaService.getList(projectID, 1, 100),
      areaService.canManage(projectID, authProvider.getState().user?.userID || ''),
    ]);
    if (revision !== areaRevision) return;
    const list = [...result.list];
    for (let page = 2; list.length < result.total; page++) {
      if (page > 200) throw new Error('区域数量过多，请在区域管理查看');
      const next = await areaService.getList(projectID, page, 100);
      if (revision !== areaRevision) return;
      if (!next.list.length) throw new Error('区域列表未完整加载');
      list.push(...next.list);
    }
    homeAreas.value = list.filter(area => area.areaID !== '2'); areaTotal.value = result.total; canManageAreas.value = canManage;
  } catch (error) {
    if (revision === areaRevision) areaError.value = (error as Error).message || '区域加载失败';
  } finally { if (revision === areaRevision) areaLoading.value = false; }
}
/** 完整刷新区域后再查询设备，避免下级范围使用不完整的区域列表。 */
async function refreshHomeAreasAndDevices(): Promise<void> {
  await loadHomeAreas();
  if (selectedAreaID.value && !areaLoading.value && !areaError.value) await loadAreaDevices(true);
}
/** openAreas 进入现有区域层级浏览，未分类项回到区域列表。 */
function openAreas(area?: AreaEntity): void {
  areaMenuVisible.value = false;
  if (!currentFamilyID.value) return;
  const parent = area && area.areaID !== '2' ? `&parentAreaID=${encodeURIComponent(area.areaID)}&parentAreaName=${encodeURIComponent(area.areaName)}` : '';
  uni.navigateTo({ url: `/packageUser/pages/room-manage/index?projectID=${encodeURIComponent(currentFamilyID.value)}&projectName=${encodeURIComponent(currentFamilyName.value)}${parent}` });
}
/** createArea 仅展示给已确认有管理资格的用户，编辑页仍独立核验。 */
function createArea(): void {
  if (!canManageAreas.value) return;
  uni.navigateTo({ url: `/packageUser/pages/room-edit/index?projectID=${encodeURIComponent(currentFamilyID.value)}&parentAreaID=1` });
}
/** openDeviceList 查看当前上下文的完整设备列表。 */
function openDeviceList(): void { uni.switchTab({ url: '/pages/device/index' }); }
/** createHomeScene 复用现有场景表单，保留项目和权限校验。 */
function createHomeScene(type: 'manual' | 'auto'): void {
  handleCloseMenus();
  if (!ensureLoggedInForAction('/packageScene/pages/create/index', { type })) return;
  uni.navigateTo({ url: `/packageScene/pages/create/index?type=${type}` });
}
/** openScenes 复用场景主页面，不在首页直接执行设备动作。 */
function openScenes(): void { uni.switchTab({ url: '/pages/scene/index' }); }
/** 多选仅属于首页，不更改全局设备列表筛选。 */
const { active: selectionActive, selected: selectedDevices, isSelected: isDeviceSelected, begin: beginDeviceSelection, toggle: toggleDeviceSelection, clear: clearDeviceSelection, retain: retainDeviceSelection } = useDeviceSelection();
/** handleHomeCardTap 在选择模式勾选设备，正常模式打开详情。 */
function handleHomeCardTap(device: DeviceEntity): void {
  if (selectionActive.value) toggleDeviceSelection(device);
  else handleDeviceTap(device);
}
/** handleSelectedDevicesMoved 只保留失败项并刷新两个区域范围及设备统计。 */
async function handleSelectedDevicesMoved(failed: DeviceEntity[]): Promise<void> {
  retainDeviceSelection(failed);
  await Promise.all([deviceListProvider.loadFirst(), refreshHomeAreasAndDevices()]);
}
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
const scrollHeight = `calc(100vh - ${navBarHeight}px)`;
const popoverListMaxHeight = Math.max(200, Math.floor((sys.screenHeight || 600) * 0.5));

const unsubscribes: Array<() => void> = [];

function noop(): void {}

/** 小程序首页承接已发布首页的 URL Link，保留令牌并转交接收页。 */
let pendingShareLaunch = '';
onReady(() => { if (pendingShareLaunch) { const url = pendingShareLaunch; pendingShareLaunch = ''; uni.navigateTo({url}); } });
onLoad((query?: Record<string, unknown>) => {
  // #ifdef MP-WEIXIN
  if (typeof query?.deviceShareToken === 'string' && query.deviceShareToken) {
    pendingShareLaunch = `/packageDevice/pages/share-accept/index?shareToken=${encodeURIComponent(query.deviceShareToken)}&shareTenant=${encodeURIComponent(String(query.shareTenant || ''))}`;
  }
  // #endif
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
      deviceTotal.value = s.pageState.total;
      allDevicesHasMore.value = s.pageState.hasMore;
      loading.value = s.pageState.loading;
    }),
    alarmProvider.subscribe((s) => {
      unreadAlarm.value = s.unreadCount;
    }),
    currentFamilyProvider.subscribe((s) => {
      const nextContextKey = `${s.currentTenantCode}:${s.projectID}`;
      if (homeContextKey !== nextContextKey) { clearDeviceSelection(); selectHomeArea(''); }
      homeContextKey = nextContextKey;
      currentFamilyName.value = s.projectName;
      currentFamilyID.value = s.projectID;
      void loadHomeAreas();
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
  // #ifdef MP-WEIXIN
  uni.hideTabBar({ animation: false });
  // #endif
  const ready = await ensurePageReady('/pages/home/index');
  if (!ready) {
    loading.value = false;
    refreshing.value = false;
    return;
  }
  if (authProvider.isLoggedIn()) {
    void messageProvider.loadFirst();
    deviceListProvider.setFilter({});
    deviceListProvider.loadFirst();
    projectProvider.loadFirst();
    void refreshHomeAreasAndDevices();
  } else {
    loading.value = false;
  }
});

onUnmounted(() => {
  areaRevision++;
  areaDeviceRevision++;
  unsubscribes.forEach((fn) => fn());
});

/** handlePullDownRefresh 同时刷新项目、当前项目设备、区域树和选中区域设备。 */
async function handlePullDownRefresh(): Promise<void> {
  if (refreshing.value || !authProvider.isLoggedIn()) {
    refreshing.value = false;
    return;
  }
  refreshing.value = true;
  try {
    await Promise.all([
      projectProvider.loadFirst(),
      deviceListProvider.loadFirst(),
      refreshHomeAreasAndDevices(),
    ]);
  } finally {
    refreshing.value = false;
    uni.stopPullDownRefresh();
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
  if (!ensureLoggedInForAction('/packageUser/pages/alarm-list/index')) return;
  uni.navigateTo({ url: '/packageUser/pages/alarm-list/index' });
}
function handleAddDevice() {
  handleCloseMenus();
  if (!ensureLoggedInForAction('/packageDevice/pages/bind/index')) return;
  uni.navigateTo({ url: '/packageDevice/pages/bind/index' });
}
/** 首页扫一扫在微信小程序直接打开相机，扫码结果再按邀请、分享或设备码分流。 */
async function handleScan() {
  handleCloseMenus();
  if (!ensureLoggedInForAction()) return;
  // #ifdef MP-WEIXIN
  if (!await ensureScanCameraReady()) return;
  uni.scanCode({ scanType: ['qrCode'], onlyFromCamera: false, success: (result) => {
    const raw = result.result || '';
    const projectInvite = parseProjectInviteQr(raw);
    if (projectInvite) { uni.navigateTo({ url: `/packageUser/pages/project-invite/index?inviteToken=${encodeURIComponent(projectInvite.token)}` }); return; }
    const share = parseDeviceShareQr(raw);
    if (share) { uni.navigateTo({ url: `/packageDevice/pages/share-accept/index?shareToken=${encodeURIComponent(share.token)}&shareTenant=${encodeURIComponent(share.tenant)}` }); return; }
    uni.navigateTo({ url: `/packageDevice/pages/bind/index?scanResult=${encodeURIComponent(raw)}` });
  }, fail: (error) => { if (!(error.errMsg || '').includes('cancel')) uni.showToast({ title: '扫码失败', icon: 'none' }); } });
  return;
  // #endif
  // #ifndef MP-WEIXIN
  if (!ensureLoggedInForAction('/packageDevice/pages/bind/index', { scan: '1' })) return;
  uni.navigateTo({ url: '/packageDevice/pages/bind/index?scan=1' });
  // #endif
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
  // 页面在登录恢复期间可能早于设备列表订阅初始化，主动刷新新项目并复用 Provider 的上下文防护。
  deviceListProvider.setFilter({});
  void deviceListProvider.loadFirst();
}

function handleRefresh() {
  handleCloseMenus();
  if (!ensureLoggedInForAction()) return;
  deviceListProvider.loadFirst();
  void refreshHomeAreasAndDevices();
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
  background: transparent;
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
  font-size: var(--font-body);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-section);
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
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-right: 8px;
}

.home-current-family__name {
  flex: 1;
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--text-primary);
}

.home-current-family__arrow {
  font-size: var(--font-label);
  color: var(--text-tertiary);
}

.home-shortcut__label {
  font-size: var(--font-caption);
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
  font-size: var(--font-label);
  font-weight: bold;
  color: var(--text-primary);
}

.home-section__count {
  font-size: var(--font-caption);
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
  background: transparent;
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
  font-size: var(--font-section);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-body);
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
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

/* 首页概览与设备双列使用同一间距，卡片高度允许长名称自然换行。 */
.home-project { display: flex; align-items: center; gap: 10px; margin: 0 16px 20px; font-size: var(--font-label); }
.home-overview { display: flex; gap: 8px; margin: 0 16px; }
.home-overview__pill { display: flex; flex: 1; justify-content: center; align-items: center; gap: 5px; padding: 12px 4px; background: var(--card-bg); border-radius: var(--radius-full); font-size: var(--font-caption); white-space: nowrap; }
.home-overview__pill .app-icon { color: var(--color-primary); }
.home-content { padding: 0 16px; }
.home-area { box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; min-height: 154px; padding: 16px; border-radius: var(--radius-lg); background: var(--card-bg); }
.home-area__top { flex: 1; display: flex; justify-content: space-between; align-items: flex-start; color: var(--color-primary); margin-bottom: 18px; }
.home-area__name { display: block; font-size: var(--font-label); font-weight: 600; word-break: break-all; }
.home-area__meta { display: block; font-size: var(--font-caption); color: var(--text-secondary); line-height: 1.5; }
.home-area--add { background: transparent; border: 1px dashed var(--text-placeholder); color: var(--color-primary); }
.home-area-error { display: block; padding: 16px; color: var(--color-error); }
.home-scene-entry { display: flex; align-items: center; gap: 14px; margin-top: 20px; padding: 20px; background: var(--card-bg); border-radius: var(--radius-lg); }
.home-scene-entry__body { flex: 1; }

/* 区域选择面板与横向导航沿用移动端主题。 */
.home-area-context { margin: 12px 0 18px; padding: 12px; border-radius: var(--radius-md); background: var(--card-bg); }
.home-area-path { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-height: 28px; padding: 0 4px; color: var(--text-secondary); font-size: var(--font-caption); }
.home-area-path__link { color: var(--color-primary); padding: 4px 0; }.home-area-path__current { color: var(--text-primary); font-weight: 600; }.home-area-path__separator { color: var(--text-placeholder); }
.home-area-tree { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border-color); }
.home-area-tree__heading { display: flex; justify-content: space-between; align-items: center; padding: 0 4px 6px; font-size: var(--font-label); font-weight: 600; }
.home-area-scope { display: flex; align-items: center; gap: 4px; padding: 7px 10px; border-radius: var(--radius-full); background: var(--surface-muted); color: var(--text-secondary); font-size: var(--font-caption); font-weight: 500; }
.home-area-scope--active { background: var(--color-primary-light); color: var(--color-primary); }
.home-area-tree__list { max-height: 220px; }
.home-area-tree :deep(.area-tree__row) { margin: 2px 0; border: 0; border-radius: var(--radius-sm); transition: background-color 180ms ease, color 180ms ease; }
.home-area-tree :deep(.area-tree__row--selected) { font-weight: 600; }
.home-area-nav { display: flex; align-items: center; gap: 8px; margin: 16px 0 4px; }
.home-area-tabs { flex: 1; min-width: 0; white-space: nowrap; }
.home-popover--areas { width: min(320px, calc(100vw - 24px)); border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 12px 36px var(--color-shadow); }
.home-areas-heading { padding: 16px 16px 10px; display: flex; justify-content: space-between; align-items: center; font-size: var(--font-label); font-weight: 600; color: var(--text-primary); }
.home-areas-heading__tip { font-size: var(--font-caption); font-weight: 400; color: var(--text-secondary); }
.home-popover--areas :deep(.area-tree__row) { margin: 2px 8px; border: 0; border-radius: var(--radius-sm); }
.home-popover--areas :deep(.area-tree__row--selected) { font-weight: 600; }
.home-area-tabs__inner { display: inline-flex; width: max-content; flex-wrap: nowrap; gap: 20px; align-items: center; }
.home-area-tab { display: inline-flex; flex-shrink: 0; white-space: nowrap; align-items: center; min-height: 44px; color: var(--text-secondary); font-size: var(--font-body); border-bottom: 3px solid transparent; }
.home-area-tab--active { color: var(--text-primary); font-weight: 700; border-bottom-color: var(--color-primary); }
.home-area-menu-button { width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; color: var(--text-primary); font-size: var(--font-section); }
.home-load-more { display: block; padding: 18px; text-align: center; color: var(--color-primary); font-size: var(--font-caption); }
</style>
