<template>
<app-navigation-bar title="设备信息" />

<scroll-view class="di-page" scroll-y type="list" :show-scrollbar="false">
  <loading v-if="loading" fullscreen text="加载中..." />

  <template v-else-if="device">
    <view v-for="group in groups" :key="group.title" class="di-group">
      <view class="di-group-head">
        <text class="di-group-head__title">{{group.title}}</text>
      </view>
      <view v-for="row in group.rows" :key="row.label" class="di-row">
        <text class="di-row__label">{{row.label}}</text>
        <text class="di-row__value">{{row.value}}</text>
      </view>
    </view>
  </template>
  <safe-area />
</scroll-view>

</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import Loading from '../../../components/loading/loading.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { deviceService } from '../../../services/device.service';
import { ensurePageReady } from '../../../utils/page-guard';
import type { DeviceEntity } from '../../../domain/entities/device.entity';

interface DeviceInfoRow {
  /** label 是行左侧展示名。 */
  label: string;
  /** value 是行右侧展示文本，空值显示 --。 */
  value: string;
}

interface DeviceInfoGroup {
  /** title 是分组标题。 */
  title: string;
  /** rows 是分组内的展示行。 */
  rows: DeviceInfoRow[];
}

const loading = ref(true);
const device = ref<DeviceEntity | null>(null);

/** DEVICE_TYPE_TEXT 是设备类型枚举的展示文案。 */
const DEVICE_TYPE_TEXT: Record<number, string> = {
  1: '直连设备',
  2: '网关',
  3: '子设备',
  4: '监控设备',
};

/** NET_TYPE_TEXT 是通讯方式枚举的展示文案。 */
const NET_TYPE_TEXT: Record<number, string> = {
  1: '其他',
  2: 'Wi-Fi',
  3: '蜂窝(2G/3G/4G)',
  4: '5G',
  5: '蓝牙',
  6: 'LoRaWAN',
  7: 'Wi-Fi+蓝牙',
  8: '有线网络',
  9: '蜂窝+蓝牙',
};

/** MOBILE_OPERATOR_TEXT 是移动运营商枚举的展示文案。 */
const MOBILE_OPERATOR_TEXT: Record<number, string> = {
  1: '无',
  2: '移动',
  3: '联通',
  4: '电信',
  5: '广电',
};

/** formatDateTime 将毫秒时间戳格式化为 YYYY-MM-DD HH:mm，空值返回 --。 */
function formatDateTime(ts?: number): string {
  if (!ts) return '--';
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** textOf 空值统一展示 --。 */
function textOf(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '--';
  return String(value);
}

/** enumText 枚举值映射文案，未命中时展示原始值。 */
function enumText(mapping: Record<number, string>, value?: number): string {
  if (!value) return '--';
  return mapping[value] || String(value);
}

/** groups 按四组组装设备信息展示行。 */
const groups = computed<DeviceInfoGroup[]>(() => {
  const d = device.value;
  if (!d) return [];
  const basic: DeviceInfoRow[] = [
    { label: '产品名称', value: textOf(d.productName) },
    { label: '设备类型', value: enumText(DEVICE_TYPE_TEXT, d.deviceType) },
    { label: '固件版本', value: textOf(d.version) },
    { label: '模组硬件型号', value: textOf(d.hardInfo) },
    { label: '模组软件版本', value: textOf(d.softInfo) },
    { label: 'IMEI', value: textOf(d.imei) },
    { label: 'MAC 地址', value: textOf(d.mac) },
    { label: 'SIM 卡号', value: textOf(d.iccid) },
    { label: '远程地址', value: textOf(d.remoteAddr) },
  ];
  if (d.desc) basic.push({ label: '设备描述', value: d.desc });
  const network: DeviceInfoRow[] = [
    { label: '通讯方式', value: enumText(NET_TYPE_TEXT, d.netType) },
    { label: '运营商', value: enumText(MOBILE_OPERATOR_TEXT, d.mobileOperator) },
    { label: '手机号', value: textOf(d.phone) },
    { label: '信号强度', value: textOf(d.rssi) },
    { label: '最后登录 IP', value: textOf(d.lastIp) },
    { label: '局域网 IP', value: textOf(d.lastLocalIp) },
  ];
  const timeline: DeviceInfoRow[] = [
    { label: '激活时间', value: formatDateTime(d.firstLogin) },
    { label: '首次绑定时间', value: formatDateTime(d.firstBind) },
    { label: '最后绑定时间', value: formatDateTime(d.lastBind) },
    { label: '最后上线时间', value: formatDateTime(d.lastLogin) },
    { label: '最后下线时间', value: formatDateTime(d.lastOffline) },
    { label: '到期时间', value: formatDateTime(d.expTime) },
    { label: '创建时间', value: formatDateTime(d.createdTime) },
  ];
  const tagRows: DeviceInfoRow[] = Object.entries(d.tags || {}).map(([key, value]) => ({
    label: key,
    value: textOf(value),
  }));
  const result: DeviceInfoGroup[] = [
    { title: '基本信息', rows: basic },
    { title: '连接与网络', rows: network },
    { title: '时间信息', rows: timeline },
  ];
  result.push(tagRows.length > 0
    ? { title: '标签', rows: tagRows }
    : { title: '标签', rows: [{ label: '标签', value: '无' }] });
  return result;
});

onLoad(async (options: Record<string, string | undefined> | undefined) => {
  const o = options || {};
  const ready = await ensurePageReady('/packageDevice/pages/device-info/index', o);
  if (!ready) {
    loading.value = false;
    return;
  }
  const pid = o.productID || '';
  const dn = o.deviceName || '';
  if (!pid || !dn) {
    loading.value = false;
    return;
  }
  try {
    device.value = await deviceService.getDetail(pid, dn);
  } catch (err) {
    uni.showToast({ title: (err as Error).message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--page-bg);
}

.di-page {
  flex: 1;
  overflow-y: hidden;
}

.di-group {
  margin: 24rpx 32rpx 0;
  background: var(--card-bg);
  border-radius: 24rpx;
  overflow: hidden;
}

.di-group-head {
  padding: 24rpx 32rpx 16rpx;
  border-bottom: 1rpx solid var(--border-color);
}

.di-group-head__title {
  font-size: 28rpx;
  color: var(--text-secondary);
  font-weight: 500;
}

.di-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid var(--divider);
}

.di-row:last-child {
  border-bottom: none;
}

.di-row__label {
  flex-shrink: 0;
  font-size: 30rpx;
  color: var(--text-primary);
}

.di-row__value {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: var(--text-secondary);
  text-align: right;
  // 长值(如 SIM 卡号、IP)允许换行展示，不截断。
  word-break: break-all;
}

</style>
