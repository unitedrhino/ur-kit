<template>
<app-navigation-bar title="添加设备" />

<scroll-view class="bind-page" scroll-y type="list">
  <view class="bind-section bind-section--scan">
    <view class="bind-section__head">
      <view class="scan-status-strip">
        <view class="scan-status-strip__row">
          <view :class="`scan-status-strip__signal ${scanning ? 'scan-status-strip__signal--active' : ''}`">
            <view class="scan-status-strip__signal-ring"></view>
            <view class="scan-status-strip__signal-core"></view>
          </view>
          <text class="scan-status-strip__title">{{scanStatusTitle}}</text>
        </view>
        <view class="scan-status-strip__action-row">
          <text class="scan-status-strip__action" @tap="handleShowScanHelp">扫描不到怎么办？</text>
        </view>
      </view>
      <text class="bind-section__desc">{{scanStatusDesc}}</text>
    </view>

    <view v-if="devices.length > 0" class="scan-list">
      <view
        v-for="(item, index) in displayDevices" :key="item.deviceId"
        class="scan-card"
        @tap="handleDeviceTap(item)"
        hover-class="scan-card--hover"
      >
        <view class="scan-card__left">
          <view class="scan-card__icon">
            <text class="scan-card__icon-text">BLE</text>
          </view>
          <view class="scan-card__info">
            <text class="scan-card__name">{{item.name || item.localName || '未知设备'}}</text>
            <text class="scan-card__meta">{{item.RSSI >= -60 ? '信号强' : item.RSSI >= -80 ? '信号中' : '信号弱'}} · {{item.RSSI}}dBm</text>
          </view>
        </view>
        <view class="scan-card__arrow">
          <view class="scan-card__arrow-line"></view>
        </view>
      </view>
      <view v-if="moreDeviceCount > 0" class="scan-more" @tap="handleShowAllDevices" hover-class="scan-more--hover">
        <text class="scan-more__text">还有 {{moreDeviceCount}} 个设备，点击展开</text>
      </view>
      <view v-else-if="showAllDevices && devices.length > 6" class="scan-more" @tap="handleShowAllDevices" hover-class="scan-more--hover">
        <text class="scan-more__text">收起</text>
      </view>
    </view>

    <view v-else-if="scanning" class="scan-empty">
      <loading :size="24" />
      <text class="scan-empty__text">正在持续扫描中...</text>
    </view>

    <view v-else class="scan-empty">
      <text class="scan-empty__text">暂未发现可连接设备</text>
      <view class="scan-empty__btn" @tap="handleRescan" hover-class="scan-empty__btn--hover">
        <text class="scan-empty__btn-text">重试</text>
      </view>
    </view>
  </view>

  <view v-if="showProductSelectionCard" class="bind-section bind-section--products">
    <view class="bind-section__head">
      <text class="bind-section__title">选择产品</text>
      <text class="bind-section__desc">也可以先选择产品，再进入第一步配置硬件。</text>
    </view>

    <view v-if="products.length > 0" class="product-layout">
      <view class="category-rail">
        <view
          v-for="(item, index) in categoryTabs" :key="item.key"
          :class="`category-rail__item ${activeCategoryKey === item.key ? 'category-rail__item--active' : ''}`"
          @tap="handleCategoryTap(item.key)"
        >
          <text class="category-rail__text">{{item.label}}</text>
        </view>
      </view>

      <view class="product-content">
        <view v-for="(section, sIdx) in productSections" :key="section.key" class="product-section">
          <view class="product-section__head">
            <view class="product-section__line"></view>
            <text class="product-section__title">{{section.title}}</text>
            <view class="product-section__line"></view>
          </view>

          <view class="product-grid">
            <view
              v-for="(product, pIdx) in section.products" :key="product.productID"
              class="product-card"
              @tap="handleProductTap(product.productID, product.productName)"
              hover-class="product-card--hover"
            >
              <image v-if="product.productImg" class="product-card__img" :src="product.productImg" mode="aspectFit" />
              <view v-else class="product-card__img product-card__img--placeholder">
                <text class="product-card__img-text">设备</text>
              </view>
              <text class="product-card__name">{{product.productName}}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="loadingProducts" class="product-empty">
      <loading :size="24" />
      <text class="product-empty__text">正在加载产品列表...</text>
    </view>

    <view v-else class="product-empty">
      <text class="product-empty__text">暂无可选产品</text>
    </view>
  </view>
</scroll-view>

<view v-if="scanHelpVisible" class="help-mask" @tap="handleCloseScanHelp">
  <view class="help-dialog" @tap.stop="noop">
    <text class="help-dialog__title">未发现可连接的蓝牙设备</text>
    <text class="help-dialog__item">1. 请确保蓝牙设备已经进入配网模式，可尝试重新上电或长按重置键。</text>
    <text class="help-dialog__item">2. 部分设备已和其他手机强绑定时，需要先解除绑定后再重新连接。</text>
    <view class="help-dialog__footer">
      <view class="help-dialog__btn" @tap="handleCloseScanHelp">
        <text class="help-dialog__btn-text">知道了</text>
      </view>
    </view>
  </view>
</view>

<privacy-authorization-modal />

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import PrivacyAuthorizationModal from '../../../components/privacy-authorization-modal/privacy-authorization-modal.vue';
import { ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { bluetoothConfigService } from '../../../services/bluetooth-config.service';
import { productService } from '../../../services/product.service';
import type { BleScanResult } from '../../../domain/models/ble-scan-result.model';
import type { ProductEntity } from '../../../domain/entities/product.entity';
import { ensurePageReady } from '../../../utils/page-guard';
import {
  OTHER_CATEGORY_KEY,
  buildCategoryTabs,
  buildProductSections,
  type ProductDisplaySection,
} from './product-grouping';
import type { ProductCategoryOption } from '../../../services/product.service';

const RSSI_SORT_DEBOUNCE_MS = 3000;

function getRssiValue(d: BleScanResult): number {
  return typeof d.RSSI === 'number' ? d.RSSI : -999;
}

function sortDevicesByRssi(arr: BleScanResult[]): BleScanResult[] {
  return arr
    .map((d, i) => ({ d, i }))
    .sort((a, b) => getRssiValue(b.d) - getRssiValue(a.d) || a.i - b.i)
    .map((x) => x.d);
}

const scanning = ref(false);
const devices = ref<BleScanResult[]>([]);
const displayDevices = ref<BleScanResult[]>([]);
const moreDeviceCount = ref(0);
const showAllDevices = ref(false);
const products = ref<ProductEntity[]>([]);
const categories = ref<ProductCategoryOption[]>([]);
const categoryTabs = ref<Array<{ key: string; label: string }>>([]);
const activeCategoryKey = ref('');
const productSections = ref<ProductDisplaySection[]>([]);
const scanStatusTitle = ref('正在扫描附近的蓝牙设备');
const scanStatusDesc = ref('请将设备靠近手机，并确认已进入配网状态');
const scanHelpVisible = ref(false);
const loadingProducts = ref(false);
const PRODUCT_SELECTION_CARD_VISIBLE_AFTER_BEIJING_TIME = Date.UTC(2026, 6, 17, 9, 0, 0);
const showProductSelectionCard = ref(isAfterBeijingProductSelectionVisibleTime());

let rssiSortTimer: ReturnType<typeof setTimeout> | null = null;
let productSelectionCardVisibilityTimer: ReturnType<typeof setTimeout> | null = null;
let pageReady = false;

function clearRssiSortTimer() {
  if (!rssiSortTimer) return;
  clearTimeout(rssiSortTimer);
  rssiSortTimer = null;
}

function clearProductSelectionCardVisibilityTimer(): void {
  if (!productSelectionCardVisibilityTimer) return;
  clearTimeout(productSelectionCardVisibilityTimer);
  productSelectionCardVisibilityTimer = null;
}

// isAfterBeijingProductSelectionVisibleTime 判断选择产品卡片是否已到北京时间 2026-07-17 17:00。
function isAfterBeijingProductSelectionVisibleTime(now: Date = new Date()): boolean {
  return now.getTime() >= PRODUCT_SELECTION_CARD_VISIBLE_AFTER_BEIJING_TIME;
}

// refreshProductSelectionCardVisibility 刷新选择产品卡片可见性，未到时间时安排一次自动刷新。
function refreshProductSelectionCardVisibility(): void {
  clearProductSelectionCardVisibilityTimer();
  showProductSelectionCard.value = isAfterBeijingProductSelectionVisibleTime();
  if (!showProductSelectionCard.value) {
    productSelectionCardVisibilityTimer = setTimeout(
      refreshProductSelectionCardVisibility,
      Math.max(PRODUCT_SELECTION_CARD_VISIBLE_AFTER_BEIJING_TIME - Date.now(), 0),
    );
  }
}

function applyDeviceList(arr: BleScanResult[]) {
  const showAll = showAllDevices.value;
  devices.value = arr;
  displayDevices.value = showAll ? arr : arr.slice(0, 6);
  moreDeviceCount.value = Math.max(0, arr.length - (showAll ? arr.length : 6));
  scanStatusTitle.value = `已发现 ${arr.length} 个可连接设备`;
  scanStatusDesc.value = '请选择上方设备，或在下方手动选择产品类型';
}

function scheduleRssiSort() {
  clearRssiSortTimer();
  rssiSortTimer = setTimeout(() => {
    rssiSortTimer = null;
    applyDeviceList(sortDevicesByRssi(devices.value));
  }, RSSI_SORT_DEBOUNCE_MS);
}

function upsertScannedDevice(d: BleScanResult) {
  const idx = devices.value.findIndex((item) => item.deviceId === d.deviceId);
  const next = idx >= 0
    ? devices.value.map((item, i) => (i === idx ? { ...item, ...d } : item))
    : [...devices.value, d];
  applyDeviceList(next);
  scheduleRssiSort();
}

async function loadCategoriesAndProducts() {
  loadingProducts.value = true;
  try {
    const [categoryResult, productResult] = await Promise.all([
      productService.getCategoryList(1, 100, '0'),
      productService.getList(1, 100),
    ]);
    const tabs = buildCategoryTabs(categoryResult.list || []);
    const activeKey = activeCategoryKey.value || tabs[0]?.key || OTHER_CATEGORY_KEY;
    categories.value = categoryResult.list || [];
    categoryTabs.value = tabs;
    activeCategoryKey.value = activeKey;
    products.value = productResult.list || [];
    productSections.value = buildProductSections(productResult.list || [], tabs, activeKey);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载产品失败', icon: 'none' });
  } finally {
    loadingProducts.value = false;
  }
}

async function startScan() {
  clearRssiSortTimer();
  scanning.value = true;
  devices.value = [];
  displayDevices.value = [];
  moreDeviceCount.value = 0;
  showAllDevices.value = false;
  scanStatusTitle.value = '正在扫描附近的蓝牙设备';
  scanStatusDesc.value = '请将设备靠近手机，并确认已进入配网状态';
  try {
    await bluetoothConfigService.startScan((d) => {
      upsertScannedDevice(d);
    });
  } catch (err) {
    scanning.value = false;
    scanStatusTitle.value = '蓝牙扫描失败';
    scanStatusDesc.value = '请检查手机蓝牙权限后重试';
    uni.showToast({ title: (err as Error).message || '蓝牙扫描失败', icon: 'none' });
  }
}

onLoad(async () => {
  const ready = await ensurePageReady('/packageDevice/pages/bind/index');
  if (!ready) return;
  pageReady = true;
  refreshProductSelectionCardVisibility();
  await loadCategoriesAndProducts();
});

onShow(async () => {
  const ready = pageReady || await ensurePageReady('/packageDevice/pages/bind/index');
  if (!ready) return;
  pageReady = true;
  refreshProductSelectionCardVisibility();
  clearRssiSortTimer();
  bluetoothConfigService.stopScan();
  void startScan();
});

onUnload(() => {
  clearRssiSortTimer();
  clearProductSelectionCardVisibilityTimer();
  bluetoothConfigService.stopScan();
});

function handleRescan() {
  clearRssiSortTimer();
  bluetoothConfigService.stopScan();
  void startScan();
}

function handleShowAllDevices() {
  const showAll = !showAllDevices.value;
  showAllDevices.value = showAll;
  displayDevices.value = showAll ? devices.value : devices.value.slice(0, 6);
  moreDeviceCount.value = Math.max(0, devices.value.length - (showAll ? devices.value.length : 6));
}

function handleShowScanHelp() {
  scanHelpVisible.value = true;
}

function handleCloseScanHelp() {
  scanHelpVisible.value = false;
}

function noop() {}

function handleCategoryTap(key: string) {
  const k = key || activeCategoryKey.value;
  activeCategoryKey.value = k;
  productSections.value = buildProductSections(products.value, categoryTabs.value, k);
}

function handleDeviceTap(device: BleScanResult) {
  const id = encodeURIComponent(device.deviceId || '');
  const name = encodeURIComponent(device.deviceName || device.name || device.localName || '');
  const productID = encodeURIComponent(device.productID || '');
  const mac = encodeURIComponent(device.mac || '');
  const moduleVersion = encodeURIComponent(String(device.moduleVersion ?? ''));
  bluetoothConfigService.stopScan();
  uni.navigateTo({
    url: `/packageBluetooth/pages/wifi/index?deviceId=${id}&deviceName=${name}&productID=${productID}&mac=${mac}&moduleVersion=${moduleVersion}&fromScan=1`,
  });
}

function handleProductTap(productID: string, productName: string) {
  const id = encodeURIComponent(productID || '');
  const name = encodeURIComponent(productName || '');
  bluetoothConfigService.stopScan();
  uni.navigateTo({ url: `/packageBluetooth/pages/prepare/index?productID=${id}&productName=${name}` });
}
</script>

<style lang="scss" scoped>
.bind-page {
  flex: 1;
  min-height: 0;
  background: var(--color-bg-secondary);
}

.bind-section {
  margin: 16px;
  background: var(--card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx var(--color-shadow);
}

.bind-section--scan {
  margin-top: 20px;
}

.bind-section__head {
  padding: 18px 18px 12px;
}

.bind-section__title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.bind-section__desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 19px;
  color: var(--text-secondary);
}

.scan-list {
  padding: 6px 12px 14px;
}

.scan-status-strip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 10px;
  border-radius: 12px;
  background: var(--color-primary-light);
}

.scan-status-strip__row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  flex: 1;
}

.scan-status-strip__signal {
  position: relative;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
}

.scan-status-strip__signal-ring {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-primary);
  opacity: 0.12;
}

.scan-status-strip__signal-core {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary);
}

.scan-status-strip__signal--active .scan-status-strip__signal-ring {
  animation: scan-status-pulse 1.4s ease-out infinite;
}

.scan-status-strip__title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  line-height: 21px;
  font-weight: 600;
  color: var(--color-primary);
}

.scan-status-strip__action {
  font-size: 12px;
  line-height: 18px;
  color: var(--color-primary);
}

.scan-status-strip__action-row {
  display: flex;
  justify-content: flex-end;
}

@keyframes scan-status-pulse {
  0% {
    opacity: 0.18;
    transform: scale(0.72);
  }
  70% {
    opacity: 0.06;
    transform: scale(1.18);
  }
  100% {
    opacity: 0;
    transform: scale(1.28);
  }
}

.scan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: 14px;
  box-shadow: 0 2rpx 12rpx var(--color-shadow);
  border: 1rpx solid var(--border-color);
}

.scan-card:first-child {
  margin-top: 4px;
}

.scan-card--hover {
  background: var(--color-bg-secondary);
}

.scan-card__left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.scan-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary-light) 100%);
  flex-shrink: 0;
}

.scan-card__icon-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
}

.scan-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.scan-card__name {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 600;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scan-card__meta {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 18px;
}

.scan-card__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-left: 8px;
}

.scan-card__arrow-line {
  width: 8px;
  height: 8px;
  border-top: 2rpx solid var(--text-placeholder);
  border-right: 2rpx solid var(--text-placeholder);
  transform: rotate(45deg);
}

.scan-more {
  width: 100%;
  padding-top: 12px;
  display: flex;
  justify-content: center;
}

.scan-more--hover {
  opacity: 0.72;
}

.scan-more__text {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--color-bg-secondary);
}

.scan-empty,
.product-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px 32px;
}

.scan-empty__text,
.product-empty__text {
  margin-top: 10px;
  font-size: 14px;
  color: var(--text-placeholder);
}

.scan-empty__btn {
  margin-top: 14px;
  padding: 8px 20px;
  border-radius: 999px;
  background: var(--color-primary);
}

.scan-empty__btn--hover {
  opacity: 0.72;
}

.scan-empty__btn-text {
  color: var(--color-on-primary);
  font-size: 13px;
  font-weight: 500;
}

.product-layout {
  display: flex;
  min-height: 520px;
}

.category-rail {
  width: 98px;
  padding: 10px 0;
  background: linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-secondary) 100%);
  border-right: 1rpx solid var(--border-color);
}

.category-rail__item {
  position: relative;
  padding: 14px 10px 14px 12px;
  border-left: 6rpx solid transparent;
}

.category-rail__item--active {
  background: var(--card-bg);
  border-left-color: var(--color-primary);
}

.category-rail__text {
  display: block;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  text-align: center;
}

.category-rail__item--active .category-rail__text {
  color: var(--color-primary);
  font-weight: 600;
}

.product-content {
  flex: 1;
  padding: 12px 12px 18px;
}

.product-section + .product-section {
  margin-top: 14px;
}

.product-section__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.product-section__line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent 0%, var(--border-color) 100%);
}

.product-section__head .product-section__line:last-child {
  background: linear-gradient(90deg, var(--border-color) 0%, transparent 100%);
}

.product-section__title {
  font-size: 13px;
  color: var(--text-placeholder);
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
}

.product-card {
  width: calc(33.33% - 12px);
  margin: 8px 6px 0;
  padding: 12px 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg-secondary);
  border-radius: 14px;
}

.product-card--hover {
  opacity: 0.72;
}

.product-card__img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: var(--card-bg);
}

.product-card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-secondary) 100%);
}

.product-card__img-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.product-card__name {
  margin-top: 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-primary);
  text-align: center;
}

.help-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-mask);
}

.help-dialog {
  width: 100%;
  padding: 24px 22px 18px;
  border-radius: 18px;
  background: var(--card-bg);
}

.help-dialog__title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--text-primary);
  text-align: center;
}

.help-dialog__item {
  display: block;
  margin-top: 14px;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-secondary);
}

.help-dialog__footer {
  margin-top: 20px;
}

.help-dialog__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 999px;
  background: var(--color-primary);
}

.help-dialog__btn-text {
  color: var(--color-on-primary);
  font-size: 15px;
  font-weight: 600;
}

</style>
