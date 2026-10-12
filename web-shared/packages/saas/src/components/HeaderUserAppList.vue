<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';
import { $t } from '@vben/locales';

import { computed, defineEmits, onMounted, ref } from 'vue';

import { CoreApi } from '@vben/api';
import { VbenAvatar, VbenIcon } from '@vben-core/shadcn-ui';
import { SvgWeChatIcon } from '@vben/icons';

import { message } from '../adapter/naive';
import { APP_LIST_EXCLUDE_APP_ID } from '../constants';
import { useSessionStore } from '../store/session';
import { getAvatarUrl, isOrgIotClientAppUrl, openAppInCurrentTab, openAppInNewTab } from '../utils/utils';
import type { MiniProgramLaunchInfo } from './HeaderUserMiniProgramLaunchModal.vue';

defineOptions({
  name: 'HeaderUserAppList',
});

type UserAppRow = NonNullable<Awaited<ReturnType<typeof CoreApi.postApiV1SystemUserSelfAppGetList>>['list']>[number];

const loading = ref(true);
const loadError = ref(false);
const userAppsRaw = ref<UserAppRow[]>([]);
const sessionStore = useSessionStore();
const currentTenantCode = computed(() => sessionStore.tenantCode);
const emit = defineEmits<{
  /** 打开微信小程序弹窗 */
  'open-mini-program-launch': [value: MiniProgramLaunchInfo];
}>();

const currentAppId = import.meta.env.VITE_GLOB_APPID as string;

/** 当前应用排在列表最前，其余保持接口顺序 */
const userApps = computed(() => {
  const list = userAppsRaw.value;
  const current = list.find((x) => x.appID === currentAppId);
  const rest = list.filter((x) => x.appID !== currentAppId);
  return current ? [current, ...rest] : list;
});

async function loadList() {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await CoreApi.postApiV1SystemUserSelfAppGetList({
      notAppID: APP_LIST_EXCLUDE_APP_ID,
    });
    userAppsRaw.value = res?.list ?? [];
  } catch (requestError) {
    loadError.value = true;
    notifyRequestError(requestError, () => $t('console.actions.loadAppListFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

/**
 * 判断是否为微信小程序。
 */
function isWechatMiniProgramApp(row: UserAppRow): boolean {
  const appType = row.app?.type;
  const appSubType = row.app?.subType;
  return appType === 'mini' && appSubType === 'wx';
}

/**
 * 打开微信小程序二维码弹窗。
 */
function openWechatMiniProgram(row: UserAppRow) {
  const appID = row.app?.id || row.appID;

  if (!appID) {
    message.error('未获取到应用 ID');
    return;
  }

  emit('open-mini-program-launch', {
    appID,
    appName: row.app?.name,
    orgId: currentTenantCode.value,
  });
}

/**
 * 打开应用（支持小程序弹窗 + org-iot-client 新标签 + tenantCode）。
 */
function openApp(row: UserAppRow) {
  if (isWechatMiniProgramApp(row)) {
    openWechatMiniProgram(row);
    return;
  }

  const url = row.app?.url;
  if (!url) {
    message.error('应用未查询到');
    return;
  }

  const isOrgIotClient = isOrgIotClientAppUrl(url);
  const targetOpen = isOrgIotClient ? openAppInNewTab : openAppInCurrentTab;
  const query = isOrgIotClient && currentTenantCode.value
    ? { tenantCode: currentTenantCode.value }
    : undefined;

  if (!targetOpen(url, query)) {
    message.error('应用未查询到');
  }
}

onMounted(() => {
  loadList();
});
</script>

<template>
  <div class="text-sm">
    <div v-if="loading" class="text-muted-foreground flex items-center justify-center gap-2 px-1 py-5">
      <VbenIcon icon="lucide:loader-2" class="size-5 shrink-0 animate-spin" aria-hidden="true" />
      <span>加载中…</span>
    </div>
    <div v-else-if="loadError" class="text-muted-foreground flex flex-col items-center gap-2 px-1 py-3">
      <span>加载失败</span>
      <button type="button" class="text-primary text-xs underline-offset-2 hover:underline" @click="loadList">重试</button>
    </div>
    <div v-else-if="userApps.length === 0" class="text-muted-foreground px-1 py-3 text-center">暂无可用应用</div>
    <ul v-else class="space-y-1 py-0.5" role="list">
      <li v-for="row in userApps" :key="row.id">
        <button
          type="button"
          class="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors"
          :class="{
            'bg-accent/60': row.appID === currentAppId,
          }"
          @click.stop.prevent="openApp(row)"
          @pointerdown.stop
        >
          <VbenAvatar :src="getAvatarUrl(row.app?.avatar)" :alt="row.app?.name" :size="32" fit="cover" class="shrink-0 rounded-sm" />
          <span class="min-w-0 flex-1 truncate font-medium">
            {{ row.app?.name || '未命名应用' }}
          </span>
          <span v-if="row.appID === currentAppId" class="text-muted-foreground shrink-0 text-xs">当前</span>
          <SvgWeChatIcon
            v-if="isWechatMiniProgramApp(row)"
            class="size-4 shrink-0 text-green-500 dark:text-green-400"
          />
          <VbenIcon
            v-else-if="isOrgIotClientAppUrl(row.app?.url || '')"
            icon="mdi:open-in-new"
            class="text-muted-foreground size-3.5 shrink-0 opacity-70"
            aria-hidden="true"
          />
          <VbenIcon
            v-else
            icon="mdi:link-variant"
            class="text-muted-foreground size-3.5 shrink-0 opacity-70"
            aria-hidden="true"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
