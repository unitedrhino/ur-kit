<!-- 设备分享接收页：先校验链接，登录后由接收者确认设备授权。 -->
<template>
  <app-navigation-bar title="接收设备分享" />
  <scroll-view class="accept-page" scroll-y>
    <view class="accept-card">
      <template v-if="loading || error">
        <text class="accept-title">{{ loading ? '正在检查分享链接…' : '无法打开分享' }}</text>
        <text v-if="error" class="accept-hint">{{ error }}</text>
      </template>
      <template v-else>
        <view class="invite-mark">✦</view>
        <text class="accept-title">{{ sharerName || '好友' }}给您分享了{{ deviceCount === 1 ? '一台' : `${deviceCount}台` }}设备</text>
        <text class="accept-hint">{{ showMiniButton ? '在微信小程序中打开并接收设备' : loggedIn ? '选择要接收的设备，确认后可在设备列表中查看' : '登录后即可接收并管理设备' }}</text>
        <view class="device-list">
          <view v-for="(item, index) in previewDevices" :key="index" class="accept-device" @tap="loggedIn && devices[index] && toggle(devices[index])">
            <view class="device-image">
              <image v-if="imageFor(item, index)" class="device-image__img" :src="imageFor(item, index)" mode="aspectFit" @error="imageFailed(index)" />
              <app-icon v-else name="tabler:devices" :size="32" color="var(--color-primary)" />
            </view>
            <view class="accept-device__info"><text class="device-name">{{ item.name }}</text><text v-if="item.productName" class="device-product">{{ item.productName }}</text></view>
            <view v-if="loggedIn && devices[index]" class="device-check" :class="{ 'device-check--selected': selected.has(keyOf(devices[index])) }">{{ selected.has(keyOf(devices[index])) ? '✓' : '' }}</view>
          </view>
        </view>
        <text v-if="loggedIn && shareDetail" class="permission-hint">{{ permissionSummary }} · {{ expirySummary }}</text>
        <view v-if="showMiniButton" class="accept-button" @tap="openMini">打开微信小程序</view>
        <text v-else-if="miniUnavailable" class="permission-hint">小程序入口暂不可用，可继续在浏览器接收设备</text>
        <view v-if="!loggedIn" :class="showMiniButton ? 'mini-button' : 'accept-button'" @tap="handleLogin">{{ showMiniButton ? '在浏览器中接收' : '登录后接收' }}</view>
        <view v-else-if="devices.length" :class="[showMiniButton ? 'mini-button' : 'accept-button', { 'accept-button--disabled': submitting || !selected.size }]" @tap="handleAccept">{{ submitting ? '接收中…' : '确认接收' }}</view>
        <text v-else class="accept-hint">没有可接收的设备</text>
      </template>
    </view>
  </scroll-view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import AppIcon from '../../../components/app-icon/app-icon.vue';
import { authProvider } from '../../../providers/auth.provider';
import { tenantProvider } from '../../../providers/tenant.provider';
import { projectProvider } from '../../../providers/project.provider';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { ensurePageReady } from '../../../utils/page-guard';
import { request } from '../../../utils/request';
import { defaultDeviceImage } from '../../../utils/device-image';
import { acceptDeviceShareLink, getDeviceShareLink, type ShareLinkDevice, type ShareLinkDetail } from '../../../services/device-share-link.service';
/** token 仅用于本次接收，不写入日志。 */
const token = ref('');
/** miniUrl 仅允许微信官方 URL Link，避免跳转到外部不可信地址。 */
const miniUrl = ref(''); const showMiniButton = ref(false); const miniUnavailable = ref(false);
/** 提示客户端切换到目标组织；实际授权归属始终由服务端确认。 */
const shareTenant = ref('');
const loading = ref(true); const error = ref(''); const loggedIn = ref(false); const submitting = ref(false);
/** waitingForProject 表示小程序已暂停接收，等待用户创建负责人项目后恢复。 */
const waitingForProject = ref(false);
let resumeInFlight = false;
const PENDING_ACCEPT_KEY = 'pending_device_share_accept';
const PENDING_ACCEPT_TTL = 10 * 60 * 1000;
/** shareDetail 用于在接收前展示服务端返回的授权范围和截止时间。 */
const shareDetail = ref<ShareLinkDetail | null>(null);
/** permissionSummary 只描述可确定的权限，避免把部分授权误称为全部权限。 */
const permissionSummary = computed(() => shareDetail.value?.authType === 1 ? '全部权限' : '部分权限');
/** expirySummary 将毫秒截止时间转换为本地时间。 */
const expirySummary = computed(() => shareDetail.value?.expTime ? `授权截止 ${new Date(shareDetail.value.expTime).toLocaleString()}` : '授权长期有效');
/** 分享预览只显示服务端从有效令牌读取的资料。 */
interface SharePreview { name: string; productName?: string; productImg?: string }
const sharerName = ref(''); const deviceCount = ref(0); const previewDevices = ref<SharePreview[]>([]);
const failedImages = ref<Record<number, number>>({});
/** 产品图加载失败后依次尝试已有的设备默认图和占位图标。 */
function imageFor(item: SharePreview, index: number) {
  const failed = failedImages.value[index] || 0;
  const isGateway = /网关|gateway/i.test(`${item.productName || ''} ${item.name}`);
  const fallback = defaultDeviceImage(isGateway ? 2 : 0, item.productName || '', item.name);
  return failed === 0 && item.productImg ? item.productImg : failed < 2 ? fallback : '';
}
function imageFailed(index: number) { failedImages.value = { ...failedImages.value, [index]: (failedImages.value[index] || 0) + 1 }; }
const devices = ref<ShareLinkDevice[]>([]); const selected = ref(new Set<string>());
/** keyOf 对设备身份编码，避免不同产品的设备名冲突。 */
function keyOf(device: ShareLinkDevice) { return JSON.stringify([device.productID, device.deviceName]); }
/** toggle 在界面上修改接收者选择，不提前写入授权。 */
function toggle(device: ShareLinkDevice) { const next = new Set(selected.value); const key = keyOf(device); next.has(key) ? next.delete(key) : next.add(key); selected.value = next; }

/** savePendingAccept 保存短时接收草稿，避免创建项目返回时丢失分享凭证和选择。 */
function savePendingAccept() {
  try {
    uni.setStorageSync(PENDING_ACCEPT_KEY, JSON.stringify({
      token: token.value,
      shareTenant: shareTenant.value,
      selected: Array.from(selected.value),
      createdAt: Date.now(),
    }));
  } catch { /* 本地存储不可用时仍可依赖页面栈恢复。 */ }
}

/** readPendingAccept 只恢复未超过分享有效期的本地接收草稿。 */
function readPendingAccept(): { token: string; shareTenant: string; selected: string[] } | null {
  try {
    const raw = uni.getStorageSync(PENDING_ACCEPT_KEY);
    if (!raw) return null;
    const value = JSON.parse(String(raw)) as { token?: string; shareTenant?: string; selected?: string[]; createdAt?: number };
    if (!value.token || !value.createdAt || Date.now() - value.createdAt > PENDING_ACCEPT_TTL) {
      uni.removeStorageSync(PENDING_ACCEPT_KEY);
      return null;
    }
    return { token: value.token, shareTenant: value.shareTenant || '', selected: Array.isArray(value.selected) ? value.selected : [] };
  } catch {
    return null;
  }
}

/** clearPendingAccept 在完成、取消或过期后清理接收草稿。 */
function clearPendingAccept() {
  try { uni.removeStorageSync(PENDING_ACCEPT_KEY); } catch { /* ignore */ }
}
/** 微信浏览器由用户点击官方链接唤起小程序；不可用时仍保留 H5 接收。 */
function openMini() {
  // #ifdef H5
  if (/^https:\/\/wxaurl\.cn\/[a-zA-Z0-9_-]+$/.test(miniUrl.value)) window.location.assign(miniUrl.value);
  // #endif
}
/** load 校验令牌；仅已登录用户读取设备明细。 */
async function load() {
  if (!token.value) { error.value = '分享链接不完整'; loading.value = false; return; }
  try {
    const check = await request<{valid: boolean; sharerName?: string; deviceCount?: number; previewDevices?: SharePreview[]}>({ url: '/api/v1/things/user/device/share/token/check', omitProjectContext: true, data: {shareToken: token.value} });
    if (!check.valid) throw new Error('分享链接已失效或过期');
    sharerName.value = check.sharerName || ''; deviceCount.value = check.deviceCount || 0; previewDevices.value = check.previewDevices || [];
    if (!authProvider.isLoggedIn() && authProvider.getState().loggedIn) await authProvider.restoreSession();
    loggedIn.value = authProvider.isLoggedIn();
    if (loggedIn.value) { shareDetail.value = await getDeviceShareLink(token.value); devices.value = shareDetail.value.devices; if (!previewDevices.value.length) previewDevices.value = devices.value.map(item => ({ name: item.deviceAlias || item.deviceName, productName: item.productName, productImg: item.productImg })); deviceCount.value = devices.value.length; selected.value = new Set(devices.value.map(keyOf)); }
  } catch (e) { error.value = (e as Error).message || '无法读取分享链接'; }
  finally { loading.value = false; }
}
/** 进入登录并保留当前链接，登录后返回此页。 */
async function handleLogin() { await ensurePageReady('/packageDevice/pages/share-accept/index', {shareToken: token.value, shareTenant: shareTenant.value}); }

/** switchToShareTenant 在检查负责人项目和接受授权前统一切换到分享所属组织。 */
async function switchToShareTenant() {
  await tenantProvider.loadTenants();
  if (shareTenant.value && tenantProvider.getState().current?.code !== shareTenant.value && !tenantProvider.switchTenant(shareTenant.value)) {
    throw new Error('分享所属组织不可用');
  }
}

/** finishAccept 调用原有接受接口，成功后切换到负责人项目并刷新设备列表。 */
async function finishAccept() {
  const accepted = devices.value.filter(item => selected.value.has(keyOf(item)));
  await acceptDeviceShareLink(token.value, accepted);
  clearPendingAccept();
  await tenantProvider.loadTenants();
  if (shareTenant.value) tenantProvider.switchTenant(shareTenant.value);
  // #ifdef MP-WEIXIN
  await projectProvider.loadFirst();
  const ownerProjects = await projectProvider.getOwnedProjects(String(authProvider.getState().user?.userID || ''));
  const currentProjectID = currentFamilyProvider.getState().projectID;
  const target = ownerProjects.find(item => item.projectID === currentProjectID) || ownerProjects[0];
  if (target) currentFamilyProvider.switchFamily(target.projectID, target.projectName);
  // #endif
  uni.showToast({title:'接收成功', icon:'success'});
  uni.switchTab({url:'/pages/device/index'});
}

/** promptCreateOwnerProject 在没有负责人项目时暂停接收并引导创建项目。 */
async function promptCreateOwnerProject(): Promise<boolean> {
  savePendingAccept();
  waitingForProject.value = true;
  const result = await uni.showModal({
    title: '需要创建项目',
    content: '你还没有自己负责的项目，请先创建一个项目，再接收共享设备。',
    confirmText: '去创建',
    cancelText: '暂不接收',
  });
  if (!result.confirm) {
    waitingForProject.value = false;
    clearPendingAccept();
    return false;
  }
  const user = authProvider.getState().user;
  const suggestedName = (user?.nickName || user?.userName || '我的设备').trim() || '我的设备';
  uni.navigateTo({ url: `/packageUser/pages/family-edit/index?source=share-accept&suggestedName=${encodeURIComponent(suggestedName)}` });
  return false;
}

/** acceptInMiniProgram 仅在微信小程序中执行负责人项目前置检查。 */
async function acceptInMiniProgram(): Promise<boolean> {
  // #ifdef MP-WEIXIN
  await switchToShareTenant();
  const ownerProjects = await projectProvider.getOwnedProjects(String(authProvider.getState().user?.userID || ''));
  if (!ownerProjects.length) return promptCreateOwnerProject();
  const currentProjectID = currentFamilyProvider.getState().projectID;
  const target = ownerProjects.find(item => item.projectID === currentProjectID) || ownerProjects[0];
  currentFamilyProvider.switchFamily(target.projectID, target.projectName);
  return true;
  // #endif
  return true;
}

/** resumeAfterProject 在创建页返回后重新检查负责人项目并继续接受。 */
async function resumeAfterProject() {
  if (resumeInFlight || !waitingForProject.value) return;
  resumeInFlight = true;
  waitingForProject.value = false;
  const pending = readPendingAccept();
  try {
    if (!pending || pending.token !== token.value) return;
    const ownerProjects = await projectProvider.getOwnedProjects(String(authProvider.getState().user?.userID || ''));
    if (!ownerProjects.length) {
      clearPendingAccept();
      return;
    }
    if (pending.selected.length) selected.value = new Set(pending.selected);
    submitting.value = true;
    await finishAccept();
  } catch (e) {
    uni.showToast({ title: (e as Error).message || '接收失败', icon: 'none' });
  } finally {
    submitting.value = false;
    resumeInFlight = false;
  }
}

/** 接受选择的设备；小程序先确保存在负责人项目，H5 保持原有直接接受行为。 */
async function handleAccept() {
  if (submitting.value || !selected.value.size) return;
  submitting.value = true;
  try {
    // #ifdef MP-WEIXIN
    if (!(await acceptInMiniProgram())) return;
    // #endif
    await finishAccept();
  } catch(e) {
    uni.showToast({title:(e as Error).message || '接收失败', icon:'none'});
  } finally {
    if (!waitingForProject.value) submitting.value = false;
  }
}
onLoad((query?: Record<string, unknown>) => { const pending = readPendingAccept(); token.value = String(query?.shareToken || pending?.token || '').trim(); shareTenant.value = String(query?.shareTenant || pending?.shareTenant || '').trim(); miniUrl.value = String(query?.miniUrl || '').trim();
  // #ifdef H5
  const isWechat = /MicroMessenger/i.test(navigator.userAgent);
  const miniUntil = Number(query?.miniUntil || 0);
  showMiniButton.value = isWechat && /^https:\/\/wxaurl\.cn\/[a-zA-Z0-9_-]+$/.test(miniUrl.value) && (!miniUntil || miniUntil > Date.now());
  miniUnavailable.value = isWechat && String(query?.fromMini || '') === '1' && !showMiniButton.value;
  // #endif
  void load(); });

onShow(() => { void resumeAfterProject(); });
</script>
<style lang="scss" scoped>
.accept-page { flex: 1; min-height: 0; }
.accept-card { margin: 24px 16px; padding: 30px 22px 24px; border-radius: var(--radius-lg); background: var(--card-bg); text-align: center; }
.invite-mark { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; margin: 0 auto 18px; border-radius: 16px; color: var(--color-primary); background: var(--color-primary-light); font-size: 25px; }
.accept-title { display: block; font-size: var(--font-section); font-weight: 600; color: var(--text-primary); line-height: 1.5; }
.accept-hint { display: block; margin-top: 8px; font-size: var(--font-caption); color: var(--text-secondary); line-height: 1.5; }
.device-list { margin-top: 24px; }
.accept-device { display: flex; align-items: center; gap: 14px; padding: 14px; margin-top: 10px; border-radius: 18px; background: var(--surface-muted); color: var(--text-primary); text-align: left; }
.device-image { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 72px; height: 72px; border-radius: 14px; background: var(--card-bg); }
.device-image__img { width: 64px; height: 64px; }
.accept-device__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.device-name { font-size: var(--font-label); font-weight: 600; word-break: break-all; }
.device-product { margin-top: 5px; font-size: var(--font-caption); color: var(--text-secondary); }
.device-check { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid var(--border-color); border-radius: 50%; flex-shrink: 0; }
.device-check--selected { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.permission-hint { display: block; margin-top: 16px; font-size: var(--font-caption); color: var(--text-secondary); line-height: 1.5; }
.accept-button { margin-top: 24px; padding: 14px; text-align: center; border-radius: var(--radius-full); color: var(--color-on-primary); background: var(--color-primary); font-weight: 600; }
.accept-button--disabled { opacity: .45; }
.mini-button { margin-top: 16px; padding: 8px; color: var(--color-primary); font-size: var(--font-body); }
</style>
