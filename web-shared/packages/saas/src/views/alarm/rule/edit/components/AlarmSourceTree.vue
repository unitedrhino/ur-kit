<script setup lang="ts">
/**
 * 文件说明：告警来源品类树
 * 只展示品类（category）和产品（product）两级，支持单选某个品类或产品。
 */
import type { AlarmObjectNode } from '../../../types/alarm-v2.types';
import { Button } from '@unitedrhino/saas-ui/ui/button';

const props = defineProps<{
  nodes: AlarmObjectNode[];
  selectedId?: string;
  selectedLevel?: string;
  level?: number;
}>();

const emit = defineEmits<{
  (e: 'select', node: AlarmObjectNode): void;
}>();

const levelIndent = `${(props.level ?? 0) * 16}px`;

function isSelectable(node: AlarmObjectNode): boolean {
  return node.level === 'category' || node.level === 'product';
}

function onSelect(node: AlarmObjectNode) {
  if (isSelectable(node)) {
    emit('select', node);
  }
}

function isSelected(node: AlarmObjectNode): boolean {
  return props.selectedId === node.id && props.selectedLevel === node.level;
}
</script>

<template>
  <div class="flex flex-col gap-1" :style="{ paddingLeft: levelIndent }">
    <div v-for="node in nodes" :key="node.id">
      <Button
        v-if="isSelectable(node)"
        type="button"
        role="radio"
        :aria-checked="isSelected(node)"
        :data-source-node="node.id"
        :variant="isSelected(node) ? 'outline' : 'ghost'"
        class="h-auto w-full justify-start px-3 py-2 text-left shadow-none"
        :class="
          isSelected(node)
            ? 'border-primary bg-primary/5 text-primary'
            : 'border border-transparent text-foreground'
        "
        @click="onSelect(node)"
      >
        <span
          aria-hidden="true"
          class="border-input flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
          :class="isSelected(node) ? 'border-primary' : ''"
        >
          <span v-if="isSelected(node)" class="bg-primary h-2 w-2 rounded-full"></span>
        </span>
        <span class="text-sm font-medium">{{ node.name }}</span>
        <span class="ml-auto text-xs text-muted-foreground">{{ node.levelName }}</span>
      </Button>
      <!-- 只继续展开品类节点，产品节点不再向下展开 -->
      <AlarmSourceTree
        v-if="node.level === 'category' && node.children && node.children.length > 0"
        :nodes="node.children"
        :selected-id="selectedId"
        :selected-level="selectedLevel"
        :level="(level ?? 0) + 1"
        @select="(n: AlarmObjectNode) => emit('select', n)"
      />
    </div>
  </div>
</template>
