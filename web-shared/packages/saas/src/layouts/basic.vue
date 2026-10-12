<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen } from '@vben/layouts';
import HelpCenterButton from '../help-center/HelpCenterButton.vue';
import SaasNotification from '../widgets/notification/SaasNotification.vue';
import SceneAiGlobalDrawer from '../widgets/SceneAiGlobalDrawer.vue';
import { preferences, updatePreferences } from '@vben/preferences';
import { translatePresetAppName } from '../utils/app-catalog-i18n';
import { $t } from '../locales';
import { useAccessStore, useUserStore, useProjectStore } from '@vben/stores';

import { getAvatarUrl } from '../utils';
import { useNotifications } from '../hooks/use-notifications';
import { useSystemConfigStore } from '@vben/stores';

import { useAuthStore } from '../store';
import { useAppInfoStore } from '../store';
import LoginForm from '../views/_core/authentication/login.vue';
import HeaderLogo from '../components/header-logo.vue';
import HeaderUserAppList from '../components/HeaderUserAppList.vue';
import HeaderUserMiniProgramLaunchModal from '../components/HeaderUserMiniProgramLaunchModal.vue';
import WsToaster from '../components/WsToaster.vue';
import NotifyBannerBar from '../components/NotifyBannerBar.vue';
import NotifyModal from '../components/NotifyModal.vue';
import type { MiniProgramLaunchInfo } from '../components/HeaderUserMiniProgramLaunchModal.vue';
import { AiChatFloat } from '../components/ai-chat';
import ServerErrorOverlay from '../components/ServerErrorOverlay.vue';
import SidebarProjectSelector from '../components/SidebarProjectSelector.vue';
import ProjectSelectModal from '../components/ProjectSelectModal.vue';

import { ORG_ID_KEY } from '../constants';
import { message } from '../adapter/naive';
import { getAppOpenUrl, getBackToConsoleUrl } from '../utils';
import { SaasUserDropdown, UserDropdown } from '../widgets/user-dropdown';

import { useCookies } from '@vueuse/integrations/useCookies';

import type { CoreApi } from '@vben/api';

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
  void preferences.app.locale;
  const isTenantOwner = userStore.userInfo?.tenants?.find((tenant: any) => tenant.tenantCode === orgID.value)?.isTenantOwner;

  // console.log("isTenantOwner========",isTenantOwner);

  return isTenantOwner == 1 ? $t('orgIotClient.admin') : $t('orgIotClient.regularUser');
});

/** 头部用户下拉是否展示「切换企业」：物联网等壳子应用即使 AppInfo.tenantCode 为 platform 也需切换组织 */
const organizationSwitcherMode = computed<'always' | 'auto' | 'never'>(() => {
  const env = import.meta.env.VITE_GLOB_ORG_SWITCHER as string | undefined;
  if (env === 'always' || env === 'never') {
    return env;
  }
  const appName = import.meta.env.VITE_GLOB_APPNAME as string | undefined;
  if (appName === 'platform-manage') {
    return 'never';
  }
  if (appName === 'iot') {
    return 'always';
  }
  return 'auto';
});

function getUserCreatedTime() {
  return (new Date(parseInt(userStore.userInfo?.createdTime)).toLocaleDateString()) || '';
}
const userCreatedTimeText = computed(() => {
  const createdTime = userStore.userInfo?.email || userStore.userInfo?.phone || getUserCreatedTime();

  return createdTime;
});

const description = computed(() => {
  // console.log("orgID.value========",orgID.value);
  // console.log("userStore.userInfo?.tenants========",userStore.userInfo?.tenants);

  const orgName = userStore.userInfo?.tenants?.find((tenant: any) => tenant.tenantCode === orgID.value)?.tenant?.name;
  // console.log("orgName========",orgName);
  return orgName || '';
});

const orgAvatar = computed(() => {
  const orgAvatar = getAvatarUrl(userStore.userInfo?.tenants?.find((tenant: any) => tenant.tenantCode === orgID.value)?.tenant?.avatar ?? '');
  return orgAvatar;
});

const appLogo = ref<string>('');
// 预置应用名称在切换语言时按当前偏好重新计算，管理员自定义名称保持原样。
const appName = computed(() => {
  void preferences.app.locale;
  const info = appInfo.value;
  return info ? (translatePresetAppName(String(info.id ?? ''), info.name) ?? info.name ?? '') : '';
});
const miniProgramLaunchOpen = ref(false);
const miniProgramLaunchPayload = ref<MiniProgramLaunchInfo | null>(null);

const appInfo = ref<CoreApi.AppInfo>();

/** 是否显示返回工作台入口，未配置时保持共享布局原有行为。 */
const headerBackEnabled = import.meta.env.VITE_GLOB_HEADER_BACK_ENABLED !== 'false';
/** 是否显示应用切换菜单，未配置时保持共享布局原有行为。 */
const appSwitcherEnabled = import.meta.env.VITE_GLOB_APP_SWITCHER_ENABLED !== 'false';

function handleOpenMiniProgramLaunch(payload: MiniProgramLaunchInfo) {
  miniProgramLaunchPayload.value = payload;
  miniProgramLaunchOpen.value = true;
}

const menus = computed(() => [
  {
    handler: () => {

      const appOpenUrl = getAppOpenUrl('/app/console/')
      // console.log("appOpenUrl========",appOpenUrl);
      // if(appOpenUrl) {
      //   window.open(appOpenUrl, '_blank');
      // }
      //router.push('/system/user/info/read');
      //不使用路由 使用 win自带的
      if(appOpenUrl) {
        //判断 appOpenUrl 是否为 /app/console/ 还是 http://localhost:3000
        // 1. /app/console/ 则 需要加 # 生产 hash 路由 /user/settings
        // 2. http://localhost:3000 /user/settings

        const hashUrl = appOpenUrl.includes('/app/console/') ? '#/user/settings' : '/user/settings';
        window.location.href = appOpenUrl + hashUrl;

      } else {
        message.error('应用未查询到');
      }
    },
    icon: "carbon:user-avatar-filled",
    text: $t('console.layout.personalSettings'),
  }
]);

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
    appInfo.value = res;

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
      <HeaderLogo
        :app-logo="appLogo"
        :app-name="appName"
        :show-app-menu="appSwitcherEnabled"
        :show-back="headerBackEnabled"
      >
        <template #app-menu>
          <HeaderUserAppList @open-mini-program-launch="handleOpenMiniProgramLaunch" />
        </template>
      </HeaderLogo>
    </template>
    <!-- 自定义头部左侧插槽 -->
    <template #user-dropdown>
      <UserDropdown
      :app-info="appInfo"
      :organization-switcher-mode="organizationSwitcherMode"
      :org-id="orgID || ''"
      :org-avatar="orgAvatar"
      :org-name="description"
      :avatar="avatar" :menus="menus" :text="nickName" :description="userCreatedTimeText" :tag-text="tagText"
        @logout="handleLogout" />
    </template>
    <template #notification>
      <SaasNotification :dot="showDot" :notifications="notifications" :muted="muted"
        @clear="handleNoticeClear" @make-all="handleMakeAll"
        @view-all="handleViewAll" @read="handleMarkAsRead" @toggle-mute="toggleMute"
        @remove="removeOne" />
    </template>
    <!-- 帮助中心入口：应用未注册帮助内容（setHelpCenterContent）时不渲染，index 95 位于通知(100)之前 -->
    <template #header-right-95>
      <HelpCenterButton />
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
      <SaasUserDropdown :avatar="avatar" :nick-name="nickName" :description="description" :on-logout="handleLogout" v-if="false"/>
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
  <!-- 微信小程序弹窗 -->
  <HeaderUserMiniProgramLaunchModal v-model="miniProgramLaunchOpen" :payload="miniProgramLaunchPayload" />
  <!-- 服务端 5xx 错误全屏蒙层，不改变当前 URL -->
  <ServerErrorOverlay />
  <!-- 项目选择弹窗（侧边栏项目选择器启用时） -->
  <ProjectSelectModal v-if="sidebarSelectorActive" />
  <!-- AI 场景助手抽屉（从浏览器最右侧滑入，响应式） -->
  <SceneAiGlobalDrawer />
</template>
