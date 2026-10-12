<template>
<app-navigation-bar :title="pageTitle" />

<scroll-view class="detail-page" scroll-y type="list">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else-if="device">
    <view v-if="readonlyCard.items.length > 0" class="detail-card detail-section">
      <view class="detail-readonly-grid">
        <view
          v-for="item in readonlyGridItems"
          :key="item.key"
          :class="`detail-readonly-tile ${item.kind === 'more' ? 'detail-readonly-tile--more' : ''}`"
          @tap="handleReadonlyTileTap(item)"
          hover-class="detail-readonly-tile--hover"
        >
          <text class="detail-readonly-tile__name">{{item.name}}</text>
          <text v-if="item.value" class="detail-readonly-tile__value">{{item.value}}</text>
          <text v-if="item.kind === 'property' && item.long" class="detail-readonly-tile__detail">查看详情</text>
        </view>
      </view>
    </view>

    <view v-if="visibleControlItems.length > 0" class="detail-card detail-section">
      <view class="detail-control-list">
        <template
          v-for="item in visibleControlItems"
          :key="`${item.kind}:${item.identifier}`"
        >
          <property-control
            v-if="item.kind === 'property'"
            :label="item.property.name"
            :dataID="item.property.identifier"
            :define="item.property.define"
            :value="item.property.value"
            :mode="item.property.mode"
            :ref="(el) => onPropertyControlRef(item.property.identifier, el)"
            @change="handlePropertyChange"
          />
          <view
            v-else
            class="detail-action-row"
            hover-class="detail-action-row--hover"
          >
            <view class="detail-action-row__info">
              <text class="detail-action-row__name">{{item.action.name}}</text>
              <text class="detail-action-row__id">{{item.action.identifier}}</text>
            </view>
            <view class="detail-action-row__controls">
              <view
                v-if="item.hasInput && actionMemoryMap[item.identifier]"
                :class="`detail-action-row__btn ${actionSubmitting[item.identifier] ? 'detail-action-row__btn--loading' : ''}`"
                @tap="handleExecuteAction(item)"
                hover-class="detail-action-row__btn--hover"
              >
                <view v-if="actionSubmitting[item.identifier]" class="detail-action-row__loader" />
                <text>{{actionSubmitting[item.identifier] ? '执行中' : '执行'}}</text>
              </view>
              <view
                v-if="item.hasInput"
                :class="`detail-action-row__btn detail-action-row__btn--ghost ${actionSubmitting[item.identifier] ? 'detail-action-row__btn--disabled' : ''}`"
                @tap="handleOpenAction(item.action.identifier, item.identifier)"
                hover-class="detail-action-row__btn--hover"
              >
                <text>{{actionMemoryMap[item.identifier] ? '修改' : '设置并执行'}}</text>
              </view>
              <view
                v-else
                :class="`detail-action-row__btn ${actionSubmitting[item.identifier] ? 'detail-action-row__btn--loading' : ''}`"
                @tap="handleExecuteAction(item)"
                hover-class="detail-action-row__btn--hover"
              >
                <view v-if="actionSubmitting[item.identifier]" class="detail-action-row__loader" />
                <text>{{actionSubmitting[item.identifier] ? '执行中' : '执行'}}</text>
              </view>
            </view>
          </view>
        </template>
      </view>
    </view>

    <view class="detail-card detail-section detail-entry-card">
      <view class="detail-section__head">
        <text class="detail-section__title">更多</text>
      </view>
      <view v-if="device.cloneID && device.cloneID > 0" class="detail-entry-row" @tap="handleNavToCloneMemory" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">记忆</text>
          <text class="detail-entry-row__desc">查看设备数字分身记忆</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
      <view class="detail-entry-row" @tap="handleNavToHistory" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">数据分析</text>
          <text class="detail-entry-row__desc">查看属性趋势与历史数据</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
      <view class="detail-entry-row" @tap="handleNavToDeviceLogs" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">设备日志</text>
          <text class="detail-entry-row__desc">操作日志与运行记录</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
      <view class="detail-entry-row" @tap="handleShare" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">设备分享</text>
          <text class="detail-entry-row__desc">分享设备给其他成员</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
      <view class="detail-entry-row" @tap="handleNavToSettings" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">设备设置</text>
          <text class="detail-entry-row__desc">名称、位置、分享与更多配置</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
    </view>
  </template>
</scroll-view>

</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import { computed, onUnmounted, ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { deviceDetailProvider } from '../../../providers/device-detail.provider';
import type { DeviceEntity } from '../../../domain/entities/device.entity';
import type {
  ActionItem,
  DeviceControlModel,
  PropertyItem,
  ThingModelDefine,
} from '../../../domain/models/device-control.model';
import {
  buildDeviceControlCardUi,
  isSystemProperty,
  type ControlCardActionUiItem,
  type ControlCardPropertyUiItem,
  type ControlCardUiItem,
} from '../../../services/device-control-card-ui.service';
import { getActionParamMemory } from '../../../services/action-param-memory.service';
import { ensurePageReady } from '../../../utils/page-guard';

const device = ref<DeviceEntity | null>(null);
const controlModel = ref<DeviceControlModel | null>(null);
const loading = ref(true);
const unsubscribes: Array<() => void> = [];
const actionSubmitting = ref<Record<string, boolean>>({});
const propertyControlRefs = ref(new Map<string, PropertyControlExpose>());
const actionMemoryVersion = ref(0);
const readonlyExpanded = ref(false);

const cardUi = computed(() => buildDeviceControlCardUi(controlModel.value));
const readonlyCard = computed(() => cardUi.value.readonlyCard);
const controlCard = computed(() => cardUi.value.controlCard);
const fallbackControlItems = computed<(ControlCardActionUiItem | ControlCardPropertyUiItem)[]>(() => {
  const items: (ControlCardActionUiItem | ControlCardPropertyUiItem)[] = [];
  const properties = controlModel.value?.properties || [];
  const actions = controlModel.value?.actions || [];
  properties
    .filter((property) => property.mode !== 'r' && !isSystemProperty(property))
    .forEach((property) => {
      items.push({
        controlType: 'input',
        identifier: property.identifier,
        kind: 'property',
        property,
      });
    });
  actions.forEach((action) => {
    items.push({
      action,
      controlType: 'button',
      hasInput: action.input?.length > 0,
      identifier: action.identifier,
      kind: 'action',
    });
  });
  return items;
});
const visibleControlItems = computed<ControlCardUiItem[]>(() => {
  if (controlCard.value.items.length > 0) {
    return controlCard.value.items;
  }
  return fallbackControlItems.value;
});
const pageTitle = computed(() => {
  const currentDevice = device.value;
  return currentDevice ? currentDevice.deviceAlias || currentDevice.deviceName || '设备详情' : '设备详情';
});
/** READONLY_VALUE_LONG_LIMIT 是只读九宫格值触发“查看详情”的长度阈值，真机两行约容纳 16~17 字符，取 14 覆盖小屏。 */
const READONLY_VALUE_LONG_LIMIT = 14;

const readonlyGridItems = computed<ReadonlyGridItem[]>(() => {
  const items = readonlyCard.value.items.map((item) => {
    const value = formatPropertyDisplayValue(item.property);
    return {
      key: item.identifier,
      kind: 'property' as const,
      name: item.property.name,
      value,
      // 超过阈值的值在两行内可能仍显示不全，标记后提供查看详情入口。
      long: value.length > READONLY_VALUE_LONG_LIMIT,
    };
  });
  if (items.length > 9 && !readonlyExpanded.value) {
    return [
      ...items.slice(0, 8),
      {
        key: 'readonly-more',
        kind: 'more' as const,
        name: '更多',
        value: '查看全部',
      },
    ];
  }
  return items;
});
const actionMemoryMap = computed(() => {
  actionMemoryVersion.value;
  const currentDevice = device.value;
  const map: Record<string, boolean> = {};
  if (!currentDevice) return map;
  visibleControlItems.value.forEach((item) => {
    if (item.kind === 'action' && item.hasInput) {
      map[item.identifier] = Boolean(getActionParamMemory(currentDevice, item.action));
    }
  });
  return map;
});

interface ReadonlyGridPropertyItem {
  /** key 是九宫格渲染使用的稳定键。 */
  key: string;
  /** kind 标记真实只读属性。 */
  kind: 'property';
  /** name 显示物模型属性中文名。 */
  name: string;
  /** value 显示格式化后的属性值。 */
  value: string;
  /** long 标记超长值，九宫格两行内可能显示不全，提供查看详情入口。 */
  long: boolean;
}

interface ReadonlyGridMoreItem {
  /** key 是“更多”入口的固定渲染键。 */
  key: string;
  /** kind 标记九宫格更多入口。 */
  kind: 'more';
  /** name 固定显示为更多。 */
  name: string;
  /** value 显示更多入口的辅助文案。 */
  value: string;
}

interface PropertyControlExpose {
  handleCommitResult?: (payload: { commitSeq: number; success: boolean }) => void;
}

type ReadonlyGridItem = ReadonlyGridPropertyItem | ReadonlyGridMoreItem;

onLoad(async (query: Record<string, string> | undefined) => {
  const q = query || {};
  const ready = await ensurePageReady('/packageDevice/pages/detail/index', q);
  if (!ready) {
    loading.value = false;
    return;
  }
  const productID = q.productID;
  const deviceName = q.deviceName;
  if (!productID || !deviceName) return;
  unsubscribes.push(
    deviceDetailProvider.subscribe((s) => {
      device.value = s.device;
      controlModel.value = s.controlModel;
      loading.value = s.loading;
    }),
  );
  deviceDetailProvider.load(productID, deviceName);
});

onShow(() => {
  actionMemoryVersion.value += 1;
});

onUnload(() => {
  unsubscribes.forEach((fn) => fn());
  deviceDetailProvider.clear();
});

onUnmounted(() => {
  unsubscribes.forEach((fn) => fn());
});

function onPropertyControlRef(identifier: string, instance: unknown): void {
  if (!identifier) return;
  if (instance) {
    propertyControlRefs.value.set(identifier, instance as PropertyControlExpose);
    return;
  }
  propertyControlRefs.value.delete(identifier);
}

function notifyPropertyCommitResult(
  dataID: string,
  commitSeq: number | undefined,
  success: boolean,
) {
  const control = propertyControlRefs.value.get(dataID);
  if (!control || !control.handleCommitResult || !commitSeq) return;
  control.handleCommitResult({ commitSeq, success });
}

/** formatDateTime 将时间戳格式化为移动端只读属性展示文本。 */
function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** formatPropertyValue 根据物模型类型生成只读属性展示文本。 */
function formatPropertyValue(item: PropertyItem): string {
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
    return ts ? formatDateTime(ts) : '—';
  }
  return String(value);
}

/** formatPropertyDisplayValue 生成只读九宫格中的 value 文本。 */
function formatPropertyDisplayValue(item: PropertyItem): string {
  const text = formatPropertyValue(item);
  if (text === '—') return text;
  return item.define.unit ? `${text} ${item.define.unit}` : text;
}

/** handleReadonlyMore 展开超过九个的只读属性。 */
function handleReadonlyMore(): void {
  readonlyExpanded.value = true;
}

/** handleReadonlyTileTap 分发九宫格点击：更多入口展开全部，超长值属性弹窗查看详情。 */
function handleReadonlyTileTap(item: ReadonlyGridItem): void {
  if (item.kind === 'more') {
    handleReadonlyMore();
    return;
  }
  if (item.long) {
    handleReadonlyDetail(item);
  }
}

/** handleReadonlyDetail 弹窗展示超长属性值的完整内容。 */
function handleReadonlyDetail(item: ReadonlyGridPropertyItem): void {
  uni.showModal({
    title: item.name,
    content: item.value,
    showCancel: false,
    confirmText: '知道了',
  });
}

/** sendAndToast 下发属性并给出移动端操作反馈。 */
async function sendAndToast(define: ThingModelDefine, dataID: string, rawValue: unknown) {
  await deviceDetailProvider.sendProperty(dataID, define, rawValue);
}

/** findWritablePropertyItem 从最新值列表或物模型定义里找到可下发属性。 */
function findWritablePropertyItem(cm: DeviceControlModel, dataID: string): PropertyItem | null {
  const latestItem = cm.properties.find((p: PropertyItem) => p.identifier === dataID);
  if (latestItem) return latestItem;
  const schemaItem = cm.thingModel.properties.find((p) => p.identifier === dataID && p.mode !== 'r');
  if (!schemaItem) return null;
  return {
    identifier: schemaItem.identifier,
    name: schemaItem.name,
    mode: 'rw',
    define: schemaItem.define,
    funcGroup: schemaItem.funcGroup,
    value: null,
    timestamp: 0,
  };
}

/** handlePropertyChange 接收 property-control 变更并按物模型序列化下发。 */
function handlePropertyChange(e: any) {
  const payload = (e && e.detail) ? e.detail : e;
  if (!payload || !payload.dataID) return;
  const cm = controlModel.value;
  if (!cm) return;
  const item = findWritablePropertyItem(cm, payload.dataID);
  if (!item) return;
  const commitSeq = typeof payload.commitSeq === 'number' ? payload.commitSeq : undefined;
  sendAndToast(item.define, payload.dataID, payload.rawValue)
    .then(() => {
      notifyPropertyCommitResult(payload.dataID, commitSeq, true);
      uni.showToast({ title: '指令已下发', icon: 'success' });
    })
    .catch(() => {
      notifyPropertyCommitResult(payload.dataID, commitSeq, false);
      uni.showToast({ title: '下发失败', icon: 'none' });
    });
}

/** setActionSubmitting 维护单个行为的执行中状态，避免重复点击。 */
function setActionSubmitting(identifier: string, submitting: boolean): void {
  actionSubmitting.value = {
    ...actionSubmitting.value,
    [identifier]: submitting,
  };
}

/** invokeActionAndToast 调用设备行为并展示成功或失败反馈。 */
async function invokeActionAndToast(action: ActionItem, params: Record<string, unknown>): Promise<void> {
  if (actionSubmitting.value[action.identifier]) return;
  setActionSubmitting(action.identifier, true);
  try {
    await deviceDetailProvider.invokeAction(action, params);
    uni.showToast({ title: '已触发', icon: 'success' });
  } catch {
    uni.showToast({ title: '触发失败', icon: 'none' });
  } finally {
    setActionSubmitting(action.identifier, false);
  }
}

/** handleExecuteAction 从 card2 直接执行无参行为或已记忆入参的行为。 */
function handleExecuteAction(item: ControlCardActionUiItem): void {
  const currentDevice = device.value;
  if (!currentDevice) return;
  if (item.hasInput) {
    const memory = getActionParamMemory(currentDevice, item.action);
    if (!memory) {
      handleOpenAction(item.action.identifier);
      return;
    }
    void invokeActionAndToast(item.action, memory.params);
    return;
  }
  void invokeActionAndToast(item.action, {});
}

/** handleOpenAction 进入行为参数页，执行中状态下不允许跳转以避免重复操作。 */
function handleOpenAction(id: string, itemIdentifier?: string) {
  if (itemIdentifier && actionSubmitting.value[itemIdentifier]) return;
  const action = controlModel.value?.actions.find((a: ActionItem) => a.identifier === id);
  if (!action) return;
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/action-invoke/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}&actionID=${encodeURIComponent(id)}`,
  });
}

/** handleNavToHistory 跳转设备数据分析页面。 */
function handleNavToHistory() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/history/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}

/** handleNavToDeviceLogs 跳转设备日志页面。 */
function handleNavToDeviceLogs() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/logs/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}

/** handleShare 跳转设备分享页面。 */
function handleShare() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/share/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}

/** handleNavToCloneMemory 跳转设备数字分身记忆页面。 */
function handleNavToCloneMemory() {
  const d = device.value;
  if (!d?.cloneID) return;
  uni.navigateTo({
    url: `/packageDevice/pages/clone-memory/index?cloneID=${encodeURIComponent(String(d.cloneID))}&productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}

/** handleNavToSettings 跳转设备设置页面。 */
function handleNavToSettings() {
  const d = device.value;
  if (!d) return;
  uni.navigateTo({
    url: `/packageDevice/pages/settings/index?productID=${encodeURIComponent(d.productID)}&deviceName=${encodeURIComponent(d.deviceName)}`,
  });
}
/** 将当前可见入口交给调试桥，远程点击复用本地事件，不绕过权限检查。 */
useClientDebugPage('packageDevice/pages/detail/index', () => loading.value || !device.value ? [] : [
  { id: 'device-settings', label: '设备设置', role: 'button', enabled: true, tap: handleNavToSettings },
]);
</script>

<style lang="scss" scoped>
.detail-page {
  flex: 1;
  min-height: 0;
  background: var(--page-bg);
}

.detail-card {
  margin: 16px;
  padding: 18px;
  background: var(--card-bg);
  border-radius: var(--radius-md, 12px);
}

.detail-hero-card {
  padding: 20px;
}

.detail-status {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-offline);
  margin-right: 6px;
}

.detail-status__dot--online {
  background: var(--color-success);
}

.detail-status__dot--error {
  background: var(--color-warning);
}

.detail-status__text {
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-device__name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
}

.detail-device__product {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.detail-section {
  padding: 0 18px;
}

.detail-section__head {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid var(--border-color);
}

.detail-section__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-section__count {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-control-list {
  display: flex;
  flex-direction: column;
}

.detail-action-row:last-child,
.detail-entry-row:last-child {
  border-bottom: none;
}

.detail-action-row__info,
.detail-entry-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-action-row__name,
.detail-entry-row__name {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-action-row__id,
.detail-entry-row__desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 3px;
}

.detail-readonly-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 0;
  background: transparent;
}

.detail-readonly-tile {
  min-width: 0;
  min-height: 78px;
  padding: 12px 8px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1rpx solid var(--border-color);
  border-bottom: 1rpx solid var(--border-color);
}

.detail-readonly-tile:nth-child(3n) {
  border-right: none;
}

.detail-readonly-tile--hover {
  opacity: 0.75;
}

.detail-readonly-tile--more {
  color: var(--color-primary);
}

.detail-readonly-tile__name {
  max-width: 100%;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-readonly-tile__value {
  max-width: 100%;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
  // 超长值(如 SIM 卡号)允许换行，最多两行，超出省略。
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.detail-readonly-tile__detail {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-primary);
}

.detail-readonly-tile--more .detail-readonly-tile__name,
.detail-readonly-tile--more .detail-readonly-tile__value {
  color: var(--color-primary);
}

.detail-action-row {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1rpx solid var(--border-color);
}

.detail-action-row--hover,
.detail-entry-row--hover,
.detail-action-row__btn--hover {
  opacity: 0.7;
}

.detail-action-row__controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-action-row__btn {
  min-width: 56px;
  height: 32px;
  padding: 0 12px;
  border-radius: 16px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-action-row__btn--ghost {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.detail-action-row__btn--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.detail-action-row__btn--loading {
  opacity: 0.9;
}

.detail-action-row__loader {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-on-primary);
  border-top-color: var(--card-bg);
  border-radius: 50%;
  animation: detail-spin 0.8s linear infinite;
  margin-right: 6px;
}

@keyframes detail-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.detail-entry-card {
  margin-bottom: 32px;
}

.detail-entry-row {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1rpx solid var(--border-color);
}

.detail-entry-row__arrow {
  font-size: 22px;
  color: var(--text-placeholder);
}

</style>
