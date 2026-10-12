<template>
<app-navigation-bar title="绑定邮箱" :back="true" />

<scroll-view class="bind-email-page" scroll-y type="list">
  <view class="bind-email-card">
    <view class="bind-email-field">
      <text class="bind-email-field__label">邮箱</text>
      <input class="bind-email-field__input" type="text" placeholder="请输入邮箱" :value="email" @blur="handleEmailBlur" />
    </view>
    <view class="bind-email-field bind-email-field--inline">
      <view class="bind-email-field__main">
        <text class="bind-email-field__label">验证码</text>
        <input class="bind-email-field__input" type="number" maxlength="6" placeholder="请输入验证码" :value="code" @blur="handleCodeBlur" />
      </view>
      <view :class="`bind-email-code-btn ${countdown > 0 || sending ? 'bind-email-code-btn--disabled' : ''}`" @tap="handleSendCode">
        <text class="bind-email-code-btn__text">{{countdown > 0 ? countdown + 's后重发' : '获取验证码'}}</text>
      </view>
    </view>
  </view>

  <view :class="`bind-email-submit ${submitting ? 'bind-email-submit--disabled' : ''}`" @tap="handleSubmit" hover-class="bind-email-submit--hover">
    <text class="bind-email-submit__text">{{submitting ? '提交中...' : '确认绑定'}}</text>
  </view>
  <safe-area />
</scroll-view>
</template>

<script setup lang="ts">
import AppNavigationBar from '../../../components/app-navigation-bar/app-navigation-bar.vue';
import SafeArea from '../../../components/safe-area/safe-area.vue';
import { ref, onUnmounted, watch } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { authProvider } from '../../../providers/auth.provider';

const COUNTDOWN_SECONDS = 60;
const email = ref('');
const code = ref('');
const codeID = ref('');
const countdown = ref(0);
const sending = ref(false);
const submitting = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clearTimer() {
  if (timer) { clearInterval(timer); timer = null; }
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

onLoad(() => {
  if (!authProvider.isLoggedIn()) {
    uni.redirectTo({ url: '/packageUser/pages/login/index' });
    return;
  }
  email.value = authProvider.getState().user?.email || '';
});

onUnload(() => clearTimer());
onUnmounted(() => clearTimer());

/** 邮箱/验证码输入框采用失焦同步：聚焦期间不写响应式 value，避免 setData 回写干扰原生输入框显示（粘贴内容不显示问题）；blur 先于按钮 tap，读取处拿到最新值 */
function handleEmailBlur(e: any) { email.value = e.detail.value }
function handleCodeBlur(e: any) { code.value = e.detail.value }

/** 邮箱变更时清空已获取的验证码与倒计时，避免新旧邮箱混用已下发的验证码 */
watch(email, (next) => {
  const trimmed = next.trim();
  if (trimmed !== next) {
    email.value = trimmed;
    return;
  }
  code.value = '';
  codeID.value = '';
  clearTimer();
  countdown.value = 0;
});

/** 验证码输入时同步去除首尾空白 */
watch(code, (next) => {
  const trimmed = next.trim();
  if (trimmed !== next) code.value = trimmed;
});

async function handleSendCode() {
  if (countdown.value > 0 || sending.value) return;
  if (!isEmail(email.value)) { uni.showToast({ title: '请输入正确邮箱', icon: 'none' }); return; }
  sending.value = true;
  try {
    const result = await authProvider.sendEmailCaptcha(email.value, 'bindAccount');
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
  if (!isEmail(email.value)) { uni.showToast({ title: '请输入正确邮箱', icon: 'none' }); return; }
  if (!codeID.value) { uni.showToast({ title: '请先获取验证码', icon: 'none' }); return; }
  if (!code.value) { uni.showToast({ title: '请输入验证码', icon: 'none' }); return; }
  submitting.value = true;
  try {
    await authProvider.bindEmailByCode(email.value, code.value, codeID.value);
    uni.showToast({ title: '绑定成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 300);
  } catch (error) {
    uni.showToast({ title: (error as Error)?.message || '绑定失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.bind-email-page { flex: 1; min-height: 0; background: var(--page-bg); }
.bind-email-card { margin: 16px; padding: 4px 16px; background: var(--card-bg); border-radius: 16px; box-shadow: 0 8px 24px var(--color-shadow); }
.bind-email-field { padding: 14px 0; border-bottom: 1rpx solid var(--border-color); }
.bind-email-field:last-child { border-bottom: none; }
.bind-email-field__label { display: block; margin-bottom: 10px; font-size: 14px; color: var(--text-secondary); }
.bind-email-field__input { font-size: 16px; color: var(--text-primary); }
.bind-email-field--inline { display: flex; align-items: flex-end; gap: 12px; }
.bind-email-field__main { flex: 1; min-width: 0; }
.bind-email-code-btn { flex-shrink: 0; min-width: 220rpx; padding: 14px 18px; text-align: center; border-radius: 12px; background: var(--color-primary-light); }
.bind-email-code-btn--disabled { opacity: 0.55; }
.bind-email-code-btn__text { font-size: 13px; color: var(--color-primary); }
.bind-email-submit { margin: 20px 16px; height: 48px; border-radius: 14px; background: var(--color-primary); display: flex; align-items: center; justify-content: center; }
.bind-email-submit--disabled { opacity: 0.6; }
.bind-email-submit--hover { opacity: 0.9; }
.bind-email-submit__text { color: var(--color-on-primary); font-size: 16px; font-weight: 600; }
</style>
