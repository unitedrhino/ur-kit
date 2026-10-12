<script setup lang="ts">
/**
 * 弹窗通知组件（showAsModal=1 触发的全屏弹窗）
 *
 * 用于展示 showAsModal=1 的站内信。
 * - 站内信弹窗：展示标题+内容，支持 actionText/actionUrl 操作按钮
 * - 资讯弹窗：如果有 coverImage 则展示封面图，不展示 buttons
 *
 * 使用方式：在布局文件的根节点末尾引入此组件。
 * modalNotification 和 closeModal 由 use-notifications 提供（模块级共享状态）。
 */
import { computed } from 'vue'

import { closeModal, modalNotification } from '../hooks/use-notifications'
import { sanitizeUserMessageBodyHtml } from '../utils/notification-body'

function openAction(url?: string) {
  if (url) window.open(url, '_blank')
}

function handleAction(url?: string) {
  openAction(url)
  closeModal()
}

const sanitizedBodyHtml = computed(() =>
  modalNotification.value ? sanitizeUserMessageBodyHtml(modalNotification.value.body) : '',
)
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="modalNotification"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>

      <!-- 弹窗卡片 -->
      <div class="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-background shadow-2xl">
        <!-- 封面图（资讯类） -->
        <div v-if="modalNotification.coverImage" class="relative h-48 overflow-hidden">
          <img
            :src="modalNotification.coverImage"
            :alt="modalNotification.title"
            class="h-full w-full object-cover"
          />
        </div>

        <!-- 内容区 -->
        <div class="p-6">
          <h2 class="mb-2 text-lg font-semibold leading-snug text-foreground">
            {{ modalNotification.title }}
          </h2>
          <div
            class="notification-modal-body text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
            v-html="sanitizedBodyHtml"
          />

          <!-- 操作区 -->
          <div class="mt-5 flex items-center justify-end gap-3">
            <button
              class="cursor-pointer rounded-md border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              @click="closeModal"
            >
              关闭
            </button>
            <button
              v-if="modalNotification.actionText && modalNotification.actionUrl"
              class="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              @click="handleAction(modalNotification.actionUrl)"
            >
              {{ modalNotification.actionText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.notification-modal-body :deep(p) {
  margin: 0.35em 0;
}
.notification-modal-body :deep(p:first-child) {
  margin-top: 0;
}
.notification-modal-body :deep(p:last-child) {
  margin-bottom: 0;
}
.notification-modal-body :deep(ul),
.notification-modal-body :deep(ol) {
  margin: 0.35em 0;
  padding-left: 1.25rem;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.25s ease;
}
.modal-fade-enter-from .relative {
  transform: scale(0.95) translateY(8px);
}
.modal-fade-leave-to .relative {
  transform: scale(0.95) translateY(8px);
}
</style>
