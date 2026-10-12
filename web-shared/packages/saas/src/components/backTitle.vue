<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Button } from '@vben-core/shadcn-ui';
import { $t } from '@vben/locales';
import { computed } from 'vue';
const router = useRouter();
const props = defineProps<{
  title: string;
  backText?: string;
}>();

const backText = computed(() => {
  return props.backText || $t('iotApp.common.back');
});

const emit = defineEmits<{
  back: [];
}>();

function onBack() {
  emit('back');
  router.back();
}


</script>

<template>
  <div class="flex items-center gap-2">
    <Button variant="ghost" size="sm" @click="onBack">
      <span class="icon-[mdi--arrow-left] mr-1 size-5"></span>
      {{  backText }}
    </Button>
    <template v-if="title">
      |
      <span class="text-xl font-bold text-nowrap">{{ title }}</span>
    </template>
    <slot />
  </div>
</template>

<style scoped>

</style>
