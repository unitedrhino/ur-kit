<script lang="ts" setup>
import { computed } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

defineOptions({ name: 'AlertBanner' });

interface Props {
  type?: string;
  title?: string;
  message: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
});

// info 样式配置；单独提取为常量，同时作为未知 type 的兜底默认值
const infoConfig = {
  bg: 'bg-blue-50 dark:bg-blue-950',
  border: 'border-blue-200 dark:border-blue-800',
  text: 'text-blue-800 dark:text-blue-300',
  icon: 'lucide:info',
  iconColor: 'text-blue-500',
};

const typeConfigMap: Record<string, {
  bg: string;
  border: string;
  text: string;
  icon: string;
  iconColor: string;
}> = {
  info: infoConfig,
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: 'lucide:triangle-alert',
    iconColor: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: 'lucide:circle-x',
    iconColor: 'text-red-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    icon: 'lucide:circle-check',
    iconColor: 'text-green-500',
  },
};

// typeConfigMap 为 Record，noUncheckedIndexedAccess 下索引访问可能 undefined，兜底取内置 info 配置
const config = computed(() => typeConfigMap[props.type] ?? infoConfig);
</script>

<template>
  <div
    class="alert-banner rounded-lg border p-3"
    :class="[config.bg, config.border]"
  >
    <div class="flex items-start gap-3">
      <VbenIcon
        :icon="config.icon"
        class="mt-0.5 size-5 shrink-0"
        :class="config.iconColor"
      />
      <div class="flex-1 min-w-0">
        <p
          v-if="title"
          class="text-sm font-semibold"
          :class="config.text"
        >
          {{ title }}
        </p>
        <p
          class="text-sm"
          :class="[config.text, title ? 'mt-1' : '']"
        >
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>
