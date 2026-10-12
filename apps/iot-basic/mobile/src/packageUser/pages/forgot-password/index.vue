<template>
<app-navigation-bar title="忘记密码" :back="true" />

<scroll-view class="forgot-page" scroll-y type="list">
  <view class="forgot-tabs">
    <view :class="`forgot-tab ${type === 'phone' ? 'forgot-tab--active' : ''}`" @tap="handleTypeChange('phone')">
      <text class="forgot-tab__text">手机号</text>
    </view>
    <view :class="`forgot-tab ${type === 'email' ? 'forgot-tab--active' : ''}`" @tap="handleTypeChange('email')">
      <text class="forgot-tab__text">邮箱</text>
    </view>
  </view>

  <view class="forgot-card">
    <view class="forgot-field">
      <text class="forgot-field__label">{{type === 'phone' ? '手机号' : '邮箱'}}</text>
      <input class="forgot-field__input" :type="type === 'phone' ? 'number' : 'text'" :maxlength="type === 'phone' ? 11 : 64" :placeholder="type === 'phone' ? '请输入手机号' : '请输入邮箱'" :value="account" @blur="handleAccountBlur" />
    </view>
    <view class="forgot-field forgot-field--inline">
      <view class="forgot-field__main">
        <text class="forgot-field__label">验证码</text>
        <input class="forgot-field__input" type="number" maxlength="6" placeholder="请输入验证码" :value="code" @blur="handleCodeBlur" />
      </view>
      <view :class="`forgot-code-btn ${countdown > 0 || sending ? 'forgot-code-btn--disabled' : ''}`" @tap="handleSendCode">
        <text class="forgot-code-btn__text">{{countdown > 0 ? countdown + 's后重发' : '获取验证码'}}</text>
      </view>
    </view>
    <view class="forgot-field">
      <text class="forgot-field__label">新密码</text>
      <input class="forgot-field__input" password placeholder="请输入新密码" :value="password" @blur="handlePasswordBlur" />
    </view>
    <view class="forgot-field">
      <text class="forgot-field__label">确认新密码</text>
      <input class="forgot-field__input" password placeholder="请再次输入新密码" :value="confirmPassword" @blur="handleConfirmPasswordBlur" />
    </view>
  </view>

  <text class="forgot-hint">密码至少8位，需包含大写、小写、数字、特殊字符中的至少3种</text>

  <view :class="`forgot-submit ${submitting ? 'forgot-submit--disabled' : ''}`" @tap="handleSubmit" hover-class="forgot-submit--hover">
    <text class="forgot-submit__text">{{submitting ? '提交中...' : '重置密码'}}</text>
  </view>
  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref, onUnmounted, watch } from 'vue';
import { onUnload } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';
import { sha256 } from '../../../utils/crypto';

const COUNTDOWN_SECONDS = 60;
const type = ref<'phone' | 'email'>('phone');
const account = ref('');
const code = ref('');
const codeID = ref('');
const password = ref('');
const confirmPassword = ref('');
const countdown = ref(0);
const sending = ref(false);
const submitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function isPhone(value: string): boolean { return /^1\d{10}$/.test(value); }
function isEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

function validatePassword(pwd: string): boolean {
  if (pwd.length < 8) return false;
  let types = 0;
  if (/[A-Z]/.test(pwd)) types++;
  if (/[a-z]/.test(pwd)) types++;
  if (/[0-9]/.test(pwd)) types++;
  if (/[^A-Za-z0-9]/.test(pwd)) types++;
  return types >= 3;
}

function clearTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

function resetCode() {
  code.value = '';
  codeID.value = '';
  clearTimer();
  countdown.value = 0;
}

function startCountdown(seconds: number) {
  clearTimer();
  countdown.value = seconds;
  timer = setInterval(() => {
    const next = countdown.value - 1;
    if (next <= 0) { clearTimer(); countdown.value = 0; return; }
    countdown.value = next;
  }, 1000);
}

onUnload(() => clearTimer());
onUnmounted(() => clearTimer());

function handleTypeChange(nextType: 'phone' | 'email') {
  if (nextType === type.value) return;
  type.value = nextType;
  account.value = '';
  resetCode();
}

/** 输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示（粘贴内容不显示问题）；blur 先于按钮 tap，读取处拿到最新值 */
function handleAccountBlur(e: any) { account.value = e.detail.value }
function handleCodeBlur(e: any) { code.value = e.detail.value }
function handlePasswordBlur(e: any) { password.value = e.detail.value }
function handleConfirmPasswordBlur(e: any) { confirmPassword.value = e.detail.value }

/** 账号变更时重置已获取的验证码与倒计时，避免新旧账号混用已下发的验证码 */
watch(account, (next) => {
  const trimmed = next.trim();
  if (trimmed !== next) {
    account.value = trimmed;
    return;
  }
  resetCode();
});

/** 验证码输入时同步去除首尾空白 */
watch(code, (next) => {
  const trimmed = next.trim();
  if (trimmed !== next) code.value = trimmed;
});

function validateAccount(): boolean {
  if (type.value === 'phone') return isPhone(account.value);
  return isEmail(account.value);
}

async function handleSendCode() {
  if (countdown.value > 0 || sending.value) return;
  if (!validateAccount()) { uni.showToast({ title: type.value === 'phone' ? '请输入正确手机号' : '请输入正确邮箱', icon: 'none' }); return; }
  sending.value = true;
  try {
    const result = type.value === 'phone'
      ? await authProvider.sendPhoneCaptchaForUse(account.value, 'forgetPwd')
      : await authProvider.sendEmailCaptcha(account.value, 'forgetPwd');
    codeID.value = result.codeID;
    startCountdown(COUNTDOWN_SECONDS);
    uni.showToast({ title: '验证码已发送', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '发送失败', icon: 'none' });
  } finally {
    sending.value = false;
  }
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!validateAccount()) { uni.showToast({ title: type.value === 'phone' ? '请输入正确手机号' : '请输入正确邮箱', icon: 'none' }); return; }
  if (!codeID.value) { uni.showToast({ title: '请先获取验证码', icon: 'none' }); return; }
  if (!code.value) { uni.showToast({ title: '请输入验证码', icon: 'none' }); return; }
  if (!password.value || !confirmPassword.value) { uni.showToast({ title: '请输入新密码', icon: 'none' }); return; }
  if (!validatePassword(password.value)) { uni.showToast({ title: '密码强度不足', icon: 'none' }); return; }
  if (password.value !== confirmPassword.value) { uni.showToast({ title: '两次密码不一致', icon: 'none' }); return; }
  submitting.value = true;
  try {
    await authProvider.forgetPassword({ type: type.value, account: account.value, code: code.value, codeID: codeID.value, password: sha256(password.value) });
    uni.showToast({ title: '密码已重置', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 300);
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '重置失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.forgot-page { flex: 1; min-height: 0; background: var(--page-bg); }
.forgot-tabs { display: flex; gap: 10px; margin: 16px 16px 0; padding: 4px; border-radius: 14px; background: var(--card-bg); }
.forgot-tab { flex: 1; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.forgot-tab--active { background: var(--color-primary-light); }
.forgot-tab__text { font-size: 14px; color: var(--text-secondary); }
.forgot-tab--active .forgot-tab__text { color: var(--color-primary); font-weight: 600; }
.forgot-card { margin: 16px; padding: 4px 16px; background: var(--card-bg); border-radius: 16px; box-shadow: 0 8px 24px var(--color-shadow); }
.forgot-field { padding: 14px 0; border-bottom: 1rpx solid var(--border-color); }
.forgot-field:last-child { border-bottom: none; }
.forgot-field__label { display: block; margin-bottom: 10px; font-size: 14px; color: var(--text-secondary); }
.forgot-field__input { font-size: 16px; color: var(--text-primary); }
.forgot-field--inline { display: flex; align-items: flex-end; gap: 12px; }
.forgot-field__main { flex: 1; min-width: 0; }
.forgot-code-btn { flex-shrink: 0; min-width: 220rpx; padding: 14px 18px; text-align: center; border-radius: 12px; background: var(--color-primary-light); }
.forgot-code-btn--disabled { opacity: 0.55; }
.forgot-code-btn__text { font-size: 13px; color: var(--color-primary); }
.forgot-hint { display: block; margin: 0 16px; font-size: 12px; line-height: 1.6; color: var(--text-secondary); }
.forgot-submit { margin: 20px 16px; height: 48px; border-radius: 14px; background: var(--color-primary); display: flex; align-items: center; justify-content: center; }
.forgot-submit--disabled { opacity: 0.6; }
.forgot-submit--hover { opacity: 0.9; }
.forgot-submit__text { color: var(--color-on-primary); font-size: 16px; font-weight: 600; }
</style>
