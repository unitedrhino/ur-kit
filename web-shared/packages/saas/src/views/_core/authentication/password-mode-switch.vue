<script setup lang="ts">
/** 登录页页脚入口：切换当前应用的密码模式，不触发导航或提交。 */
import { $t } from '../../../locales';
import { useLoginPasswordMode } from '../../../password-login';
import { useAuthStore } from '../../../store/auth';

/** passwordMode 与所有密码表单共用同一模式状态。 */
const passwordMode = useLoginPasswordMode();
/** authStore 提供真实登录请求的忙碌状态。 */
const authStore = useAuthStore();

/** toggleMode 请求期间拒绝切换，保证界面状态与当前请求一致。 */
function toggleMode() {
  if (authStore.loginLoading) return;
  passwordMode.selectMode(passwordMode.mode === 'md5' ? 'sha256' : 'md5');
}
</script>

<template>
  <span class="inline-flex flex-wrap items-center justify-center gap-x-1">
    <span v-if="passwordMode.mode === 'md5'">{{ $t('authMode.legacyMode') }} ·</span>
    <button
      type="button"
      class="hover:text-primary focus-visible:ring-ring whitespace-nowrap rounded-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-wait disabled:opacity-50"
      :disabled="authStore.loginLoading"
      @click="toggleMode"
    >
      {{ passwordMode.mode === 'md5' ? $t('authMode.switchStandardLogin') : $t('authMode.legacyLogin') }}
    </button>
  </span>
</template>
