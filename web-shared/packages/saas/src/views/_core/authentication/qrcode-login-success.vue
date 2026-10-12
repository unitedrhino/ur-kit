<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/** 微信扫码登录回调结果页：固定提示随当前语言显示。 */
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@vben/locales';
import { useAuthStore } from '../../../store';
import { useMessage } from 'naive-ui';
import Title from './auth-title.vue';
import { CoreApi } from '@vben/api';

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
    message.error($t('orgIotClient.auth.loginFailedWithMsg', { msg: `: ${error.value}` }));
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
    return;
  }

  // 调用登录 API
  try {
    error.value = '';

    await authStore.authLogin({
      loginType: CoreApi.UserLoginReqLoginTypeEnum.WX_OPEN,
      code: code,
      // isSsl: 2,
      codeID: state,
    });

    // message.success('登录成功');
    // authStore.authLogin 内部会自动跳转到首页，这里不需要手动跳转
  } catch (err: any) {
    const errorMsg = err?.msg || err?.message || $t('orgIotClient.auth.loginFailedRetry');
    error.value = errorMsg;
    notifyRequestError(err, () => $t('orgIotClient.auth.loginFailedWithMsg', { msg: err?.msg ? `: ${err?.msg}` : '' }), (text) => message.error(text));

    // 清除 URL 参数
    //router.replace({ path: route.path, query: {} });

    // 5秒后跳转到登录页
    setTimeout(() => {
      router.push('/auth/login');
    }, 5000);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <Title>
      <template #default>{{ $t('authentication.wechatLogin') }}</template>
      <template #desc>
        <span class="text-muted-foreground">{{ $t('orgIotClient.auth.processingLogin') }}</span>
      </template>
    </Title>

    <div class="mt-8 flex flex-col items-center gap-4">
      <div v-if="loading" class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="text-muted-foreground">{{ $t('orgIotClient.auth.verifyingLogin') }}</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center gap-4">
        <div class="text-destructive text-center">
          <p class="text-lg font-semibold mb-2">{{ $t('orgIotClient.auth.loginFailed') }}</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <p class="text-muted-foreground text-sm">{{ $t('orgIotClient.auth.redirectingToLogin') }}</p>
      </div>
    </div>
  </div>
</template>
