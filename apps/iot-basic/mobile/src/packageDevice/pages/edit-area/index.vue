<template>
<app-navigation-bar :title="`设备${TERM.area}`" />

<scroll-view class="ea-body" scroll-y type="list" :show-scrollbar="false">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else>
    <!-- 新增 入口 -->
    <view class="ea-list ea-list--top">
      <view class="ea-item ea-item--add" @tap="handleCreate" hover-class="ea-item--hover">
        <app-icon class="ea-item__add-icon" name="tabler:plus" :size="'36rpx'" />
        <text class="ea-item__add-text">新建{{TERM.area}}</text>
      </view>
    </view>

    <view v-if="list.length > 0" class="ea-list">
      <view
        v-for="(item, index) in list" :key="item.areaID"
        class="ea-item"
        @tap="handleSelect(item.areaID)"
        hover-class="ea-item--hover"
      >
        <view class="ea-item__main">
          <app-icon class="ea-item__icon" :name="normalizeAreaIcon(item.areaImg)" :size="'32rpx'" />
          <text class="ea-item__name">{{item.areaName}}</text>
        </view>
        <app-icon class="ea-item__check" v-if="item.areaID === selectedID" name="tabler:check" :size="'32rpx'" />
      </view>
    </view>

    <empty-state v-else :text="`还没有${TERM.area}`" />
  </template>
</scroll-view>

<view class="ea-footer">
  <view
    :class="`ea-btn ea-btn--primary ${submitting ? 'ea-btn--disabled' : ''}`"
    @tap="submitting ? null : handleSubmit()"
    hover-class="ea-btn--hover"
  >
    <text>{{submitting ? '保存中...' : '保存'}}</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../../../components/app-icon/app-icon.vue';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { deviceService } from '../../../services/device.service';
import { areaService } from '../../../services/area.service';
import { TERM } from '../../../config/terminology';
import { normalizeAreaIcon } from '../../../config/area-icons';
import type { AreaEntity } from '../../../domain/entities/area.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const loading = ref(true);
const productID = ref('');
const deviceName = ref('');
const projectID = ref('');
const originalID = ref('');
const selectedID = ref('');
const list = ref<AreaEntity[]>([]);
const submitting = ref(false);

async function loadList() {
  if (!projectID.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const result = await areaService.getList(projectID.value, 1, 100);
    list.value = result.list;
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const o = options || {};
  const ready = await ensurePageReady('/packageDevice/pages/edit-area/index', o);
  if (!ready) {
    loading.value = false;
    return;
  }
  productID.value = o.productID || '';
  deviceName.value = o.deviceName || '';
  projectID.value = o.projectID || '';
  originalID.value = o.areaID || '';
  selectedID.value = originalID.value;
  await loadList();
});

onShow(() => {
  if (projectID.value && !loading.value) {
    void loadList();
  }
});

function handleSelect(id: string) {
  selectedID.value = id === selectedID.value ? '' : id;
}

function handleCreate() {
  if (!projectID.value) return;
  uni.navigateTo({
    url: `/packageUser/pages/room-edit/index?projectID=${projectID.value}`,
  });
}

async function handleSubmit() {
  if (submitting.value) return;
  if (selectedID.value === originalID.value) {
    uni.navigateBack({ delta: 1 });
    return;
  }
  submitting.value = true;
  try {
    await deviceService.update({
      productID: productID.value,
      deviceName: deviceName.value,
      areaID: selectedID.value,
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.ea-body {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.ea-list {
  margin: 24rpx 32rpx 0;
  background: var(--card-bg);
  border-radius: 24rpx;
  overflow: hidden;
}

.ea-list--top {
  margin-top: 24rpx;
}

.ea-item--add {
  justify-content: flex-start;
}

.ea-item__add-icon {
  color: var(--color-primary);
  margin-right: 16rpx;
}

.ea-item__add-text {
  font-size: 30rpx;
  color: var(--color-primary);
}

.ea-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid var(--divider);
}

.ea-item:last-child {
  border-bottom: none;
}

.ea-item--hover {
  background: var(--color-bg-secondary);
}

.ea-item__main {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.ea-item__icon {
  color: var(--text-primary);
  margin-right: 16rpx;
}

.ea-item__name {
  font-size: 30rpx;
  color: var(--text-primary);
}

.ea-item__check {
  color: var(--color-primary);
}

.ea-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--divider);
}

.ea-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.ea-btn--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.ea-btn--hover {
  opacity: 0.85;
}

.ea-btn--disabled {
  opacity: 0.5;
}

</style>
