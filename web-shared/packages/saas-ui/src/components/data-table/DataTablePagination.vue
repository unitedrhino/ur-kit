<!-- DataTable 分页栏，提供总数、每页条数与翻页操作。 -->
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';

import { $t } from '@vben/locales';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';

import { Button, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui';

/** 分页栏属性。 */
defineProps<{
  /** 当前 TanStack 表格实例。 */
  table: Table<any>;
  /** 服务端返回的数据总数。 */
  total?: number;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 px-1">
    <div class="text-muted-foreground flex-1 text-sm">
      <template v-if="table.getFilteredSelectedRowModel().rows.length > 0">
        {{ $t('ui.dataTable.selectedRows', { selected: table.getFilteredSelectedRowModel().rows.length, rows: table.getFilteredRowModel().rows.length }) }}
      </template>
      <template v-else-if="total != null">{{ $t('ui.dataTable.totalRows', { total }) }}</template>
    </div>

    <div class="flex shrink-0 items-center gap-3 lg:gap-5">
      <div class="flex items-center gap-2">
        <span class="whitespace-nowrap text-sm font-medium">{{ $t('ui.dataTable.rowsPerPage') }}</span>
        <Select :model-value="String(table.getState().pagination.pageSize)" @update:model-value="(value) => table.setPageSize(Number(value))">
          <SelectTrigger class="h-8 w-16">
            <SelectValue :placeholder="String(table.getState().pagination.pageSize)" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectItem v-for="size in [10, 20, 30, 50]" :key="size" :value="String(size)">{{ size }}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div class="text-muted-foreground whitespace-nowrap text-sm font-medium tabular-nums">
        {{ $t('ui.dataTable.pageDetail', { page: table.getState().pagination.pageIndex + 1, totalPages: table.getPageCount() || 1 }) }}
      </div>

      <div class="flex items-center gap-1">
        <Button
          :aria-label="$t('ui.dataTable.firstPage')"
          class="hidden size-8 p-0 lg:inline-flex"
          :disabled="!table.getCanPreviousPage()"
          size="icon-sm"
          variant="outline"
          @click="table.setPageIndex(0)"
        >
          <ChevronsLeft class="size-4" />
        </Button>
        <Button
          :aria-label="$t('ui.dataTable.previousPage')"
          class="size-8 p-0"
          :disabled="!table.getCanPreviousPage()"
          size="icon-sm"
          variant="outline"
          @click="table.previousPage()"
        >
          <ChevronLeft class="size-4" />
        </Button>
        <Button
          :aria-label="$t('ui.dataTable.nextPage')"
          class="size-8 p-0"
          :disabled="!table.getCanNextPage()"
          size="icon-sm"
          variant="outline"
          @click="table.nextPage()"
        >
          <ChevronRight class="size-4" />
        </Button>
        <Button
          :aria-label="$t('ui.dataTable.lastPage')"
          class="hidden size-8 p-0 lg:inline-flex"
          :disabled="!table.getCanNextPage()"
          size="icon-sm"
          variant="outline"
          @click="table.setPageIndex(Math.max(table.getPageCount() - 1, 0))"
        >
          <ChevronsRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
