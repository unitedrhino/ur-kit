<!-- 设备分享：按选择的方式展示账号或链接授权配置，并管理已分享用户。 -->
<template>
  <app-navigation-bar title="设备分享" />
  <scroll-view class="share-page" scroll-y type="list" @scrolltolower="handleScrollToLower">
    <view class="share-content">
    <view class="share-info">
      <view class="share-info__icon"><app-icon name="tabler:devices" :size="22" /></view>
      <view class="share-info__content"><text class="share-info__label">分享设备</text><text class="share-info__value">{{ deviceName }}</text></view>
    </view>
    <view class="share-tabs" role="tablist" aria-label="分享方式">
      <view :class="['share-tab', { 'share-tab--active': shareMode === 'account' }]" role="tab" :aria-selected="shareMode === 'account'" @tap="shareMode = 'account'">
        <view class="share-tab__icon"><app-icon name="tabler:user" :size="19" /></view><view class="share-tab__content"><text class="share-tab__name">账号分享</text><text class="share-tab__desc">指定用户</text></view>
      </view>
      <view :class="['share-tab', { 'share-tab--active': shareMode === 'link' }]" role="tab" :aria-selected="shareMode === 'link'" @tap="shareMode = 'link'">
        <view class="share-tab__icon"><app-icon name="tabler:share" :size="19" /></view><view class="share-tab__content"><text class="share-tab__name">扫码分享</text><text class="share-tab__desc">面对面扫码</text></view>
      </view>
    </view>
    <view v-if="shareMode === 'account'" class="share-card">
      <text class="share-card__title">分享给指定账号</text>
      <text class="share-card__desc">搜索对方账号，设置权限后即可分享设备</text>
      <view class="share-search"><input v-model="account" class="share-search__input" placeholder="手机号或账号" confirm-type="search" @confirm="handleSearchUser" /><view class="share-search__button" @tap="handleSearchUser"><text>搜索</text></view></view>
      <loading v-if="searchingUser" text="搜索中..." />
      <view v-if="searchedUser" class="share-user"><view class="share-user__avatar"><text>{{ searchedUser.nickName?.[0] || '?' }}</text></view><view class="share-user__info"><text class="share-user__name">{{ searchedUser.nickName || searchedUser.userName }}</text><text class="share-user__account">{{ searchedUser.account || searchedUser.userName }}</text></view></view>
      <share-link-options-component v-if="searchedUser" v-model="accountOptions" />
      <view v-if="searchedUser" class="share-btn" :class="{ 'share-btn--disabled': submitting }" @tap="handleCreateShare"><text class="share-btn__text">{{ submitting ? '提交中...' : '确认分享' }}</text></view>
    </view>
    <view v-else-if="productID && deviceName" class="share-card">
      <text class="share-card__title">生成分享二维码</text>
      <text class="share-card__desc">对方在小程序内扫码，确认后即可接收设备</text>
      <share-link-options-component v-model="linkOptions" />
      <view class="share-btn" @tap="qrVisible = true"><text class="share-btn__text">生成分享二维码</text></view>
      <text class="share-card__footnote">请仅分享给信任的人</text>
    </view>
    <view class="share-list-title"><text>已分享用户</text><text>{{ list.length }}人</text></view>
    <loading v-if="loading && list.length === 0" text="加载中..." />
    <view v-else-if="list.length > 0"><view v-for="item in list" :key="item.id" class="share-item"><view class="share-user__avatar"><text>{{ item.user?.nickName?.[0] || '?' }}</text></view><view class="share-user__info"><text class="share-user__name">{{ item.user?.nickName || item.sharedUserAccount || item.sharedUserID }}</text><text class="share-user__account">{{ item.user?.account || item.sharedUserAccount }}</text><text class="share-item__permission">{{ item.authType === 1 ? '全部权限' : '部分权限' }}</text></view><view class="share-item__remove" @tap="handleRemove(item.id)"><text>撤销</text></view></view></view>
    <empty-state v-else text="暂无分享用户" />
    <view v-if="loading && list.length > 0" class="share-loading-more"><loading text="加载更多..." /></view>
    </view>
  </scroll-view>
<share-qr v-if="qrVisible" :productID="productID" :deviceName="deviceName" :options="linkOptions" @close="qrVisible = false" />
</template>

<script setup lang="ts">
import ShareQr from '../../components/share-qr/share-qr.vue';
import { ref } from 'vue';
import { resolveShareOptions, type ShareLinkOptions } from '../../../services/device-share-link.service';
import ShareLinkOptionsComponent from '../../components/share-link-options/share-link-options.vue';
import { onLoad, onHide, onUnload } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ensurePageReady } from '../../../utils/page-guard';
import { deviceShareProvider, type DeviceShareState } from '../../../providers/device-share.provider';
import type { DeviceShareEntity } from '../../../domain/entities/device-share.entity';

const productID = ref(''); const deviceName = ref(''); const list = ref<DeviceShareEntity[]>([]); const loading = ref(true); const hasMore = ref(true); const account = ref(''); const searchedUser = ref<DeviceShareState['searchedUser']>(null); const searchingUser = ref(false); const submitting = ref(false); let unsubscribe: (() => void) | null = null;
/** shareMode 控制当前显示的分享方式，切换时保留各自表单草稿。 */
const shareMode = ref<'account' | 'link'>('account');
/** 二维码弹窗存在期间维护短时凭证。 */
const qrVisible = ref(false);
// 离开页面时关闭弹窗，已生成的二维码按原有效期继续生效。
onHide(() => { qrVisible.value = false; });
/** 链接授权默认全部权限，截止日期未设置表示长期授权。 */
const linkOptions = ref<ShareLinkOptions>({authType:1, groups:['baseControl'], expDate:'', expTime:'23:59'});
/** 账号分享与链接分别保留独立授权配置。 */
const accountOptions = ref<ShareLinkOptions>({authType:1, groups:['baseControl'], expDate:'', expTime:'23:59'});
// 页面加载时绑定当前设备上下文，并订阅分享列表状态。
onLoad(async (query?: Record<string, unknown>) => { const params = (query || {}) as Record<string, string>; const ready = await ensurePageReady('/packageDevice/pages/share/index', params); if (!ready) return; productID.value = params.productID || ''; deviceName.value = params.deviceName || ''; deviceShareProvider.setDevice(productID.value, deviceName.value); unsubscribe = deviceShareProvider.subscribe((state: DeviceShareState) => { list.value = state.list; loading.value = state.pageState.loading; hasMore.value = state.pageState.hasMore; searchedUser.value = state.searchedUser; searchingUser.value = state.searchingUser; }); await deviceShareProvider.loadFirst(); });
onUnload(() => { unsubscribe?.(); unsubscribe = null; });
// 搜索分享对象并把结果展示在当前表单中。
async function handleSearchUser() { if (!account.value.trim()) { uni.showToast({ title: '请输入手机号或账号', icon: 'none' }); return; } const user = await deviceShareProvider.searchUser(account.value); if (!user) uni.showToast({ title: '未找到可分享用户', icon: 'none' }); }
// 创建前校验并展开权限，提交成功后刷新列表。
async function handleCreateShare() {
  if (!searchedUser.value) { uni.showToast({ title: '请先搜索分享对象', icon: 'none' }); return; }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const options = await resolveShareOptions({ productID: productID.value, deviceName: deviceName.value }, accountOptions.value);
    await deviceShareProvider.create({ sharedUserID: searchedUser.value.userID, authType: accountOptions.value.authType, schemaPerm: options.schemaPerm, accessPerm: options.accessPerm, expTime: options.expTime ? String(options.expTime) : undefined });
    account.value = ''; searchedUser.value = null;
    accountOptions.value = {authType:1, groups:['baseControl'], expDate:'', expTime:'23:59'};
    uni.showToast({ title: '分享成功', icon: 'success' });
  } catch (error) { uni.showToast({ title: (error as Error).message || '分享失败', icon: 'none' }); }
  finally { submitting.value = false; }
}
// 撤销单条分享并回刷列表。
async function handleRemove(id: string) { const result = await uni.showModal({ title: '取消分享', content: '取消后该用户将立即失去设备访问权限，确定继续吗？' }); if (!result.confirm) return; try { await deviceShareProvider.remove(id); uni.showToast({ title: '已取消分享', icon: 'success' }); } catch (error) { uni.showToast({ title: (error as Error).message || '取消失败', icon: 'none' }); } }
// 滚动到底部时加载下一页分享记录。
function handleScrollToLower() { if (hasMore.value) deviceShareProvider.loadMore(); }
</script>

<style lang="scss" scoped>
.share-page { flex: 1; min-height: 0; background: transparent; }.share-content { max-width: 600px; margin: 0 auto; padding-bottom: 20px; }.share-info, .share-card, .share-item { margin: 12px 16px; padding: 16px; background: var(--card-bg); border-radius: var(--radius-lg); }.share-info { display: flex; align-items: center; gap: 12px; }.share-info__icon { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 14px; color: var(--color-primary); background: var(--color-primary-light); font-size: var(--font-label); font-weight: 600; }.share-info__content { min-width: 0; flex: 1; }.share-info__label { display: block; margin-bottom: 4px; font-size: var(--font-caption); color: var(--text-secondary); }.share-info__value { display: block; overflow-wrap: anywhere; font-size: var(--font-body); color: var(--text-primary); font-weight: 500; }.share-card__title, .share-list-title { font-size: var(--font-body); font-weight: 600; color: var(--text-primary); }.share-tabs { display: flex; gap: 10px; margin: 12px 16px 0; }.share-tab { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid transparent; border-radius: var(--radius-lg); background: var(--card-bg); color: var(--text-secondary); box-sizing: border-box; }.share-tab--active { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); }.share-tab__icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--page-bg); color: var(--text-secondary); }.share-tab--active .share-tab__icon { color: var(--color-primary); background: var(--card-bg); }.share-tab__content { display: flex; flex-direction: column; min-width: 0; gap: 3px; }.share-tab__name { font-size: var(--font-body); font-weight: 600; }.share-tab__desc { font-size: var(--font-caption); color: var(--text-secondary); }
.share-card__desc, .share-card__footnote { display: block; margin-top: 8px; color: var(--text-secondary); font-size: var(--font-caption); line-height: 1.5; }.share-card__footnote { text-align: center; }.share-search { display: flex; gap: 8px; margin-top: 12px; }.share-search__input { flex: 1; padding: 10px 12px; background: var(--page-bg); border-radius: 8px; font-size: var(--font-body); }.share-search__button, .share-btn { display: flex; align-items: center; justify-content: center; color: var(--color-on-primary); background: var(--color-primary); border-radius: 8px; }.share-search__button { padding: 0 14px; }.share-btn { margin-top: 12px; padding: 10px; }.share-btn--disabled { opacity: .5; }.share-btn__text { font-size: var(--font-body); }.share-user, .share-item { display: flex; align-items: center; gap: 10px; }.share-user { margin-top: 12px; padding: 10px; background: var(--page-bg); border-radius: 8px; }.share-user__avatar { width: 38px; height: 38px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-on-primary); background: var(--color-primary); }.share-user__info { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }.share-user__name { font-size: var(--font-body); color: var(--text-primary); }.share-user__account, .share-item__permission { font-size: var(--font-caption); color: var(--text-secondary); }.share-auth { display: flex; gap: 16px; margin-top: 12px; font-size: var(--font-caption); color: var(--text-secondary); }.share-expiry { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color); font-size: var(--font-caption); color: var(--text-secondary); }.share-list-title { display: flex; justify-content: space-between; margin: 18px 16px 8px; }.share-item { margin-top: 8px; padding: 12px; }.share-item__remove { padding: 5px 9px; color: var(--color-danger); font-size: var(--font-caption); }.share-loading-more { display: flex; justify-content: center; padding: 10px; }

.share-search__input { width: 0; min-width: 0; min-height: 24px; border-radius: var(--radius-sm); }
.share-search__button { min-height: 44px; border-radius: var(--radius-sm); flex-shrink: 0; }
.share-btn { min-height: 44px; box-sizing: border-box; border-radius: var(--radius-full); }
.share-user__account { overflow-wrap: anywhere; }
.share-link-hint { display: block; margin-top: 8px; color: var(--text-secondary); font-size: var(--font-caption); line-height: 1.5; }
</style>
