<script setup lang="ts">
/**
 * 文件说明：告警规则向导统一步骤概览。
 * 通过固定的标题、辅助说明和重点摘要层级，保证各步骤视觉结构一致。
 * 摘要条采用卡片化设计（左侧主题色强调条），替代生硬的 Alert border-l-4 观感。
 */
defineProps<{
  /** 当前步骤的辅助说明。 */
  description: string;
  /** 重点摘要的内容。 */
  summary: string;
  /** 重点摘要的标签。 */
  summaryLabel: string;
  /** 当前步骤的主标题。 */
  title: string;
}>();

defineSlots<{
  /** 展示加载、警告或错误等次级状态。 */
  status?: () => unknown;
}>();
</script>

<template>
  <section class="flex flex-col gap-3" data-testid="step-overview">
    <header>
      <h2 class="text-base font-semibold leading-6">{{ title }}</h2>
      <p class="text-muted-foreground mt-1 text-xs leading-5">{{ description }}</p>
    </header>

    <div class="bg-card flex items-start gap-3 rounded-xl border p-4 shadow-sm" data-testid="step-summary">
      <span class="bg-primary mt-1 h-6 w-1 shrink-0 rounded-full"></span>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-medium">{{ summaryLabel }}</div>
        <div class="text-foreground/90 mt-1 break-words leading-6">{{ summary }}</div>
      </div>
    </div>

    <slot name="status"></slot>
  </section>
</template>
