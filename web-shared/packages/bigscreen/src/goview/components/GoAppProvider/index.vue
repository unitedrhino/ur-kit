<script lang="ts" setup>
import { DialogContent } from '@/components/Plugins/DialogContent';
import { LoadingContent } from '@/components/Plugins/LoadingContent';
import { MessageContent } from '@/components/Plugins/MessageContent';
import { NDialogProvider, NLoadingBarProvider, NMessageProvider, NNotificationProvider } from 'naive-ui';
</script>

<template>
  <NLoadingBarProvider>
    <NDialogProvider>
      <DialogContent />
      <LoadingContent />
      <NNotificationProvider>
        <NMessageProvider>
          <MessageContent />
          <slot></slot>
        </NMessageProvider>
      </NNotificationProvider>
    </NDialogProvider>
  </NLoadingBarProvider>
</template>
