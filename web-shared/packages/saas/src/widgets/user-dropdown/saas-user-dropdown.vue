<script setup lang="ts">
import { $t } from '@vben/saas/locales';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  Avatar,
  AvatarImage,
  AvatarFallback,
  VbenIcon,
  VbenIconButton,
} from '@vben-core/shadcn-ui';

defineOptions({
  name: 'SaasUserDropdown',
});

interface Props {
  /**
   * 头像 URL
   */
  avatar?: string;
  /**
   * 昵称
   */
  nickName?: string;
  /**
   * 描述信息
   */
  description?: string;
  /**
   * 点击头像区域的跳转路径
   */
  userInfoPath?: string;
  /**
   * 登出处理函数
   */
  onLogout?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  avatar: undefined,
  nickName: undefined,
  description: undefined,
  userInfoPath: '/system/user/info/read',
  onLogout: undefined,
});

const router = useRouter();
const userStore = useUserStore();

// 如果 props 中没有提供，则从 store 中获取
const computedAvatar = computed(() => {
  if (props.avatar !== undefined) {
    return props.avatar;
  }
  const raw = userStore.userInfo?.avatar;
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  // 从 store 获取头像逻辑
  if (import.meta.env.MODE === 'development') {
    let baseUrl = import.meta.env.VITE_GLOB_API_URL;
    if (baseUrl?.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl + raw;
  }
  return raw;
});

const computedNickName = computed(() => {
  return props.nickName ?? userStore.userInfo?.nickName ?? $t('orgWidgets.ui.user');
});

const computedDescription = computed(() => {
  return props.description ?? userStore.userInfo?.userID ?? '';
});

const isMobile = computed(() => preferences.sidebar.collapsed);

function handleUserInfoClick() {
  router.push(props.userInfoPath);
}

function handleLogout() {
  if (props.onLogout) {
    props.onLogout();
  }
}
</script>

<template>
  <div class="flex items-center gap-1.5 border-border border-t px-2 py-2" :class="preferences.sidebar.collapsed ? 'flex-col' : 'justify-between'">
    <div
      :class="[
        'flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors',
        preferences.sidebar.collapsed ? 'w-full justify-center' : 'flex-1 min-w-0',
      ]"
      @click="handleUserInfoClick"
    >
      <div class="flex items-center justify-center size-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
        <img v-if="computedAvatar" :src="computedAvatar" alt="avatar" class="size-full object-cover" />
        <VbenIcon v-else icon="carbon:user-avatar-filled" class="size-4" />
      </div>
      <div v-if="!preferences.sidebar.collapsed" class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate leading-tight">{{ computedNickName }}</div>
        <div class="text-xs text-muted-foreground truncate leading-tight">{{ computedDescription }}</div>
      </div>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger>
        <VbenIconButton
          :tooltip="preferences.sidebar.collapsed ? $t('orgWidgets.ui.settings') : ''"
          :class="[preferences.sidebar.collapsed ? 'w-full' : 'flex-shrink-0']"
          variant="ghost"
          size="icon"
        >
          <VbenIcon icon="tabler:dots-vertical" class="size-4" />
        </VbenIconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        class="min-w-56 rounded-lg"
        :side="isMobile ? 'bottom' : 'right'"
        align="end"
        :side-offset="4"
      >
        <DropdownMenuLabel class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="computedAvatar" :alt="computedNickName" />
              <AvatarFallback class="rounded-lg">
                CN
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ computedNickName }}</span>
              <span class="text-muted-foreground truncate text-xs">
                {{ computedDescription }}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <VbenIcon icon="tabler:user-circle" class="size-4 mr-2" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <VbenIcon icon="tabler:credit-card" class="size-4 mr-2" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <VbenIcon icon="tabler:notification" class="size-4 mr-2" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="handleLogout">
          <VbenIcon icon="tabler:logout" class="size-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
