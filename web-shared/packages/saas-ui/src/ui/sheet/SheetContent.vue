<script setup lang="ts">
/** 文件说明：shadcn 右侧 Sheet 容器，复用同一套可访问 Dialog 原语。 */
import { DialogContent } from '../dialog';
</script>
<template>
  <DialogContent class="left-auto right-0 top-0 h-dvh max-h-dvh w-full max-w-[480px] translate-x-0 translate-y-0 rounded-none sm:rounded-none" v-bind="$attrs"
    ><slot
  /></DialogContent>
</template>
