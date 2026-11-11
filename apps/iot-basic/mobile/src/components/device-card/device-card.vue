<!-- 移动端页面与控件，使用统一主题、字号和圆角规范。 -->
<template>
<view :class="`device-card ${status === 2 ? 'device-card--online' : ''}`" @tap="handleTap" @longpress.stop="handleLongPress" @contextmenu="handleContextMenu" @mousedown="handleMouseDown" @mouseup="cancelMousePress" @mouseleave="cancelMousePress" hover-class="device-card--hover">
  <view v-if="selectionMode" :class="['device-card__selection', { 'device-card__selection--checked': selected }]" :aria-label="selected ? '已选择' : '未选择'"><text v-if="selected">✓</text></view>
  <view class="device-card__icon">
    <image v-if="displayImage" :src="displayImage" @error="handleImageError" mode="aspectFit" :draggable="false" class="device-card__img" />
    <view v-else class="device-card__img-placeholder">
      <view class="device-card__placeholder-body"><view class="device-card__placeholder-light" /></view>
    </view>
  </view>
  <view class="device-card__info">
    <text class="device-card__name">{{displayName}}</text>
  </view>
  <view class="device-card__right">
  <view class="device-card__status">
    <text v-if="areaName" class="device-card__area">{{areaName}} ·</text>
    <view :class="`device-card__dot ${status === 2 ? 'device-card__dot--online' : (status === 4 ? 'device-card__dot--error' : '')}`"></view>
    <text class="device-card__status-text">{{status === 2 ? '在线' : (status === 4 ? '异常' : (status === 1 ? '未激活' : '离线'))}}</text>
  </view>
  <view v-if="isShared" class="device-card__share" aria-label="共享设备">
    <app-icon name="tabler:share" :size="14" />
  </view>
  </view>
</view>

</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import AppIcon from '../app-icon/app-icon.vue';
import { deviceImageCandidates } from '../../utils/device-image';

/** Props 定义设备卡片展示字段，deviceName 仍作为设备真实身份用于跳转。 */
interface Props {
  /** isShared 表示跨项目收到的设备分享，卡片只显示分享图标。 */
  isShared?: boolean;
  deviceName?: string;
  deviceAlias?: string;
  productName?: string;
  productID?: string;
  status?: number; // 1=未激活 2=在线 3=离线 4=异常
  /** deviceImg 是设备单独配置的图片，优先于产品图片。 */
  deviceImg?: string;
  productImg?: string;
  /** deviceType 为产品设备类型，2 表示网关。 */
  deviceType?: number;
  /** areaName 是当前设备所属区域的展示名。 */
  areaName?: string;
  /** allowLongPress 开启长按，selectionMode 与 selected 显示选择状态。 */
  allowLongPress?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  deviceName: '',
  deviceAlias: '',
  productName: '',
  productID: '',
  status: 1,
  deviceImg: '',
  productImg: '',
  deviceType: 0,
  areaName: '',
  allowLongPress: false,
  selectionMode: false,
  selected: false,
  isShared: false,
});
/** 图片按设备、产品、分类默认图回退，全部失败时显示通用设备图形。 */
const imageIndex = ref(0);
const imageCandidates = computed(() => deviceImageCandidates(props.deviceImg, props.productImg, props.deviceType, props.productName, props.deviceAlias));
const displayImage = computed(() => imageCandidates.value[imageIndex.value] || '');
watch(() => [props.deviceImg, props.productImg, props.productName, props.deviceAlias, props.deviceType], () => { imageIndex.value = 0; });
/** handleImageError 尝试下一张候选图，避免失效地址循环加载。 */
function handleImageError(): void {
  if (imageIndex.value < imageCandidates.value.length) imageIndex.value += 1;
}
/** select/tap 返回设备身份供页面打开详情。 */
const emit = defineEmits<{
  (e: 'tap', payload: { productID: string; deviceName: string }): void;
  (e: 'select', payload: { productID: string; deviceName: string }): void;
  (e: 'longpress', payload: { productID: string; deviceName: string }): void;
}>();

/** displayName 是列表中唯一展示的设备名称，优先使用用户设置的设备别名。 */
const displayName = computed(() => props.deviceAlias || props.deviceName);

/** suppressTapUntil 防止长按结束后的点击又取消选择或进入详情。 */
let suppressTapUntil = 0;
/** H5 桌面鼠标长按补充 uni 触屏长按，松开或移出时取消。 */
let mousePressTimer: ReturnType<typeof setTimeout> | undefined;
function cancelMousePress(): void { if (mousePressTimer) clearTimeout(mousePressTimer); mousePressTimer = undefined; }
function handleMouseDown(event: MouseEvent): void {
  // #ifdef H5
  if (!props.allowLongPress || (typeof event.button === 'number' && event.button !== 0)) return;
  cancelMousePress();
  mousePressTimer = setTimeout(() => { mousePressTimer = undefined; handleLongPress(); }, 600);
  // #endif
}
onUnmounted(cancelMousePress);
/** handleContextMenu 仅在启用长按的列表抑制浏览器默认菜单。 */
function handleContextMenu(event: Event): void { if (props.allowLongPress) event.preventDefault(); }
/** handleLongPress 通知列表进入选择模式。 */
function handleLongPress(): void {
  if (!props.allowLongPress || Date.now() < suppressTapUntil) return;
  cancelMousePress();
  suppressTapUntil = Date.now() + 700;
  emit('longpress', { productID: props.productID, deviceName: props.deviceName });
}
/** handleTap 保持原有设备选择事件；长按后的附带点击不重复触发。 */
function handleTap() {
  if (Date.now() < suppressTapUntil) return;
  const payload = { productID: props.productID, deviceName: props.deviceName };
  emit('select', payload);
  emit('tap', payload);
}
</script>

<style lang="scss" scoped>
.device-card { position: relative; min-height: 156px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; padding: 16px; background: var(--card-bg); border-radius: var(--radius-lg); gap: 12px; }
.device-card--hover { opacity: .75; }
.device-card__selection { position: absolute; right: 14px; top: 14px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--text-placeholder); border-radius: 50%; background: var(--card-bg); color: var(--color-on-primary); font-size: var(--font-caption); }
.device-card__selection--checked { background: var(--color-success); border-color: var(--color-success); }
.device-card__icon, .device-card__img, .device-card__img-placeholder { width: 64px; height: 64px; border-radius: var(--radius-sm); }
.device-card__img-placeholder { display: flex; align-items: center; justify-content: center; background: var(--color-primary-light); }
.device-card__placeholder-body { width: 32px; height: 36px; box-sizing: border-box; border: 2px solid var(--color-primary); border-radius: 8px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; }
.device-card__placeholder-light { width: 8px; height: 3px; border-radius: 2px; background: var(--color-primary); }
.device-card__info { width: 100%; min-width: 0; flex: 1; }
.device-card__name { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: var(--font-label); font-weight: 600; line-height: 1.4; word-break: break-all; }
.device-card__right { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.device-card__status { display: flex; align-items: center; gap: 5px; min-width: 0; }
.device-card__area { max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-caption); color: var(--text-secondary); }
.device-card__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-offline); }
.device-card__dot--online { background: var(--color-success); }
.device-card__dot--error { background: var(--color-warning); }
.device-card__status-text { flex-shrink: 0; font-size: var(--font-caption); color: var(--text-secondary); }
.device-card__share { display: flex; align-items: center; gap: 3px; font-size: var(--font-caption); color: var(--color-primary); }
</style>
