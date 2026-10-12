<template>
<app-navigation-bar title="设备版本" />

<scroll-view class="version-page" scroll-y type="list">
  <loading v-if="loading" text="加载中..." />

  <template v-else-if="devices.length > 0">
    <view class="device-list">
      <view class="device-item" v-for="(item, index) in devices" :key="item.deviceName">
        <view class="device-item__left">
          <text class="device-item__name">{{item.deviceName}}</text>
          <text class="device-item__ver">{{item.currentVersion}} → {{item.targetVersion}}</text>
        </view>
        <text :class="`device-item__status status-${item.status}`">{{item.statusText}}</text>
      </view>
    </view>
  </template>

  <empty-state v-else text="暂无设备" />
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { otaProvider } from '../../../providers/ota.provider';
import { ensurePageReady } from '../../../utils/page-guard';

interface DeviceVersionItem {
  deviceName: string;
  currentVersion: string;
  targetVersion: string;
  status: number;
  statusText: string;
}

const jobID = ref('');
const devices = ref<DeviceVersionItem[]>([]);
const loading = ref(true);
const unsubscribes: Array<() => void> = [];

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const opts = (options || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageOTA/pages/device-version/index', opts);
  if (!ready) {
    loading.value = false;
    return;
  }
  jobID.value = opts.jobID || '';

  unsubscribes.push(
    otaProvider.subscribe((s) => {
      devices.value = (s.jobDevices || []) as DeviceVersionItem[];
      loading.value = false;
    }),
  );

  otaProvider.loadJobDevices(jobID.value);
});

onUnload(() => unsubscribes.forEach((fn) => fn()));
onUnmounted(() => unsubscribes.forEach((fn) => fn()));
</script>

<style lang="scss" scoped>
.version-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.device-list { padding: 0 16px; }
.device-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--card-bg); border-radius: 12px; margin-bottom: 10px; }
.device-item__left { display: flex; flex-direction: column; gap: 4px; }
.device-item__name { font-size: 15px; color: var(--text-primary); font-weight: 500; }
.device-item__ver { font-size: 12px; color: var(--text-secondary); }
.device-item__status { font-size: 13px; font-weight: 500; }
.status-1 { color: var(--text-secondary); }
.status-2 { color: var(--color-primary); }
.status-3 { color: var(--color-success); }
.status-4 { color: var(--color-error); }

</style>
