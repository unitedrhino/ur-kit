<script setup lang="ts">
/**
 * 设备日志 Timeline 列表组件。
 *
 * 只负责展示归一化后的日志条目、日期折叠和加载状态，数据获取留在页面层处理。
 */
import type { DeviceLogDateGroup, DeviceLogTimelineItem, DeviceLogTone } from '../normalizers';

import { $t } from '@vben/locales';

import { computed } from 'vue';

import { Badge, Button, ScrollArea, VbenSpinner } from '@vben-core/shadcn-ui';

import { groupTimelineItems } from '../normalizers';

/** 组件入参定义了 Timeline 展示需要的全部外部状态。 */
const props = defineProps<{
  /** 接口错误文案。 */
  errorMessage?: string;
  /** 日期展开状态。 */
  expandedDates: Record<string, boolean>;
  /** 是否还有更多分页数据。 */
  hasMore: boolean;
  /** 是否首次加载中。 */
  loading: boolean;
  /** 是否加载更多中。 */
  loadingMore: boolean;
  /** 归一化后的日志条目。 */
  logs: DeviceLogTimelineItem[];
}>();

const emit = defineEmits<{
  /** 点击加载更多。 */
  loadMore: [];
  /** 点击重试。 */
  retry: [];
  /** 选择日志查看详情。 */
  select: [item: DeviceLogTimelineItem];
  /** 切换日期分组展开态。 */
  toggleDate: [dateLabel: string];
}>();

const groups = computed<DeviceLogDateGroup[]>(() => groupTimelineItems(props.logs, props.expandedDates));

function badgeVariant(tone: DeviceLogTone) {
  if (tone === 'danger') return 'destructive';
  if (tone === 'success' || tone === 'warning') return 'outline';
  return 'outline';
}

/** badgeToneClass 按日志色调返回明确的视觉 token，确保浅色和深色下可读性。 */
function badgeToneClass(tone: DeviceLogTone) {
  if (tone === 'success') {
    return 'border-emerald-400/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/70 dark:bg-emerald-500/20 dark:text-emerald-100';
  }
  if (tone === 'danger') {
    return 'border-rose-400/60 bg-rose-50 text-rose-700 dark:border-rose-400/70 dark:bg-rose-500/20 dark:text-rose-100';
  }
  if (tone === 'warning') {
    return 'border-amber-400/60 bg-amber-50 text-amber-700 dark:border-amber-400/70 dark:bg-amber-500/20 dark:text-amber-100';
  }
  if (tone === 'info') {
    return 'border-sky-400/60 bg-sky-50 text-sky-700 dark:border-sky-400/70 dark:bg-sky-500/20 dark:text-sky-100';
  }
  return 'border-border/70 bg-muted/60 text-muted-foreground dark:border-muted-foreground/30 dark:bg-muted/20 dark:text-muted-foreground';
}
</script>

<template>
  <div data-testid="device-log-timeline" class="h-[calc(100vh-360px)] min-h-[360px] rounded-lg border border-border bg-background">
    <div v-if="loading" class="flex h-full min-h-0 flex-col items-center justify-center gap-3 text-muted-foreground">
      <VbenSpinner class="size-6" />
      <span class="text-sm">{{ $t('orgIotClient.deviceLogs.loadingLogs') }}</span>
    </div>

    <div v-else-if="errorMessage" class="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-6 text-center">
      <div class="text-sm font-medium text-foreground">{{ $t('orgIotClient.deviceLogs.logsLoadFailed') }}</div>
      <div class="max-w-md text-sm text-muted-foreground">{{ errorMessage }}</div>
      <Button variant="outline" size="sm" @click="emit('retry')">{{ $t('orgIotClient.deviceLogs.reload') }}</Button>
    </div>

    <div v-else-if="groups.length === 0" class="flex h-full min-h-0 flex-col items-center justify-center gap-2 px-6 text-center">
      <div class="text-sm font-medium text-foreground">{{ $t('orgIotClient.deviceLogs.noLogs') }}</div>
      <div class="text-sm text-muted-foreground">{{ $t('orgIotClient.deviceLogs.noLogsDesc') }}</div>
    </div>

    <ScrollArea v-else class="h-full min-h-0">
      <div class="flex flex-col gap-6 p-4">
        <section v-for="group in groups" :key="group.dateLabel" class="flex flex-col gap-3">
          <div class="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 py-2 backdrop-blur">
            <div class="text-sm font-semibold text-foreground">{{ group.dateLabel }}</div>
            <div class="text-xs text-muted-foreground">{{ $t('orgIotClient.deviceLogs.itemsCount', { count: group.items.length }) }}</div>
          </div>

          <div class="relative flex flex-col gap-3 pl-5">
            <div class="absolute bottom-2 left-1.5 top-2 w-px bg-border"></div>
            <button
              v-for="item in group.visibleItems"
              :key="item.id"
              class="group relative rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-accent/30"
              type="button"
              @click="emit('select', item)"
            >
              <span class="absolute -left-[19px] top-5 size-2.5 rounded-full border border-background bg-primary"></span>
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-foreground">{{ item.title }}</span>
                  <Badge :variant="badgeVariant(item.resultTone)" :class="badgeToneClass(item.resultTone)">{{ item.badgeLabel }}</Badge>
                </div>
                  <div v-if="item.subtitle" class="mt-2 line-clamp-2 text-xs text-muted-foreground">{{ item.subtitle }}</div>
                  <div v-if="item.actor" class="mt-2 text-xs text-muted-foreground">{{ $t('orgIotClient.deviceLogs.operator', { name: item.actor }) }}</div>
                </div>
                <div class="shrink-0 text-xs tabular-nums text-muted-foreground">{{ item.timeLabel }}</div>
              </div>
            </button>
          </div>

          <Button v-if="group.hiddenCount > 0 || expandedDates[group.dateLabel]" variant="ghost" size="sm" class="self-start" @click="emit('toggleDate', group.dateLabel)">
            {{ expandedDates[group.dateLabel] ? $t('orgIotClient.deviceLogs.collapse') : $t('orgIotClient.deviceLogs.expandMore', { count: group.hiddenCount }) }}
          </Button>
        </section>

        <div class="flex justify-center pb-2">
          <Button v-if="hasMore" variant="outline" size="sm" :disabled="loadingMore" @click="emit('loadMore')">
            <VbenSpinner v-if="loadingMore" class="mr-2 size-4" />
            {{ loadingMore ? $t('orgIotClient.energyTree.loading') : $t('orgIotClient.deviceLogs.loadMore') }}
          </Button>
          <span v-else class="text-xs text-muted-foreground">{{ $t('orgIotClient.deviceLogs.allLoaded') }}</span>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
