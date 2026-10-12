<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { CoreApi } from '@vben/api';
import { $t } from '@vben/locales';
import { useAuthStore, useSessionStore } from '@vben/saas/store';

import { VbenButton } from '@vben-core/shadcn-ui';

import { useMessage } from 'naive-ui';

import { acceptPendingInviteAfterAuth } from './accept-invite';
import { resolveAuthPath, resolveHomePath } from './auth-paths';
import { savePendingInviteCode } from './invite-link';

defineOptions({ name: 'InviteAccept' });

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const sessionStore = useSessionStore();

const loading = ref(true);
const errorText = ref('');

const inviteCode = computed(() => {
  const code = route.query.code;
  return Array.isArray(code) ? code[0] || '' : code || '';
});

async function acceptInvite() {
  errorText.value = '';
  loading.value = true;

  try {
    await acceptPendingInviteAfterAuth({
      join: (payload) => CoreApi.postApiV1SystemUserSelfTenantJoin(payload),
      refreshSelfAppList: async () => {
        const result = await CoreApi.postApiV1SystemUserSelfAppGetList({});
        sessionStore.setSelfAppList(result?.list ?? []);
      },
      refreshUserInfo: () => authStore.fetchUserInfo(),
      setTenant: (tenantCode) => sessionStore.setTenant(tenantCode),
    });

    message.success($t('orgIotClient.auth.joinedOrg'));
    await router.replace(resolveHomePath(route));
  } catch (error: any) {
    errorText.value = error?.msg || error?.message || $t('orgIotClient.auth.inviteInvalid');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!inviteCode.value) {
    errorText.value = $t('orgIotClient.auth.inviteCodeMissing');
    loading.value = false;
    return;
  }

  savePendingInviteCode(inviteCode.value);

  if (!sessionStore.isAuthenticated) {
    await router.replace({
      path: resolveAuthPath(route, 'login'),
      query: { redirect: encodeURIComponent(route.fullPath) },
    });
    return;
  }

  await acceptInvite();
});
</script>

<template>
  <div class="mx-auto flex min-h-[360px] max-w-md flex-col items-center justify-center px-6 text-center">
    <template v-if="loading">
      <div class="text-lg font-medium">{{ $t('orgIotClient.auth.processingInvite') }}</div>
      <div class="text-muted-foreground mt-2 text-sm">{{ $t('orgIotClient.auth.pleaseWait') }}</div>
    </template>

    <template v-else-if="errorText">
      <div class="text-lg font-medium">{{ $t('orgIotClient.auth.cannotJoinOrg') }}</div>
      <div class="text-muted-foreground mt-2 text-sm">{{ errorText }}</div>
      <div class="mt-6 flex gap-3">
        <VbenButton variant="outline" @click="router.replace(resolveAuthPath(route, 'login'))">{{ $t('authentication.goToLogin') }}</VbenButton>
        <VbenButton @click="router.replace(resolveAuthPath(route, 'register'))">{{ $t('orgIotClient.auth.registerAccount') }}</VbenButton>
      </div>
    </template>
  </div>
</template>
