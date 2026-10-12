<script lang="ts" setup>
import { Table as ResizableTable } from '@unitedrhino/saas-ui/ui/table';

import { computed } from 'vue';

defineOptions({ name: 'TableRenderer' });

interface Props {
  data: any[];
  columns?: string;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  columns: '',
  pageSize: 0,
});

const columnList = computed(() => {
  if (props.columns) {
    return props.columns.split(',').map((c) => c.trim()).filter(Boolean);
  }
  if (props.data && props.data.length > 0) {
    return Object.keys(props.data[0]);
  }
  return [];
});

const displayData = computed(() => {
  if (props.pageSize && props.pageSize > 0) {
    return props.data.slice(0, props.pageSize);
  }
  return props.data;
});

function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '--';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
</script>

<template>
  <div class="table-renderer bg-card border-border rounded-lg border overflow-hidden">
    <div class="overflow-x-auto">
      <ResizableTable class="w-full text-sm">
        <thead>
          <tr class="bg-muted/50 border-border border-b">
            <th
              v-for="col in columnList"
              :key="col"
              class="text-muted-foreground px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIdx) in displayData"
            :key="rowIdx"
            class="border-border border-b transition-colors last:border-b-0 hover:bg-muted/30"
          >
            <td
              v-for="col in columnList"
              :key="col"
              class="text-foreground px-4 py-2.5 whitespace-nowrap"
            >
              {{ formatCellValue(row[col]) }}
            </td>
          </tr>
          <tr v-if="displayData.length === 0">
            <td
              :colspan="columnList.length"
              class="text-muted-foreground px-4 py-8 text-center"
            >
              No data available
            </td>
          </tr>
        </tbody>
      </ResizableTable>
    </div>
    <div
      v-if="props.pageSize && props.pageSize > 0 && props.data.length > props.pageSize"
      class="bg-muted/30 border-border border-t px-4 py-2"
    >
      <span class="text-muted-foreground text-xs">
        Showing {{ displayData.length }} of {{ props.data.length }} rows
      </span>
    </div>
  </div>
</template>
