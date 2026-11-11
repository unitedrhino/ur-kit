<!-- 设备详情优先显示面板；共享设备不提供二次分享。 -->
<template>
<view class="device-detail-layout" :class="{ 'device-detail-layout--mini': miniWebHost }">
<!-- #ifndef MP-WEIXIN -->
<app-navigation-bar v-if="!miniWebHost" :title="pageTitle" />
<!-- #endif -->
<!-- #ifdef MP-WEIXIN -->
<web-view v-if="miniPanelURL" :src="miniPanelURL" @error="handleMiniPanelError" />
<view v-else-if="miniPanelError" class="detail-panel-error"><text>{{miniPanelError}}</text><button @tap="retryMiniPanel">重新加载面板</button><button @tap="useNativePanel">使用原生控制</button></view>
<!-- #endif -->

<view class="detail-page">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else-if="device">
    <device-panel-host :product-i-d="device.productID" :device-name="device.deviceName" :active="pageActive" @availability="panelMode = $event" />
    <scroll-view v-if="panelMode === 'native'" class="detail-native" scroll-y type="list">
    <view class="detail-native-header">
      <text>设备控制</text>
      <view class="detail-settings" role="button" aria-label="设备设置" @tap="handleNavToSettings"><app-icon name="tabler:settings" :size="22" /><text>设置</text></view>
    </view>
    <view class="detail-card detail-hero-card">
      <view class="detail-hero-icon"><image v-if="detailImage" class="detail-hero-image" :src="detailImage" mode="aspectFit" @error="handleDetailImageError" /><app-icon v-else name="tabler:devices" :size="42" color="var(--color-primary)" /></view>
      <view class="detail-status">
        <view :class="['detail-status__dot', { 'detail-status__dot--online': device.status === 2, 'detail-status__dot--error': device.status === 4 }]" />
        <text class="detail-status__text">{{ device.status === 2 ? '在线' : device.status === 1 ? '未激活' : device.status === 4 ? '异常' : '离线' }}</text>
        <app-icon v-if="device.isShared" name="tabler:share" :size="16" color="var(--color-primary)" aria-label="共享设备" />
      </view>
      <text class="detail-device__name">{{ device.deviceAlias || device.deviceName }}</text>
      <text class="detail-device__product">{{ device.productName || device.deviceAlias || device.deviceName }}</text>
      <text v-if="controlModel && controlModel.properties.every(item => !item.timestamp)" class="detail-panel-note">设备尚无上报数据，当前值以“—”显示</text>
    </view>
    <view v-if="readonlyCard.items.length === 0 && visibleControlItems.length === 0" class="detail-card detail-empty-panel">
      <text class="detail-section__title">暂无可用控制项</text>
      <text class="detail-panel-note">该设备暂未提供可展示的功能</text>
    </view>

    <view v-if="readonlyCard.items.length > 0" class="detail-card detail-section">
      <view class="detail-section__head"><text class="detail-section__title">实时数据</text></view>
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
      <view class="detail-section__head"><text class="detail-section__title">设备控制</text></view>
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
      <view v-if="device.isShared === false" class="detail-entry-row" @tap="handleShare" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">设备分享</text>
          <text class="detail-entry-row__desc">分享设备给其他成员</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
      <view class="detail-entry-row" @tap="handleNavToSettings" hover-class="detail-entry-row--hover">
        <view class="detail-entry-row__info">
          <text class="detail-entry-row__name">设备设置</text>
          <text class="detail-entry-row__desc">{{ device.isShared ? '设备信息与更多配置' : '名称、位置、分享与更多配置' }}</text>
        </view>
        <text class="detail-entry-row__arrow">›</text>
      </view>
    </view>
    </scroll-view>
  </template>
</view>

</view>
</template>

<script setup lang="ts">
import { useClientDebugPage } from '../../../utils/use-client-debug-page';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import DevicePanelHost from '../../../components/device-panel-host/device-panel-host.vue';
import Loading from '../../../components/loading/loading.vue';
import { computed, onUnmounted, ref, watch } from 'vue';
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';
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
import { panelLaunchService } from '../../../services/panel-launch.service';
import { isMiniPanelWebHost } from '../../../services/mini-panel-navigation.service';
import { ensurePageReady } from '../../../utils/page-guard';
import { defaultDeviceImage } from '../../../utils/device-image';

/** miniPanelURL 是一次性入口，生命周期内保留web-view，设置返回不重新签发。 */
const miniPanelURL = ref('');
/** miniPanelError 明确显示入口或业务域名失败，不把失败伪装为未绑定。 */
const miniPanelError = ref('');
/** miniIdentity 只保存当前详情固定目标，用于重试和显式原生回退。 */
const miniIdentity = { productID: '', deviceName: '' };
/** miniClosed 使卸载后的入口响应失效，不能重新创建旧设备窗口。 */
let miniClosed = false;
/** miniWebHost 只在第一方交接已校验微信桥后隐藏H5重复导航。 */
const miniWebHost = isMiniPanelWebHost();

/** openMiniPanel 按当前登录身份解析H5绑定；无绑定才返回原生控制。 */
async function openMiniPanel(): Promise<boolean> {
  loading.value = true;
  miniPanelError.value = '';
  try {
    const url = await panelLaunchService.create(miniIdentity.productID, miniIdentity.deviceName);
    if (miniClosed) return true;
    miniPanelURL.value = url;
    return !!url;
  } catch (cause) {
    if (!miniClosed) miniPanelError.value = cause instanceof Error ? cause.message : '面板暂时无法打开';
    return true;
  } finally { if (!miniClosed) loading.value = false; }
}
/** handleMiniPanelError 移除失败容器，明确提示检查微信业务域名后重试。 */
function handleMiniPanelError(): void {
  miniPanelURL.value = '';
  miniPanelError.value = '自定义面板加载失败，请确认网络及微信业务域名配置后重试';
}
/** retryMiniPanel 重新签发短票据，不重放已消费的URL。 */
async function retryMiniPanel(): Promise<void> { if (!(await openMiniPanel())) useNativePanel(); }
/** useNativePanel 仅在用户明确选择或无绑定时加载原生物模型控制。 */
function useNativePanel(): void {
  miniPanelError.value = '';
  miniPanelURL.value = '';
  void deviceDetailProvider.load(miniIdentity.productID, miniIdentity.deviceName);
}
const device = ref<DeviceEntity | null>(null);
/** 详情优先产品图片，失败后依次使用默认图和通用图标。 */
const detailProductImageFailed = ref(false);
const detailDefaultImageFailed = ref(false);
const detailDefaultImage = computed(() => device.value ? defaultDeviceImage(device.value.deviceType, device.value.productName, device.value.deviceAlias) : '');
const detailImage = computed(() => (!detailProductImageFailed.value && device.value?.productImg) || (!detailDefaultImageFailed.value && detailDefaultImage.value) || '');
watch(() => [device.value?.productID, device.value?.deviceName, device.value?.productImg, device.value?.productName, device.value?.deviceAlias, device.value?.deviceType], () => { detailProductImageFailed.value = false; detailDefaultImageFailed.value = false; });
/** handleDetailImageError 逐级回退，避免失效图片反复加载。 */
function handleDetailImageError(): void {
  if (!detailProductImageFailed.value && device.value?.productImg) detailProductImageFailed.value = true;
  else detailDefaultImageFailed.value = true;
}

const controlModel = ref<DeviceControlModel | null>(null);
const loading = ref(true);
/** pageActive 通知嵌入宿主隐藏时释放连接，设置返回时恢复。 */
const pageActive = ref(true);
/** panelMode 在解析完成前隐藏原生控件，避免重复控制区。 */
const panelMode = ref<'loading' | 'panel' | 'native'>('loading');
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
// #ifdef MP-WEIXIN
/** 微信详情使用原生导航栏，无绑定的原生控制与加载失败页也保留顶部返回。 */
watch(pageTitle, (title) => { uni.setNavigationBarTitle({ title }); }, { immediate: true });
// #endif
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
  if (miniClosed) return;
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
  miniIdentity.productID = productID;
  miniIdentity.deviceName = deviceName;
  // #ifdef MP-WEIXIN
  if (await openMiniPanel()) return;
  // #endif
  deviceDetailProvider.load(productID, deviceName);
});

onHide(() => { pageActive.value = false; });

onShow(() => {
  pageActive.value = true;
  actionMemoryVersion.value += 1;
});

onUnload(() => {
  miniClosed = true;
  miniPanelURL.value = "";
  pageActive.value = false;
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

/** handleShare 仅在确认不是收到的共享设备时打开分享管理。 */
function handleShare() {
  const d = device.value;
  if (!d || d.isShared !== false) return;
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
  const d = device.value || (miniPanelURL.value ? miniIdentity : null);
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
.detail-panel-error { padding:24px; display:flex; flex-direction:column; gap:16px; color:var(--text-secondary); }
/* 微信电脑端也按移动控制面板展示，真实手机小于430px时占满设备宽度。 */
.device-detail-layout--mini { width: min(100%, 430px); margin-inline: auto; }
.device-detail-layout { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.detail-page {
  flex: 1;
  min-height: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.detail-native { flex: 1; min-height: 0; }
.detail-native-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px 0; color: var(--text-secondary); font-size: 14px; }
.detail-settings { min-height: 44px; display: flex; align-items: center; gap: 6px; color: var(--text-primary); }

.detail-card {
  margin: 16px;
  padding: 18px;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
}

.detail-panel-note { display: block; margin-top: 10px; font-size: var(--font-caption); color: var(--text-secondary); }
.detail-empty-panel { padding: 18px; }

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
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.detail-device__name {
  font-size: var(--font-section);
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 4px;
}

.detail-device__product {
  font-size: var(--font-caption);
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
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--text-primary);
}

.detail-section__count {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.detail-control-list {
  display: flex;
  flex-direction: column;
}

.detail-action-row:last-child {
  border-bottom: none;
}

.detail-action-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-action-row__name,
.detail-entry-row__name {
  font-size: var(--font-body);
  color: var(--text-primary);
  font-weight: 500;
}

.detail-action-row__id,
.detail-entry-row__desc {
  font-size: var(--font-caption);
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
  font-size: var(--font-caption);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-readonly-tile__value {
  max-width: 100%;
  margin-top: 6px;
  font-size: var(--font-body);
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
  font-size: var(--font-caption);
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
  font-size: var(--font-caption);
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




/* 更多功能使用独立行展示名称、说明和进入箭头，避免 H5 默认块布局挤在一起。 */
.detail-entry-row { min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1rpx solid var(--border-color); }
.detail-entry-row:last-child { border-bottom: 0; }
.detail-entry-row__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.detail-entry-row--hover { opacity: 0.7; }

.detail-entry-row__arrow {
  font-size: var(--font-section);
  color: var(--text-placeholder);
}


.detail-hero-card { position: relative; padding: 24px 108px 24px 24px; min-height: 96px; }
.detail-hero-icon { position: absolute; right: 20px; top: 20px; display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: var(--radius-lg); background: var(--color-primary-light); margin-left: 12px; }
.detail-hero-image { width: 100%; height: 100%; border-radius: var(--radius-lg); }
.detail-device__name { display: block; font-size: 26px; line-height: 1.35; word-break: break-all; }
.detail-device__product { display: block; margin-top: 8px; }
.detail-card { border-radius: var(--radius-lg); }
.detail-readonly-tile { border-radius: var(--radius-md); padding: 18px 12px; }
.detail-readonly-tile__value { font-size: 28px; }
.detail-section__title { font-size: var(--font-section); }
.detail-page { padding-bottom: calc(24px + env(safe-area-inset-bottom)); }
</style>
