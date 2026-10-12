<!-- org-iot-client 专用头部 Logo：仅展示应用标识，移除左侧跳转与应用列表弹层。 -->
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import { VbenAvatar } from '@vben-core/shadcn-ui';

interface Props {
  /** Logo 图片地址。 */
  appLogo?: string;
  /** 应用名称。 */
  appName?: string;
}

withDefaults(defineProps<Props>(), {
  appLogo: '',
  appName: '',
});

const wrapperRef = ref<HTMLElement | null>(null);
const isCollapsed = ref(false);

function checkCollapsed() {
  if (wrapperRef.value?.parentElement) {
    const parentWidth = wrapperRef.value.parentElement.offsetWidth;
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
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<template>
  <div ref="wrapperRef" class="header-logo-container flex h-full w-full items-center gap-3 pl-3" :class="{ 'is-collapsed': isCollapsed }">
    <VbenAvatar v-if="appLogo" :src="appLogo" :alt="appName" :size="32" fit="cover" class="flex-shrink-0 rounded-none bg-transparent" />

    <div v-if="appName && !isCollapsed" class="min-w-0 flex-1">
      <span class="text-foreground truncate text-base font-medium leading-tight">
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
