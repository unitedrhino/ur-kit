<script lang="ts" setup>
import { $t } from '@vben/locales';
import { Fallback } from '@vben/common-ui';
import { useServerErrorStore } from '../store';

defineOptions({ name: 'ServerErrorOverlay' });

const serverErrorStore = useServerErrorStore();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="serverErrorStore.visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
    >
      <Fallback status="500" />
      <button
        class="absolute top-4 right-4 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        @click="serverErrorStore.hide()"
      >
        {{ $t('iotApp.errorOverlay.ignoreAndContinue') }}
      </button>
    </div>
  </Teleport>
</template>
