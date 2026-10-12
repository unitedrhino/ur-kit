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
          <text class="picker-title">选择区域</text>
          <view class="picker-close" @tap="handleClose"><text>✕</text></view>
        </view>

        <view v-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <template v-else-if="list.length > 0">
          <view
            v-for="(item, index) in list" :key="item.areaID"
            :class="`picker-item ${item.areaID === selectedID ? 'picker-item--active' : ''}`"
            :data-id="item.areaID"
            @tap="handleSelect(item.areaID)"
            hover-class="picker-item--hover"
          >
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.areaName}}</text>
              <text class="picker-item__desc">设备 {{item.deviceCount || 0}}</text>
            </view>
            <app-icon v-if="item.areaID === selectedID" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">暂无可选区域</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { ref, watch } from 'vue';
import { areaService } from '../../../services/area.service';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import type { AreaEntity } from '../../../domain/entities/area.entity';

interface Props { visible?: boolean; selectedID?: string }
const props = withDefaults(defineProps<Props>(), { visible: false, selectedID: '' });
const emit = defineEmits<{
  (e: 'select', payload: { areaID: string; areaName: string }): void;
  (e: 'close'): void;
}>();

const list = ref<AreaEntity[]>([]);
const loading = ref(false);
const loaded = ref(false);

async function loadList() {
  if (loading.value) return;
  const projectID = currentFamilyProvider.getState().projectID;
  if (!projectID) {
    uni.showToast({ title: '未选择项目', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const result = await areaService.getList(projectID, 1, 200);
    list.value = result.list;
    loaded.value = true;
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载区域失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
watch(() => props.visible, (val) => {
  if (val && !loaded.value) loadList();
});
function handleSelect(areaID: string) {
  const item = list.value.find((a) => a.areaID === areaID);
  if (!item) return;
  emit('select', { areaID: item.areaID, areaName: item.areaName });
}
function handleClose() { emit('close'); }
function handleMaskTap() { handleClose(); }
/* eslint-disable */
// import { areaService } from '../../../services/area.service';
// import { currentFamilyProvider } from '../../../providers/current-family.provider';
// import type { AreaEntity } from '../../../domain/entities/area.entity';
// 
// Component({
//   properties: {
//     visible: { type: Boolean, value: false },
//     selectedID: { type: String, value: '' },
//   },
// 
//   data: {
//     list: [] as AreaEntity[],
//     loading: false,
//     loaded: false,
//   },
// 
//   observers: {
//     visible(val: boolean) {
//       if (val && !this.data.loaded) {
//         this.loadList();
//       }
//     },
//   },
// 
//   methods: {
//     async loadList() {
//       if (this.data.loading) return;
//       const projectID = currentFamilyProvider.getState().projectID;
//       if (!projectID) {
//         wx.showToast({ title: '未选择项目', icon: 'none' });
//         return;
//       }
//       this.setData({ loading: true });
//       try {
//         const result = await areaService.getList(projectID, 1, 200);
//         this.setData({ list: result.list, loaded: true });
//       } catch (err) {
//         wx.showToast({ title: (err as Error).message || '加载区域失败', icon: 'none' });
//       } finally {
//         this.setData({ loading: false });
//       }
//     },
// 
//     handleSelect(e: WechatMiniprogram.CustomEvent) {
//       const areaID = e.currentTarget.dataset.id as string;
//       const item = this.data.list.find((a) => a.areaID === areaID);
//       if (!item) return;
//       this.triggerEvent('select', {
//         areaID: item.areaID,
//         areaName: item.areaName,
//       });
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
  margin-top: 8rpx;
}

.picker-item__check {
  color: var(--color-primary);
  font-size: 32rpx;
  font-weight: 600;
  margin-left: 16rpx;
}

.picker-empty {
  padding: 120rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-empty__text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

</style>
