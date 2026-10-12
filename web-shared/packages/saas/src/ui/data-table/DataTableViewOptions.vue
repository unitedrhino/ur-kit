<script setup lang="ts">
import type { Table } from '@tanstack/vue-table';

import { $t } from '@vben/locales';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@vben-core/shadcn-ui';
import { VbenIcon } from '@vben-core/shadcn-ui';
import { computed } from 'vue';

const props = defineProps<{
  table: Table<any>;
}>();

const hidableColumns = computed(() =>
  props.table
    .getAllColumns()
    .filter(
      (col) => typeof col.accessorFn !== 'undefined' && col.getCanHide(),
    ),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm" class="ml-auto h-8">
        <VbenIcon icon="lucide:settings-2" class="mr-1.5 h-4 w-4" />
        {{ $t('ui.dataTable.columns') }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[160px]">
      <DropdownMenuLabel>{{ $t('ui.dataTable.toggleColumns') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in hidableColumns"
        :key="column.id"
        class="capitalize"
        :model-value="column.getIsVisible()"
        @update:model-value="(val: boolean) => column.toggleVisibility(!!val)"
      >
        {{ (column.columnDef.meta as any)?.label ?? column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
