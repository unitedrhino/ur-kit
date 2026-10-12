<script lang="ts" setup>
/**
 * 文件说明：帮助中心面板内容（通用渲染器）。
 * 结构：新手引导大入口 → 教程目录分组（应用内路由/文档外链）→ 底部「官网文档 / 问题反馈」外链。
 * 内容完全来自应用通过 setHelpCenterContent 注册的数据，本组件不携带业务文案。
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '../locales';
import { useHelpCenterContent } from './registry';

const emit = defineEmits<{ navigate: [] }>();

const router = useRouter();
const contentRef = useHelpCenterContent();
const content = computed(() => contentRef.value);

/** 跳转应用内路由并通知外层关闭弹层 */
function goRoute(route: string) {
  emit('navigate');
  router.push(route);
}

/** 新窗口打开外部文档 */
function openHref(href: string) {
  emit('navigate');
  window.open(href, '_blank', 'noopener');
}
</script>

<template>
  <div v-if="content" class="max-h-[70vh] overflow-y-auto">
    <!-- 新手引导大入口 -->
    <button
      class="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted"
      data-tour="help-center-onboarding"
      @click="goRoute(content.onboardingRoute)"
    >
      <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <span class="icon-[carbon--rocket] size-5 text-primary"></span>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-medium text-foreground">{{ content.onboardingLabel || $t('helpCenter.onboarding') }}</span>
        <span class="mt-0.5 block truncate text-xs text-muted-foreground">
          {{ content.onboardingDescription || $t('helpCenter.onboardingDescription') }}
        </span>
      </span>
      <span class="icon-[carbon--chevron-right] size-4 shrink-0 text-muted-foreground"></span>
    </button>

    <!-- 教程目录分组 -->
    <div v-for="group in content.menuGroups" :key="group.title" class="mb-1">
      <div class="px-1 pb-1 pt-2 text-xs font-medium text-muted-foreground">{{ group.title }}</div>
      <template v-for="item in group.items" :key="item.label">
        <button
          class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
          @click="item.route ? goRoute(item.route) : item.href && openHref(item.href)"
        >
          <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{ item.label }}</span>
          <span
            v-if="item.href"
            class="icon-[carbon--launch] size-3.5 shrink-0 text-muted-foreground"
            :title="$t('helpCenter.openDocument')"
          ></span>
        </button>
      </template>
    </div>

    <!-- 底部外链 -->
    <div class="mt-2 flex items-center gap-4 border-t border-border px-1 pt-2">
      <a
        v-if="content.docSiteUrl"
        :href="content.docSiteUrl"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1 text-xs text-primary hover:underline"
        @click="emit('navigate')"
      >
        <span class="icon-[carbon--book] size-3.5"></span>
        {{ $t('helpCenter.officialDocs') }}
      </a>
      <a
        v-if="content.feedbackUrl"
        :href="content.feedbackUrl"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1 text-xs text-primary hover:underline"
        @click="emit('navigate')"
      >
        <span class="icon-[carbon--chat] size-3.5"></span>
        {{ $t('helpCenter.feedback') }}
      </a>
    </div>
  </div>
</template>
