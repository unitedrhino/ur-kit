<script setup lang="ts">
/** 文件说明：危险操作确认容器；内容由业务提供，异步提交失败时不自动关闭。 */
import { AlertDialogContent, AlertDialogOverlay, AlertDialogPortal } from 'reka-ui';
</script>
<template>
  <AlertDialogPortal>
    <AlertDialogOverlay class="fixed inset-0 z-[2200] bg-black/50" />
    <AlertDialogContent
      class="bg-background text-foreground fixed left-1/2 top-1/2 z-[2201] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-5 rounded-lg border p-6 shadow-lg"
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
