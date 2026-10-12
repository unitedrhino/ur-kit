<script setup lang="ts">
import { computed } from 'vue';

import { SvgGithubIcon, SvgGoogleIcon } from '@vben/icons';
import { VbenButton } from '@vben-core/shadcn-ui';

defineOptions({ name: 'ThirdLoginEntry' });

const props = defineProps<{
  providers: string[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  start: [provider: string];
}>();

const visibleProviders = computed(() => props.providers.filter(Boolean));

function handleStart(provider: string) {
  emit('start', provider);
}
</script>

<template>
  <div v-if="visibleProviders.length > 0" class="mt-4">
    <div class="mb-3 text-center text-xs text-muted-foreground">其他登录方式</div>
    <div class="grid gap-3">
      <VbenButton
        v-if="visibleProviders.includes('ding')"
        :loading="loading"
        class="h-11 justify-center gap-2 border border-border bg-white text-foreground hover:bg-muted"
        variant="outline"
        @click="handleStart('ding')"
      >
        <span class="text-base leading-none">钉</span>
        钉钉登录
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('huawei')"
        :loading="loading"
        class="h-11 justify-center gap-2 border border-border bg-white text-foreground hover:bg-muted"
        variant="outline"
        @click="handleStart('huawei')"
      >
        <span class="text-base leading-none">华</span>
        华为登录
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('google')"
        :loading="loading"
        class="h-11 justify-center gap-2 border border-border bg-white text-foreground hover:bg-muted"
        variant="outline"
        @click="handleStart('google')"
      >
        <SvgGoogleIcon class="size-4" />
        Google 登录
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('github')"
        :loading="loading"
        class="h-11 justify-center gap-2 bg-black text-white hover:bg-black/90"
        @click="handleStart('github')"
      >
        <SvgGithubIcon class="size-4" />
        GitHub 登录
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('apple')"
        :loading="loading"
        class="h-11 justify-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
        @click="handleStart('apple')"
      >
        <span class="text-base leading-none"></span>
        Apple 登录
      </VbenButton>
    </div>
  </div>
</template>
