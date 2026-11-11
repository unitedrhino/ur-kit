<!-- 全局设备分享管理：查看发出的分享、撤销授权及打开收到的共享设备。 -->
<template>
  <app-navigation-bar title="设备分享" />
  <view class="share-manage__tabs">
    <view :class="['share-manage__tab', { 'share-manage__tab--active': state.mode === 'sent' }]" @tap="switchMode('sent')"><text>我分享的</text></view>
    <view :class="['share-manage__tab', { 'share-manage__tab--active': state.mode === 'received' }]" @tap="switchMode('received')"><text>收到的分享</text></view>
  </view>
  <scroll-view class="share-manage" scroll-y @scrolltolower="loadMore">
    <text class="share-manage__scope">当前企业下所有{{ state.mode === 'sent' ? '发出的设备分享' : '收到的共享设备' }}</text>
    <loading v-if="state.pageState.loading && !hasItems" text="加载中..." />
    <empty-state v-else-if="state.error" :text="state.error" buttonText="重试" @action="reload" />
    <template v-else-if="state.mode === 'sent'">
      <view v-for="item in state.sent" :key="item.id" class="share-manage__record">
        <view class="share-manage__title" @tap="manageDevice(item.device)"><text>{{ item.device.deviceAlias || item.device.deviceName }}</text><text>›</text></view>
        <text class="share-manage__meta">分享给：{{ item.user?.nickName || item.sharedUserAccount || item.sharedUserID }}</text>
        <text class="share-manage__meta">{{ item.authType === 1 ? '全部权限' : '部分权限' }} · {{ expiryLabel(item.expTime) }}</text>
        <view class="share-manage__actions">
          <view @tap="manageDevice(item.device)"><text>管理此设备分享</text></view>
          <view @tap="remove(item.id)"><text>取消分享</text></view>
        </view>
      </view>
      <empty-state v-if="!hasItems && !state.pageState.loading" text="还没有分享设备" />
    </template>
    <template v-else>
      <view class="mobile-card-grid"><view v-for="item in state.received" :key="JSON.stringify([item.productID, item.deviceName])" class="mobile-card-cell"><device-card
        :deviceName="item.deviceName" :deviceAlias="item.deviceAlias" :productID="item.productID"
        :productName="item.productName" :deviceType="item.deviceType" :deviceImg="item.deviceImg" :productImg="item.productImg" :status="item.status" :isShared="true" @select="openDevice" /></view></view>
      <empty-state v-if="!hasItems && !state.pageState.loading" text="还没有收到设备分享" />
    </template>
    <view v-if="hasItems && state.pageState.hasMore" class="share-manage__more" @tap="loadMore"><text>{{ state.pageState.loading ? '加载中...' : '加载更多' }}</text></view>
    <safe-area />
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import DeviceCard from '../../../components/device-card/device-card.vue';
import Loading from '../../../components/loading/loading.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { deviceShareManageProvider as provider, type ShareManageMode } from '../../../providers/device-share-manage.provider';
import { deviceListProvider } from '../../../providers/device-list.provider';
import { ensurePageReady } from '../../../utils/page-guard';

/** state 是全局分享列表的只读视图。 */
const state = ref(provider.getState());
/** hasItems 决定加载与空状态展示。 */
const hasItems = computed(() => state.value.mode === 'sent' ? state.value.sent.length > 0 : state.value.received.length > 0);
/** removing 阻止重复撤销。 */
const removing = ref(false);
/** unsubscribe 在页面销毁时移除状态监听。 */
const unsubscribe = provider.subscribe((next) => { state.value = next; });
onShow(async () => { if (await ensurePageReady('/packageDevice/pages/share-manage/index')) await provider.loadFirst(); });
onUnmounted(() => { unsubscribe(); provider.reset(); });
/** switchMode 切换发出与接收列表。 */
async function switchMode(mode: ShareManageMode): Promise<void> { if (state.value.mode !== mode) await provider.loadFirst(mode); }
/** reload 重试当前列表。 */
async function reload(): Promise<void> { await provider.loadFirst(); }
/** loadMore 读取当前方向的下一页。 */
async function loadMore(): Promise<void> { await provider.loadMore(); }
/** manageDevice 打开单设备分享管理，不更改项目成员身份。 */
function manageDevice(device: { productID: string; deviceName: string }): void {
  uni.navigateTo({ url: `/packageDevice/pages/share/index?productID=${encodeURIComponent(device.productID)}&deviceName=${encodeURIComponent(device.deviceName)}` });
}
/** openDevice 打开收到的设备，由后端执行具体设备授权校验。 */
function openDevice(device: { productID: string; deviceName: string }): void {
  uni.navigateTo({ url: `/packageDevice/pages/detail/index?productID=${encodeURIComponent(device.productID)}&deviceName=${encodeURIComponent(device.deviceName)}` });
}
/** expiryLabel 解释毫秒有效期及永久授权。 */
function expiryLabel(value: string): string {
  const millis = Number(value);
  if (!millis) return '长期有效';
  return millis <= Date.now() ? '已过期' : `${new Date(millis).toLocaleDateString()} 到期`;
}
/** remove 确认后撤销，并等待相关列表更新再反馈成功。 */
async function remove(id: string): Promise<void> {
  if (removing.value) return;
  const result = await uni.showModal({ title: '取消分享', content: '取消后对方将失去该设备的分享权限，确定继续吗？' });
  if (!result.confirm) return;
  removing.value = true;
  try {
    await provider.remove(id);
    await deviceListProvider.loadFirst();
    uni.showToast({ title: '已取消分享', icon: 'success' });
  } catch (error) { uni.showToast({ title: (error as Error).message || '取消失败', icon: 'none' }); }
  finally { removing.value = false; }
}
</script>

<style scoped lang="scss">
.share-manage__tabs { display: flex; background: var(--card-bg); margin: 16px; padding: 5px; border-radius: var(--radius-full); }
.share-manage__tab { flex: 1; text-align: center; padding: 14px 8px; color: var(--text-secondary); border-radius: var(--radius-full); }
.share-manage__tab--active { color: var(--color-on-primary); background: var(--navigation-active); }
.share-manage { height: calc(100vh - 150px); box-sizing: border-box; padding: 0 16px 24px; background: transparent; }
.share-manage__scope { display: block; font-size: var(--font-caption); color: var(--text-secondary); margin-bottom: 16px; }
.share-manage__record { border-radius: var(--radius-lg); background: var(--card-bg); padding: 16px; margin-bottom: 12px; }
.share-manage__title { display: flex; justify-content: space-between; gap: 12px; color: var(--text-primary); font-weight: 500; word-break: break-all; }
.share-manage__meta { display: block; color: var(--text-secondary); font-size: var(--font-caption); margin-top: 10px; }
.share-manage__actions { display: flex; justify-content: space-between; color: var(--color-primary); font-size: var(--font-caption); margin-top: 18px; }
.share-manage__more { padding: 16px; text-align: center; color: var(--color-primary); }
</style>
