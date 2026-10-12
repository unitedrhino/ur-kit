<!-- 文件说明：五个 Web 应用共用的头像菜单，包含个人语言快捷切换与企业入口。 -->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { Component } from 'vue';

import type { AnyFunction } from '@vben/types';

import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useHoverToggle } from '@vben/hooks';
import { LogOut } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences, usePreferences } from '@vben/preferences';
import { isWindowsOs } from '@vben/utils';
import { SUPPORT_LANGUAGES } from '@vben/constants';

import { useVbenModal } from '@vben-core/popup-ui';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import { useMagicKeys, whenever } from '@vueuse/core';

import { OrgModal, InviteMemberModal } from '../org-modal';
import AddTenantModal from '../org-modal/add-tenant-modal.vue';
import JoinTenantModal from '../org-modal/join-tenant-modal.vue';

import { useCookies } from '@vueuse/integrations/useCookies';
import SaasAvatar from '../../components/saas-avatar.vue';
import { message } from '../../adapter/naive';
import { ORG_ID_KEY } from '../../constants';
import { useUserStore } from '@vben/stores';
import { useSessionStore } from '../../store/session';
import { getBackToConsoleUrl } from '../../utils';
import { savePersonalLanguage } from '../../locales';
import type { CoreApi } from '@vben/api';

import { Api } from './index.api';

interface Props {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * 应用信息
   */
  appInfo?: CoreApi.AppInfo;
  /**
   * @zh_CN 描述
   */
  description?: string;
  /**
   * 企业ID
   */
  orgId?: string;
  /**
   * 企业头像
   */
  orgAvatar?: string;

  /**
   * 企业名称
   */
  orgName?: string;
  /**
   * 头部下拉是否展示「切换企业」区块
   * - auto：应用 tenantCode 为 platform 时不展示（平台管理类）
   * - always：只要有企业列表就展示（物联网等业务壳，虽应用归属 platform 仍需切换组织）
   * - never：不展示
   */
  organizationSwitcherMode?: 'always' | 'auto' | 'never';
  /**
   * 企业管理设置页地址。传空字符串时不展示设置入口。
   */
  organizationSettingsPath?: string;
  /**
   * 是否启用快捷键
   */
  enableShortcutKey?: boolean;
  /**
   * 菜单数组
   */
  menus?: Array<{
    handler: AnyFunction;
    icon?: Component | Function | string;
    text: string;
  }>;

  /**
   * 标签文本
   */
  tagText?: string;
  /**
   * 文本
   */
  text?: string;
  /** 触发方式 */
  trigger?: 'both' | 'click' | 'hover';
  /** hover触发时，延迟响应的时间 */
  hoverDelay?: number;
}

defineOptions({
  name: 'UserDropdown',
});

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  appInfo: () => ({}),
  description: '',
  orgId: '',
  orgAvatar: '',
  orgName: '',
  organizationSwitcherMode: 'auto',
  organizationSettingsPath: getBackToConsoleUrl('/user/settings?tab=org'),
  enableShortcutKey: true,
  menus: () => [],
  showShortcutKey: true,
  tagText: '',
  text: '',
  trigger: 'click',
  hoverDelay: 500,
});

const emit = defineEmits<{ logout: [] }>();

const userStore = useUserStore();
const sessionStore = useSessionStore();
const cookies = useCookies([ORG_ID_KEY], { doNotParse: true });

/** 默认选项只用于菜单；服务端仍以空语言值表示按浏览器和平台默认值选择。 */
const AUTO_LANGUAGE = 'auto';
/** savingLanguage 阻止一次保存未结束时再次提交头像菜单选择。 */
const savingLanguage = ref(false);
/** selectedPersonalLanguage 展示个人显式偏好，空值对应默认选项而不是当前生效语言。 */
const selectedPersonalLanguage = computed(() => userStore.userInfo?.language || AUTO_LANGUAGE);

/** handleLanguageChange 保存头像菜单中的个人语言选择，失败时保留原勾选及界面语言。 */
async function handleLanguageChange(value: string) {
  if (savingLanguage.value || value === selectedPersonalLanguage.value) return;
  savingLanguage.value = true;
  try {
    await savePersonalLanguage(value === AUTO_LANGUAGE ? '' : value);
    message.success($t('systemLanguage.saved'));
  } catch (error) {
    console.error($t('orgWidgets.ui.personalLanguageSwitchingFailed'), error);
    notifyRequestError(error, () => $t('systemLanguage.saveFailed'), (text) => message.error(text));
  } finally {
    savingLanguage.value = false;
  }
}

// 添加企业模态框引用
const addTenantModalRef = ref<InstanceType<typeof AddTenantModal>>();
// 加入企业模态框引用
const joinTenantModalRef = ref<InstanceType<typeof JoinTenantModal>>();

const { globalLockScreenShortcutKey, globalLogoutShortcutKey } = usePreferences();
const [OrgModelComponent, lockModalApi] = useVbenModal({
  connectedComponent: OrgModal,
  destroyOnClose: true,
});
const [InviteMemberModalComponent, inviteMemberModalApi] = useVbenModal({
  connectedComponent: InviteMemberModal,
  destroyOnClose: true,
});
const [LogoutModal, logoutModalApi] = useVbenModal({
  onConfirm() {
    handleSubmitLogout();
  },
});

const refTrigger = useTemplateRef('refTrigger');
const refContent = useTemplateRef('refContent');
const [openPopover, hoverWatcher] = useHoverToggle([refTrigger, refContent], () => props.hoverDelay);

watch(
  () => props.trigger === 'hover' || props.trigger === 'both',
  (val) => {
    if (val) {
      hoverWatcher.enable();
    } else {
      hoverWatcher.disable();
    }
  },
  {
    immediate: true,
  },
);

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));

const enableLogoutShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLogoutShortcutKey.value;
});

const enableLockScreenShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLockScreenShortcutKey.value;
});

const enableShortcutKey = computed(() => {
  return props.enableShortcutKey && preferences.shortcutKeys.enable;
});

// 企业列表
const tenants = ref<CoreApi.UserTenant[]>([]);
// 加载状态
const tenantsLoading = ref(false);
const switchingTenantCode = ref('');

function buildSelfAppEntries(userTenants: CoreApi.UserTenant[]) {
  const entries: Array<{ appID: string; tenantCode?: string }> = [];
  for (const tenant of userTenants) {
    const appIDs = tenant.tenant?.appIDs as Array<string | number> | undefined;
    if (Array.isArray(appIDs)) {
      for (const id of appIDs) {
        entries.push({ appID: String(id), tenantCode: tenant.tenantCode });
      }
    }
  }
  return entries;
}

// 从最新用户信息同步企业列表，覆盖组件挂载时接口返回空列表的旧状态
function syncTenantsFromUserInfo(userTenants: CoreApi.UserTenant[] | undefined) {
  if (!Array.isArray(userTenants) || userTenants.length === 0) {
    return;
  }

  tenants.value = [...userTenants];

  const entries = buildSelfAppEntries(userTenants);
  if (entries.length > 0) {
    sessionStore.setSelfAppList(entries);
  }
}

// 获取企业列表
async function fetchTenantList() {
  const userID = userStore.userInfo?.userID;
  if (!userID) {
    return;
  }

  try {
    tenantsLoading.value = true;
    const result = await Api.getTenantList();
    const list = result?.list || [];
    if (list.length > 0 || !userStore.userInfo?.tenants?.length) {
      tenants.value = list;
    } else {
      syncTenantsFromUserInfo(userStore.userInfo.tenants as CoreApi.UserTenant[]);
    }
  } catch (error) {
    console.error($t('orgWidgets.ui.failedToObtainEnterpriseList'), error);
    if (userStore.userInfo?.tenants?.length) {
      syncTenantsFromUserInfo(userStore.userInfo.tenants as CoreApi.UserTenant[]);
    } else {
      tenants.value = [];
    }
  } finally {
    tenantsLoading.value = false;
  }
}

// 排序后的企业列表：当前选中的置顶
const sortedTenants = computed(() => {
  const currentCode = currentTenantCode.value;
  return [...tenants.value].sort((a, b) => {
    if (a.tenantCode === currentCode) return -1;
    if (b.tenantCode === currentCode) return 1;
    return 0;
  });
});

const showOrganizationSection = computed(() => {
  switch (props.organizationSwitcherMode) {
    case 'never': {
      return false;
    }
    case 'always': {
      return true;
    }
    default: {
      return props.appInfo?.tenantCode !== 'platform';
    }
  }
});

// 当前选中的企业编码
const currentTenantCode = computed(() => {
  return cookies.get(ORG_ID_KEY);
});

// 获取企业状态标签列表
function getTenantBadges(tenant: CoreApi.UserTenant) {
  const badges: { text: string; class: string }[] = [];

  // 平台标签
  if (tenant.tenantCode === 'platform') {
    badges.push({
      text: $t('orgWidgets.ui.platform'),
      class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    });
  }

  // 状态标签
  if (tenant?.status === 1) {
    badges.push({
      text: $t('orgWidgets.ui.enabled'),
      class: 'bg-green-500/10 text-green-600 dark:text-green-400',
    });
  } else if (tenant?.status === 2) {
    badges.push({
      text: $t('orgWidgets.ui.disabled'),
      class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    });
  }

  return badges;
}

function isTenantSelected(tenant: CoreApi.UserTenant) {
  return tenant.tenantCode === currentTenantCode.value;
}

function getTenantRowKey(tenant: CoreApi.UserTenant, index: number) {
  return tenant.tenantCode || tenant.tenant?.code || tenant.tenant?.id || `tenant-${index}`;
}

// 处理选择企业
async function handleSelectTenant(tenant: CoreApi.UserTenant) {
  const tenantCode = tenant.tenantCode;
  if (!tenantCode) return;

  // 如果选择的是当前企业，不做任何操作
  if (tenantCode === currentTenantCode.value) {
    openPopover.value = false;
    return;
  }

  if (switchingTenantCode.value) return;
  switchingTenantCode.value = tenantCode;

  const appId = import.meta.env.VITE_GLOB_APPID as string;
  try {
    const authorized = appId ? await sessionStore.verifySelfAppAccess(tenantCode, appId) : true;
    if (!authorized) {
      message.warning($t('orgWidgets.ui.theEnterpriseHasNotActivatedThisApplicationAndCa'));
      return;
    }

    // 先关闭下拉菜单
    openPopover.value = false;

    // 写入新企业编码到 cookie
    sessionStore.setTenant(tenantCode);

    // 延迟刷新，等下拉菜单关闭动画完成后再 reload
    setTimeout(() => window.location.reload(), 150);
  } catch (error) {
    console.error($t('orgWidgets.ui.enterpriseSwitchingPermissionVerificationFailed'), error);
    notifyRequestError(error, () => $t('orgWidgets.ui.enterpriseSwitchingVerificationFailedPleaseTryAg'), (text) => message.error(text));
  } finally {
    switchingTenantCode.value = '';
  }
}

// 打开加入企业模态框
function handleOpenJoinTenant() {
  joinTenantModalRef.value?.open();
  openPopover.value = false;
}

// 打开添加企业模态框（从加入企业弹窗中的链接触发）
function handleOpenAddTenant() {
  addTenantModalRef.value?.open();
}

// 处理添加/加入企业成功
async function handleTenantSuccess() {
  // 刷新企业列表
  await fetchTenantList();
  // 刷新页面以加载新的企业数据
  window.location.reload();
}

function handleOpenLock() {
  lockModalApi.open();
  openPopover.value = false;
}

function handleOpenInvite() {
  inviteMemberModalApi.open();
  openPopover.value = false;
}

function handleOpenOrganizationSettings() {
  openPopover.value = false;
}

function handleSubmitLock(_tenantCode: string) {
  // 企业切换逻辑已在 OrgModal 组件内部处理（设置 cookie、重置权限状态和跳转）
  // 路由守卫会自动重新加载用户信息和菜单
}

function handleLogout() {
  // emit
  logoutModalApi.open();
  openPopover.value = false;
}

function handleSubmitLogout() {
  emit('logout');
  logoutModalApi.close();
}

watch(
  () => userStore.userInfo?.tenants,
  (userTenants) => {
    syncTenantsFromUserInfo(userTenants as CoreApi.UserTenant[] | undefined);
  },
  {
    deep: true,
    immediate: true,
  },
);

// 组件挂载时获取企业列表，并兜底构建 selfAppList 缓存
onMounted(() => {
  fetchTenantList();

  // 若 selfAppList 未加载（刷新后 session 恢复但未走登录流程），
  // 从 userStore.userInfo.tenants 重新构建缓存
  if (sessionStore.selfAppList === null) {
    const allTenants = (userStore.userInfo?.tenants ?? []) as CoreApi.UserTenant[];
    const entries = buildSelfAppEntries(allTenants);
    if (entries.length > 0) {
      sessionStore.setSelfAppList(entries);
    }
  }
});

if (enableShortcutKey.value) {
  const keys = useMagicKeys();
  whenever(keys['Alt+KeyQ']!, () => {
    if (enableLogoutShortcutKey.value) {
      handleLogout();
    }
  });

  whenever(keys['Alt+KeyL']!, () => {
    if (enableLockScreenShortcutKey.value) {
      handleOpenLock();
    }
  });
}
</script>

<template>
  <OrgModelComponent @submit="handleSubmitLock" />
  <InviteMemberModalComponent />
  <AddTenantModal ref="addTenantModalRef" @success="handleTenantSuccess" />
  <JoinTenantModal ref="joinTenantModalRef" @success="handleTenantSuccess" @open-add-tenant="handleOpenAddTenant" />

  <LogoutModal :cancel-text="$t('common.cancel')" :confirm-text="$t('common.confirm')" :fullscreen-button="false"
    :title="$t('common.prompt')" centered content-class="px-8 min-h-10" footer-class="border-none mb-3 mr-3"
    header-class="border-none">
    {{ $t('ui.widgets.logoutTip') }}
  </LogoutModal>

  <DropdownMenu v-model:open="openPopover">
    <DropdownMenuTrigger ref="refTrigger" :disabled="props.trigger === 'hover'">
      <div class="hover:bg-accent ml-1 mr-2 cursor-pointer rounded-full p-1.5">
        <div class="hover:text-accent-foreground flex-center">
          <SaasAvatar :avatar="avatar" :name="text" :size="32" class="rounded-full" />
        </div>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-2 w-[320px] max-w-[calc(100vw-1rem)] p-0 pb-2">
      <div ref="refContent">
        <!-- 用户信息区域 -->
        <div class="px-3 pt-3 pb-2">
          <div class="flex items-center gap-3">
            <SaasAvatar :avatar="avatar" :name="text" :size="40" class="rounded-full" />
            <div class="flex-1 min-w-0">
              <div v-if="tagText || text || $slots.tagText"
                class="text-foreground mb-0.5 flex items-center text-sm font-medium">
                <span class="truncate">{{ text }}</span>
                <slot name="tagText">
                  <Badge v-if="tagText" class="ml-2 flex-shrink-0 text-green-400">
                    {{ tagText }}
                  </Badge>
                </slot>
              </div>
              <div class="text-muted-foreground truncate text-xs font-normal">
                {{ description }}
              </div>
            </div>
          </div>
        </div>

      <!-- 分隔线 -->
      <DropdownMenuSeparator v-if="showOrganizationSection" />

      <!-- 企业列表区域 -->
      <div class="px-3 py-2" v-if="showOrganizationSection">
        <div class="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide">
          <div class="flex items-center gap-1.5">
            <span>{{ $t('orgWidgets.ui.organization') }}</span>
            <a
              v-if="organizationSettingsPath"
              :href="organizationSettingsPath"
              class="text-muted-foreground flex size-5 items-center justify-center rounded-sm transition-colors hover:bg-accent hover:text-foreground"
              :title="$t('orgWidgets.ui.organizationSettings')"
              @click.stop="handleOpenOrganizationSettings"
            >
              <VbenIcon icon="lucide:settings" class="size-3.5" />
            </a>
          </div>
          <span
            class="text-foreground flex cursor-pointer items-center gap-1.5 transition-all duration-200 hover:brightness-75"
            @click="handleOpenInvite"
          >
            <VbenIcon icon="lucide:user-plus" class="size-3.5" />
            <span>{{ $t('orgWidgets.ui.inviteMembers') }}</span>
          </span>
        </div>
        <!-- 企业列表 -->
        <div class="max-h-[300px] space-y-1 overflow-y-auto">
          <div
            v-for="(tenant, index) in sortedTenants"
            :key="getTenantRowKey(tenant, index)"
            class="group relative flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
            @click="handleSelectTenant(tenant)"
          >
            <!-- 选中态 -->
            <div class="flex size-4 flex-shrink-0 items-center justify-center rounded-sm border border-border">
              <VbenIcon
                v-if="isTenantSelected(tenant)"
                icon="lucide:check"
                class="text-primary size-3"
              />
            </div>

            <!-- 企业头像 -->
            <SaasAvatar
              :avatar="tenant.tenant?.avatar"
              :name="tenant.tenant?.name"
              :size="32"
              class="flex-shrink-0 rounded-full"
            />

            <!-- 企业信息 -->
            <div class="min-w-0 flex-1">
              <div class="text-foreground flex items-center gap-2 text-sm font-medium">
                <span class="truncate">{{ tenant.tenant?.name || $t('orgWidgets.ui.unnamedOrganization') }}</span>
              </div>
            </div>

            <!-- 右侧状态标签 -->
            <div class="flex flex-shrink-0 gap-1">
              <Badge
                v-for="(badge, bIdx) in getTenantBadges(tenant)"
                :key="bIdx"
                :class="badge.class"
                class="text-xs font-medium"
              >
                {{ badge.text }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- 加入企业入口 -->
        <div
          class="mt-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          @click="handleOpenJoinTenant"
        >
          <VbenIcon icon="lucide:plus" class="size-4" />
          <span>{{ $t('orgWidgets.ui.joinOrganization') }}</span>
        </div>
      </div>

      <!-- 分隔线 -->
      <DropdownMenuSeparator />

      <!-- 菜单项 -->
      <DropdownMenuItem
        v-for="(menu, index) in menus"
        :key="index"
        class="mx-1 flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm"
        @click="menu.handler">
        <VbenIcon :icon="menu.icon" class="mr-2 size-4" />
        <span>{{ menu.text }}</span>
      </DropdownMenuItem>

      <!-- 个人语言在头像菜单就地切换，不修改平台默认语言。 -->
      <DropdownMenuSub>
        <DropdownMenuSubTrigger class="mx-1 flex items-center rounded-sm px-2 py-2 text-sm" :disabled="savingLanguage">
          <VbenIcon icon="lucide:languages" class="mr-2 size-4" />
          <span>{{ $t('systemLanguage.personal') }}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup :model-value="selectedPersonalLanguage" @update:model-value="handleLanguageChange">
              <DropdownMenuRadioItem :value="AUTO_LANGUAGE" :disabled="savingLanguage">
                {{ $t('systemLanguage.automatic') }}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                v-for="language in SUPPORT_LANGUAGES"
                :key="language.value"
                :value="language.value"
                :disabled="savingLanguage"
              >
                {{ language.label }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <!-- 分隔线 -->
      <DropdownMenuSeparator />

      <!-- 退出登录 -->
      <DropdownMenuItem
        class="mx-1 flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm"
        @click="handleLogout">
        <LogOut class="mr-2 size-4" />
        <span>{{ $t('common.logout') }}</span>
        <DropdownMenuShortcut v-if="enableLogoutShortcutKey" class="ml-auto">
          {{ altView }} Q
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
