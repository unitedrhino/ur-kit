<!-- 文件说明：知识库文档目录树，提供搜索、选择、拖拽移动、右键管理与引用失效角标；新建/移动/删除对话框内聚在本组件。 -->
<script setup lang="ts">
import { $t } from '../../../locales';
import type { TreeOption } from 'naive-ui';

import type { KnowledgeTreeNode } from '../data';

import { computed, h, ref, watch } from 'vue';

import { Badge } from '@unitedrhino/saas-ui/ui/badge';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@unitedrhino/saas-ui/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@unitedrhino/saas-ui/ui/empty';
import { Input } from '@unitedrhino/saas-ui/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@unitedrhino/saas-ui/ui/tooltip';
import { File, Folder, FolderPlus, LoaderCircle, Search, Upload } from 'lucide-vue-next';
import { NDropdown, NSpin, NTree } from 'naive-ui';

import { Api } from '../index.api';
import { getErrorMessage } from '../workbench';

type UiTreeNode = TreeOption & { fieldPendingCount?: number; rawNode?: KnowledgeTreeNode };

const props = withDefaults(defineProps<Props>(), {
  canWrite: false,
  error: '',
  expandedKeys: () => [],
  fieldPendingSummary: () => ({}),
  keyword: '',
  loading: false,
  nodes: () => [],
  selectedKeys: () => [],
});

/** 组件只负责目录操作与选择上报；数据刷新、文档切换与错误提示由工作台统一协调。 */
const emit = defineEmits<{
  /** 批量删除成功后通知工作台清理当前文档并刷新树与统计，携带实际删除的节点。 */
  batchDeleted: [nodes: KnowledgeTreeNode[]];
  /** 批量重试提交完成，壳层刷新编译状态，进行中任务由轮询接管。 */
  batchRetried: [count: number];
  /** 删除节点成功后通知工作台清理当前文档并刷新树与统计。 */
  deleted: [node: KnowledgeTreeNode];
  /** 目录操作失败时上抛错误文案，由工作台写入头部错误条并回滚目录。 */
  error: [message: string];
  /** 选中文件夹变化，工作台记录为后续上传的默认目标目录。 */
  folderSelect: [node: KnowledgeTreeNode | null];
  /** 新建、移动或拖拽成功后请求工作台刷新目录树。 */
  refresh: [];
  /** 文件节点被选中，工作台据此切换当前文档。 */
  select: [node: KnowledgeTreeNode];
  /** 展开节点键变化（v-model:expanded-keys）。 */
  'update:expandedKeys': [keys: Array<number | string>];
  /** 搜索关键词变化（v-model:keyword），提升到工作台以在常驻目录与临时侧栏间共享。 */
  'update:keyword': [value: string];
  /** 右键「上传到此目录」或空态引导上传；null 表示整库上传（目标根目录）。 */
  uploadToFolder: [node: KnowledgeTreeNode | null];
}>();

interface Props {
  /** 是否允许结构操作（新建/移动/删除/拖拽/上传入口）。 */
  canWrite?: boolean;
  /** 目录加载失败文案，空串表示加载正常。 */
  error?: string;
  /** 展开节点键（v-model:expanded-keys）。 */
  expandedKeys?: Array<number | string>;
  /** 文档引用失效计数：documentID → 数量，用于节点角标。 */
  fieldPendingSummary?: Record<number, number>;
  /** 搜索关键词（v-model:keyword）。 */
  keyword?: string;
  /** 当前知识库 ID，目录结构操作按它提交。 */
  knowledgeId: number;
  /** 目录加载中占位。 */
  loading?: boolean;
  /** 业务目录树数据。 */
  nodes?: KnowledgeTreeNode[];
  /** 当前选中的节点键。 */
  selectedKeys?: Array<number | string>;
}

/** 最近选中的文件夹，作为新建子目录与上传的目标位置。 */
const selectedFolderNode = ref<KnowledgeTreeNode | null>(null);
const nodeMenuShow = ref(false);
const nodeMenuX = ref(0);
const nodeMenuY = ref(0);
const nodeMenuNode = ref<KnowledgeTreeNode | null>(null);
const draggingNode = ref<KnowledgeTreeNode | null>(null);
const createFolderOpen = ref(false);
const createFolderName = ref('');
const createFolderParentID = ref(0);
const createFolderLoading = ref(false);
const moveNodeOpen = ref(false);
const moveNodeTarget = ref(0);
const moveNodeLoading = ref(false);
const confirmDeleteOpen = ref(false);
const deleteTargetNode = ref<KnowledgeTreeNode | null>(null);
const deleteLoading = ref(false);

/** 批量勾选键独立于单选打开语义：单选仍由 selected-keys 驱动文档切换。 */
const checkedKeys = ref<Array<number | string>>([]);
const batchDeleteOpen = ref(false);
const batchDeleting = ref(false);
const batchRetrying = ref(false);

/** nodeIndex 把扁平键映射回业务节点，供批量操作还原目标对象。 */
const nodeIndex = computed(() => {
  const index = new Map<number, KnowledgeTreeNode>();
  const collect = (nodes: KnowledgeTreeNode[]) =>
    nodes.forEach((node) => {
      index.set(node.id, node);
      collect(node.children ?? []);
    });
  collect(props.nodes);
  return index;
});

/** 勾选节点对象列表；树刷新后仍按现存节点收敛，避免残留已删除键。 */
const checkedNodes = computed(() => checkedKeys.value.map((key) => nodeIndex.value.get(Number(key))).filter((node): node is KnowledgeTreeNode => !!node));
/** 只有文件可重试，文件夹勾选不影响重试可用性判断。 */
const checkedFileCount = computed(() => checkedNodes.value.filter((node) => node.nodeType !== 'folder').length);

/** handleCheckedChange 同步勾选集合。 */
function handleCheckedChange(keys: Array<number | string>) {
  checkedKeys.value = keys;
}

/** clearChecked 清空批量勾选并收起批量条。 */
function clearChecked() {
  checkedKeys.value = [];
}

/** batchRetrySelected 对勾选文件逐个提交重试；单个失败不中断其余提交。 */
async function batchRetrySelected() {
  if (!props.canWrite || batchRetrying.value) return;
  const files = checkedNodes.value.filter((node) => node.nodeType !== 'folder');
  if (files.length === 0) return;
  batchRetrying.value = true;
  let failedCount = 0;
  for (const node of files) {
    try {
      await Api.retryCompile(props.knowledgeId, 'all', { documentID: node.id });
    } catch {
      failedCount++;
    }
  }
  batchRetrying.value = false;
  if (failedCount > 0) emit('error', $t('knowledgeBase.text_fc908cfd6fb1', { arg0: failedCount }));
  const submitted = files.length - failedCount;
  if (submitted > 0) {
    clearChecked();
    emit('batchRetried', submitted);
  }
}

/** confirmBatchDelete 逐个删除勾选节点，部分失败时已删除项仍会刷新。 */
async function confirmBatchDelete() {
  if (batchDeleting.value) return;
  batchDeleting.value = true;
  const deletedNodes: KnowledgeTreeNode[] = [];
  for (const node of checkedNodes.value) {
    try {
      await Api.deleteNode(node.id);
      deletedNodes.push(node);
    } catch (error) {
      emit('error', getErrorMessage(error, $t('knowledgeBase.text_f90f11218658', { arg0: node.name })));
    }
  }
  batchDeleting.value = false;
  batchDeleteOpen.value = false;
  clearChecked();
  if (deletedNodes.length > 0) emit('batchDeleted', deletedNodes);
}

/** 树数据刷新后按现存节点收敛勾选，防止已删除节点残留在批量条。 */
watch(
  () => props.nodes,
  () => {
    if (checkedKeys.value.length === 0) return;
    const valid = new Set(nodeIndex.value.keys());
    checkedKeys.value = checkedKeys.value.filter((key) => valid.has(Number(key)));
  },
);

/** filterTreeNodes 按名称或路径过滤目录，并保留命中子项的父级。 */
function filterTreeNodes(nodes: KnowledgeTreeNode[], value: string): KnowledgeTreeNode[] {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return nodes;
  const result: KnowledgeTreeNode[] = [];
  for (const node of nodes) {
    const children = node.children ? filterTreeNodes(node.children, value) : undefined;
    const matched = `${node.name}\n${node.path}`.toLowerCase().includes(normalized);
    if (matched || children?.length) result.push({ ...node, children });
  }
  return result;
}

/** toTreeData 将业务目录转为 Naive Tree 需要的节点，并携带引用失效数量供角标渲染。 */
function toTreeData(nodes: KnowledgeTreeNode[]): UiTreeNode[] {
  const pending = props.fieldPendingSummary;
  return nodes.map((node) => ({
    children: node.children?.length ? toTreeData(node.children) : undefined,
    fieldPendingCount: pending[node.id] ?? 0,
    key: node.id,
    label: node.name,
    rawNode: node,
  }));
}

const treeData = computed(() => toTreeData(filterTreeNodes(props.nodes, props.keyword)));

/** renderTreePrefix 为文件夹和文档显示 Lucide 图标。 */
function renderTreePrefix({ option }: { option: TreeOption }) {
  const node = (option as UiTreeNode).rawNode;
  return h(node?.nodeType === 'folder' ? Folder : File, { class: 'size-4 text-muted-foreground' });
}

/** 长名称保持目录行高，悬停或键盘聚焦均可读取完整名称；失效角标随名称同行展示。 */
function renderTreeLabel({ option }: { option: TreeOption }) {
  const label = String(option.label || '');
  const pendingCount = (option as UiTreeNode).fieldPendingCount ?? 0;
  return h(
    Tooltip,
    {},
    {
      default: () => [
        h(
          TooltipTrigger,
          { asChild: true },
          {
            default: () =>
              h('span', { class: 'kb-tree-label', tabindex: 0 }, [
                label,
                pendingCount > 0
                  ? h(
                      Badge,
                      { class: 'ml-1 px-1.5 py-0 text-[10px]', variant: 'destructive' },
                      { default: () => $t('knowledgeBase.text_09caa8b1a9a7', { arg0: pendingCount }) },
                    )
                  : null,
              ]),
          },
        ),
        h(TooltipContent, { class: 'max-w-80 break-all' }, { default: () => label }),
      ],
    },
  );
}

/** openNodeMenu 打开文档树节点操作菜单。 */
function openNodeMenu(event: MouseEvent, node: KnowledgeTreeNode) {
  if (!props.canWrite) return;
  event.preventDefault();
  event.stopPropagation();
  nodeMenuNode.value = node;
  nodeMenuX.value = event.clientX;
  nodeMenuY.value = event.clientY;
  nodeMenuShow.value = true;
}

/** nodeProps 为目录节点注入右键菜单。 */
function nodeProps({ option }: { option: TreeOption }) {
  return {
    onContextmenu: (event: MouseEvent) => {
      const node = (option as UiTreeNode).rawNode;
      if (node) openNodeMenu(event, node);
    },
  };
}

/** renderTreeSuffix 为可写节点提供键盘可聚焦的更多入口。 */
function renderTreeSuffix({ option }: { option: TreeOption }) {
  if (!props.canWrite) return null;
  const node = (option as UiTreeNode).rawNode;
  if (!node) return null;
  return h(
    'button',
    {
      'aria-label': $t('knowledgeBase.text_f4b7d758a043', { arg0: node.name }),
      class: 'kb-node-more rounded px-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      onClick: (event: MouseEvent) => openNodeMenu(event, node),
      type: 'button',
    },
    '⋯',
  );
}

/** handleTreeSelect 选中文件时上抛切换文档，选中文件夹时仅记住后续上传位置。 */
function handleTreeSelect(_keys: Array<number | string>, options: Array<null | TreeOption>) {
  const node = (options[0] as UiTreeNode | undefined)?.rawNode;
  if (!node) return;
  if (node.nodeType === 'folder') {
    selectedFolderNode.value = node;
    emit('folderSelect', node);
    return;
  }
  selectedFolderNode.value = null;
  emit('folderSelect', null);
  emit('select', node);
}

const nodeMenuOptions = computed(() => {
  const node = nodeMenuNode.value;
  if (!node) return [];
  if (node.nodeType === 'folder') {
    return [
      { key: 'create-folder', label: $t('knowledgeBase.text_a48b8276f7d1') },
      { key: 'upload', label: $t('knowledgeBase.text_34b68421cf0f') },
      { key: 'move', label: $t('knowledgeBase.text_60f0d6d5b68f') },
      { key: 'delete', label: $t('knowledgeBase.text_3755f56f2f83') },
    ];
  }
  return [
    { key: 'move', label: $t('knowledgeBase.text_60f0d6d5b68f') },
    { key: 'delete', label: $t('knowledgeBase.text_3755f56f2f83') },
  ];
});

/** handleNodeMenuSelect 路由节点菜单操作。 */
function handleNodeMenuSelect(key: string) {
  nodeMenuShow.value = false;
  const node = nodeMenuNode.value;
  if (!node) return;
  switch (key) {
    case 'create-folder': {
      createFolderParentID.value = node.id;
      createFolderName.value = '';
      createFolderOpen.value = true;

      break;
    }
    case 'delete': {
      deleteTargetNode.value = node;
      confirmDeleteOpen.value = true;

      break;
    }
    case 'move': {
      moveNodeTarget.value = node.parentID || 0;
      moveNodeOpen.value = true;

      break;
    }
    case 'upload': {
      emit('uploadToFolder', node);

      break;
    }
    // No default
  }
}

/** openCreateFolder 打开新建文件夹对话框，默认建在最近选中的文件夹下。 */
function openCreateFolder() {
  createFolderParentID.value = selectedFolderNode.value?.id || 0;
  createFolderName.value = '';
  createFolderOpen.value = true;
}

/** submitCreateFolder 在指定父级下创建文件夹。 */
async function submitCreateFolder() {
  if (!createFolderName.value.trim()) return;
  createFolderLoading.value = true;
  try {
    await Api.createFolder(props.knowledgeId, createFolderName.value.trim(), createFolderParentID.value);
    createFolderOpen.value = false;
    emit('refresh');
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_6702d4c93221')));
  } finally {
    createFolderLoading.value = false;
  }
}

const moveTargetTreeData = computed(() => {
  const moving = nodeMenuNode.value;
  const build = (nodes: KnowledgeTreeNode[]): TreeOption[] =>
    nodes
      .filter((node) => node.nodeType === 'folder' && node.id !== moving?.id)
      .map((node) => ({ children: build(node.children ?? []), key: node.id, label: node.name }));
  return build(props.nodes);
});

/** submitMoveNode 将节点移动到选定文件夹或根目录。 */
async function submitMoveNode() {
  const node = nodeMenuNode.value;
  if (!node) return;
  moveNodeLoading.value = true;
  try {
    await Api.moveNode(node.id, moveNodeTarget.value);
    moveNodeOpen.value = false;
    emit('refresh');
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_5ff5a6803e86')));
  } finally {
    moveNodeLoading.value = false;
  }
}

/** confirmDeleteNode 删除已确认的文档或文件夹，刷新由工作台在 deleted 事件后统一执行。 */
async function confirmDeleteNode() {
  const node = deleteTargetNode.value;
  if (!node) return;
  deleteLoading.value = true;
  try {
    await Api.deleteNode(node.id);
    confirmDeleteOpen.value = false;
    emit('deleted', node);
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_72250c5922f2')));
  } finally {
    deleteLoading.value = false;
  }
}

/** isDescendant 防止拖拽将文件夹移入自身子树。 */
function isDescendant(candidateID: number, ancestor: KnowledgeTreeNode) {
  if (candidateID === ancestor.id) return true;
  const index = new Map<number, KnowledgeTreeNode>();
  const collect = (nodes: KnowledgeTreeNode[]) =>
    nodes.forEach((node) => {
      index.set(node.id, node);
      collect(node.children ?? []);
    });
  collect(props.nodes);
  let cursor = index.get(candidateID);
  while (cursor?.parentID) {
    if (cursor.parentID === ancestor.id) return true;
    cursor = index.get(cursor.parentID);
  }
  return false;
}

/** allowTreeDrop 校验目标类型与树环边界。 */
function allowTreeDrop({ dropPosition, node }: { dropPosition: string; node: TreeOption }) {
  const dragging = draggingNode.value;
  const target = (node as UiTreeNode).rawNode;
  if (!dragging || !target || dragging.id === target.id) return false;
  if (dropPosition === 'inside' && target.nodeType !== 'folder') return false;
  return !isDescendant(target.id, dragging);
}

/** handleTreeDragStart 记录当前拖拽节点，供落点校验与持久化使用。 */
function handleTreeDragStart({ node }: { node: TreeOption }) {
  draggingNode.value = (node as UiTreeNode).rawNode ?? null;
}

/** handleTreeDrop 将拖拽结果持久化，失败时请求刷新以回滚视图。 */
async function handleTreeDrop({ dropPosition, node }: { dragNode: TreeOption; dropPosition: string; node: TreeOption }) {
  const dragging = draggingNode.value;
  const target = (node as UiTreeNode).rawNode;
  draggingNode.value = null;
  if (!dragging || !target) return;
  const parentID = dropPosition === 'inside' ? target.id : target.parentID || 0;
  if (parentID === (dragging.parentID || 0)) return;
  try {
    await Api.moveNode(dragging.id, parentID);
    emit('refresh');
  } catch (error) {
    emit('error', getErrorMessage(error, $t('knowledgeBase.text_2e58a2354103')));
  }
}
</script>
<template>
  <aside class="kb-directory bg-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border shadow-sm">
    <div class="flex min-h-12 shrink-0 items-center justify-between border-b px-4 py-2">
      <h2 class="text-sm font-semibold">{{ $t('knowledgeBase.text_863a3341e3a2') }}</h2>
      <div v-if="canWrite" class="flex items-center gap-1">
        <Button variant="ghost" size="icon" class="kb-control size-7" :title="$t('knowledgeBase.text_95cf3cd4212b')" @click="openCreateFolder">
          <FolderPlus class="size-4" />
        </Button>
      </div>
    </div>
    <div class="shrink-0 px-4 py-3">
      <div class="relative">
        <Search class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          :model-value="keyword"
          class="h-8 pl-8"
          :placeholder="$t('knowledgeBase.text_36cd03a9203e')"
          @update:model-value="emit('update:keyword', String($event))"
        />
      </div>
    </div>
    <div v-if="error" class="bg-destructive/10 text-destructive m-2 rounded-md p-2 text-xs">{{ error }}</div>
    <NSpin :show="loading" class="min-h-0 flex-1 overflow-hidden">
      <Empty v-if="treeData.length === 0" class="min-h-48">
        <EmptyHeader>
          <EmptyTitle>{{ keyword ? $t('knowledgeBase.text_0fae2b99d48d') : $t('knowledgeBase.text_8613e7abb56d') }}</EmptyTitle>
          <EmptyDescription>{{ keyword ? $t('knowledgeBase.text_0f5eaeaed3dd') : $t('knowledgeBase.text_8a1536597aa0') }}</EmptyDescription>
        </EmptyHeader>
        <!-- 空态引导区分搜索无结果与整库为空：前者给清除入口，后者可写时直通上传。 -->
        <Button v-if="keyword" variant="outline" size="sm" class="kb-control mt-3" @click="emit('update:keyword', '')">{{
          $t('knowledgeBase.text_318ea18eede5')
        }}</Button>
        <Button v-else-if="canWrite" size="sm" class="kb-control mt-3" @click="emit('uploadToFolder', null)">
          <Upload class="size-4" /> {{ $t('knowledgeBase.text_955940df06e5') }}
        </Button>
      </Empty>
      <TooltipProvider v-else :delay-duration="300">
        <div class="kb-tree-scroll h-full overflow-y-auto overflow-x-hidden px-2 pb-2">
          <NTree
            :allow-drop="allowTreeDrop"
            block-line
            :checked-keys="canWrite ? checkedKeys : []"
            :checkable="canWrite"
            expand-on-click
            :data="treeData"
            :draggable="canWrite"
            :expanded-keys="expandedKeys"
            :node-props="nodeProps"
            :render-prefix="renderTreePrefix"
            :render-label="renderTreeLabel"
            :render-suffix="renderTreeSuffix"
            :selected-keys="selectedKeys"
            @dragend="draggingNode = null"
            @dragstart="handleTreeDragStart"
            @drop="handleTreeDrop"
            @update:checked-keys="handleCheckedChange"
            @update:expanded-keys="emit('update:expandedKeys', $event)"
            @update:selected-keys="handleTreeSelect"
          />
        </div>
      </TooltipProvider>
    </NSpin>

    <!-- 批量操作条：勾选即现，重试仅对文件生效，删除覆盖文件与文件夹。 -->
    <div
      v-if="canWrite && checkedNodes.length > 0"
      class="border-border bg-muted/40 flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2"
      data-testid="kb-tree-batch-bar"
    >
      <span class="text-xs font-medium">{{ $t('knowledgeBase.selectedItems', { count: checkedNodes.length }) }}</span>
      <div class="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          class="kb-control h-7 text-xs"
          :disabled="batchRetrying || checkedFileCount === 0"
          :title="checkedFileCount === 0 ? $t('knowledgeBase.text_596a961dbdcf') : undefined"
          @click="batchRetrySelected"
        >
          <LoaderCircle v-if="batchRetrying" class="size-3 animate-spin" /> {{ $t('knowledgeBase.text_f397fa1c2a51') }}
        </Button>
        <Button variant="destructive" size="sm" class="kb-control h-7 text-xs" :disabled="batchDeleting" @click="batchDeleteOpen = true">
          {{ $t('knowledgeBase.text_362aedce377d') }}
        </Button>
        <Button variant="ghost" size="sm" class="kb-control h-7 text-xs" @click="clearChecked">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
      </div>
    </div>

    <NDropdown
      trigger="manual"
      placement="bottom-start"
      :show="nodeMenuShow"
      :x="nodeMenuX"
      :y="nodeMenuY"
      :options="nodeMenuOptions"
      @clickoutside="nodeMenuShow = false"
      @select="handleNodeMenuSelect"
    />

    <Dialog :open="createFolderOpen" @update:open="createFolderOpen = $event">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_95cf3cd4212b') }}</DialogTitle>
          <DialogDescription>{{ $t('knowledgeBase.text_c6850e096a4c') }}</DialogDescription>
        </DialogHeader>
        <Input v-model="createFolderName" :placeholder="$t('knowledgeBase.text_6af274b8d873')" @keyup.enter="submitCreateFolder" />
        <DialogFooter>
          <Button variant="outline" @click="createFolderOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button :disabled="createFolderLoading" @click="submitCreateFolder" class="kb-control">{{ $t('knowledgeBase.text_fcbd0932929e') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="moveNodeOpen" @update:open="moveNodeOpen = $event">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_ac9d34fdc612') }}</DialogTitle>
          <DialogDescription>{{ $t('knowledgeBase.text_7f5356a90d3a') }}</DialogDescription>
        </DialogHeader>
        <div class="max-h-72 overflow-auto rounded-lg border p-2">
          <NTree
            block-line
            :data="moveTargetTreeData"
            :selected-keys="moveNodeTarget ? [moveNodeTarget] : []"
            @update:selected-keys="(keys: Array<number | string>) => (moveNodeTarget = Number(keys[0] || 0))"
          />
        </div>
        <Button variant="ghost" size="sm" @click="moveNodeTarget = 0" class="kb-control">{{ $t('knowledgeBase.text_371858643608') }}</Button>
        <DialogFooter>
          <Button variant="outline" @click="moveNodeOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button :disabled="moveNodeLoading" @click="submitMoveNode" class="kb-control">{{ $t('knowledgeBase.text_591f3aa55fda') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="confirmDeleteOpen" @update:open="confirmDeleteOpen = $event">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{
            deleteTargetNode?.nodeType === 'folder' ? $t('knowledgeBase.text_0bc1638f0cda') : $t('knowledgeBase.text_e7adbd575b98')
          }}</DialogTitle>
          <DialogDescription>{{ $t('knowledgeBase.confirmNodeDelete', { name: deleteTargetNode?.name || '' }) }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDeleteOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button variant="destructive" :disabled="deleteLoading" @click="confirmDeleteNode" class="kb-control">{{
            $t('knowledgeBase.text_3c06abe11651')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="batchDeleteOpen" @update:open="batchDeleteOpen = $event">
      <DialogContent class="kb-ui p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ $t('knowledgeBase.text_362aedce377d') }}</DialogTitle>
          <DialogDescription
            >{{ $t('knowledgeBase.confirmBatchDelete', { count: checkedNodes.length }) }}</DialogDescription
          >
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="batchDeleteOpen = false" class="kb-control">{{ $t('knowledgeBase.text_4d0b4688c787') }}</Button>
          <Button variant="destructive" :disabled="batchDeleting" @click="confirmBatchDelete" class="kb-control">{{
            $t('knowledgeBase.text_3c06abe11651')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </aside>
</template>

<style scoped>
:deep(.n-tree-node .kb-node-more) {
  opacity: 0;
  transition: opacity 200ms;
}

:deep(.n-tree-node:hover .kb-node-more),
:deep(.n-tree-node .kb-node-more:focus-visible) {
  opacity: 1;
}
</style>
