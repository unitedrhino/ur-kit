<!-- DataTable 列显隐菜单，使用当前 Reka UI 的 checked 受控协议。 -->
<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { Settings2 } from 'lucide-vue-next';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui';

/** 列显隐菜单属性。 */
const props = defineProps<{
  /** 当前 TanStack 表格实例。 */
  table: Table<any>;
}>();

/** 当前允许用户控制显隐的叶子列。 */
const hidableColumns = computed(() => props.table.getAllLeafColumns().filter((column) => column.getCanHide()));
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button class="ml-auto h-8" size="sm" variant="outline">
        <Settings2 class="size-4" />
        {{ $t('ui.dataTable.columns') }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuLabel>{{ $t('ui.dataTable.toggleColumns') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          v-for="column in hidableColumns"
          :key="column.id"
          :model-value="column.getIsVisible()"
          @update:model-value="column.toggleVisibility"
        >
          {{ (column.columnDef.meta as any)?.label ?? column.id }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
