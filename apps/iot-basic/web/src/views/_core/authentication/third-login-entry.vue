<script setup lang="ts">
import { computed } from 'vue';

import { SvgGithubIcon, SvgGoogleIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import { VbenButton } from '@vben-core/shadcn-ui';

defineOptions({ name: 'ThirdLoginEntry' });

const props = defineProps<{
  loading?: boolean;
  providers: string[];
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
    <div class="text-muted-foreground mb-3 text-center text-xs">{{ $t('authentication.thirdPartyLogin') }}</div>
    <div class="grid gap-3">
      <VbenButton
        v-if="visibleProviders.includes('ding')"
        :loading="loading"
        class="h-11 justify-center gap-2 border border-border bg-white text-foreground hover:bg-muted"
        variant="outline"
        @click="handleStart('ding')"
      >
        <span class="text-base leading-none">{{ $t('orgIotClient.auth.dingLogo') }}</span>
        {{ $t('authentication.dingdingLogin') }}
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('huawei')"
        :loading="loading"
        class="h-11 justify-center gap-2 border border-border bg-white text-foreground hover:bg-muted"
        variant="outline"
        @click="handleStart('huawei')"
      >
        <span class="text-base leading-none">{{ $t('orgIotClient.auth.huaweiLogo') }}</span>
        {{ $t('orgIotClient.auth.huaweiLogin') }}
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('google')"
        :loading="loading"
        class="border-border text-foreground hover:bg-muted h-11 justify-center gap-2 border bg-white"
        variant="outline"
        @click="handleStart('google')"
      >
        <SvgGoogleIcon class="size-4" />
        {{ $t('orgIotClient.auth.googleLogin') }}
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('github')"
        :loading="loading"
        class="h-11 justify-center gap-2 bg-black text-white hover:bg-black/90"
        @click="handleStart('github')"
      >
        <SvgGithubIcon class="size-4" />
        {{ $t('orgIotClient.auth.githubLogin') }}
      </VbenButton>
      <VbenButton
        v-if="visibleProviders.includes('apple')"
        :loading="loading"
        class="h-11 justify-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
        @click="handleStart('apple')"
      >
        <span class="text-base leading-none"></span>
        {{ $t('orgIotClient.auth.appleLogin') }}
      </VbenButton>
    </div>
  </div>
</template>
