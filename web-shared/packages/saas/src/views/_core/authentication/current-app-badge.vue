<script lang="ts" setup>
import type { CoreApi } from '@vben/api';

import { computed, onMounted, ref } from 'vue';

import { useAppInfoStore } from '../../../store';

import { getCurrentAppEnv, resolveCurrentAppDisplayName } from './current-app';

defineOptions({ name: 'CurrentAppBadge' });

const appInfoStore = useAppInfoStore();
const currentAppEnv = getCurrentAppEnv();
const appInfo = ref<Pick<CoreApi.AppInfo, 'name'> | null>(null);

const displayName = computed(() => resolveCurrentAppDisplayName(appInfo.value, currentAppEnv));

onMounted(async () => {
  const appId = currentAppEnv.appId?.trim();
  if (!appId) return;

  try {
    appInfo.value = await appInfoStore.getAppInfo(appId);
  } catch {
    // 应用名只是登录页辅助标识，接口失败时保留环境变量兜底，避免干扰登录。
  }
});
</script>

<template>
  <span class="whitespace-nowrap" aria-label="当前应用">｜ {{ displayName }}</span>
</template>
