<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';
import { useAuthStore } from '@vben/saas/store';

import { useMessage } from 'naive-ui';

import { resolveAuthPath } from './auth-paths';
import Title from './auth-title.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

const loading = ref(true);
const error = ref<string>('');

onMounted(async () => {
  const code = route.query.code as string;
  const state = route.query.state as string;

  // 验证必要参数
  if (!code || !state) {
    loading.value = false;
    error.value = $t('orgIotClient.auth.missingLoginParams');
    message.error($t('orgIotClient.auth.loginStateMismatch'));
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push(resolveAuthPath(route, 'login'));
    }, 3000);
    return;
  }

  // 调用登录 API
  try {
    error.value = '';

    await authStore.authLogin({
      loginType: CoreApi.UserLoginReqLoginTypeEnum.WX_OPEN,
      code,
      // isSsl: 2,
      codeID: state,
    });

    // message.success('登录成功');
    // authStore.authLogin 内部会自动跳转到首页，这里不需要手动跳转
  } catch (error_: any) {
    const errorMsg = error_?.msg || error_?.message || $t('orgIotClient.auth.loginFailedRetry');
    error.value = errorMsg;
    notifyRequestError(error_, () => $t('orgIotClient.auth.loginFailedWithMsg', { msg: error_?.msg ? `: ${error_?.msg}` : '' }), (text) => message.error(text));

    // 清除 URL 参数
    // router.replace({ path: route.path, query: {} });

    // 5秒后跳转到登录页
    setTimeout(() => {
      router.push(resolveAuthPath(route, 'login'));
    }, 5000);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center p-4">
    <Title>
      <template #default>{{ $t('authentication.wechatLogin') }}</template>
      <template #desc>
        <span class="text-muted-foreground">{{ $t('orgIotClient.auth.processingLogin') }}</span>
      </template>
    </Title>

    <div class="mt-8 flex flex-col items-center gap-4">
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <div class="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <p class="text-muted-foreground">{{ $t('orgIotClient.auth.verifyingLogin') }}</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <div class="text-destructive text-center">
          <p class="mb-2 text-lg font-semibold">{{ $t('orgIotClient.auth.loginFailed') }}</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <p class="text-muted-foreground text-sm">{{ $t('orgIotClient.auth.redirectingToLogin') }}</p>
      </div>
    </div>
  </div>
</template>
