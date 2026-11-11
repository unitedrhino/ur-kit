<!-- 无项目入口：先选择创建项目或扫描负责人邀请，不创建临时共享项目。 -->
<template>
  <app-navigation-bar title="选择项目" />
  <view class="entry-page">
    <view class="entry-card">
      <view class="entry-icon">⌂</view>
      <text class="entry-title">先加入一个项目</text>
      <text class="entry-desc">当前组织还没有可访问的项目，请创建自己的项目，或扫描负责人发来的邀请二维码。</text>
      <view class="entry-btn" @tap="handleCreate">创建项目</view>
      <view class="entry-btn entry-btn--outline" @tap="handleScan">扫码加入项目</view>
      <view class="entry-cancel" @tap="handleCancel">稍后再说</view>
    </view>
  </view>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import { ensureScanCameraReady } from '../../../services/scan-permission.service';
import { parseProjectInviteQr } from '../../../services/project-invite.service';
const suggestedName = ref('');
onLoad((query: Record<string, string | undefined> = {}) => { suggestedName.value = decodeURIComponent(query.suggestedName || ''); });
function handleCreate() { uni.redirectTo({ url: `/packageUser/pages/family-edit/index?mode=create&source=guard&suggestedName=${encodeURIComponent(suggestedName.value)}` }); }
async function handleScan() {
  if (!await ensureScanCameraReady()) return;
  uni.scanCode({ scanType: ['qrCode'], onlyFromCamera: false, success: (result) => { const invite = parseProjectInviteQr(result.result || ''); if (invite) uni.redirectTo({ url: `/packageUser/pages/project-invite/index?inviteToken=${encodeURIComponent(invite.token)}` }); else uni.showToast({ title: '请扫描项目邀请二维码', icon: 'none' }); }, fail: (error) => { if (!(error.errMsg || '').includes('cancel')) uni.showToast({ title: '扫码失败', icon: 'none' }); } });
}
function handleCancel() { uni.switchTab({ url: '/pages/home/index' }); }
</script>
<style lang="scss" scoped>
.entry-page{min-height:100vh;box-sizing:border-box;padding:34px 20px;background:var(--page-gradient)}.entry-card{margin-top:16vh;padding:28px 22px;border-radius:var(--radius-lg);background:var(--card-bg);text-align:center}.entry-icon{width:62px;height:62px;margin:0 auto 18px;line-height:62px;border-radius:20px;color:var(--color-primary);background:var(--color-primary-light);font-size:30px}.entry-title{display:block;font-size:var(--font-section);font-weight:600;color:var(--text-primary)}.entry-desc{display:block;margin-top:10px;font-size:var(--font-caption);line-height:1.6;color:var(--text-secondary)}.entry-btn{margin-top:24px;padding:13px;border-radius:var(--radius-full);color:var(--color-on-primary);background:var(--color-primary)}.entry-btn--outline{margin-top:12px;color:var(--color-primary);border:1px solid var(--color-primary);background:transparent}.entry-cancel{margin-top:18px;font-size:var(--font-caption);color:var(--text-secondary)}
</style>
