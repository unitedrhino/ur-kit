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
          <text class="picker-title">{{title}}</text>
          <view class="picker-close" @tap="handleClose"><text>✕</text></view>
        </view>

        <view v-if="!productId" class="picker-empty"><text class="picker-empty__text">请先选择产品</text></view>
        <view v-else-if="loading" class="picker-empty"><text class="picker-empty__text">加载中...</text></view>

        <template v-else-if="items.length > 0">
          <view
            v-for="(item, index) in items" :key="item.dataID"
            :class="`picker-item ${item.dataID === selectedId ? 'picker-item--active' : ''}`"
            :data-id="item.dataID"
            @tap="handleSelect(item.dataID)"
            hover-class="picker-item--hover"
          >
            <view class="picker-item__info">
              <text class="picker-item__name">{{item.dataName || item.dataID}}</text>
              <text class="picker-item__desc">{{item.dataID}} · {{item.kind}}{{item.mode ? ' · ' + item.mode : ''}}</text>
            </view>
            <app-icon v-if="item.dataID === selectedId" class="picker-item__check" name="tabler:check" :size="16" />
          </view>
        </template>

        <view v-else class="picker-empty"><text class="picker-empty__text">该产品暂无可选项</text></view>
      </scroll-view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { ref, computed, watch } from 'vue';
import { deviceControlService } from '../../../services/device-control.service';
import type { ThingModelSchema } from '../../../domain/models/device-control.model';

type SchemaKind = 'property-write' | 'property-read' | 'property-all' | 'event' | 'action';
interface SchemaItem {
  dataID: string;
  dataName: string;
  kind: 'property' | 'event' | 'action';
  mode?: string;
  define?: Record<string, unknown>;
}

interface Props { visible?: boolean; productId?: string; schemaType?: SchemaKind; selectedId?: string }
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productId: '',
  schemaType: 'property-all',
  selectedId: '',
});
const emit = defineEmits<{
  (e: 'select', payload: { dataID: string; dataName: string; kind: string; mode: string; define: Record<string, unknown> }): void;
  (e: 'close'): void;
}>();

const items = ref<SchemaItem[]>([]);
const loading = ref(false);
const loadedForProductID = ref('');
const title = computed(() => {
  const map: Record<string, string> = {
    'property-write': '选择可控属性',
    'property-read': '选择可读属性',
    'property-all': '选择属性',
    event: '选择事件',
    action: '选择物模型服务',
  };
  return map[props.schemaType] || '选择物模型';
});

function filterItems(schema: ThingModelSchema): SchemaItem[] {
  const kind = props.schemaType;
  if (kind === 'event') {
    return (schema.events || []).map((e) => ({ dataID: e.identifier, dataName: e.name, kind: 'event' }));
  }
  if (kind === 'action') {
    return (schema.actions || []).map((a) => ({ dataID: a.identifier, dataName: a.name, kind: 'action' }));
  }
  const properties = schema.properties || [];
  const filtered = properties.filter((p) => {
    if (kind === 'property-write') return (p.mode || '').includes('w');
    if (kind === 'property-read') return (p.mode || '').includes('r');
    return true;
  });
  return filtered.map((p) => ({
    dataID: p.identifier,
    dataName: p.name,
    kind: 'property',
    mode: p.mode,
    define: p.define as unknown as Record<string, unknown>,
  }));
}
async function loadSchema(productID: string) {
  if (loading.value) return;
  loading.value = true;
  try {
    const schema = await deviceControlService.getThingModel(productID);
    loadedForProductID.value = productID;
    items.value = filterItems(schema);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载物模型失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
watch([() => props.visible, () => props.productId, () => props.schemaType], () => {
  if (props.visible && props.productId && loadedForProductID.value !== props.productId) {
    loadSchema(props.productId);
  }
});
function handleSelect(dataID: string) {
  const item = items.value.find((x) => x.dataID === dataID);
  if (!item) return;
  emit('select', {
    dataID: item.dataID,
    dataName: item.dataName,
    kind: item.kind,
    mode: item.mode || '',
    define: item.define || {},
  });
}
function handleClose() { emit('close'); }
function handleMaskTap() { handleClose(); }
/* eslint-disable */
// import { DeviceInteractRepositoryImpl } from '../../../data/repositories/device-interact.repository.impl';
// import type { ThingModelSchema } from '../../../domain/models/device-control.model';
// 
// const interactRepo = new DeviceInteractRepositoryImpl();
// 
// type SchemaKind = 'property-write' | 'property-read' | 'property-all' | 'event' | 'action';
// 
// interface SchemaItem {
//   dataID: string;
//   dataName: string;
//   kind: 'property' | 'event' | 'action';
//   mode?: string;
//   define?: Record<string, unknown>;
// }
// 
// Component({
//   properties: {
//     visible: { type: Boolean, value: false },
//     productID: { type: String, value: '' },
//     schemaType: { type: String, value: 'property-all' as SchemaKind },
//     selectedID: { type: String, value: '' },
//   },
// 
//   data: {
//     items: [] as SchemaItem[],
//     loading: false,
//     loadedForProductID: '',
//     title: '选择物模型',
//   },
// 
//   observers: {
//     'visible, productID, schemaType'(visible: boolean, productID: string) {
//       if (visible && productID && this.data.loadedForProductID !== productID) {
//         this.loadSchema(productID);
//       }
//       if (visible) {
//         this.setData({ title: this.getTitle() });
//       }
//     },
//   },
// 
//   methods: {
//     getTitle(): string {
//       const map: Record<string, string> = {
//         'property-write': '选择可控属性',
//         'property-read': '选择可读属性',
//         'property-all': '选择属性',
//         event: '选择事件',
//         action: '选择物模型服务',
//       };
//       return map[this.data.schemaType] || '选择物模型';
//     },
// 
//     async loadSchema(productID: string) {
//       if (this.data.loading) return;
//       this.setData({ loading: true });
//       try {
//         const schema: ThingModelSchema = await interactRepo.getThingModel(productID);
//         this.setData({ loadedForProductID: productID, items: this.filterItems(schema) });
//       } catch (err) {
//         wx.showToast({ title: (err as Error).message || '加载物模型失败', icon: 'none' });
//       } finally {
//         this.setData({ loading: false });
//       }
//     },
// 
//     filterItems(schema: ThingModelSchema): SchemaItem[] {
//       const kind = this.data.schemaType as SchemaKind;
//       if (kind === 'event') {
//         return (schema.events || []).map((e) => ({ dataID: e.identifier, dataName: e.name, kind: 'event' }));
//       }
//       if (kind === 'action') {
//         return (schema.actions || []).map((a) => ({ dataID: a.identifier, dataName: a.name, kind: 'action' }));
//       }
//       const properties = schema.properties || [];
//       const filtered = properties.filter((p) => {
//         if (kind === 'property-write') return (p.mode || '').includes('w');
//         if (kind === 'property-read') return (p.mode || '').includes('r');
//         return true;
//       });
//       return filtered.map((p) => ({
//         dataID: p.identifier,
//         dataName: p.name,
//         kind: 'property',
//         mode: p.mode,
//         define: p.define as unknown as Record<string, unknown>,
//       }));
//     },
// 
//     handleSelect(e: WechatMiniprogram.CustomEvent) {
//       const dataID = e.currentTarget.dataset.id as string;
//       const item = this.data.items.find((x) => x.dataID === dataID);
//       if (!item) return;
//       this.triggerEvent('select', {
//         dataID: item.dataID,
//         dataName: item.dataName,
//         kind: item.kind,
//         mode: item.mode || '',
//         define: item.define || {},
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
  font-size: 22rpx;
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
