<template>
<app-navigation-bar :title="hasPassword ? '修改密码' : '设置密码'" :back="true" />

<scroll-view class="change-pwd-page" scroll-y type="list">
  <view class="change-pwd-card">
    <view v-if="hasPassword" class="change-pwd-field">
      <text class="change-pwd-field__label">原密码</text>
      <input class="change-pwd-field__input" password placeholder="请输入原密码" :value="oldPassword" @blur="handleOldPasswordBlur" />
    </view>
    <view class="change-pwd-field">
      <text class="change-pwd-field__label">新密码</text>
      <input class="change-pwd-field__input" password placeholder="请输入新密码" :value="password" @blur="handlePasswordBlur" />
    </view>
    <view class="change-pwd-field">
      <text class="change-pwd-field__label">确认新密码</text>
      <input class="change-pwd-field__input" password placeholder="请再次输入新密码" :value="confirmPassword" @blur="handleConfirmPasswordBlur" />
    </view>
  </view>

  <text class="change-pwd-hint">密码至少8位，需包含大写、小写、数字、特殊字符中的至少3种</text>

  <view :class="`change-pwd-submit ${submitting ? 'change-pwd-submit--disabled' : ''}`" @tap="handleSubmit" hover-class="change-pwd-submit--hover">
    <text class="change-pwd-submit__text">{{submitting ? '提交中...' : '确认提交'}}</text>
  </view>
  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';
import { sha256 } from '../../../utils/crypto';

const hasPassword = ref(false);
const oldPassword = ref('');
const password = ref('');
const confirmPassword = ref('');
const submitting = ref(false);

function validatePassword(pwd: string): boolean {
  if (pwd.length < 8) return false;
  let types = 0;
  if (/[A-Z]/.test(pwd)) types++;
  if (/[a-z]/.test(pwd)) types++;
  if (/[0-9]/.test(pwd)) types++;
  if (/[^A-Za-z0-9]/.test(pwd)) types++;
  return types >= 3;
}

onLoad(() => {
  if (!authProvider.isLoggedIn()) {
    uni.redirectTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  hasPassword.value = !!authProvider.getState().user?.password;
});

/** 密码输入框采用失焦同步：聚焦期间不写响应式 value，避免 setData 回写干扰原生输入框显示；blur 先于提交按钮 tap，提交处拿到最新值 */
function handleOldPasswordBlur(e: any) { oldPassword.value = e.detail.value }
function handlePasswordBlur(e: any) { password.value = e.detail.value }
function handleConfirmPasswordBlur(e: any) { confirmPassword.value = e.detail.value }

async function handleSubmit() {
  if (submitting.value) return;
  if (hasPassword.value && !oldPassword.value) { uni.showToast({ title: '请输入原密码', icon: 'none' }); return; }
  if (!password.value || !confirmPassword.value) { uni.showToast({ title: '请输入新密码', icon: 'none' }); return; }
  if (!validatePassword(password.value)) { uni.showToast({ title: '密码强度不足', icon: 'none' }); return; }
  if (password.value !== confirmPassword.value) { uni.showToast({ title: '两次密码不一致', icon: 'none' }); return; }
  submitting.value = true;
  try {
    await authProvider.changePasswordByOldPassword(hasPassword.value ? sha256(oldPassword.value) : undefined, sha256(password.value));
    uni.showToast({ title: hasPassword.value ? '修改成功' : '设置成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 300);
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.change-pwd-page { flex: 1; min-height: 0; background: var(--page-bg); }
.change-pwd-card { margin: 16px; padding: 4px 16px; background: var(--card-bg); border-radius: 16px; box-shadow: 0 8px 24px var(--color-shadow); }
.change-pwd-field { padding: 14px 0; border-bottom: 1rpx solid var(--border-color); }
.change-pwd-field:last-child { border-bottom: none; }
.change-pwd-field__label { display: block; margin-bottom: 10px; font-size: 14px; color: var(--text-secondary); }
.change-pwd-field__input { font-size: 16px; color: var(--text-primary); }
.change-pwd-hint { display: block; margin: 0 16px; font-size: 12px; line-height: 1.6; color: var(--text-secondary); }
.change-pwd-submit { margin: 20px 16px; height: 48px; border-radius: 14px; background: var(--color-primary); display: flex; align-items: center; justify-content: center; }
.change-pwd-submit--disabled { opacity: 0.6; }
.change-pwd-submit--hover { opacity: 0.9; }
.change-pwd-submit__text { color: var(--color-on-primary); font-size: 16px; font-weight: 600; }
</style>
