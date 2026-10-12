<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue';

import { message } from '../adapter/naive';
import { $t } from '../locales';
import { getBackToConsoleUrl } from '../utils';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  VbenAvatar,
  VbenIcon,
  VbenTooltip,
} from '@vben-core/shadcn-ui';

interface Props {
  /**
   * Logo图片地址
   */
  appLogo?: string;
  /**
   * 应用名称
   */
  appName?: string;
  /**
   * 是否显示返回工作台入口
   */
  showBack?: boolean;
  /**
   * 是否显示应用切换菜单
   */
  showAppMenu?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  appLogo: '',
  appName: '',
  showAppMenu: true,
  showBack: true,
});

const slots = useSlots();
const hasAppMenuSlot = computed(() => props.showAppMenu && !!slots['app-menu']);

const wrapperRef = ref<HTMLElement | null>(null);
const isCollapsed = ref(false);
const appMenuOpen = ref(false);

/** 应用菜单悬停打开延迟，避免鼠标路过顶栏时误触发弹层 */
const APP_MENU_HOVER_OPEN_DELAY = 400;

let openMenuTimer: null | ReturnType<typeof setTimeout> = null;
let closeMenuTimer: null | ReturnType<typeof setTimeout> = null;

function checkCollapsed() {
  if (wrapperRef.value?.parentElement) {
    const parentWidth = wrapperRef.value.parentElement.offsetWidth;
    // 折叠宽度通常是 60px，这里使用 80px 作为阈值
    isCollapsed.value = parentWidth <= 80;
  }
}

let resizeObserver: null | ResizeObserver = null;

onMounted(() => {
  checkCollapsed();
  if (wrapperRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      checkCollapsed();
    });
    resizeObserver.observe(wrapperRef.value.parentElement);
  }
});

onUnmounted(() => {
  if (openMenuTimer) {
    clearTimeout(openMenuTimer);
    openMenuTimer = null;
  }
  if (closeMenuTimer) {
    clearTimeout(closeMenuTimer);
    closeMenuTimer = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

function clearCloseMenuTimer() {
  if (!closeMenuTimer) {
    return;
  }
  clearTimeout(closeMenuTimer);
  closeMenuTimer = null;
}

function clearOpenMenuTimer() {
  if (!openMenuTimer) {
    return;
  }
  clearTimeout(openMenuTimer);
  openMenuTimer = null;
}

function openAppMenu() {
  clearOpenMenuTimer();
  clearCloseMenuTimer();
  appMenuOpen.value = true;
}

function scheduleOpenAppMenu() {
  clearOpenMenuTimer();
  clearCloseMenuTimer();
  openMenuTimer = setTimeout(() => {
    appMenuOpen.value = true;
    openMenuTimer = null;
  }, APP_MENU_HOVER_OPEN_DELAY);
}

function scheduleCloseAppMenu() {
  clearOpenMenuTimer();
  clearCloseMenuTimer();
  closeMenuTimer = setTimeout(() => {
    appMenuOpen.value = false;
    closeMenuTimer = null;
  }, 120);
}

function handleBackToConsole() {
  const backToConsoleUrl = getBackToConsoleUrl('/console');
  if (backToConsoleUrl) {
    window.location.href = backToConsoleUrl;
  } else {
    message.error($t('console.actions.appNotFound'));
  }
}
</script>

<template>
  <div
    ref="wrapperRef"
    class="header-logo-container flex h-full w-full items-center gap-3"
    :class="{ 'is-collapsed': isCollapsed, 'pl-3': !showBack }"
  >
    <!-- 返回console按钮 - 折叠时隐藏 -->
    <VbenTooltip v-if="showBack && !isCollapsed" side="left">
      <template #trigger>
        <button
          type="button"
          class="hover:bg-muted text-foreground flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md pl-1 transition-colors"
          @click="handleBackToConsole"
        >
          <span class="icon-[mdi--arrow-left] size-5"></span>
        </button>
      </template>
      {{ $t('systemLanguage.backToConsole') }}
    </VbenTooltip>

    <!-- Logo图标 -->
    <VbenAvatar v-if="appLogo" :src="appLogo" :alt="appName" :size="32" fit="cover" class="flex-shrink-0 rounded-none bg-transparent" />

    <!-- 应用名称：有 app-menu 插槽时为 Navigation Menu 触发器 -->
    <div v-if="appName && !isCollapsed" class="min-w-0 flex-1">
      <Popover v-if="hasAppMenuSlot" v-model:open="appMenuOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            data-test="header-app-menu-trigger"
            class="text-foreground hover:bg-accent hover:text-accent-foreground flex min-h-9 w-full min-w-0 max-w-full items-center justify-between gap-1 rounded-md px-2 py-1 text-left text-base font-medium leading-tight transition-colors"
            @click="openAppMenu"
            @focus="openAppMenu"
            @mouseenter="scheduleOpenAppMenu"
            @mouseleave="scheduleCloseAppMenu"
          >
            <span class="line-clamp-2 min-w-0 flex-1 break-words" :title="appName">{{ appName }}</span>
            <VbenIcon
              icon="lucide:chevron-down"
              class="size-4 shrink-0 opacity-60 transition-transform duration-200"
              :class="{ 'rotate-180': appMenuOpen }"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          :side-offset="8"
          class="border-border z-popup w-[min(18rem,calc(100vw-2rem))] min-w-[16rem] max-w-[calc(100vw-2rem)] origin-top-left border-2 p-2.5 shadow-md"
        >
          <div
            @focusin="openAppMenu"
            @mouseenter="openAppMenu"
            @mouseleave="scheduleCloseAppMenu"
          >
            <slot name="app-menu"></slot>
          </div>
        </PopoverContent>
      </Popover>
      <span v-else class="text-foreground line-clamp-2 break-words text-base font-medium leading-tight">
        {{ appName }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.header-logo-container.is-collapsed {
  justify-content: center;
}
</style>
