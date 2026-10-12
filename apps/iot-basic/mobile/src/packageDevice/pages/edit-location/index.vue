<template>
<app-navigation-bar title="设备位置" />

<scroll-view class="el-body" scroll-y type="list" :show-scrollbar="false">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else>
    <view class="el-card">
      <text class="el-card__title">设备安装位置</text>
      <text class="el-card__desc">可使用当前位置刷新设备安装位置，便于后续维护和管理时识别设备所在地点。</text>

      <view class="el-location">
        <text class="el-location__label">当前位置</text>
        <text class="el-location__value">{{locationText}}</text>
        <text v-if="locationError" class="el-location__error">{{locationError}}</text>
      </view>

      <view class="el-actions">
        <view class="el-btn el-btn--ghost" @tap="handleFetchLocation" hover-class="el-btn--hover">
          <loading v-if="locationLoading" :size="18" color="var(--color-primary)" />
          <text v-else class="el-btn__text el-btn__text--ghost">{{position ? '重新获取当前位置' : '获取当前位置'}}</text>
        </view>
      </view>
    </view>
  </template>
</scroll-view>

<view class="el-footer">
  <view
    :class="`el-btn el-btn--primary ${(saving || !position) ? 'el-btn--disabled' : ''}`"
    @tap="() => !(saving || !position) && handleSave()"
    hover-class="el-btn--hover"
  >
    <loading v-if="saving" :size="18" color="var(--color-on-primary)" />
    <text v-else class="el-btn__text">保存位置</text>
  </view>
</view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceService } from '../../../services/device.service';
import { locationService } from '../../../services/location.service';
import { ensurePageReady } from '../../../utils/page-guard';
import { formatGeoPoint, LocationError, type GeoPoint } from '../../../domain/models/location.model';

const loading = ref(true);
const locationLoading = ref(false);
const saving = ref(false);
const productID = ref('');
const deviceName = ref('');
const position = ref<GeoPoint | null>(null);
const locationText = ref('未设置');
const locationError = ref('');

function syncLocationText() {
  locationText.value = formatGeoPoint(position.value);
}

async function loadDevice() {
  loading.value = true;
  try {
    const device = await deviceService.getDetail(productID.value, deviceName.value);
    position.value = device.position || null;
    syncLocationText();
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const o = options || {};
  const ready = await ensurePageReady('/packageDevice/pages/edit-location/index', o);
  if (!ready) {
    loading.value = false;
    return;
  }
  productID.value = o.productID || '';
  deviceName.value = o.deviceName || '';
  if (!productID.value || !deviceName.value) {
    loading.value = false;
    return;
  }
  await loadDevice();
});

function promptLocationSetting() {
  uni.showModal({
    title: '开启定位权限',
    content: '开启后可获取当前位置并保存为设备安装位置。',
    confirmText: '去开启',
    cancelText: '稍后',
    success: (res) => {
      if (!res.confirm) return;
      uni.openSetting({
        success: (setting) => {
          if (setting.authSetting['scope.userLocation'] === true) void handleFetchLocation();
        },
      });
    },
  });
}

async function handleFetchLocation() {
  if (locationLoading.value) return;
  locationLoading.value = true;
  locationError.value = '';
  try {
    position.value = await locationService.getCurrentLocation();
    syncLocationText();
  } catch (err) {
    if (err instanceof LocationError && err.code === 'LOCATION_PERMISSION_DENIED') {
      locationError.value = '定位权限未开启，允许后可保存设备安装位置。';
      promptLocationSetting();
    } else {
      locationError.value = (err as Error).message || '暂时无法获取当前位置';
    }
  } finally {
    locationLoading.value = false;
  }
}

async function handleSave() {
  if (!position.value || saving.value) return;
  saving.value = true;
  try {
    await deviceService.update({
      productID: productID.value,
      deviceName: deviceName.value,
      position: position.value,
    });
    uni.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => uni.navigateBack({ delta: 1 }), 500);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
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

.el-body {
  flex: 1;
  overflow-y: hidden;
  margin-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.el-card {
  display: flex;
  flex-direction: column;
  margin: 24rpx 32rpx 0;
  padding: 32rpx;
  border-radius: 24rpx;
  background: var(--card-bg);
}

.el-card__title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.el-card__desc {
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.el-location {
  display: flex;
  flex-direction: column;
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: var(--color-bg-secondary);
}

.el-location__label {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.el-location__value {
  margin-top: 12rpx;
  font-size: 30rpx;
  line-height: 1.5;
  color: var(--text-primary);
}

.el-location__error {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--color-warning);
}

.el-actions {
  margin-top: 28rpx;
}

.el-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--card-bg);
  box-shadow: 0 -1rpx 0 var(--border-color);
}

.el-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 24rpx;
}

.el-btn--primary {
  background: var(--color-primary);
}

.el-btn--ghost {
  background: var(--color-primary-light);
}

.el-btn--disabled {
  opacity: 0.5;
}

.el-btn--hover {
  opacity: 0.72;
}

.el-btn__text {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--color-on-primary);
}

.el-btn__text--ghost {
  color: var(--color-primary);
}
</style>
