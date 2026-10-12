<script lang="ts" setup>
/**
 * 文件说明：头部右侧「帮助与教程」问号入口按钮。
 * 仅当应用通过 setHelpCenterContent 注册了帮助内容时才渲染；
 * 面板主体（教程目录）异步加载，保证 basic.vue 启动链路轻量。
 * 根元素带 data-tour="help-center"，供新手高亮引导（driver.js）定位。
 */
import { computed, defineAsyncComponent } from 'vue';

import { NPopover } from 'naive-ui';

import { $t } from '../locales';
import { useHelpCenterContent } from './registry';

const HelpCenterPanel = defineAsyncComponent(() => import('./HelpCenterPanel.vue'));

const contentRef = useHelpCenterContent();
const enabled = computed(() => !!contentRef.value);

const show = defineModel<boolean>('show', { default: false });

/** 按钮图标类名（iconify 完整类名）；console 等头部已有同款图标的应用可换用其他图标 */
const props = withDefaults(
  defineProps<{
    /** 图标类名（iconify 完整类名，如 icon-[carbon--help]） */
    icon?: string;
  }>(),
  { icon: 'icon-[carbon--help]' },
);
</script>

<template>
  <div v-if="enabled" data-tour="help-center" class="mr-1 flex items-center">
    <NPopover v-model:show="show" trigger="click" placement="bottom-end" :width="360">
      <template #trigger>
        <button
          class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          :title="$t('helpCenter.helpAndTutorials')"
          :aria-label="$t('helpCenter.helpAndTutorials')"
        >
          <span :class="[props.icon, 'size-4']"></span>
        </button>
      </template>
      <HelpCenterPanel @navigate="show = false" />
    </NPopover>
  </div>
</template>
