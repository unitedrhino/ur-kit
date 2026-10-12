<template>
<view v-if="visible" class="picker-overlay" @tap="handleMaskTap">
  <view class="picker-panel" @tap.stop="">
    <view class="picker-header">
      <text class="picker-title">选择组织</text>
    </view>

    <scroll-view
      v-if="list.length > 0"
      type="list"
      scroll-y
      class="picker-list"
      :style="`height: ${list.length > 5 ? '500rpx' : list.length * 100 + 'rpx'};`"
    >
      <view
        v-for="item in list" :key="item.code"
        :class="`picker-item ${item.code === currentCode ? 'picker-item--active' : ''}`"
        @tap="handleSelect(item.code)"
        hover-class="picker-item--hover"
      >
        <text class="picker-item__name">{{item.name}}</text>
        <app-icon v-if="item.code === currentCode" class="picker-item__check" name="tabler:check" :size="16" />
      </view>
    </scroll-view>

    <view v-else class="picker-empty">
      <text class="picker-empty__text">暂无可选组织</text>
    </view>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../app-icon/app-icon.vue';
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { tenantProvider } from '../../providers/tenant.provider';
import type { TenantEntity } from '../../domain/entities/tenant.entity';

interface Props { visible?: boolean }
const props = withDefaults(defineProps<Props>(), { visible: false });
const emit = defineEmits<{ (e: 'close'): void }>();

const list = ref<TenantEntity[]>([]);
const currentCode = ref('');

function syncFromProvider() {
  const s = tenantProvider.getState();
  list.value = s.list;
  currentCode.value = s.current?.code || '';
}

let unsubscribe: (() => void) | null = null;
onMounted(() => {
  syncFromProvider();
  unsubscribe = tenantProvider.subscribe(() => syncFromProvider());
});
onUnmounted(() => {
  unsubscribe?.();
});

watch(() => props.visible, (val) => {
  if (val) syncFromProvider();
});

function handleSelect(code: string) {
  if (code === currentCode.value) {
    handleClose();
    return;
  }
  tenantProvider.switchTenant(code);
  currentCode.value = code;
  handleClose();
}
function handleClose() { emit('close'); }
function handleMaskTap() { handleClose(); }
/* eslint-disable */
// import { tenantProvider } from '../../providers/tenant.provider';
// import type { TenantEntity } from '../../domain/entities/tenant.entity';
// 
// Component({
//   properties: {
//     visible: { type: Boolean, value: false },
//   },
// 
//   data: {
//     list: [] as TenantEntity[],
//     currentCode: '',
//   },
// 
//   lifetimes: {
//     attached() {
//       const state = tenantProvider.getState();
//       this.setData({
//         list: state.list,
//         currentCode: state.current?.code || '',
//       });
// 
//       (this as any)._unsubscribe = tenantProvider.subscribe((s) => {
//         this.setData({
//           list: s.list,
//           currentCode: s.current?.code || '',
//         });
//       });
//     },
// 
//     detached() {
//       if ((this as any)._unsubscribe) {
//         (this as any)._unsubscribe();
//       }
//     },
//   },
// 
//   observers: {
//     visible(val: boolean) {
//       if (val) {
//         const state = tenantProvider.getState();
//         this.setData({
//           list: state.list,
//           currentCode: state.current?.code || '',
//         });
//       }
//     },
//   },
// 
//   methods: {
//     handleSelect(e: WechatMiniprogram.CustomEvent) {
//       const code = e.currentTarget.dataset.code as string;
//       if (code === this.data.currentCode) {
//         this.handleClose();
//         return;
//       }
//       tenantProvider.switchTenant(code);
//       this.setData({ currentCode: code });
//       this.handleClose();
//     },
// 
//     handleClose() {
//       this.triggerEvent('close');
//     },
// 
//     handleMaskTap() {
//       this.handleClose();
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--color-mask);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.picker-panel {
  width: 100%;
  max-height: 60vh;
  background: var(--card-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid var(--border-color);
}

.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.picker-list {
  flex: 1;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1px solid var(--border-color);
}

.picker-item--hover {
  background: var(--color-primary-light);
}

.picker-item--active .picker-item__name {
  color: var(--color-primary);
  font-weight: 500;
}

.picker-item__name {
  font-size: 30rpx;
  color: var(--text-primary);
}

.picker-item__check {
  font-size: 32rpx;
  color: var(--color-primary);
  font-weight: 600;
}

.picker-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.picker-empty__text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

</style>
