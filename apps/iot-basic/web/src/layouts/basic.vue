<!-- org-iot-client 独立基础布局：保留 SaaS 壳层能力，替换为客户端专用头部与用户下拉。 -->
<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { $t } from '@vben/locales';
import { translatePresetAppName } from '@vben/saas/utils';
import { BasicLayout, LockScreen } from '@vben/layouts';
import { preferences, updatePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore, useProjectStore } from '@vben/stores';

import { ORG_ID_KEY } from '@vben/saas/constants';
import { getAvatarUrl, getBackToConsoleUrl } from '@vben/saas/utils';
import { useAuthStore, useAppInfoStore } from '@vben/saas/store';
import { AiChatFloat } from '@vben/saas/ai-chat';
import { useSystemConfigStore } from '@vben/stores';

import HeaderLogo from '../components/header-logo-client.vue';
import UserDropdown from '../components/user-dropdown-client.vue';

import NotifyBannerBar from '../../../../../web-shared/packages/saas/src/components/NotifyBannerBar.vue';
import NotifyModal from '../../../../../web-shared/packages/saas/src/components/NotifyModal.vue';
import ProjectSelectModal from '../../../../../web-shared/packages/saas/src/components/ProjectSelectModal.vue';
import ServerErrorOverlay from '../../../../../web-shared/packages/saas/src/components/ServerErrorOverlay.vue';
import SidebarProjectSelector from '../../../../../web-shared/packages/saas/src/components/SidebarProjectSelector.vue';
import WsToaster from '../../../../../web-shared/packages/saas/src/components/WsToaster.vue';
import { useNotifications } from '../../../../../web-shared/packages/saas/src/hooks/use-notifications';
import LoginForm from '../../../../../web-shared/packages/saas/src/views/_core/authentication/login.vue';
import SaasNotification from '../../../../../web-shared/packages/saas/src/widgets/notification/SaasNotification.vue';
import SceneAiGlobalDrawer from '../../../../../web-shared/packages/saas/src/widgets/SceneAiGlobalDrawer.vue';

import { useCookies } from '@vueuse/integrations/useCookies';

const systemConfigStore = useSystemConfigStore();
const projectStore = useProjectStore();

const route = useRoute();

const cookies = useCookies([ORG_ID_KEY], { doNotParse: true });
const orgID = computed(() => cookies.get(ORG_ID_KEY));

// 侧边栏项目选择器是否在当前路由生效：
// - sidebarSelectorEnabled 为 false → 不显示
// - sidebarSelectorPathPrefix 为 null → 始终显示
// - sidebarSelectorPathPrefix 为字符串 → 仅当当前路径以该前缀开头才显示
const sidebarSelectorActive = computed(() => {
  if (!projectStore.sidebarSelectorEnabled) return false;
  const prefix = projectStore.sidebarSelectorPathPrefix;
  if (!prefix) return true;
  return route.path.startsWith(prefix);
});

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const appInfoStore = useAppInfoStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { notifications, showDot, muted, toggleMute, loadInitialMessages, markAsRead, markAllRead, removeOne, clearAll } = useNotifications();

const nickName = computed(() => {
  return userStore.userInfo?.nickName || userStore.userInfo?.userName;
});

const tagText = computed(() => {
  const isTenantOwner = userStore.userInfo?.tenants?.find((tenant: any) => tenant.tenantCode === orgID.value)?.isTenantOwner;

  // console.log("isTenantOwner========",isTenantOwner);

  return isTenantOwner == 1 ? $t('orgIotClient.layout.admin') : $t('orgIotClient.layout.regularUser');
});

function getUserCreatedTime() {
  return (new Date(parseInt(userStore.userInfo?.createdTime)).toLocaleDateString()) || '';
}
const userCreatedTimeText = computed(() => {
  const createdTime = userStore.userInfo?.email || userStore.userInfo?.phone || getUserCreatedTime();

  return createdTime;
});

const appLogo = ref<string>('');
const appName = ref<string>('');

const avatar = computed(() => {
  const raw = userStore.userInfo?.avatar;
  if (!raw) return '';
  // 已经是绝对 URL，直接返回
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  if (import.meta.env.MODE === 'development') {
    let baseUrl = import.meta.env.VITE_GLOB_API_URL;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl + raw;
  }
  return raw;
});

const layout = computed(() => {
  return route.meta.layout || preferences.app.layout;
});

const tabbarEnable = computed(() => {
  return route.meta.tabbarEnable === undefined ? preferences.tabbar.enable : route.meta.tabbarEnable;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  clearAll();
}

function handleMakeAll() {
  markAllRead();
}

function handleViewAll() {
  const url = getBackToConsoleUrl('/user/message');
  if (url) {
    window.location.href = url;
  }
}

watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);

function handleClickLogo() {

}


function handleMarkAsRead(clickItem: NotificationItem) {
  markAsRead(clickItem);
}

function handleUpdatePreferences() {

  if (!systemConfigStore.systemConfig?.oem?.avatar || !systemConfigStore.systemConfig?.oem?.title) {
    return;
  }

  updatePreferences({
    app: {
      name: systemConfigStore.systemConfig.oem.title,
    },
    logo: {
      source: getAvatarUrl(systemConfigStore.systemConfig.oem.avatar),
    },
  });
}

onMounted(() => {
  handleUpdatePreferences();
  loadInitialMessages();


  // console.log("app name ========",import.meta.env.VITE_GLOB_APPID);

  appInfoStore.getAppInfo(import.meta.env.VITE_GLOB_APPID).then((res) => {

    // console.log("res============= ",res);
    appLogo.value = getAvatarUrl(res.avatar || '');
    appName.value = res.name || '';
    // 预置应用名走目录翻译（未被平台管理员改写时按语言渲染）
    appName.value = translatePresetAppName(String(res.id ?? ''), res.name) ?? appName.value;
  });

});
</script>

<template>
  <BasicLayout
  :logo-source="appLogo"
  :logo-text="appName"
  :layout="layout"
  :tabbar-enable="tabbarEnable"
  @clear-preferences-and-logout="handleLogout" @click-logo="handleClickLogo">

    <!-- <template #header-menu>
      <div></div>
    </template> -->
    <template #header-logo>
      <HeaderLogo :app-logo="appLogo" :app-name="appName" />
    </template>
    <!-- 自定义头部左侧插槽 -->
    <template #user-dropdown>
      <UserDropdown
      :avatar="avatar" :text="nickName" :description="userCreatedTimeText" :tag-text="tagText"
        @logout="handleLogout" />
    </template>
    <template #notification>
      <SaasNotification :dot="showDot" :notifications="notifications" :muted="muted"
        @clear="handleNoticeClear" @make-all="handleMakeAll"
        @view-all="handleViewAll" @read="handleMarkAsRead" @toggle-mute="toggleMute"
        @remove="removeOne" />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal v-model:open="accessStore.loginExpired" :avatar>
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
    <!-- 滚动底部区域 -->
    <template #menu-bottom>
      <SidebarProjectSelector v-if="sidebarSelectorActive" />
    </template>
  </BasicLayout>

  <!-- WS 实时通知 toast，挂在布局外，fixed 定位不受 BasicLayout 影响 -->
  <WsToaster />
  <!-- 横幅通知栏，fixed 定位在头部下方 -->
  <NotifyBannerBar class="fixed top-[var(--vben-header-height,48px)] left-0 right-0 z-[999]" />
  <!-- 弹窗通知 -->
  <NotifyModal />
  <!-- AI 悬浮聊天按钮，fixed 定位，挂在布局外 -->
  <AiChatFloat />
  <!-- 服务端 5xx 错误全屏蒙层，不改变当前 URL -->
  <ServerErrorOverlay />
  <!-- 项目选择弹窗（侧边栏项目选择器启用时） -->
  <ProjectSelectModal v-if="sidebarSelectorActive" />
  <!-- AI 场景助手抽屉（从浏览器最右侧滑入，响应式） -->
  <SceneAiGlobalDrawer />
</template>
