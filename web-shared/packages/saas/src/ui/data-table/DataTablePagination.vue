<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';

import { $t } from '@vben/locales';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VbenIcon,
} from '@vben-core/shadcn-ui';

defineProps<{
  table: Table<any>;
  total?: number;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-1">
    <!-- 左侧：已选行数 -->
    <div class="flex-1 text-sm text-muted-foreground">
      <template v-if="table.getFilteredSelectedRowModel().rows.length > 0">
        {{ $t('ui.dataTable.selectedRows', { selected: table.getFilteredSelectedRowModel().rows.length, rows: table.getFilteredRowModel().rows.length }) }}
      </template>
      <template v-else-if="total != null">
        {{ $t('ui.dataTable.totalRows', { total }) }}
      </template>
    </div>

    <!-- 右侧：分页控件 -->
    <div class="flex items-center gap-4 lg:gap-6">
      <!-- 每页条数 -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium whitespace-nowrap">{{ $t('ui.dataTable.rowsPerPage') }}</span>
        <Select
          :model-value="`${table.getState().pagination.pageSize}`"
          @update:model-value="(val) => table.setPageSize(Number(val))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="size in [10, 20, 30, 50]"
              :key="size"
              :value="`${size}`"
            >
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 页码信息 -->
      <div class="text-muted-foreground whitespace-nowrap text-sm font-medium tabular-nums">
        {{ $t('ui.dataTable.pageDetail', { page: table.getState().pagination.pageIndex + 1, totalPages: table.getPageCount() || 1 }) }}
      </div>

      <!-- 翻页按钮 -->
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanPreviousPage()"
          @click="table.setPageIndex(0)"
        >
          <span class="sr-only">{{ $t('ui.dataTable.firstPage') }}</span>
          <VbenIcon icon="lucide:chevrons-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <span class="sr-only">{{ $t('ui.dataTable.previousPage') }}</span>
          <VbenIcon icon="lucide:chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <span class="sr-only">{{ $t('ui.dataTable.nextPage') }}</span>
          <VbenIcon icon="lucide:chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!table.getCanNextPage()"
          @click="table.setPageIndex(table.getPageCount() - 1)"
        >
          <span class="sr-only">{{ $t('ui.dataTable.lastPage') }}</span>
          <VbenIcon icon="lucide:chevrons-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
