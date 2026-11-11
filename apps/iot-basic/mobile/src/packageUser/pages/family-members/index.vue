<!-- 家庭成员页：负责人管理成员，直接成员仅查看并退出。 -->
<template>
  <app-navigation-bar :title="`${projectName} - 家庭成员`" />
  <scroll-view class="member-page" scroll-y type="list" @scrolltolower="handleScrollToLower">
    <view v-if="canManage" class="member-card">
      <text class="member-title">添加项目成员</text>
      <!-- #ifdef MP-WEIXIN -->
      <view class="member-tabs"><view :class="`member-tab ${activeTab === 'account' ? 'member-tab--active' : ''}`" @tap="activeTab = 'account'">账号添加</view><view :class="`member-tab ${activeTab === 'scan' ? 'member-tab--active' : ''}`" @tap="activeTab = 'scan'">扫码添加</view></view>
      <!-- #endif -->
      <view v-if="activeTab === 'account'">
        <view class="member-search"><input v-model="account" @input="familyMemberProvider.clearSearch()" class="member-search__input" placeholder="手机号或账号" confirm-type="search" @confirm="handleSearchUser" /><view class="member-search__button" @tap="handleSearchUser"><text>搜索</text></view></view>
        <loading v-if="searchingUser" text="搜索中..." />
        <view v-if="searchedUser" class="member-result"><view class="member-avatar"><text>{{ searchedUser.nickName?.[0] || '?' }}</text></view><view class="member-info"><text class="member-name">{{ searchedUser.nickName || searchedUser.userName }}</text><text class="member-account">{{ searchedUser.phone || searchedUser.userName }}</text></view></view>
        <radio-group v-if="searchedUser" class="member-auth" @change="handleAuthTypeChange"><label><radio value="1" />管理</label><label><radio value="2" :checked="authType === 2" />读写</label><label><radio value="3" :checked="authType === 3" />只读</label></radio-group>
        <input v-if="searchedUser" v-model="memberRemark" class="member-remark" placeholder="成员称呼（可选）" />
        <view v-if="searchedUser" class="member-button" @tap="handleAddMember"><text>{{ submitting ? '提交中...' : '添加成员' }}</text></view>
      </view>
      <!-- #ifdef MP-WEIXIN -->
      <view v-else class="scan-invite-panel"><text class="scan-invite-title">项目二维码</text><text class="scan-invite-desc">{{ isOwner ? '选择管理、读写或只读权限，成员扫码后加入本项目。' : '你可以扫描其他项目负责人发来的邀请二维码。' }}</text><view v-if="isOwner" class="member-button" @tap="showInviteQr = true"><text>生成项目邀请二维码</text></view><view class="scan-join-button" @tap="handleScanProjectInvite"><text>扫一扫加入其他项目</text></view></view>
      <!-- #endif -->
    </view>
    <!-- #ifdef MP-WEIXIN -->
    <view v-else class="member-card scan-invite-panel"><text class="member-title">扫码加入其他项目</text><text class="scan-invite-desc">你可以扫描项目负责人生成的邀请二维码。</text><view class="member-button" @tap="handleScanProjectInvite"><text>打开扫码</text></view></view>
    <!-- #endif -->
    <view class="member-list-title"><text>成员列表</text><text>{{ list.length }}人</text></view>
    <loading v-if="loading && list.length === 0" text="加载中..." />
    <view v-else-if="list.length > 0"><view v-for="item in list" :key="item.targetID" class="member-card member-item"><view class="member-avatar"><text>{{ item.user?.nickName?.[0] || '?' }}</text></view><view class="member-info"><text class="member-name">{{ item.memberRemark || item.user?.nickName || item.user?.userName }}</text><text class="member-account">{{ item.user?.phone || item.user?.userName }}</text><text class="member-role">{{ item.authType === 1 ? '管理员' : item.authType === 2 ? '读写成员' : '只读成员' }}</text></view><view v-if="canManage && item.targetID !== ownerUserID" class="member-actions"><text @tap="handleEditRemark(item)">称呼</text><text class="member-actions__danger" @tap="handleRemove(item)">移除</text></view></view></view>
    <empty-state v-else-if="!error" text="暂无家庭成员" />
    <view v-if="error" class="member-card"><text>{{error}}</text><text @tap="handleRetry"> 点击重试</text></view>
    <view v-if="canLeave" class="member-card"><view class="member-button" @tap="handleLeave"><text>{{leaving ? '退出中...' : '退出共享家庭'}}</text></view></view>
    <view v-if="loading && list.length > 0" class="member-loading-more"><loading text="加载更多..." /></view>
  </scroll-view>
  <project-invite-qr v-if="showInviteQr" :project-i-d="projectID" :project-name="projectName" @close="showInviteQr = false" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import EmptyState from '../../../components/empty-state/empty-state.vue';
import Loading from '../../../components/loading/loading.vue';
import { ensurePageReady } from '../../../utils/page-guard';
import { familyMemberProvider, type FamilyMemberState } from '../../../providers/family-member.provider';
import { authProvider } from '../../../providers/auth.provider';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { projectProvider } from '../../../providers/project.provider';
import type { FamilyMemberEntity } from '../../../domain/entities/family-member.entity';
import ProjectInviteQr from '../../components/project-invite-qr/project-invite-qr.vue';
import { ensureScanCameraReady } from '../../../services/scan-permission.service';
import { parseProjectInviteQr } from '../../../services/project-invite.service';

/** 当前页面请求的家庭及展示名称。 */
const projectID = ref('');
const projectName = ref('');
/** 列表及分页状态。 */
const list = ref<FamilyMemberEntity[]>([]);
const loading = ref(true);
const hasMore = ref(true);
/** 待添加对象及权限草稿。 */
const account = ref('');
const searchedUser = ref<FamilyMemberState['searchedUser']>(null);
const searchingUser = ref(false);
const authType = ref(2);
const memberRemark = ref('');
const submitting = ref(false);
/** 由服务端身份核验结果控制的操作资格。 */
const canManage = ref(false);
const canLeave = ref(false);
const ownerUserID = ref('');
const error = ref('');
const leaving = ref(false);
const activeTab = ref<'account' | 'scan'>('account');
const showInviteQr = ref(false);
const isOwner = computed(() => String(authProvider.getState().user?.userID || '') === String(ownerUserID.value));
/** 页面关闭时移除订阅，避免失效页面继续接收状态。 */
let unsubscribe: (() => void) | null = null;

// 页面先完成登录与家庭守卫，再按当前账号核验操作资格。
onLoad(async (query?: Record<string, unknown>) => {
  const params = (query || {}) as Record<string, string>;
  if (!await ensurePageReady('/packageUser/pages/family-members/index', params)) return;
  projectID.value = params.projectID || '';
  projectName.value = decodeURIComponent(params.projectName || '');
  unsubscribe = familyMemberProvider.subscribe((state: FamilyMemberState) => {
    list.value = state.list;
    loading.value = state.pageState.loading;
    hasMore.value = state.pageState.hasMore;
    searchedUser.value = state.searchedUser;
    searchingUser.value = state.searchingUser;
    canManage.value = !!state.access?.canManage;
    canLeave.value = !!state.access?.canLeave;
    ownerUserID.value = state.access?.ownerUserID || '';
    error.value = state.error;
  });
  await handleRetry();
});
onUnload(() => { unsubscribe?.(); unsubscribe = null; });

/** 重试服务端资格查询，失败时不开放操作。 */
async function handleRetry() {
  await familyMemberProvider.initialize(projectID.value, authProvider.getState().user?.userID || '');
}

/** 精准搜索待添加对象，保留服务端失败提示。 */
async function handleSearchUser() {
  if (!account.value.trim()) { uni.showToast({ title: '请输入手机号或账号', icon: 'none' }); return; }
  try {
    const user = await familyMemberProvider.searchUser(account.value);
    if (!user) uni.showToast({ title: '未找到可添加用户', icon: 'none' });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || '搜索失败', icon: 'none' });
  }
}

/** 将选项转换为后端成员权限枚举。 */
function handleAuthTypeChange(event: { detail: { value: string } }) { authType.value = Number(event.detail.value); }

/** 打开统一扫码入口，项目邀请和设备分享由扫码结果分别路由。 */
async function handleScanProjectInvite() {
  if (!await ensureScanCameraReady()) return;
  uni.scanCode({
    scanType: ['qrCode'], onlyFromCamera: false,
    success: (result) => {
      const invite = parseProjectInviteQr(result.result || '');
      if (invite) uni.navigateTo({ url: `/packageUser/pages/project-invite/index?inviteToken=${encodeURIComponent(invite.token)}` });
      else uni.showToast({ title: '请扫描项目邀请二维码', icon: 'none' });
    },
    fail: (scanError) => { if (!(scanError.errMsg || '').includes('cancel')) uni.showToast({ title: '扫码失败', icon: 'none' }); },
  });
}

/** 添加成员并等待列表刷新后展示成功。 */
async function handleAddMember() {
  if (!searchedUser.value || submitting.value) return;
  submitting.value = true;
  try {
    await familyMemberProvider.create(searchedUser.value.userID, authType.value, memberRemark.value.trim());
    account.value = ''; memberRemark.value = '';
    uni.showToast({ title: '成员已添加', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: (error as Error).message || '添加失败', icon: 'none' });
  } finally { submitting.value = false; }
}

/** 修改称呼，空字符串明确表示清空。 */
async function handleEditRemark(item: FamilyMemberEntity) {
  const result = await uni.showModal({ title: '修改称呼', editable: true, placeholderText: item.memberRemark || '请输入成员称呼', content: item.memberRemark || '' });
  if (!result.confirm) return;
  try {
    await familyMemberProvider.updateRemark(item.targetID, String(result.content || '').trim());
    uni.showToast({ title: '已更新', icon: 'success' });
  } catch (error) { uni.showToast({ title: (error as Error).message || '更新失败', icon: 'none' }); }
}

/** 移除其他成员，负责人自身由 Provider 再次保护。 */
async function handleRemove(item: FamilyMemberEntity) {
  const result = await uni.showModal({ title: '移除成员', content: '移除后该用户将失去当前家庭访问权限，确定继续吗？' });
  if (!result.confirm) return;
  try {
    await familyMemberProvider.remove(item.targetID);
    uni.showToast({ title: '已移除', icon: 'success' });
  } catch (error) { uni.showToast({ title: (error as Error).message || '移除失败', icon: 'none' }); }
}

/** 退出只撤销本人授权；成功后清理选中上下文并刷新家庭列表。 */
async function handleLeave() {
  if (!canLeave.value || leaving.value) return;
  leaving.value = true;
  try {
    const { confirm } = await uni.showModal({ title: '退出共享家庭', content: '退出后将失去此家庭的直接授权，家庭及设备不会被删除。确定退出吗？' });
    if (!confirm) return;
    await familyMemberProvider.leave();
    if (currentFamilyProvider.getState().projectID === projectID.value) currentFamilyProvider.clear();
    await projectProvider.loadFirst();
    uni.redirectTo({ url: '/packageUser/pages/family-manage/index?mode=select' });
    uni.showToast({ title: '已退出共享家庭', icon: 'success' });
  } catch (error) { uni.showToast({ title: (error as Error).message || '退出失败', icon: 'none' }); }
  finally { leaving.value = false; }
}

/** 继续加载下一页成员。 */
function handleScrollToLower() { if (hasMore.value) familyMemberProvider.loadMore(); }
</script>

<style lang="scss" scoped>
.member-page { flex: 1; min-height: 0; background: transparent; }.member-card { margin: 12px 16px; padding: 16px; background: var(--card-bg); border-radius: var(--radius-lg); }.member-title, .member-list-title { font-size: var(--font-body); font-weight: 600; color: var(--text-primary); }.member-search { display: flex; gap: 8px; margin-top: 12px; }.member-search__input { flex: 1; padding: 10px 12px; background: var(--page-bg); border-radius: 8px; font-size: var(--font-body); }.member-search__button, .member-button { display: flex; align-items: center; justify-content: center; color: var(--color-on-primary); background: var(--color-primary); border-radius: 8px; }.member-search__button { padding: 0 14px; }.member-button { margin-top: 12px; padding: 10px; }.member-result, .member-item { display: flex; align-items: center; gap: 10px; }.member-result { margin-top: 12px; padding: 10px; background: var(--page-bg); border-radius: 8px; }.member-avatar { width: 38px; height: 38px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--color-on-primary); background: var(--color-primary); }.member-info { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }.member-name { font-size: var(--font-body); color: var(--text-primary); }.member-account, .member-role { font-size: var(--font-caption); color: var(--text-secondary); }.member-auth { display: flex; gap: 16px; margin-top: 12px; font-size: var(--font-caption); color: var(--text-secondary); }.member-remark { margin-top: 10px; padding: 9px 10px; background: var(--page-bg); border-radius: 8px; font-size: var(--font-caption); }.member-list-title { display: flex; justify-content: space-between; margin: 18px 16px 8px; }.member-item { padding: 12px; }.member-actions { display: flex; gap: 10px; color: var(--color-primary); font-size: var(--font-caption); }.member-actions__danger { color: var(--color-danger); }.member-loading-more { display: flex; justify-content: center; padding: 10px; }

.member-search__input { width: 0; min-width: 0; min-height: 24px; border-radius: var(--radius-sm); }
.member-search__button { min-height: 44px; border-radius: var(--radius-sm); flex-shrink: 0; }
.member-tabs { display:flex; gap:8px; margin-top:14px; padding:4px; border-radius:var(--radius-full); background:var(--page-bg); }
.member-tab { flex:1; padding:9px 0; text-align:center; border-radius:var(--radius-full); font-size:var(--font-caption); color:var(--text-secondary); }
.member-tab--active { color:var(--color-primary); background:var(--card-bg); box-shadow:0 2px 8px var(--color-shadow); }
.scan-invite-panel { display:flex; flex-direction:column; }
.scan-invite-title { margin-top:14px; font-size:var(--font-body); font-weight:600; color:var(--text-primary); }
.scan-invite-desc { margin-top:8px; font-size:var(--font-caption); line-height:1.5; color:var(--text-secondary); }
.scan-join-button { margin-top:12px; padding:10px; text-align:center; border:1px solid var(--color-primary); border-radius:var(--radius-sm); color:var(--color-primary); font-size:var(--font-caption); }
.member-btn { min-height: 44px; box-sizing: border-box; border-radius: var(--radius-full); }
.member-user__account { overflow-wrap: anywhere; }
</style>
