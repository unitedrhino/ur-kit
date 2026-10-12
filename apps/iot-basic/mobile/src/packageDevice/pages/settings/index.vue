<template>
<app-navigation-bar title="设备设置" />

<scroll-view class="ds-page" scroll-y type="list" :show-scrollbar="false">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else-if="device">
    <!-- 信息分组 -->
    <view class="ds-group">
      <view class="ds-row" @tap="handleEditName" hover-class="ds-row--hover">
        <text class="ds-row__label">设备名</text>
        <view class="ds-row__right">
          <text class="ds-row__value">{{device.deviceAlias || device.deviceName}}</text>
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
      <view class="ds-row">
        <text class="ds-row__label">设备ID</text>
        <view class="ds-row__right ds-row__right--copy">
          <text class="ds-row__value ds-row__value--id">{{device.deviceName}}</text>
          <view class="ds-copy-btn" @tap.stop="handleCopyDeviceID" hover-class="ds-copy-btn--hover" aria-label="复制设备ID">
            <app-icon name="tabler:copy" :size="18" color="var(--color-primary)" aria-label="复制设备ID" />
          </view>
        </view>
      </view>
      <view class="ds-row" @tap="handleEditArea" hover-class="ds-row--hover">
        <text class="ds-row__label">设备{{TERM.area}}</text>
        <view class="ds-row__right">
          <text class="ds-row__value">{{areaName || '未设置'}}</text>
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
      <view class="ds-row" @tap="handleEditLocation" hover-class="ds-row--hover">
        <text class="ds-row__label">设备位置</text>
        <view class="ds-row__right">
          <text class="ds-row__value">{{locationText}}</text>
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
      <view class="ds-row" @tap="handleOpenDeviceInfo" hover-class="ds-row--hover">
        <text class="ds-row__label">更多</text>
        <view class="ds-row__right">
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 操作分组 -->
    <view class="ds-group">
      <view v-if="canChangeNetwork" class="ds-row" @tap="handleChangeNetwork" hover-class="ds-row--hover">
        <text class="ds-row__label">Wi-Fi 管理</text>
        <view class="ds-row__right"><text class="ds-row__value">添加或更换网络</text><text class="ds-row__arrow">›</text></view>
      </view>
      <view class="ds-row" @tap="handleShare" hover-class="ds-row--hover">
        <text class="ds-row__label">设备分享</text>
        <view class="ds-row__right">
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
      <view class="ds-row" @tap="handleCheckVersion" hover-class="ds-row--hover">
        <text class="ds-row__label">设备版本</text>
        <view class="ds-row__right">
          <text class="ds-row__value">{{versionLabel}}</text>
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
      <view class="ds-row" @tap="handleOpenManual" hover-class="ds-row--hover">
        <text class="ds-row__label">说明书</text>
        <view class="ds-row__right">
          <text class="ds-row__arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 系统功能分组 -->
    <view v-if="systemPropertyItems.length > 0" class="ds-group ds-system-group">
      <view class="ds-group-head">
        <text class="ds-group-head__title">系统功能</text>
      </view>
      <template v-for="item in systemPropertyItems" :key="item.identifier">
        <view
          v-if="item.property.mode === 'r'"
          :class="`ds-row ${isLongSystemValue(item.property) ? 'ds-row--detail' : ''}`"
          :hover-class="isLongSystemValue(item.property) ? 'ds-row--hover' : ''"
          @tap="isLongSystemValue(item.property) ? handleSystemValueDetail(item.property) : null"
        >
          <text class="ds-row__label">{{item.property.name}}</text>
          <view class="ds-row__right">
            <text class="ds-row__value">{{formatSystemPropertyDisplayValue(item.property)}}</text>
          </view>
        </view>
        <view v-else class="ds-system-control-row">
          <property-control
            :label="item.property.name"
            :dataID="item.property.identifier"
            :define="item.property.define"
            :value="item.property.value"
            :mode="item.property.mode"
            :ref="(el) => onSystemPropertyControlRef(item.property.identifier, el)"
            @change="handleSystemPropertyChange"
          />
        </view>
      </template>
    </view>

    <!-- 危险操作分组 -->
    <view class="ds-group ds-group--danger">
      <view class="ds-row ds-row--danger" @tap="handleDelete" hover-class="ds-row--hover">
        <text class="ds-row__label ds-row__label--danger">删除设备</text>
      </view>
    </view>
  </template>
  <safe-area />
</scroll-view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { computed, ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { deviceService } from '../../../services/device.service';
import { provisionProvider } from '../../../providers/provision.provider';
import { DeviceNetworkRepository } from '../../../data/repositories/device-network.repository';
import { deviceControlService } from '../../../services/device-control.service';
import { buildDeviceControlCardUi } from '../../../services/device-control-card-ui.service';
import { areaService } from '../../../services/area.service';
import { otaService } from '../../../services/ota.service';
import { config } from '../../../config';
import { TERM } from '../../../config/terminology';
import type { DeviceEntity } from '../../../domain/entities/device.entity';
import type { DeviceControlModel, PropertyItem } from '../../../domain/models/device-control.model';
import { ensurePageReady } from '../../../utils/page-guard';
import { formatGeoPoint } from '../../../domain/models/location.model';

const loading = ref(true);
const productID = ref('');
const deviceName = ref('');
const device = ref<DeviceEntity | null>(null);
const controlModel = ref<DeviceControlModel | null>(null);
const areaName = ref('');
const locationText = ref('未设置');
const versionLabel = ref('');
const versionChecking = ref(false);
/** 防止重复点击并发创建换网请求。 */
const networkRequesting = ref(false);
/** 页面销毁后忽略确认框及平台请求的迟到结果。 */
const networkPage = { closed: false };
onUnload(() => {
  networkPage.closed = true;
  if (networkRequesting.value) provisionProvider.cancel('PAGE_UNLOADED');
});
/** 权限由平台核验真实项目归属；具体固件能力在 BLE 连接后核验。 */
const canChangeNetwork = ref(false);

/** handleChangeNetwork 提示本地开启 BLE，平台检查权限后进入候选配网，不修改绑定。 */
async function handleChangeNetwork(): Promise<void> {
  const target = device.value;
  if (!target || networkRequesting.value) return;
  networkRequesting.value = true;
  try {
    if (networkPage.closed) return;
    await provisionProvider.startNetworkChange({ productID: target.productID, deviceName: target.deviceName });
    if (networkPage.closed) return;
    uni.navigateTo({
      url: '/packageBluetooth/pages/prepare/index?changeNetwork=1',
      fail: () => provisionProvider.cancel('NAVIGATION_FAILED'),
    });
  } catch (error) {
    if (networkPage.closed) return;
    provisionProvider.cancel('NETWORK_REQUEST_FAILED');
    uni.showModal({ title: '无法开始换网', content: (error as Error).message || '请稍后重试', showCancel: false });
  } finally {
    networkRequesting.value = false;
  }
}
const systemPropertyControlRefs = ref(new Map<string, PropertyControlExpose>());

/** SYSTEM_VALUE_LONG_LIMIT 是系统属性值触发查看详情的长度阈值，与详情页九宫格保持一致。 */
const SYSTEM_VALUE_LONG_LIMIT = 14;

const cardUi = computed(() => buildDeviceControlCardUi(controlModel.value));
const systemPropertyItems = computed(() => cardUi.value.systemPropertyCard.items);

interface PropertyControlExpose {
  handleCommitResult?: (payload: { commitSeq: number; success: boolean }) => void;
}

async function loadDevice() {
  loading.value = true;
  canChangeNetwork.value = false;
  try {
    const d = await deviceService.getDetail(productID.value, deviceName.value);
    let an = '';
    if (d.areaID) {
      try {
        const area = await areaService.getOne(d.areaID);
        an = area.areaName || '';
      } catch {
        an = '';
      }
    }
    device.value = d;
    try {
      const permission = await new DeviceNetworkRepository().authorize(d);
      if (!networkPage.closed && device.value?.productID === d.productID && device.value?.deviceName === d.deviceName) {
        canChangeNetwork.value = permission.allowed && [2, 7].includes(d.netType ?? 0);
      }
    } catch { /* 未授权或权限服务不可用时隐藏入口，不影响其他设备设置。 */ }
    areaName.value = an;
    locationText.value = formatGeoPoint(d.position);
    versionLabel.value = d.version || '未知';
    await loadSystemProperties(d);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

/** loadSystemProperties 加载系统属性，不阻塞设备基础设置展示。 */
async function loadSystemProperties(d: DeviceEntity): Promise<void> {
  try {
    controlModel.value = await deviceControlService.loadControlModel(d);
  } catch {
    controlModel.value = null;
  }
}

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const o = options || {};
  const ready = await ensurePageReady('/packageDevice/pages/settings/index', o);
  if (!ready) {
    loading.value = false;
    return;
  }
  const pid = o.productID || '';
  const dn = o.deviceName || '';
  if (!pid || !dn) {
    loading.value = false;
    return;
  }
  productID.value = pid;
  deviceName.value = dn;
  await loadDevice();
});

onShow(() => {
  if (productID.value && deviceName.value && !loading.value) {
    void loadDevice();
  }
});

function handleEditName() {
  const d = device.value;
  if (!d) return;
  const current = d.deviceAlias || d.deviceName;
  uni.navigateTo({
    url: `/packageDevice/pages/edit-name/index?productID=${d.productID}&deviceName=${d.deviceName}&current=${encodeURIComponent(current)}`,
  });
}

/** handleCopyDeviceID 复制当前设备的真实设备 ID。 */
function handleCopyDeviceID() {
  const d = device.value;
  if (!d || !d.deviceName) return;
  uni.setClipboardData({
    data: d.deviceName,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' }),
  });
}

function handleEditArea() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/edit-area/index?productID=${d.productID}&deviceName=${d.deviceName}&projectID=${d.projectID}&areaID=${d.areaID || ''}`,
  });
}

function handleEditLocation() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/edit-location/index?productID=${d.productID}&deviceName=${d.deviceName}`,
  });
}

function handleShare() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/share/index?productID=${d.productID}&deviceName=${d.deviceName}`,
  });
}

/** formatSystemDateTime 将时间戳格式化为设置页属性展示文本。 */
function formatSystemDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** formatSystemPropertyValue 根据物模型类型生成系统属性展示文本。 */
function formatSystemPropertyValue(item: PropertyItem): string {
  const value = item.value;
  const define = item.define;
  if (value === null || value === undefined || value === '') return '—';
  if (define.type === 'bool') {
    const on = value === true || value === 1 || value === '1';
    return define.mapping?.[on ? '1' : '0'] || (on ? '开' : '关');
  }
  if (define.type === 'enum') {
    return define.mapping?.[String(value)] || String(value);
  }
  if (define.type === 'timestamp') {
    const ts = Number(value);
    return ts ? formatSystemDateTime(ts) : '—';
  }
  return String(value);
}

/** formatSystemPropertyDisplayValue 生成系统属性 cell 里的值文本。 */
function formatSystemPropertyDisplayValue(item: PropertyItem): string {
  const text = formatSystemPropertyValue(item);
  if (text === '—') return text;
  return item.define.unit ? `${text} ${item.define.unit}` : text;
}

/** isLongSystemValue 判断系统属性展示文本是否超长，超长行提供查看详情入口。 */
function isLongSystemValue(item: PropertyItem): boolean {
  return formatSystemPropertyDisplayValue(item).length > SYSTEM_VALUE_LONG_LIMIT;
}

/** handleSystemValueDetail 弹窗展示超长系统属性值的完整内容。 */
function handleSystemValueDetail(item: PropertyItem): void {
  uni.showModal({
    title: item.name,
    content: formatSystemPropertyDisplayValue(item),
    showCancel: false,
    confirmText: '知道了',
  });
}

/** handleOpenDeviceInfo 进入设备信息页查看完整设备详情。 */
function handleOpenDeviceInfo() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/device-info/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}

/** onSystemPropertyControlRef 保存系统属性控件实例，用于提交成功或失败后清理草稿态。 */
function onSystemPropertyControlRef(identifier: string, instance: unknown): void {
  if (!identifier) return;
  if (instance) {
    systemPropertyControlRefs.value.set(identifier, instance as PropertyControlExpose);
    return;
  }
  systemPropertyControlRefs.value.delete(identifier);
}

/** notifySystemPropertyCommitResult 通知系统属性控件本次下发结果。 */
function notifySystemPropertyCommitResult(
  dataID: string,
  commitSeq: number | undefined,
  success: boolean,
): void {
  const control = systemPropertyControlRefs.value.get(dataID);
  if (!control || !control.handleCommitResult || !commitSeq) return;
  control.handleCommitResult({ commitSeq, success });
}

/** updateSystemPropertyValue 在下发成功后更新本地控制模型里的最新属性值。 */
function updateSystemPropertyValue(dataID: string, rawValue: unknown): void {
  const model = controlModel.value;
  if (!model) return;
  controlModel.value = {
    ...model,
    properties: model.properties.map((property) => (
      property.identifier === dataID
        ? { ...property, value: rawValue, timestamp: Date.now() }
        : property
    )),
  };
}

/** handleSystemPropertyChange 下发设备设置页中的系统可写属性。 */
function handleSystemPropertyChange(e: any): void {
  const payload = (e && e.detail) ? e.detail : e;
  if (!payload || !payload.dataID) return;
  const d = device.value;
  if (!d) return;
  const item = systemPropertyItems.value.find((propertyItem) => propertyItem.identifier === payload.dataID);
  if (!item || item.property.mode === 'r') return;
  const commitSeq = typeof payload.commitSeq === 'number' ? payload.commitSeq : undefined;
  deviceControlService.sendProperty(
    d.productID,
    d.deviceName,
    payload.dataID,
    item.property.define,
    payload.rawValue,
  )
    .then(() => {
      updateSystemPropertyValue(payload.dataID, payload.rawValue);
      notifySystemPropertyCommitResult(payload.dataID, commitSeq, true);
      uni.showToast({ title: '指令已下发', icon: 'success' });
    })
    .catch(() => {
      notifySystemPropertyCommitResult(payload.dataID, commitSeq, false);
      uni.showToast({ title: '下发失败', icon: 'none' });
    });
}

async function handleCheckVersion() {
  if (versionChecking.value) return;
  const d = device.value;
  if (!d) return;
  versionChecking.value = true;
  uni.showLoading({ title: '查询中...' });
  try {
    const versions = await otaService.getDeviceModuleVersions(d.productID, d.deviceName);
    uni.hideLoading();
    if (versions.length === 0) {
      uni.showToast({ title: '暂无版本信息', icon: 'none' });
      return;
    }
    const content = versions
      .map((item) => `${item.module || '默认模块'}：${item.version || '未知'}`)
      .join('\n');
    uni.showModal({
      title: '设备版本',
      content,
      showCancel: false,
      confirmText: '知道了',
    });
  } catch (err) {
    uni.hideLoading();
    uni.showToast({ title: (err as Error).message || '查询失败', icon: 'none' });
  } finally {
    versionChecking.value = false;
  }
}

function handleOpenManual() {
  uni.showToast({ title: '说明书暂未配置', icon: 'none' });
}

function handleDelete() {
  const d = device.value;
  if (!d) return;
  uni.showModal({
    title: '确定要删除设备吗？',
    content: '删除后将解绑该设备，需要重新绑定才能再次使用。',
    confirmColor: config.themeErrorColor,
    confirmText: '删除',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        uni.showLoading({ title: '删除中...', mask: true });
        await deviceService.delete(d.productID, d.deviceName);
        uni.hideLoading();
        uni.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => {
          const pages = getCurrentPages();
          const delta = Math.min(2, pages.length - 1);
          if (delta > 0) {
            uni.navigateBack({ delta });
          }
        }, 600);
      } catch (err) {
        uni.hideLoading();
        uni.showToast({ title: (err as Error).message || '删除失败', icon: 'none' });
      }
    },
  });
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageDevice/pages/settings/index', () => loading.value || !device.value || !canChangeNetwork.value ? [] : [
  { id: 'wifi-management', label: 'Wi-Fi 管理', role: 'button', enabled: !networkRequesting.value, tap: handleChangeNetwork },
]);
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.ds-page {
  flex: 1;
  overflow-y: hidden;
}

.ds-group {
  margin: 24rpx 32rpx 0;
  background: var(--card-bg);
  border-radius: 24rpx;
  overflow: hidden;
}

.ds-group--danger {
  margin-top: 48rpx;
  margin-bottom: 48rpx;
}

.ds-system-group {
  overflow: visible;
}

.ds-group-head {
  padding: 24rpx 32rpx 16rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.ds-group-head__title {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.ds-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx;
  border-bottom: 1rpx solid var(--divider);
}

.ds-row:last-child {
  border-bottom: none;
}

.ds-row--hover {
  background: var(--color-bg-secondary);
}

.ds-row--danger {
  justify-content: center;
}

.ds-system-control-row {
  padding: 0 32rpx;
}

.ds-system-control-row:last-child :deep(.prop-ctrl) {
  border-bottom: none;
}

.ds-row__label {
  font-size: 30rpx;
  color: var(--text-primary);
}

.ds-row__label--danger {
  color: var(--color-danger);
}

.ds-row__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  max-width: 60%;
}

.ds-row__right--copy {
  min-width: 0;
}

.ds-row__value {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-right: 8rpx;
  text-align: right;
  // 超长值允许换行，最多两行，超出省略。
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.ds-row__value--id {
  max-width: 360rpx;
}

.ds-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  border-radius: 26rpx;
  flex-shrink: 0;
}

.ds-copy-btn--hover {
  background: var(--color-bg-secondary);
}

.ds-row__arrow {
  font-size: 32rpx;
  color: var(--text-tertiary);
  margin-left: 4rpx;
}

</style>
