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
          <text class="picker-title">选择场景</text>
          <view class="picker-close" @tap="handleClose"><text>✕</text></view>
        </view>

        <view v-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <template v-else-if="list.length > 0">
          <view
            v-for="(item, index) in list" :key="item.id"
            :class="`picker-item ${item.id === selectedID ? 'picker-item--active' : ''}`"
            :data-id="item.id"
            @tap="handleSelect(item.id)"
            hover-class="picker-item--hover"
          >
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.name}}</text>
              <text class="picker-item__desc">{{item.type === 'auto' ? '自动化' : '手动'}}</text>
            </view>
            <app-icon v-if="item.id === selectedID" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">暂无可选场景</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { ref, watch } from 'vue';
import { SceneService } from '../../../services/scene.service';
import type { SceneEntity } from '../../../domain/entities/scene.entity';

const sceneService = new SceneService();

interface Props { visible?: boolean; selectedID?: string; excludeID?: string }
const props = withDefaults(defineProps<Props>(), { visible: false, selectedID: '', excludeID: '' });
const emit = defineEmits<{
  (e: 'select', payload: { sceneID: string; sceneName: string; sceneType: string }): void;
  (e: 'close'): void;
}>();

const list = ref<SceneEntity[]>([]);
const loading = ref(false);
const loaded = ref(false);

async function loadList() {
  if (loading.value) return;
  loading.value = true;
  try {
    const result = await sceneService.getList(1, 200);
    list.value = props.excludeID ? result.list.filter((s) => s.id !== props.excludeID) : result.list;
    loaded.value = true;
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载场景失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
watch(() => props.visible, (val) => {
  if (val && !loaded.value) loadList();
});
function handleSelect(sceneID: string) {
  const item = list.value.find((s) => s.id === sceneID);
  if (!item) return;
  emit('select', { sceneID: item.id, sceneName: item.name, sceneType: item.type });
}
function handleClose() { emit('close'); }
function handleMaskTap() { handleClose(); }
/* eslint-disable */
// import { SceneService } from '../../../services/scene.service';
// import type { SceneEntity } from '../../../domain/entities/scene.entity';
// 
// const sceneService = new SceneService();
// 
// Component({
//   properties: {
//     visible: { type: Boolean, value: false },
//     selectedID: { type: String, value: '' },
//     excludeID: { type: String, value: '' },
//   },
// 
//   data: {
//     list: [] as SceneEntity[],
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
//       this.setData({ loading: true });
//       try {
//         const result = await sceneService.getList(1, 200);
//         const excludeID = (this.data as unknown as { excludeID: string }).excludeID;
//         const list = excludeID ? result.list.filter((s) => s.id !== excludeID) : result.list;
//         this.setData({ list, loaded: true });
//       } catch (err) {
//         wx.showToast({ title: (err as Error).message || '加载场景失败', icon: 'none' });
//       } finally {
//         this.setData({ loading: false });
//       }
//     },
// 
//     handleSelect(e: WechatMiniprogram.CustomEvent) {
//       const sceneID = e.currentTarget.dataset.id as string;
//       const item = this.data.list.find((s) => s.id === sceneID);
//       if (!item) return;
//       this.triggerEvent('select', {
//         sceneID: item.id,
//         sceneName: item.name,
//         sceneType: item.type,
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
