<script setup lang="ts">
import { computed } from 'vue';
import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';

interface TreeNode {
  id: string;
  name: string;
  level: string;
  levelName: string;
  children?: TreeNode[];
}

const props = defineProps<{
  nodes: TreeNode[];
  filterType: 'area' | 'group' | 'device';
  isChecked: (node: TreeNode) => boolean;
  level?: number;
  /** 不显示复选框的层级，默认产品节点不可选 */
  disableCheckLevels?: string[];
}>();

const disableLevels = props.disableCheckLevels ?? ['product'];

const emit = defineEmits<{
  (e: 'toggle', node: TreeNode, checked: boolean): void;
}>();

const levelIndent = computed(() => `${(props.level ?? 0) * 16}px`);

function shouldShow(node: TreeNode): boolean {
  if (node.level === 'product') return true;
  if (props.filterType === 'area') {
    return node.level === 'area';
  }
  if (props.filterType === 'group') {
    return node.level === 'group';
  }
  if (props.filterType === 'device') {
    return node.level === 'device';
  }
  return true;
}

function visibleChildren(node: TreeNode): TreeNode[] {
  return (node.children ?? []).filter(shouldShow);
}

function isCheckDisabled(node: TreeNode): boolean {
  return disableLevels.includes(node.level);
}
</script>

<template>
  <div class="flex flex-col gap-1" :style="{ paddingLeft: levelIndent }">
    <div
      v-for="node in nodes"
      :key="node.id"
    >
      <div
        v-if="shouldShow(node)"
        :data-tree-level="node.level"
        class="flex items-center gap-2"
        :class="
          node.level === 'product'
            ? 'border-b bg-muted/40 px-3 py-2 font-medium last:border-b-0'
            : 'hover:bg-muted/40 rounded-md px-3 py-2'
        "
      >
        <Checkbox
          v-if="!isCheckDisabled(node)"
          :model-value="isChecked(node)"
          @update:model-value="emit('toggle', node, $event === true)"
        />
        <span
          class="text-sm"
          :class="[
            node.level === 'device' ? 'text-muted-foreground' : 'text-foreground',
          ]"
        >
          {{ node.name }}
        </span>
        <span class="ml-auto text-xs text-muted-foreground">
          {{ node.level === 'product' ? '产品' : node.levelName }}
        </span>
      </div>
      <RecursiveTree
        v-if="visibleChildren(node).length > 0"
        :nodes="visibleChildren(node)"
        :filter-type="filterType"
        :is-checked="isChecked"
        :level="(level ?? 0) + 1"
        :disable-check-levels="disableLevels"
        @toggle="(n: TreeNode, c: boolean) => emit('toggle', n, c)"
      />
    </div>
  </div>
</template>
