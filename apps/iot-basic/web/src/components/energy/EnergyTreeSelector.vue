<!--
  能源树选择器：用 shadcn 风格控件展示建筑/区域树，支持搜索、单选、多选、全选与级联选择。
-->
<script setup lang="ts">
import type { GroupType } from '#/hooks/use-energy-tree';

import { computed, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';
import { Empty, EmptyDescription } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { ScrollArea } from '@unitedrhino/saas-ui/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unitedrhino/saas-ui/ui/select';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';

export interface EnergyTreeOption {
  children?: EnergyTreeOption[];
  key?: number | string;
  label?: string;
  value?: number | string;
}

interface TreeRow {
  depth: number;
  node: EnergyTreeOption;
}

type CheckedState = boolean | 'indeterminate';

interface Props {
  /** 选中的节点 key 列表。 */
  selectedKeys?: string[];
  /** 当前分组类型。 */
  groupType?: GroupType;
  /** 树形数据。 */
  treeData?: EnergyTreeOption[];
  /** 是否加载中。 */
  loading?: boolean;
  /** 是否多选。 */
  multiple?: boolean;
  /** 搜索值。 */
  searchValue?: string;
  /** 是否显示分组类型切换下拉。 */
  showGroupType?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  groupType: 'areaID',
  loading: false,
  multiple: false,
  searchValue: '',
  selectedKeys: () => [],
  showGroupType: true,
  treeData: () => [],
});

const emit = defineEmits<{
  'update:groupType': [type: GroupType];
  'update:searchValue': [value: string];
  'update:selectedKeys': [keys: string[]];
}>();

const groupTypeOptions: Array<{ label: string; value: GroupType }> = [
  { label: $t('orgIotClient.energyTree.building'), value: 'groupBuildingIDs' },
  { label: $t('orgIotClient.energyTree.area'), value: 'areaID' },
];

const expandedKeys = ref<string[]>([]);
const cascadeCheck = ref(false);

const groupTypeRef = computed({
  get: () => props.groupType,
  set: (value) => handleUpdateGroupType(value as GroupType),
});

const searchValueRef = computed({
  get: () => props.searchValue,
  set: (value) => emit('update:searchValue', String(value ?? '')),
});

const selectedSet = computed(() => new Set(props.selectedKeys.map(String)));
const allKeys = computed(() => collectAllKeys(props.treeData));
const checkedAll = computed(() => allKeys.value.length > 0 && allKeys.value.every((key) => selectedSet.value.has(key)));
const treeRows = computed<TreeRow[]>(() => flattenVisibleRows(props.treeData));

function nodeKey(node: EnergyTreeOption) {
  return String(node.key ?? node.value ?? '');
}

function nodeLabel(node: EnergyTreeOption) {
  return String(node.label ?? node.value ?? node.key ?? '');
}

/** collectAllKeys 递归收集树中所有可选节点 key。 */
function collectAllKeys(nodes: EnergyTreeOption[]): string[] {
  const keys: string[] = [];
  const traverse = (list: EnergyTreeOption[]) => {
    for (const node of list) {
      const key = nodeKey(node);
      if (key) {
        keys.push(key);
      }
      if (node.children?.length) {
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return keys;
}

function collectExpandableKeys(nodes: EnergyTreeOption[]) {
  const keys: string[] = [];
  const traverse = (list: EnergyTreeOption[]) => {
    for (const node of list) {
      if (node.children?.length) {
        keys.push(nodeKey(node));
        traverse(node.children);
      }
    }
  };
  traverse(nodes);
  return keys.filter(Boolean);
}

function collectDescendantKeys(node: EnergyTreeOption) {
  return collectAllKeys([node]);
}

function flattenVisibleRows(nodes: EnergyTreeOption[], depth = 0): TreeRow[] {
  const rows: TreeRow[] = [];
  for (const node of nodes) {
    const key = nodeKey(node);
    rows.push({ depth, node });
    if (node.children?.length && expandedKeys.value.includes(key)) {
      rows.push(...flattenVisibleRows(node.children, depth + 1));
    }
  }
  return rows;
}

/** toggleNode 切换父节点展开状态。 */
function toggleNode(node: EnergyTreeOption) {
  const key = nodeKey(node);
  if (!key || !node.children?.length) {
    return;
  }
  const expanded = new Set(expandedKeys.value);
  if (expanded.has(key)) {
    expanded.delete(key);
  } else {
    expanded.add(key);
  }
  expandedKeys.value = [...expanded];
}

/** applyCascadeSelection 根据级联开关决定只选当前节点或连同子节点一起选。 */
function applyCascadeSelection(node: EnergyTreeOption, checked: boolean) {
  const next = new Set(props.selectedKeys.map(String));
  const targetKeys = cascadeCheck.value ? collectDescendantKeys(node) : [nodeKey(node)].filter(Boolean);

  for (const key of targetKeys) {
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }

  emit('update:selectedKeys', [...next]);
}

function handleCheckedAllChange(checked: boolean) {
  emit('update:selectedKeys', checked ? allKeys.value : []);
}

function handleCheckedAllStateChange(checked: CheckedState) {
  handleCheckedAllChange(checked === true);
}

function handleNodeCheckedChange(node: EnergyTreeOption, checked: CheckedState) {
  applyCascadeSelection(node, checked === true);
}

function handleNodeSelect(node: EnergyTreeOption) {
  const key = nodeKey(node);
  if (!key) {
    return;
  }
  if (props.multiple) {
    applyCascadeSelection(node, !selectedSet.value.has(key));
    return;
  }
  emit('update:selectedKeys', [key]);
}

function handleUpdateGroupType(value: GroupType) {
  emit('update:groupType', value);
  emit('update:selectedKeys', []);
}

watch(
  () => props.treeData,
  (nodes) => {
    expandedKeys.value = [...new Set([...expandedKeys.value, ...collectExpandableKeys(nodes)])];
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div class="flex flex-col gap-2">
      <Select v-if="showGroupType" v-model="groupTypeRef">
        <SelectTrigger class="h-8">
          <SelectValue :placeholder="$t('orgIotClient.energyTree.groupTypePlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="item in groupTypeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <div class="relative">
        <Input v-model="searchValueRef" class="h-8 pr-8" :placeholder="$t('orgIotClient.energyTree.searchPlaceholder')" />
        <Button
          v-if="searchValueRef"
          class="absolute right-1 top-1 size-6"
          size="icon-sm"
          type="button"
          variant="ghost"
          :aria-label="$t('orgIotClient.energyTree.clearSearch')"
          @click="searchValueRef = ''"
        >
          <span class="icon-[mdi--close] size-3.5"></span>
        </Button>
      </div>
    </div>

    <div v-if="multiple" class="flex items-center gap-3">
      <label class="text-muted-foreground flex h-8 items-center gap-2 text-sm">
        <Checkbox :checked="checkedAll" @update:checked="handleCheckedAllStateChange" />
        {{ $t('orgManage.role.selectAll') }}
      </label>
      <label class="text-muted-foreground flex h-8 items-center gap-2 text-sm">
        <Checkbox v-model:checked="cascadeCheck" />
        {{ $t('orgIotClient.energyTree.cascade') }}
      </label>
    </div>

    <div v-if="loading" class="text-muted-foreground flex flex-1 items-center justify-center gap-2 py-8 text-sm">
      <Spinner class="size-5" />
      {{ $t('orgIotClient.energyTree.loading') }}
    </div>

    <Empty v-else-if="treeData.length === 0" class="flex-1 border-none py-8">
      <EmptyDescription>{{ $t('common.noData') }}</EmptyDescription>
    </Empty>

    <ScrollArea v-else class="min-h-0 flex-1 pr-1">
      <div class="space-y-1">
        <div
          v-for="{ node, depth } in treeRows"
          :key="nodeKey(node)"
          class="group flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5 hover:bg-muted/70"
          :style="{ paddingLeft: `${depth * 14 + 4}px` }"
        >
          <Button
            class="size-7 shrink-0 text-muted-foreground"
            size="icon-sm"
            type="button"
            variant="ghost"
            :aria-label="expandedKeys.includes(nodeKey(node)) ? $t('orgIotClient.energyTree.collapseNode') : $t('orgIotClient.energyTree.expandNode')"
            :disabled="!node.children?.length"
            @click="toggleNode(node)"
          >
            <span
              class="size-3.5 transition-transform"
              :class="node.children?.length ? 'icon-[mdi--chevron-right]' : 'icon-[mdi--circle-small] opacity-50'"
              :style="{ transform: node.children?.length && expandedKeys.includes(nodeKey(node)) ? 'rotate(90deg)' : undefined }"
            ></span>
          </Button>

          <Checkbox
            v-if="multiple"
            class="shrink-0"
            :checked="selectedSet.has(nodeKey(node))"
            @update:checked="(checked: CheckedState) => handleNodeCheckedChange(node, checked)"
          />

          <button
            class="flex h-8 min-w-0 flex-1 items-center rounded-md px-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            :class="selectedSet.has(nodeKey(node)) ? 'bg-accent text-accent-foreground' : 'text-foreground'"
            type="button"
            @click="handleNodeSelect(node)"
          >
            <span class="truncate">{{ nodeLabel(node) }}</span>
          </button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
