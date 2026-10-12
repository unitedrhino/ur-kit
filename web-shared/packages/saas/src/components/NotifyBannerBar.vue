<script setup lang="ts">
/**
 * 横幅通知栏组件
 *
 * 用于展示 type=banner 的横幅通知。
 * 根据 severity 字段展示不同颜色：info=蓝, warning=黄, error=红。
 * 根据 allowDismiss 控制是否显示关闭按钮。
 *
 * 使用方式：在布局文件的顶部区域引入此组件。
 * bannerNotifications 和 dismissBanner 由 use-notifications 提供（模块级共享状态）。
 */
import { bannerNotifications, dismissBanner } from '../hooks/use-notifications'
import { messageBodyToPreviewText } from '../utils/notification-body'

function openAction(url?: string) {
  if (url) window.open(url, '_blank')
}

const SEVERITY_CLASSES: Record<string, string> = {
  info:    'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
  error:   'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
}

const SEVERITY_ICON_CLASSES: Record<string, string> = {
  info:    'icon-[lucide--info] text-blue-500',
  warning: 'icon-[lucide--triangle-alert] text-yellow-500',
  error:   'icon-[lucide--circle-alert] text-red-500',
}

function severityClass(severity: string): string {
  return SEVERITY_CLASSES[severity] ?? SEVERITY_CLASSES.info!
}

function severityIconClass(severity: string): string {
  return SEVERITY_ICON_CLASSES[severity] ?? SEVERITY_ICON_CLASSES.info!
}
</script>

<template>
  <TransitionGroup name="banner" tag="div" class="flex flex-col">
    <div
      v-for="banner in bannerNotifications"
      :key="banner.id"
      class="flex items-center gap-3 border-b px-4 py-2.5 text-sm"
      :class="severityClass(banner.severity)"
    >
      <!-- 严重等级图标 -->
      <span :class="[severityIconClass(banner.severity), 'shrink-0 size-4']"></span>

      <!-- 内容 -->
      <div class="flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
        <span v-if="banner.title" class="font-medium">{{ banner.title }}</span>
        <span v-if="banner.body" class="opacity-80">{{ messageBodyToPreviewText(banner.body) }}</span>
        <button
          v-if="banner.actionText && banner.actionUrl"
          class="cursor-pointer font-medium underline underline-offset-2 hover:opacity-80"
          @click="openAction(banner.actionUrl)"
        >
          {{ banner.actionText }}
        </button>
      </div>

      <!-- 关闭按钮 -->
      <button
        v-if="banner.allowDismiss"
        class="shrink-0 cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
        title="关闭"
        @click="dismissBanner(banner.id)"
      >
        <span class="icon-[lucide--x] size-4"></span>
      </button>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.banner-enter-to,
.banner-leave-from {
  max-height: 80px;
}
</style>
