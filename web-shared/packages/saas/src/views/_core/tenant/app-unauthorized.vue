<script setup lang="ts">
/** 应用无权限页：固定说明和操作按钮随当前语言显示。 */
import { useRouter } from 'vue-router';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Separator,
  VbenButton,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import { $t } from '../../../locales';
import { useAuthStore } from '../../../store/auth';

defineOptions({ name: 'AppUnauthorized' });

const router = useRouter();
const authStore = useAuthStore();

async function handleChooseTenant() {
  await router.push('/auth/tenant-choose');
}

async function handleBackToLogin() {
  await authStore.logout(false);
}
</script>

<template>
  <div class="flex w-full items-center justify-center">
    <Card class="w-full max-w-md border-none shadow-none">
      <CardHeader class="items-center pb-2 text-center">
        <!-- 图标容器 -->
        <div
          class="bg-destructive/10 mb-5 inline-flex items-center justify-center rounded-full p-5"
        >
          <VbenIcon
            icon="mdi:shield-lock-outline"
            class="text-destructive"
            width="56"
            height="56"
          />
        </div>
        <h2
          class="text-foreground text-2xl font-semibold leading-tight tracking-tight"
        >
          {{ $t('console.routes.appUnauthorized') }}
        </h2>
        <p class="text-muted-foreground mt-1.5 text-sm">
          {{ $t('authAccess.unauthorizedDescription') }}
        </p>
      </CardHeader>

      <CardContent class="px-6 pb-4 pt-2">
        <div
          class="bg-muted/50 flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
        >
          <VbenIcon
            icon="mdi:information-outline"
            class="text-muted-foreground mt-0.5 shrink-0"
            width="20"
            height="20"
          />
          <span class="text-muted-foreground leading-relaxed">
            {{ $t('authAccess.unauthorizedGuide') }}
          </span>
        </div>
      </CardContent>

      <CardFooter class="flex-col gap-3 px-6 pt-0">
        <Separator class="mb-1" />
        <VbenButton class="w-full" @click="handleChooseTenant">
          <VbenIcon icon="mdi:swap-horizontal" class="mr-2" width="18" height="18" />
          {{ $t('console.tenant.switchTitle') }}
        </VbenButton>
        <VbenButton variant="ghost" class="w-full" @click="handleBackToLogin">
          <VbenIcon icon="mdi:arrow-left" class="mr-2" width="18" height="18" />
          {{ $t('authAccess.backToLogin') }}
        </VbenButton>
      </CardFooter>
    </Card>
  </div>
</template>
