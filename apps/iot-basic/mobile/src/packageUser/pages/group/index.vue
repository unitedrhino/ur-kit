<template>
<app-navigation-bar title="设备分组" />

<scroll-view class="group-page" scroll-y type="list">
  <template v-if="groups.length > 0">
    <view class="group-list">
      <view class="group-item" v-for="(item, index) in groups" :key="item.id" @tap="handleGroupTap(item.id)" hover-class="group-item--hover">
        <text class="group-item__name">{{item.name}}</text>
        <text class="group-item__count">{{item.deviceCount}}台设备</text>
      </view>
    </view>
  </template>
  <empty-state v-else text="暂无分组" />
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { ensurePageReady } from '../../../utils/page-guard';

const groups = ref<Array<{ id: string; name: string; deviceCount: number }>>([]);
const loading = ref(true);

onLoad(async () => {
  const ready = await ensurePageReady('/packageUser/pages/group/index');
  if (!ready) {
    loading.value = false;
    return;
  }
  // TODO: load device groups
  loading.value = false;
});

function handleGroupTap(id: string) {
  uni.showToast({ title: `分组 ${id}`, icon: 'none' });
}
</script>

<style lang="scss" scoped>
.group-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.group-list { padding: 16px; }
.group-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--card-bg); border-radius: 12px; margin-bottom: 10px; }
.group-item--hover { opacity: 0.7; }
.group-item__name { font-size: 15px; color: var(--text-primary); font-weight: 500; }
.group-item__count { font-size: 13px; color: var(--text-secondary); }

</style>
