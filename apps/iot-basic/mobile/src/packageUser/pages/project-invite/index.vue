<!-- 项目邀请确认页：扫码后先展示摘要，确认才写入项目成员和区域权限。 -->
<template>
  <app-navigation-bar title="加入项目" />
  <view class="invite-page">
    <view v-if="loading" class="invite-card invite-state">正在读取邀请信息…</view>
    <view v-else-if="error" class="invite-card invite-state"><text class="invite-error">{{ error }}</text><view class="invite-btn" @tap="handleBack">返回</view></view>
    <view v-else class="invite-card">
      <view class="invite-icon">⌂</view>
      <text class="invite-title">{{ summary.sharerName || '项目负责人' }}邀请你加入项目</text>
      <text class="invite-project">{{ summary.projectName }}</text>
      <view class="invite-meta"><text>权限：{{ authLabel }}</text><text v-if="summary.authType === 3">区域：{{ areaSummary }}</text><text>有效期：{{ expireText }}</text></view>
      <view class="invite-btn" @tap="handleAccept">{{ accepting ? '加入中…' : '确认加入项目' }}</view>
      <view class="invite-cancel" @tap="handleBack">暂不加入</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ensurePageReady } from '../../../utils/page-guard';
import { acceptProjectInvite, checkProjectInvite, type ProjectInviteSummary } from '../../../services/project-invite.service';
import { projectProvider } from '../../../providers/project.provider';
import { currentFamilyProvider } from '../../../providers/current-family.provider';
import { appContextProvider } from '../../../providers/app-context.provider';

const token = ref('');
const loading = ref(true);
const accepting = ref(false);
const error = ref('');
const summary = ref<ProjectInviteSummary>({ valid: false, projectID: '', projectName: '', sharerName: '', authType: 0, areas: [], expiresAt: 0 });
const authLabel = computed(() => summary.value.authType === 1 ? '管理权限' : summary.value.authType === 2 ? '读写权限' : '只读权限');
const areaSummary = computed(() => summary.value.areas.map((item) => `${item.areaName || `区域 ${item.areaID}`}${item.isAuthChildren === 1 ? '（含下级）' : ''}`).join('、'));
const expireText = computed(() => summary.value.expiresAt ? new Date(summary.value.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '即将过期');

onLoad(async (query: Record<string, string | undefined> = {}) => {
  token.value = query.inviteToken || '';
  if (!token.value) { error.value = '邀请二维码无效'; loading.value = false; return; }
  if (!await ensurePageReady(`/packageUser/pages/project-invite/index?inviteToken=${encodeURIComponent(token.value)}`)) return;
  try {
    const result = await checkProjectInvite(token.value);
    if (!result.valid) throw new Error('邀请已过期或已撤销');
    summary.value = result;
  } catch (err) { error.value = (err as Error).message || '邀请读取失败'; }
  finally { loading.value = false; }
});

/** 接受成功后刷新项目列表并切换到邀请项目。 */
async function handleAccept() {
  if (accepting.value || !summary.value.valid) return;
  accepting.value = true; error.value = '';
  try {
    const result = await acceptProjectInvite(token.value);
    await projectProvider.loadFirst();
    currentFamilyProvider.switchFamily(result.projectID, result.projectName);
    uni.showToast({ title: '已加入项目', icon: 'success' });
    // 邀请页本身会被守卫记录为待恢复路由，接受成功后必须清掉它并回到首页，避免再次打开邀请页。
    appContextProvider.clearPendingRoute();
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 300);
  } catch (err) { error.value = (err as Error).message || '加入项目失败，请稍后重试'; }
  finally { accepting.value = false; }
}
function handleBack() { uni.navigateBack({ delta: 1 }); }
</script>

<style lang="scss" scoped>
.invite-page{min-height:100vh;box-sizing:border-box;padding:36px 20px;background:var(--page-gradient)}.invite-card{padding:26px 20px;border-radius:var(--radius-lg);background:var(--card-bg);text-align:center}.invite-state{margin-top:20vh}.invite-icon{width:64px;height:64px;margin:0 auto 18px;line-height:64px;border-radius:20px;color:var(--color-primary);background:var(--color-primary-light);font-size:30px}.invite-title{display:block;font-size:var(--font-section);font-weight:600;color:var(--text-primary)}.invite-project{display:block;margin-top:10px;font-size:20px;font-weight:600;color:var(--color-primary)}.invite-meta{display:flex;flex-direction:column;gap:10px;margin-top:22px;padding:14px;text-align:left;border-radius:12px;background:var(--page-bg);font-size:var(--font-caption);line-height:1.5;color:var(--text-secondary)}.invite-error{display:block;color:var(--color-danger);line-height:1.5}.invite-btn{margin-top:24px;padding:13px;border-radius:var(--radius-full);color:var(--color-on-primary);background:var(--color-primary)}.invite-cancel{margin-top:16px;font-size:var(--font-caption);color:var(--text-secondary)}
</style>
