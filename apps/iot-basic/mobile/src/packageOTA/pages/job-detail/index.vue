<template>
<app-navigation-bar title="升级任务详情" />

<scroll-view class="detail-page" scroll-y type="list">
  <loading v-if="loading" text="加载中..." />

  <template v-else-if="job">
    <view class="info-card">
      <view class="info-row">
        <text class="info-label">任务名称</text>
        <text class="info-value">{{job.firmwareName}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">固件版本</text>
        <text class="info-value">v{{job.targetVersion}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">升级类型</text>
        <text class="info-value">{{job.type === 0 ? '通知升级' : '静默升级'}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">状态</text>
        <text :class="`info-value status-${job.status}`">{{job.status === 0 ? '创建中' : job.status === 1 ? '进行中' : job.status === 2 ? '已完成' : '已停止'}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">目标设备数</text>
        <text class="info-value">{{job.upgradeCount || '-'}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">成功 / 失败</text>
        <text class="info-value">{{job.successCount || 0}} / {{job.failureCount || 0}}</text>
      </view>
    </view>

    <button class="devices-btn" @tap="handleViewDevices">查看设备列表</button>
  </template>
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref, onUnmounted } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { otaProvider } from '../../../providers/ota.provider';
import type { OtaJobEntity } from '../../../domain/entities/ota-job.entity';
import { ensurePageReady } from '../../../utils/page-guard';

const jobID = ref('');
const job = ref<OtaJobEntity | null>(null);
const loading = ref(true);
const unsubscribes: Array<() => void> = [];

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const opts = (options || {}) as Record<string, string>;
  const ready = await ensurePageReady('/packageOTA/pages/job-detail/index', opts);
  if (!ready) {
    loading.value = false;
    return;
  }
  jobID.value = opts.jobID || '';

  unsubscribes.push(
    otaProvider.subscribe((s) => {
      job.value = s.jobDetail;
      loading.value = false;
    }),
  );

  otaProvider.loadJobDetail(jobID.value);
});

onUnload(() => unsubscribes.forEach((fn) => fn()));
onUnmounted(() => unsubscribes.forEach((fn) => fn()));

function handleViewDevices() {
  uni.navigateTo({
    url: `/packageOTA/pages/device-version/index?jobID=${jobID.value}`,
  });
}
</script>

<style lang="scss" scoped>
.detail-page { flex: 1;
  min-height: 0; background: var(--page-bg); }
.info-card { margin: 16px; background: var(--card-bg); border-radius: 12px; padding: 16px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 14px; color: var(--text-secondary); }
.info-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
.status-1 { color: var(--color-primary); }
.status-2 { color: var(--color-success); }
.status-3 { color: var(--color-error); }
.devices-btn { margin: 16px; background: var(--color-primary); color: var(--card-bg); border-radius: 24px; font-size: 15px; height: 44px; line-height: 44px; }

</style>
