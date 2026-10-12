<template>
<view v-if="visible" class="sp-overlay">
  <view class="sp-panel" @tap.stop="">
    <view class="sp-header">
      <text class="sp-title">设置密码</text>
      <text class="sp-subtitle">为保障账号安全，请设置登录密码</text>
    </view>

    <view class="sp-form">
      <!-- 密码 -->
      <view class="sp-field">
        <text class="sp-label">密码</text>
        <view class="sp-input-wrap">
          <input
            class="sp-input"
            type="text"
            :password="!showPassword"
            placeholder="请输入密码"
            :value="password"
            @blur="handlePasswordBlur"
            maxlength="32"
          />
          <view class="sp-eye" @tap="togglePasswordVisible">
            <app-icon class="sp-eye-icon" :name="showPassword ? 'tabler:eye' : 'tabler:eye-off'" :size="20" />
          </view>
        </view>
      </view>

      <!-- 确认密码 -->
      <view class="sp-field">
        <text class="sp-label">确认密码</text>
        <view class="sp-input-wrap">
          <input
            class="sp-input"
            type="text"
            :password="!showConfirmPassword"
            placeholder="请再次输入密码"
            :value="confirmPassword"
            @blur="handleConfirmPasswordBlur"
            maxlength="32"
          />
          <view class="sp-eye" @tap="toggleConfirmPasswordVisible">
            <app-icon class="sp-eye-icon" :name="showConfirmPassword ? 'tabler:eye' : 'tabler:eye-off'" :size="20" />
          </view>
        </view>
      </view>

      <!-- 密码提示 -->
      <text class="sp-hint">密码至少8位，需包含大写、小写、数字、特殊字符中的至少3种</text>

      <!-- 错误信息 -->
      <text v-if="errorMsg" class="sp-error">{{errorMsg}}</text>
    </view>

    <view class="sp-footer">
      <view
        :class="`sp-btn ${loading ? 'sp-btn--disabled' : ''}`"
        @tap="handleSubmit"
        hover-class="sp-btn--hover"
      >
        <text class="sp-btn__text">{{loading ? '提交中...' : '确认设置'}}</text>
      </view>
    </view>
  </view>
</view>

</template>

<script setup lang="ts">
import AppIcon from '../app-icon/app-icon.vue';
import { ref, watch } from 'vue';
import { authProvider } from '../../providers/auth.provider';
import { sha256 } from '../../utils/crypto';

interface Props { visible?: boolean }
withDefaults(defineProps<Props>(), { visible: false });
const emit = defineEmits<{ (e: 'success'): void }>();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const errorMsg = ref('');

/** 密码输入框采用失焦同步：聚焦输入期间不写响应式 value，避免 setData 回写干扰原生输入框显示（粘贴内容不显示问题）；blur 先于提交按钮 tap，提交处拿到最新值 */
function handlePasswordBlur(e: any) { password.value = e.detail.value }
function handleConfirmPasswordBlur(e: any) { confirmPassword.value = e.detail.value }

/** 密码输入变化时清除上次的错误提示 */
watch(password, () => {
  errorMsg.value = '';
});
/** 确认密码输入变化时清除上次的错误提示 */
watch(confirmPassword, () => {
  errorMsg.value = '';
});

function validatePassword(pwd: string): boolean {
  if (pwd.length < 8) return false;
  let types = 0;
  if (/[A-Z]/.test(pwd)) types++;
  if (/[a-z]/.test(pwd)) types++;
  if (/[0-9]/.test(pwd)) types++;
  if (/[^A-Za-z0-9]/.test(pwd)) types++;
  return types >= 3;
}

function togglePasswordVisible() { showPassword.value = !showPassword.value; }
function toggleConfirmPasswordVisible() { showConfirmPassword.value = !showConfirmPassword.value; }

async function handleSubmit() {
  if (!password.value || !confirmPassword.value) {
    errorMsg.value = '请输入密码';
    return;
  }
  if (!validatePassword(password.value)) {
    errorMsg.value = '密码至少8位，需包含大写、小写、数字、特殊字符 中的至少3种';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    await authProvider.setPassword(sha256(password.value));
    uni.showToast({ title: '密码设置成功', icon: 'success' });
    password.value = '';
    confirmPassword.value = '';
    loading.value = false;
    emit('success');
  } catch (err) {
    loading.value = false;
    errorMsg.value = (err as Error).message || '设置密码失败';
  }
}
/* eslint-disable */
// import { authProvider } from '../../providers/auth.provider';
// import { sha256 } from '../../utils/crypto';
// 
// /** 密码强度校验：至少8位，包含大写、小写、数字、特殊字符中的至少3种 */
// function validatePassword(pwd: string): boolean {
//   if (pwd.length < 8) return false;
//   let types = 0;
//   if (/[A-Z]/.test(pwd)) types++;
//   if (/[a-z]/.test(pwd)) types++;
//   if (/[0-9]/.test(pwd)) types++;
//   if (/[^A-Za-z0-9]/.test(pwd)) types++;
//   return types >= 3;
// }
// 
// Component({
//   properties: {
//     visible: { type: Boolean, value: false },
//   },
// 
//   data: {
//     password: '',
//     confirmPassword: '',
//     showPassword: false,
//     showConfirmPassword: false,
//     loading: false,
//     errorMsg: '',
//   },
// 
//   methods: {
//     handlePasswordInput(e: WechatMiniprogram.Input) {
//       this.setData({ password: e.detail.value, errorMsg: '' });
//     },
// 
//     handleConfirmPasswordInput(e: WechatMiniprogram.Input) {
//       this.setData({ confirmPassword: e.detail.value, errorMsg: '' });
//     },
// 
//     togglePasswordVisible() {
//       this.setData({ showPassword: !this.data.showPassword });
//     },
// 
//     toggleConfirmPasswordVisible() {
//       this.setData({ showConfirmPassword: !this.data.showConfirmPassword });
//     },
// 
//     async handleSubmit() {
//       const { password, confirmPassword } = this.data;
// 
//       if (!password || !confirmPassword) {
//         this.setData({ errorMsg: '请输入密码' });
//         return;
//       }
// 
//       if (!validatePassword(password)) {
//         this.setData({ errorMsg: '密码至少8位，需包含大写、小写、数字、特殊字符中的至少3种' });
//         return;
//       }
// 
//       if (password !== confirmPassword) {
//         this.setData({ errorMsg: '两次输入的密码不一致' });
//         return;
//       }
// 
//       this.setData({ loading: true, errorMsg: '' });
//       try {
//         await authProvider.setPassword(sha256(password));
//         wx.showToast({ title: '密码设置成功', icon: 'success' });
//         this.setData({ password: '', confirmPassword: '', loading: false });
//         this.triggerEvent('success');
//       } catch (err) {
//         this.setData({
//           loading: false,
//           errorMsg: (err as Error).message || '设置密码失败',
//         });
//       }
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.sp-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sp-panel {
  width: 85%;
  max-width: 640rpx;
  background: var(--card-bg);
  border-radius: var(--radius-lg, 24rpx);
  padding: 48rpx 40rpx 40rpx;
  display: flex;
  flex-direction: column;
}

.sp-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.sp-title {
  font-size: 36rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.sp-subtitle {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.sp-form {
  display: flex;
  flex-direction: column;
}

.sp-field {
  margin-bottom: 28rpx;
}

.sp-label {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 12rpx;
  display: block;
}

.sp-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md, 16rpx);
  padding: 0 24rpx;
  height: 88rpx;
}

.sp-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary);
  height: 88rpx;
}

.sp-eye {
  padding: 12rpx;
}

.sp-eye-icon {
  color: var(--text-secondary);
}

.sp-hint {
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-bottom: 12rpx;
}

.sp-error {
  font-size: 24rpx;
  color: var(--color-danger);
  margin-top: 8rpx;
}

.sp-footer {
  margin-top: 32rpx;
}

.sp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  background: var(--color-primary);
  border-radius: var(--radius-md, 16rpx);
}

.sp-btn--hover {
  opacity: 0.85;
}

.sp-btn--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.sp-btn__text {
  font-size: 30rpx;
  color: var(--color-on-primary);
  font-weight: 500;
}

</style>
