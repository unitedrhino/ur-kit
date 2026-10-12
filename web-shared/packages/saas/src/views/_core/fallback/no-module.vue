<!-- 无模块权限页面：系统固定文案随界面语言切换，查询参数保留调用方原文。 -->
<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Fallback } from '@vben/common-ui';
import { LogOut } from '@vben/icons';

import { VbenButton } from '@vben-core/shadcn-ui';

import { $t } from '../../../locales';
import { useAuthStore } from '../../../store';

defineOptions({ name: 'NoModule' });

const authStore = useAuthStore();
const route = useRoute();
/** 已知模块错误使用语言键；外部业务错误保留原值，不把任意文本当翻译键。 */
const errorMessage = computed(() => {
  const supplied = route.query.errorMessage as string;
  const known: Record<string, string> = {
    'orgManage.guard.noMenu': 'orgManage.guard.noMenu',
    'orgManage.guard.screenRouteNotFound': 'orgManage.guard.screenRouteNotFound',
    '该模块没有菜单': 'orgManage.guard.noMenu',
    '该模块配置了首页大屏菜单，但未找到对应的路由': 'orgManage.guard.screenRouteNotFound',
  };
  return known[supplied] ? $t(known[supplied]!) : supplied || $t('noModule.message');
});
/** 模块名为业务数据，不做前端翻译。 */
const moduleName = computed(() => (route.query.moduleName as string) || '');
/** 模块路径为业务数据，不做前端翻译。 */
const modulePath = computed(() => (route.query.modulePath as string) || '');

const logout = async () => {
  // 使用 authStore 的 logout 方法
  // 会自动清除 localStorage、sessionStorage 和所有 state
  await authStore.logout(false);
};
</script>

<template>
  <Fallback status="403">
    <template #title>
      <div class="mt-6 space-y-2">
        <h1 class="text-foreground text-3xl font-bold md:text-4xl lg:text-5xl">{{ $t('noModule.title') }}</h1>
      </div>
    </template>

    <template #describe>
      <div class="mx-auto mt-6 max-w-3xl space-y-8 px-4">
        <!-- 主要错误信息 -->
        <div class="text-center">
          <p class="text-muted-foreground text-base leading-relaxed md:text-lg">
            {{ errorMessage }}
          </p>
        </div>

        <!-- 详细信息卡片 -->
        <div v-if="moduleName || modulePath" class="bg-accent/30 border-border space-y-4 rounded-xl border p-6 shadow-sm md:p-8">
          <div class="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-wider md:text-sm">{{ $t('noModule.details') }}</div>

          <div v-if="moduleName" class="group">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span class="text-muted-foreground w-20 shrink-0 text-sm font-medium">{{ $t('noModule.moduleName') }}</span>
              <span class="text-foreground text-sm font-medium md:text-base">
                {{ moduleName }}
              </span>
            </div>
          </div>

          <div v-if="modulePath" class="border-border/50 group border-t pt-2">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
              <span class="text-muted-foreground w-20 shrink-0 text-sm font-medium">{{ $t('noModule.modulePath') }}</span>
              <code class="text-foreground bg-muted/50 flex-1 break-all rounded-md px-3 py-2 font-mono text-xs md:text-sm">
                {{ modulePath }}
              </code>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #action>
      <div class="mt-8">
        <VbenButton size="lg" @click="logout">
          <LogOut class="mr-2 size-4" />
          {{ $t('noModule.logout') }}
        </VbenButton>
      </div>
    </template>
  </Fallback>
</template>
