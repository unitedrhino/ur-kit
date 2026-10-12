<template>
<app-navigation-bar title="固件列表" />

<scroll-view class="fw-page" scroll-y type="list">
  <loading v-if="loading" text="加载中..." />

  <template v-else-if="firmwares.length > 0">
    <view class="fw-list">
      <view class="fw-item" v-for="(item, index) in firmwares" :key="item.id" @tap="handleFirmwareTap(item.id)" hover-class="fw-item--hover">
        <text class="fw-item__name">{{item.name}}</text>
        <text class="fw-item__version">v{{item.version}}</text>
      </view>
    </view>
  </template>

  <empty-state v-else text="暂无固件" />
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { otaProvider } from '../../../providers/ota.provider';
import type { FirmwareEntity } from '../../../domain/entities/firmware.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const firmwares = ref<FirmwareEntity[]>([]);
const loading = ref(true);
const unsubscribes: Array<() => void> = [];

onLoad(async () => {
  const ready = await ensurePageReady('/packageOTA/pages/firmware-list/index');
  if (!ready) {
    loading.value = false;
    return;
  }
  unsubscribes.push(
    otaProvider.subscribe((s) => {
      firmwares.value = s.firmwares;
      loading.value = s.firmwarePageState.loading;
    }),
  );
  otaProvider.loadFirmwareList();
});

onUnload(() => unsubscribes.forEach((fn) => fn()));
onUnmounted(() => unsubscribes.forEach((fn) => fn()));

function handleFirmwareTap(id: string) {
  uni.navigateTo({ url: `/packageOTA/pages/job-create/index?firmwareID=${id}` });
}
</script>

<style lang="scss" scoped>
.fw-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.fw-list { padding: 0 16px; }
.fw-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: var(--card-bg); border-radius: 12px; margin-bottom: 10px; }
.fw-item--hover { opacity: 0.7; }
.fw-item__name { font-size: 15px; color: var(--text-primary); font-weight: 500; }
.fw-item__version { font-size: 13px; color: var(--color-primary); }

</style>
