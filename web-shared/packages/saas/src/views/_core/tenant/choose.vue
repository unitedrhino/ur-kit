<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/** 企业选择页：权限提示与空态随当前语言显示，企业名称保留业务原文。 */
import type { CoreApi } from '@vben/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenAvatar, VbenIcon } from '@vben-core/shadcn-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { message } from '../../../adapter/naive';
import { $t } from '../../../locales';
import { getAvatarUrl } from '../../../utils/utils';
import { useSessionStore } from '../../../store/session';
import { useAuthStore } from '../../../store/auth';

defineOptions({ name: 'TenantChoose' });

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const sessionStore = useSessionStore();

const selecting = ref(false);

const tenants = computed(() => {
  return (userStore.userInfo?.tenants || []) as CoreApi.UserTenant[];
});

const appId = import.meta.env.VITE_GLOB_APPID as string;

// 页面挂载时，如果 selfAppList 未加载（刷新后 session 恢复但未走登录流程），
// 从 userStore.userInfo.tenants 重新构建缓存
onMounted(() => {
  if (sessionStore.selfAppList === null) {
    const allTenants = (userStore.userInfo?.tenants ?? []) as CoreApi.UserTenant[];
    const entries: Array<{ appID: string; tenantCode?: string }> = [];
    for (const t of allTenants) {
      const appIDs = t.tenant?.appIDs as Array<string | number> | undefined;
      if (Array.isArray(appIDs)) {
        for (const id of appIDs) {
          entries.push({ appID: String(id), tenantCode: t.tenantCode });
        }
      }
    }
    if (entries.length > 0) {
      sessionStore.setSelfAppList(entries);
    }
  }
});

/** 判断某个企业是否有权限访问当前应用 */
function isAuthorized(_tenant: CoreApi.UserTenant): boolean {
  if (!appId) return true;
  // 本地 appIDs 可能是部分数据，点击时会用目标企业实时接口做最终校验。
  return true;
}

function getTenantColor(id: string | undefined): string {
  const colors = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
    '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  ];
  if (!id) return colors[0]!;
  const hash = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length]!;
}

function getTenantInitial(name: string | undefined): string {
  if (!name) return 'O';
  return name.charAt(0).toUpperCase();
}

/** 选择企业时校验目标应用权限，失败提示按当前语言显示。 */
async function handleSelectTenant(tenant: CoreApi.UserTenant) {
  const tenantCode = tenant.tenantCode;
  if (!tenantCode || selecting.value) return;

  selecting.value = true;
  try {
    const authorized = appId ? await sessionStore.verifySelfAppAccess(tenantCode, appId) : true;
    if (!authorized) {
      message.warning($t('authAccess.notEnabledForOrg'));
      return;
    }

    sessionStore.setTenant(tenantCode);
    // 选定租户后必须立即刷新用户信息：登录响应中的 tenants.roles 为空，
    // userRoles 需按当前租户重算，否则依赖 hasAccessByRoles 的按钮全部隐藏
    await authStore.fetchUserInfo().catch(() => {});
    const targetPath = preferences.app.defaultHomePath;
    await router.push(targetPath);
  } catch (error) {
    console.error('企业选择权限校验失败:', error);
    notifyRequestError(error, () => $t('authAccess.switchVerifyFailed'), (text) => message.error(text));
  } finally {
    selecting.value = false;
  }
}

async function handleBackToLogin() {
  await authStore.logout(false);
}
</script>

<template>
  <div>
    <!-- 标题区域：与 auth-title.vue 保持一致 -->
    <div class="mb-7 sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="text-foreground mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl">
        {{ $t('console.choose.title') }}
      </h2>
      <p class="text-muted-foreground lg:text-md text-sm">
        {{ $t('authAccess.chooseSubtitle') }}
      </p>
    </div>

    <!-- 企业列表 -->
    <div class="max-h-[400px] space-y-2 overflow-y-auto">
      <div
        v-for="tenant in tenants"
        :key="tenant.tenantCode"
        class="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200"
        :class="isAuthorized(tenant)
          ? 'cursor-pointer hover:border-primary/50 hover:bg-accent'
          : 'cursor-not-allowed opacity-50'"
        @click="handleSelectTenant(tenant)"
      >
        <!-- 头像 -->
        <VbenAvatar
          :src="getAvatarUrl(tenant.tenant?.avatar || '')"
          :size="40"
          class="flex-shrink-0"
          :style="{ borderRadius: '8px' }"
        >
          <template #fallback>
            <div
              class="flex size-full items-center justify-center text-sm font-medium text-white"
              :style="{ backgroundColor: getTenantColor(tenant.tenant?.id) }"
            >
              {{ getTenantInitial(tenant.tenant?.name) }}
            </div>
          </template>
        </VbenAvatar>

        <!-- 企业信息 -->
        <div class="min-w-0 flex-1">
          <div class="text-foreground mb-0.5 text-sm font-medium">
            {{ tenant.tenant?.name || $t('console.sidebar.unnamedOrg') }}
          </div>
          <div class="text-muted-foreground truncate text-xs">
            {{ tenant.tenant?.desc || $t('console.common.noDescription') }}
          </div>
        </div>

        <!-- 右侧：未开通标签 or 箭头 -->
        <template v-if="!isAuthorized(tenant)">
          <span class="text-muted-foreground flex-shrink-0 rounded border border-current px-1.5 py-0.5 text-xs">
            {{ $t('authAccess.notEnabled') }}
          </span>
        </template>
        <template v-else>
          <VbenIcon
            icon="mdi:chevron-right"
            class="text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            :size="20"
          />
        </template>
      </div>

      <!-- 空状态 -->
      <div
        v-if="tenants.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <VbenIcon icon="mdi:office-building-outline" class="text-muted-foreground mb-2" :size="48" />
        <div class="text-muted-foreground text-sm">{{ $t('authAccess.noAvailableOrganizations') }}</div>
      </div>
    </div>

    <!-- 底部返回登录 -->
    <div class="mt-4 text-center text-sm">
      <span class="vben-link text-sm font-normal" @click="handleBackToLogin">
        {{ $t('authAccess.backToLogin') }}
      </span>
    </div>
  </div>
</template>
