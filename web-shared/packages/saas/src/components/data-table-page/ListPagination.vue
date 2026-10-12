<script setup lang="ts">
/**
 * 文件说明：列表分页器（ListPagination）
 * 统一"第 X / Y 页，共 Z 条 + 上一页/下一页"的分页工具条，供告警等列表页复用。
 */
import { Button } from '@unitedrhino/saas-ui/ui/button';

import { $t } from '@vben/locales';

defineOptions({ name: 'ListPagination' });

const props = defineProps<{
  /** 是否禁用（如加载中）。 */
  loading?: boolean;
  /** 当前页（1 起）。 */
  page: number;
  /** 总条数。 */
  total: number;
  /** 总页数。 */
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<template>
  <div class="text-muted-foreground flex items-center justify-end gap-3 text-sm">
    <span>{{ $t('iotApp.pagination.pageInfo', { page: props.page, totalPages: props.totalPages, total: props.total }) }}</span>
    <Button class="h-8" size="sm" variant="outline" :disabled="props.page <= 1 || props.loading" @click="emit('prev')"> {{ $t('iotApp.pagination.prev') }} </Button>
    <Button class="h-8" size="sm" variant="outline" :disabled="props.page >= props.totalPages || props.loading" @click="emit('next')"> {{ $t('iotApp.pagination.next') }} </Button>
  </div>
</template>
