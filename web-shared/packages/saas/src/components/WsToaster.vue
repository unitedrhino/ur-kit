<script setup lang="ts">
import { useToast } from '../hooks/use-toast'

const { toasts, dismiss, muted, toggleMute } = useToast()

function muteAndDismiss(id: string) {
  toggleMute()   // 开启静音
  dismiss(id)    // 关闭当前 toast
}
</script>

<template>
  <!-- 固定在右上角，z 层级高于其他浮层 -->
  <div class="fixed right-4 top-4 z-[9999] flex flex-col gap-2 w-[360px] pointer-events-none">
    <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-lg"
      >
        <!-- 铃铛图标 -->
        <div class="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </div>

        <!-- 内容 -->
        <div class="flex-1 space-y-0.5">
          <p class="text-sm font-semibold leading-snug text-foreground">{{ toast.title }}</p>
          <p v-if="toast.description" class="text-sm text-muted-foreground leading-snug line-clamp-2">
            {{ toast.description }}
          </p>
        </div>

        <!-- 右侧操作区 -->
        <div class="flex shrink-0 flex-col items-center gap-1.5 mt-0.5">
          <!-- 关闭按钮 -->
          <button
            class="rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
            title="关闭"
            @click="dismiss(toast.id)"
          >
            <!-- X icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>

          <!-- 不再提醒按钮（铃铛斜线） -->
          <button
            v-if="!muted"
            class="rounded-sm opacity-40 transition-opacity hover:opacity-80 focus:outline-none"
            title="不再提醒"
            @click="muteAndDismiss(toast.id)"
          >
            <!-- BellOff icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/>
              <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              <path d="m2 2 20 20"/>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(110%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(110%);
}
.toast-move {
  transition: transform 0.25s ease;
}
</style>
