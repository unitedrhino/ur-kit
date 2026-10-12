<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

/** 第三方登录回调页：状态与缺参提示随当前语言显示。 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { $t } from '@vben/locales';
import { VbenButton } from '@vben-core/shadcn-ui';
import { useMessage, NSpin } from 'naive-ui';

import { useAuthStore } from '../../../store';
import { Api } from './index.api';

defineOptions({ name: 'ThirdLoginCallback' });

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref('');

const provider = computed(() => String(route.query.provider || ''));
const code = computed(() => String(route.query.code || ''));
const state = computed(() => String(route.query.state || ''));
const oauthError = computed(() => String(route.query.error || ''));

async function handleCallback() {
  if (oauthError.value) {
    errorMessage.value = oauthError.value;
    loading.value = false;
    return;
  }
  if (!provider.value || !code.value || !state.value) {
    errorMessage.value = $t('orgIotClient.auth.missingCallbackParams');
    loading.value = false;
    return;
  }
  try {
    const result = await Api.thirdLogin(provider.value as any, code.value, state.value, 'web');
    if (result.status === 'need_register_completion') {
      await router.replace({
        path: '/auth/third-login-complete',
        query: {
          pendingToken: result.pendingToken,
          provider: result.provider || provider.value,
        },
      });
      return;
    }
    if (!result.login) {
      throw new Error(result.message || $t('orgIotClient.auth.thirdLoginFailed'));
    }
    await authStore.authLoginWithResult(result.login);
  } catch (error: any) {
    errorMessage.value = error?.msg || error?.message || $t('orgIotClient.auth.thirdLoginFailed');
    notifyRequestError(error, () => errorMessage.value, (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void handleCallback();
});
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-foreground">{{ $t('orgIotClient.auth.completingLogin') }}</h2>
      <p class="mt-2 text-sm text-muted-foreground">{{ $t('orgIotClient.auth.verifyingThirdIdentity') }}</p>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <NSpin size="large" />
    </div>

    <div v-else-if="errorMessage" class="space-y-4 text-center">
      <p class="text-sm text-destructive">{{ errorMessage }}</p>
      <VbenButton class="w-full" @click="router.replace('/auth/login')">{{ $t('orgIotClient.auth.backToLogin') }}</VbenButton>
    </div>
  </div>
</template>
