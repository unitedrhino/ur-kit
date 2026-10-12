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
          <text class="picker-title">选择设备</text>
          <view class="picker-close" @tap="handleClose"><text>✕</text></view>
        </view>

        <view v-if="!productId" class="picker-empty"><text class="picker-empty__text">请先选择产品</text></view>
        <view v-else-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <template v-else-if="list.length > 0">
          <view
            v-for="(item, index) in list" :key="item.deviceName"
            :class="`picker-item ${item.deviceName === selectedName ? 'picker-item--active' : ''}`"
            :data-name="item.deviceName"
            @tap="handleSelect(item.deviceName)"
            hover-class="picker-item--hover"
          >
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.deviceAlias || item.deviceName}}</text>
              <text class="picker-item__desc">{{item.deviceName}}</text>
            </view>
            <view :class="`picker-item__status ${item.status === 2 ? 'picker-item__status--online' : (item.status === 4 ? 'picker-item__status--error' : '')}`">
              <text>{{item.status === 2 ? '在线' : (item.status === 4 ? '异常' : (item.status === 1 ? '未激活' : '离线'))}}</text>
            </view>
            <app-icon v-if="item.deviceName === selectedName" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">该产品下暂无设备</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { computed, watch } from 'vue';
import type { DeviceEntity } from '../../../domain/entities/device.entity';

interface Props { visible?: boolean; productId?: string; selectedName?: string; devices?: DeviceEntity[]; loading?: boolean }
const props = withDefaults(defineProps<Props>(), { visible: false, productId: '', selectedName: '', devices: () => [], loading: false });
const emit = defineEmits<{
  (e: 'select', payload: { productID: string; deviceName: string; deviceAlias: string; productName: string }): void;
  (e: 'close'): void;
}>();

// list 从统一设备列表中按产品过滤，组件本身不再发起设备接口请求。
const list = computed(() => {
  if (!props.productId) return [];
  return props.devices.filter((device) => device.productID === props.productId);
});
const loading = computed(() => props.loading);

// autoSelectOnlyDevice 只有一台可选设备且当前未选择时自动填入，避免产品选完后设备仍为空。
function autoSelectOnlyDevice(devices: DeviceEntity[]): void {
  if (props.selectedName || devices.length !== 1) return;
  const device = devices[0];
  if (!device) return;
  emit('select', {
    productID: device.productID,
    deviceName: device.deviceName,
    deviceAlias: device.deviceAlias,
    productName: device.productName,
  });
}

watch([() => props.visible, () => props.productId, list, loading], () => {
  if (props.visible && props.productId && !loading.value) {
    autoSelectOnlyDevice(list.value);
  }
});
function handleSelect(deviceName: string) {
  const item = list.value.find((d) => d.deviceName === deviceName);
  if (!item) return;
  emit('select', {
    productID: item.productID,
    deviceName: item.deviceName,
    deviceAlias: item.deviceAlias,
    productName: item.productName,
  });
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

.picker-item__status {
  font-size: 22rpx;
  color: var(--text-secondary);
  padding: 4rpx 12rpx;
  background: var(--border-color);
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.picker-item__status--online {
  color: var(--color-success);
  background: var(--color-success-bg);
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
