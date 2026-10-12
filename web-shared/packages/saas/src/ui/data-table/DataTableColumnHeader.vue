<script setup lang="ts">
import { $t } from '@vben/locales';
import type { Column } from '@tanstack/vue-table';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  VbenIcon,
} from '@vben-core/shadcn-ui';
import { cn } from '@vben-core/shared/utils';

defineOptions({ inheritAttrs: false });

defineProps<{
  column: Column<any, any>;
  title: string;
}>();
</script>

<template>
  <!-- 可排序列：带下拉菜单 -->
  <div
    v-if="column.getCanSort()"
    :class="cn('flex items-center space-x-1', ($attrs.class as string) ?? '')"
  >
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="sm"
          class="-ml-3 h-8 data-[state=open]:bg-accent"
        >
          <span>{{ title }}</span>
          <VbenIcon
            v-if="column.getIsSorted() === 'desc'"
            icon="lucide:arrow-down"
            class="ml-1 h-3.5 w-3.5"
          />
          <VbenIcon
            v-else-if="column.getIsSorted() === 'asc'"
            icon="lucide:arrow-up"
            class="ml-1 h-3.5 w-3.5"
          />
          <VbenIcon v-else icon="lucide:chevrons-up-down" class="ml-1 h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem @click="column.toggleSorting(false)">
          <VbenIcon icon="lucide:arrow-up" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ $t('ui.dataTable.sortAscending') }}
        </DropdownMenuItem>
        <DropdownMenuItem @click="column.toggleSorting(true)">
          <VbenIcon icon="lucide:arrow-down" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ $t('ui.dataTable.sortDescending') }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem v-if="column.getCanHide()" @click="column.toggleVisibility(false)">
          <VbenIcon icon="lucide:eye-off" class="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          {{ $t('ui.dataTable.hideColumn') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <!-- 不可排序列：纯文字 -->
  <div v-else :class="($attrs.class as string) ?? ''">
    {{ title }}
  </div>
</template>
