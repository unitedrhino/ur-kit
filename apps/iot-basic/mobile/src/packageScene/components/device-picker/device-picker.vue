<!-- 场景设备选择弹窗：展示设备图片、状态及当前选择。 -->
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

        <view v-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <view v-else-if="error" class="picker-empty" @tap="emit('retry')"><text class="picker-empty__text">{{ error }}，点击重试</text></view>

        <template v-else-if="list.length > 0">
          <view
            v-for="(item, index) in list" :key="item.productID + '::' + item.deviceName"
            :class="`picker-item ${item.deviceName === selectedName && item.productID === productId ? 'picker-item--active' : ''}`"
            :data-name="item.deviceName"
            @tap="handleSelect(item)"
            hover-class="picker-item--hover"
          >
            <view class="picker-item__image">
              <image v-if="imageFor(item)" :src="imageFor(item)" mode="aspectFit" class="picker-item__image-content" @error="handleImageError(item, imageFor(item))" />
              <app-icon v-else name="tabler:devices" :size="26" color="var(--color-primary)" />
            </view>
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.deviceAlias || item.deviceName}}</text>
              <text class="picker-item__desc">{{item.productName || item.productID}} · {{item.deviceName}}</text>
            </view>
            <view :class="`picker-item__status ${item.status === 2 ? 'picker-item__status--online' : (item.status === 4 ? 'picker-item__status--error' : '')}`">
              <text>{{item.status === 2 ? '在线' : (item.status === 4 ? '异常' : (item.status === 1 ? '未激活' : '离线'))}}</text>
            </view>
            <app-icon v-if="item.deviceName === selectedName && item.productID === productId" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">暂无可选择的设备</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { computed, reactive } from 'vue';
import { defaultDeviceImage } from '../../../utils/device-image';
import type { DeviceEntity } from '../../../domain/entities/device.entity';

interface Props { visible?: boolean; productId?: string; selectedName?: string; devices?: DeviceEntity[]; loading?: boolean; error?: string }
const props = withDefaults(defineProps<Props>(), { visible: false, productId: '', selectedName: '', devices: () => [], loading: false, error: '' });
const emit = defineEmits<{
  (e: 'select', payload: { productID: string; deviceName: string; deviceAlias: string; productName: string }): void;
  (e: 'close'): void;
  (e: 'retry'): void;
}>();

/** 按设备及图片地址记录加载失败，产品图片更新后可正常重试。 */
const failedImages = reactive<Record<string, string[]>>({});
/** imageFor 先展示产品图，再回退到品类默认图或通用图标。 */
function imageFor(item: DeviceEntity): string {
  const failed = failedImages[JSON.stringify([item.productID, item.deviceName])] || [];
  return [item.productImg, defaultDeviceImage(item.deviceType, item.productName, item.deviceAlias)].find(src => !!src && !failed.includes(src)) || '';
}
/** handleImageError 仅标记对应设备的失败图片，防止重复加载。 */
function handleImageError(item: DeviceEntity, src: string): void {
  if (!src) return;
  const key = JSON.stringify([item.productID, item.deviceName]);
  failedImages[key] = [...(failedImages[key] || []), src];
}

/** list 直接展示当前项目已加载的设备，使用产品和设备名共同标识。 */
const list = computed(() => props.devices);
const loading = computed(() => props.loading);

function handleSelect(item: DeviceEntity) {
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
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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
  font-size: var(--font-label);
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
  gap: 20rpx;
  margin: 16rpx 24rpx;
  padding: 20rpx;
  border: 1rpx solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--card-bg);
}

.picker-item--hover {
  background: var(--color-bg-secondary);
}

.picker-item--active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.picker-item__image {
  width: 104rpx; height: 104rpx; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); background: var(--color-bg-secondary); overflow: hidden;
}
.picker-item__image-content { width: 100%; height: 100%; }

.picker-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.picker-item__name {
  font-size: var(--font-label);
  color: var(--text-primary);
  font-weight: 500;
}

.picker-item__desc {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: 6rpx;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.picker-item__status {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  padding: 4rpx 12rpx;
  background: var(--border-color);
  border-radius: 8rpx;
  flex-shrink: 0;
}

.picker-item__status--online {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.picker-item__check {
  color: var(--color-primary);
  font-size: var(--font-label);
  font-weight: 600;
}

.picker-empty {
  padding: 80rpx 32rpx;
  text-align: center;
}

.picker-empty__text {
  color: var(--text-secondary);
  font-size: var(--font-body);
}

</style>
