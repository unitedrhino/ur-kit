<template>
<view :class="`device-card ${status === 2 ? 'device-card--online' : ''}`" @tap="handleTap" hover-class="device-card--hover">
  <view class="device-card__icon">
    <image v-if="productImg" :src="productImg" mode="aspectFit" class="device-card__img" />
    <view v-else class="device-card__img-placeholder">
      <text class="device-card__img-text">{{productName[0] || '?'}}</text>
    </view>
  </view>
  <view class="device-card__info">
    <text class="device-card__name">{{displayName}}</text>
  </view>
  <view class="device-card__status">
    <view :class="`device-card__dot ${status === 2 ? 'device-card__dot--online' : (status === 4 ? 'device-card__dot--error' : '')}`"></view>
    <text class="device-card__status-text">{{status === 2 ? '在线' : (status === 4 ? '异常' : (status === 1 ? '未激活' : '离线'))}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import { computed } from 'vue';

/** Props 定义设备卡片展示字段，deviceName 仍作为设备真实身份用于跳转。 */
interface Props {
  deviceName?: string;
  deviceAlias?: string;
  productName?: string;
  productID?: string;
  status?: number; // 1=未激活 2=在线 3=离线 4=异常
  productImg?: string;
}
const props = withDefaults(defineProps<Props>(), {
  deviceName: '',
  deviceAlias: '',
  productName: '',
  productID: '',
  status: 1,
  productImg: '',
});
const emit = defineEmits<{
  (e: 'tap', payload: { productID: string; deviceName: string }): void;
  (e: 'select', payload: { productID: string; deviceName: string }): void;
}>();

/** displayName 是列表中唯一展示的设备名称，优先使用用户设置的设备别名。 */
const displayName = computed(() => props.deviceAlias || props.deviceName);

function handleTap() {
  const payload = { productID: props.productID, deviceName: props.deviceName };
  emit('select', payload);
  emit('tap', payload);
}
</script>

<style lang="scss" scoped>
.device-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  margin-bottom: 12px;
}

.device-card--hover {
  opacity: 0.7;
}

.device-card__icon {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
}

.device-card__img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.device-card__img-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-card__img-text {
  font-size: 20px;
  color: var(--color-primary);
  font-weight: bold;
}

.device-card__info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
}

.device-card__name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.device-card__status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.device-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-offline);
  margin-right: 4px;
}

.device-card__dot--online {
  background: var(--color-success);
}

.device-card__dot--error {
  background: var(--color-warning);
}

.device-card__status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

</style>
