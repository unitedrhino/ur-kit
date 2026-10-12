<template>
<view :class="`picker-mask ${visible ? 'picker-mask--visible' : ''}`" @tap="handleMaskTap" />
<scroll-view
  :class="`picker-panel ${visible ? 'picker-panel--visible' : ''}`"
  scroll-y
  type="list"
  :show-scrollbar="false"
>
        <view class="picker-handle"><view class="picker-handle-bar" /></view>
        <view class="picker-header">
          <text class="picker-title">选择产品</text>
          <view class="picker-close" @tap="handleClose"><text>✕</text></view>
        </view>

        <view v-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <template v-else-if="list.length > 0">
          <view
            v-for="(item, index) in list" :key="item.productID"
            :class="`picker-item ${item.productID === selectedId ? 'picker-item--active' : ''}`"
            :data-id="item.productID"
            @tap="handleSelect(item.productID)"
            hover-class="picker-item--hover"
          >
            <image v-if="item.productImg" class="picker-item__img" :src="item.productImg" mode="aspectFill" />
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.productName}}</text>
              <text class="picker-item__desc">{{item.productID}}</text>
            </view>
            <app-icon v-if="item.productID === selectedId" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">暂无可选产品</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { computed } from 'vue';
import type { DeviceEntity } from '../../../domain/entities/device.entity';

interface ProductOption {
  productID: string;
  productName: string;
  productImg: string;
}

interface Props { visible?: boolean; selectedId?: string; devices?: DeviceEntity[]; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { visible: false, selectedId: '', devices: () => [], loading: false });
const emit = defineEmits<{
  (e: 'select', payload: { productID: string; productName: string; productImg: string }): void;
  (e: 'close'): void;
}>();

// toProductOptions 从当前可选设备聚合产品，避免选到没有设备的产品后下一步为空。
function toProductOptions(devices: DeviceEntity[]): ProductOption[] {
  const map = new Map<string, ProductOption>();
  devices.forEach((device) => {
    if (!device.productID || map.has(device.productID)) return;
    map.set(device.productID, {
      productID: device.productID,
      productName: device.productName || device.productID,
      productImg: device.productImg,
    });
  });
  return Array.from(map.values());
}

const list = computed(() => toProductOptions(props.devices));
const loading = computed(() => props.loading);

function handleSelect(productID: string) {
  const item = list.value.find((p) => p.productID === productID);
  if (!item) return;
  emit('select', { productID: item.productID, productName: item.productName, productImg: item.productImg });
}
function handleClose() { emit('close'); }
function handleMaskTap() { handleClose(); }
</script>

<style lang="scss" scoped>
.picker-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 998;
  background: var(--color-mask);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.picker-mask--visible {
  opacity: 1;
  pointer-events: auto;
}

.picker-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  height: 60vh;
  max-height: 85vh;
  background: var(--card-bg);
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateY(100%);
  transition: transform 0.28s ease;
  display: flex;
  flex-direction: column;
}
.picker-panel--visible {
  transform: translateY(0);
}

.picker-handle {
  display: flex;
  justify-content: center;
  padding: 16rpx 0 8rpx;
}

.picker-handle-bar {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: var(--border-color);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 32rpx 24rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.picker-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.picker-list {
  flex: 1;
  max-height: 70vh;
}

.picker-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--color-bg-secondary);
}

.picker-item--hover {
  background: var(--color-bg-secondary);
}

.picker-item--active {
  background: var(--color-primary-light);
}

.picker-item__img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  background: var(--color-bg-secondary);
}

.picker-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.picker-item__name {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.picker-item__desc {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-top: 6rpx;
}

.picker-item__check {
  color: var(--color-primary);
  font-size: 32rpx;
  font-weight: 600;
}

.picker-empty {
  padding: 80rpx 32rpx;
  text-align: center;
}

.picker-empty__text {
  color: var(--text-secondary);
  font-size: 28rpx;
}

</style>
