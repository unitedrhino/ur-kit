<script setup lang="ts">
import type { TransferOption } from './types';

import { computed, ref } from 'vue';

import {
  Button,
  Checkbox,
  Input,
  ScrollArea,
  VbenCheckButtonGroup,
  VbenIcon,
} from '@vben-core/shadcn-ui';

defineOptions({ name: 'Transfer' });

/** 物模型类型 1:属性 2:事件 3:行为 */
const SCHEMA_TYPE_OPTIONS = [
  { value: 1, label: '属性' },
  { value: 2, label: '事件' },
  { value: 3, label: '行为' },
];

const props = withDefaults(
  defineProps<{
    options: TransferOption[];
    modelValue: string[];
    sourceFilterable?: boolean;
    targetFilterable?: boolean;
    sourceTitle?: string;
    targetTitle?: string;
    filterPlaceholder?: string;
    emptyText?: string;
    class?: string;
    /** 是否显示物模型类型筛选（types 多选） */
    showTypesFilter?: boolean;
    /** 选中的物模型类型，用于 API CommonSchemaGetListReq.types */
    typesFilter?: number[];
    /** 自定义物模型类型选项，可禁用特定类型 */
    typesFilterOptions?: { value: number; label: string; disabled?: boolean }[];
    /** 类型筛选是否允许多选，默认 true，多选；false 时呈现单选（Radio）效果 */
    typesFilterMultiple?: boolean;
    /**
     * 按哪个字段分组（如 "description" 表示按模块名分组）。
     * 设置后列表按组显示，每组标题可折叠，支持一键选中整组。
     */
    groupBy?: string;
  }>(),
  {
    sourceFilterable: true,
    targetFilterable: true,
    sourceTitle: '可选',
    targetTitle: '已选',
    filterPlaceholder: '请输入搜索内容',
    emptyText: '暂无数据',
    showTypesFilter: false,
    typesFilter: () => [1, 2, 3],
    typesFilterMultiple: true,
    groupBy: undefined,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'update:typesFilter', value: number[]): void;
}>();

const typesFilterModel = computed({
  get: () => props.typesFilter ?? [],
  set: (v) => emit('update:typesFilter', v ?? []),
});

const typesFilterOptions = computed(() => {
  const sourceOptions =
    props.typesFilterOptions && props.typesFilterOptions.length > 0
      ? props.typesFilterOptions
      : SCHEMA_TYPE_OPTIONS;
  return sourceOptions.map((item) => ({
    disabled: false,
    ...item,
  }));
});

const typesFilterControlValue = computed({
  get: () => {
    if (props.typesFilterMultiple) {
      return typesFilterModel.value;
    }
    return typesFilterModel.value[0] ?? undefined;
  },
  set: (val) => {
    if (props.typesFilterMultiple) {
      typesFilterModel.value = Array.isArray(val) ? (val as number[]) : [];
      return;
    }
    if (Array.isArray(val)) {
      typesFilterModel.value = val.slice(0, 1);
    } else if (val === undefined) {
      typesFilterModel.value = [];
    } else {
      typesFilterModel.value = [val as number];
    }
  },
});

const targetKeys = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const sourceFilter = ref('');
const targetFilter = ref('');
const selectedSourceKeys = ref<Set<string>>(new Set());
const selectedTargetKeys = ref<Set<string>>(new Set());

/** 折叠的分组 key（source 侧） */
const collapsedSourceGroups = ref<Set<string>>(new Set());
/** 折叠的分组 key（target 侧） */
const collapsedTargetGroups = ref<Set<string>>(new Set());

function matchFilter(text: string, q: string) {
  const t = (text ?? '').trim().toLowerCase();
  const k = (q ?? '').trim().toLowerCase();
  if (!k) return true;
  return t.includes(k);
}

const sourceList = computed(() => {
  const keys = new Set(targetKeys.value);
  return props.options.filter((o) => !keys.has(o.value));
});

const targetList = computed(() => {
  const keys = new Set(targetKeys.value);
  return props.options.filter((o) => keys.has(o.value));
});

const filteredSource = computed(() => {
  if (!props.sourceFilterable) return sourceList.value;
  return sourceList.value.filter(
    (o) =>
      matchFilter(o.label, sourceFilter.value) ||
      matchFilter(o.description ?? '', sourceFilter.value),
  );
});

const filteredTarget = computed(() => {
  if (!props.targetFilterable) return targetList.value;
  return targetList.value.filter(
    (o) =>
      matchFilter(o.label, targetFilter.value) ||
      matchFilter(o.description ?? '', targetFilter.value),
  );
});

/** 按 groupBy 字段分组，返回有序 Map<groupName, items[]> */
function buildGroups(items: TransferOption[]): Map<string, TransferOption[]> {
  const groups = new Map<string, TransferOption[]>();
  for (const item of items) {
    const key = ((item as any)[props.groupBy!] as string | undefined) || '其他';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

const sourceGroups = computed(() =>
  props.groupBy ? buildGroups(filteredSource.value) : new Map<string, TransferOption[]>(),
);

const targetGroups = computed(() =>
  props.groupBy ? buildGroups(filteredTarget.value) : new Map<string, TransferOption[]>(),
);

// ---------- 全选逻辑（平铺模式） ----------

const sourceAllChecked = computed(() => {
  const ids = filteredSource.value.map((o) => o.value);
  if (ids.length === 0) return false;
  return ids.every((id) => selectedSourceKeys.value.has(id));
});

const sourceSomeChecked = computed(() => {
  const ids = filteredSource.value.map((o) => o.value);
  if (ids.length === 0) return false;
  const sel = selectedSourceKeys.value;
  return ids.some((id) => sel.has(id)) && !ids.every((id) => sel.has(id));
});

const targetAllChecked = computed(() => {
  const ids = filteredTarget.value.map((o) => o.value);
  if (ids.length === 0) return false;
  return ids.every((id) => selectedTargetKeys.value.has(id));
});

const targetSomeChecked = computed(() => {
  const ids = filteredTarget.value.map((o) => o.value);
  if (ids.length === 0) return false;
  const sel = selectedTargetKeys.value;
  return ids.some((id) => sel.has(id)) && !ids.every((id) => sel.has(id));
});

function toggleSourceAll(checked: boolean | 'indeterminate') {
  const ids = filteredSource.value.map((o) => o.value);
  const next = new Set(selectedSourceKeys.value);
  if (checked === true) ids.forEach((id) => next.add(id));
  else ids.forEach((id) => next.delete(id));
  selectedSourceKeys.value = next;
}

function toggleTargetAll(checked: boolean | 'indeterminate') {
  const ids = filteredTarget.value.map((o) => o.value);
  const next = new Set(selectedTargetKeys.value);
  if (checked === true) ids.forEach((id) => next.add(id));
  else ids.forEach((id) => next.delete(id));
  selectedTargetKeys.value = next;
}

// ---------- 分组模式辅助 ----------

function isGroupAllChecked(items: TransferOption[], selectedKeys: Set<string>): boolean {
  return items.length > 0 && items.every((o) => selectedKeys.has(o.value));
}

function isGroupSomeChecked(items: TransferOption[], selectedKeys: Set<string>): boolean {
  return (
    items.some((o) => selectedKeys.has(o.value)) &&
    !items.every((o) => selectedKeys.has(o.value))
  );
}

function toggleGroupSourceKeys(items: TransferOption[], checked: boolean | 'indeterminate') {
  const next = new Set(selectedSourceKeys.value);
  if (checked === true) items.forEach((o) => next.add(o.value));
  else items.forEach((o) => next.delete(o.value));
  selectedSourceKeys.value = next;
}

function toggleGroupTargetKeys(items: TransferOption[], checked: boolean | 'indeterminate') {
  const next = new Set(selectedTargetKeys.value);
  if (checked === true) items.forEach((o) => next.add(o.value));
  else items.forEach((o) => next.delete(o.value));
  selectedTargetKeys.value = next;
}

function toggleSourceGroupCollapse(groupName: string) {
  const next = new Set(collapsedSourceGroups.value);
  if (next.has(groupName)) next.delete(groupName);
  else next.add(groupName);
  collapsedSourceGroups.value = next;
}

function toggleTargetGroupCollapse(groupName: string) {
  const next = new Set(collapsedTargetGroups.value);
  if (next.has(groupName)) next.delete(groupName);
  else next.add(groupName);
  collapsedTargetGroups.value = next;
}

// ---------- 单项勾选 ----------

function toggleSource(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedSourceKeys.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedSourceKeys.value = next;
}

function toggleTarget(id: string, checked: boolean | 'indeterminate') {
  const next = new Set(selectedTargetKeys.value);
  if (checked === true) next.add(id);
  else next.delete(id);
  selectedTargetKeys.value = next;
}

// ---------- 穿梭操作 ----------

function addSelected() {
  const add = [...selectedSourceKeys.value];
  targetKeys.value = [...new Set([...targetKeys.value, ...add])];
  selectedSourceKeys.value = new Set();
}

function removeSelected() {
  const remove = [...selectedTargetKeys.value];
  const set = new Set(targetKeys.value);
  remove.forEach((id) => set.delete(id));
  targetKeys.value = [...set];
  selectedTargetKeys.value = new Set();
}

const canAdd = computed(() => selectedSourceKeys.value.size > 0);
const canRemove = computed(() => selectedTargetKeys.value.size > 0);
</script>

<template>
  <div
    :class="props.class"
    class="grid min-h-[280px] grid-cols-[1fr_auto_1fr] gap-4"
  >
    <!-- 可选 -->
    <div
      class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
    >
      <div class="flex flex-none items-center gap-2 border-b border-border px-3 py-2">
        <Checkbox
          :checked="sourceAllChecked"
          :indeterminate="sourceSomeChecked"
          :aria-label="`全选${sourceTitle}`"
          class="shrink-0"
          @update:checked="toggleSourceAll"
        />
        <span class="text-sm font-medium">{{ sourceTitle }}</span>
        <span class="text-muted-foreground text-xs">
          {{ selectedSourceKeys.size }}/{{ sourceList.length }} 项
        </span>
      </div>
      <div
        v-if="sourceFilterable || showTypesFilter"
        class="flex flex-col gap-1.5 px-2 py-1.5"
      >
        <div class="flex min-w-0 items-center gap-2">
          <div
            v-if="sourceFilterable"
            class="relative min-w-0 flex-1"
          >
            <VbenIcon
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              icon="lucide:search"
            />
            <Input
              v-model="sourceFilter"
              :aria-label="`搜索${sourceTitle}`"
              :placeholder="filterPlaceholder"
              class="h-9 pl-8"
            />
          </div>
          <div
            v-if="showTypesFilter"
            class="flex h-9 shrink-0 items-center gap-2 rounded-md border border-border/60 bg-muted/60 px-2"
            aria-label="物模型类型筛选"
            role="group"
          >
            <span class="text-xs font-medium text-muted-foreground">类型</span>
            <VbenCheckButtonGroup
              v-model="typesFilterControlValue"
              :options="typesFilterOptions"
              :multiple="props.typesFilterMultiple"
              :show-icon="false"
              class="flex h-full items-center rounded-md bg-card/60"
              btn-class="h-7 px-3 text-xs rounded-none first:rounded-l-md last:rounded-r-md [&:not(:first-child)]:-ml-px"
            />
          </div>
        </div>
      </div>
      <ScrollArea class="min-h-0 flex-1 px-1 pb-2">
        <!-- 分组模式 -->
        <template v-if="groupBy">
          <div
            v-for="[groupName, groupItems] in sourceGroups"
            :key="groupName"
            class="mb-0.5"
          >
            <!-- 分组标题行 -->
            <div
              class="bg-muted/40 hover:bg-muted/70 flex cursor-pointer select-none items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors duration-150"
              @click="toggleSourceGroupCollapse(groupName)"
            >
              <Checkbox
                :checked="isGroupAllChecked(groupItems, selectedSourceKeys)"
                :indeterminate="isGroupSomeChecked(groupItems, selectedSourceKeys)"
                class="shrink-0"
                aria-label="选中整组"
                @update:checked="(v) => toggleGroupSourceKeys(groupItems, v)"
                @click.stop
              />
              <VbenIcon
                :icon="collapsedSourceGroups.has(groupName) ? 'lucide:chevron-right' : 'lucide:chevron-down'"
                class="text-muted-foreground size-3 shrink-0"
              />
              <span class="min-w-0 flex-1 truncate text-xs font-semibold">{{ groupName }}</span>
              <span class="text-muted-foreground shrink-0 text-xs">{{ groupItems.length }}</span>
            </div>
            <!-- 分组条目 -->
            <ul
              v-if="!collapsedSourceGroups.has(groupName)"
              class="ml-3 flex flex-col gap-0.5"
            >
              <li
                v-for="o in groupItems"
                :key="o.value"
                class="rounded-md transition-colors duration-200 motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
              >
                <label
                  :for="`src-${o.value}`"
                  class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-left"
                >
                  <Checkbox
                    :id="`src-${o.value}`"
                    :checked="selectedSourceKeys.has(o.value)"
                    aria-label="选择"
                    class="shrink-0"
                    @update:checked="(v) => toggleSource(o.value, v)"
                  />
                  <span class="min-w-0 flex-1">
                    <slot name="item" :option="o">
                      <span class="block truncate text-sm">{{ o.label }}</span>
                    </slot>
                  </span>
                </label>
              </li>
            </ul>
          </div>
          <div
            v-if="sourceGroups.size === 0"
            class="text-muted-foreground py-8 text-center text-sm"
            role="status"
          >
            {{ emptyText }}
          </div>
        </template>
        <!-- 平铺模式（默认） -->
        <template v-else>
          <ul class="flex flex-col gap-0.5">
            <li
              v-for="o in filteredSource"
              :key="o.value"
              class="rounded-md transition-colors duration-200 motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
            >
              <label
                :for="`src-${o.value}`"
                class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-left"
              >
                <Checkbox
                  :id="`src-${o.value}`"
                  :checked="selectedSourceKeys.has(o.value)"
                  aria-label="选择"
                  class="shrink-0"
                  @update:checked="(v) => toggleSource(o.value, v)"
                />
                <span class="min-w-0 flex-1">
                  <slot name="item" :option="o">
                    <span class="block truncate text-sm">{{ o.label }}</span>
                    <span
                      v-if="o.description"
                      class="text-muted-foreground block truncate text-xs"
                    >
                      {{ o.description }}
                    </span>
                  </slot>
                </span>
              </label>
            </li>
            <li
              v-if="filteredSource.length === 0"
              class="text-muted-foreground py-8 text-center text-sm"
              role="status"
            >
              {{ emptyText }}
            </li>
          </ul>
        </template>
      </ScrollArea>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-col items-center justify-center gap-2 self-center">
      <Button
        :disabled="!canAdd"
        aria-label="添加选中项到已选"
        class="transition-colors duration-200 motion-reduce:transition-none"
        size="icon"
        variant="default"
        @click="addSelected"
      >
        <VbenIcon class="size-4" icon="lucide:chevron-right" />
      </Button>
      <Button
        :disabled="!canRemove"
        aria-label="从已选移除选中项"
        class="transition-colors duration-200 motion-reduce:transition-none"
        size="icon"
        variant="outline"
        @click="removeSelected"
      >
        <VbenIcon class="size-4" icon="lucide:chevron-left" />
      </Button>
    </div>

    <!-- 已选 -->
    <div
      class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
    >
      <div class="flex flex-none items-center gap-2 border-b border-border px-3 py-2">
        <Checkbox
          :checked="targetAllChecked"
          :indeterminate="targetSomeChecked"
          :aria-label="`全选${targetTitle}`"
          class="shrink-0"
          @update:checked="toggleTargetAll"
        />
        <span class="text-sm font-medium">{{ targetTitle }}</span>
        <span class="text-muted-foreground text-xs">
          {{ selectedTargetKeys.size }}/{{ targetList.length }} 项
        </span>
      </div>
      <div v-if="targetFilterable" class="flex-none px-2 py-1.5">
        <div class="relative">
          <VbenIcon
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            icon="lucide:search"
          />
          <Input
            v-model="targetFilter"
            :aria-label="`搜索${targetTitle}`"
            :placeholder="filterPlaceholder"
            class="h-9 pl-8"
          />
        </div>
      </div>
      <ScrollArea class="min-h-0 flex-1 px-1 pb-2">
        <!-- 分组模式 -->
        <template v-if="groupBy">
          <div
            v-for="[groupName, groupItems] in targetGroups"
            :key="groupName"
            class="mb-0.5"
          >
            <!-- 分组标题行 -->
            <div
              class="bg-muted/40 hover:bg-muted/70 flex cursor-pointer select-none items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors duration-150"
              @click="toggleTargetGroupCollapse(groupName)"
            >
              <Checkbox
                :checked="isGroupAllChecked(groupItems, selectedTargetKeys)"
                :indeterminate="isGroupSomeChecked(groupItems, selectedTargetKeys)"
                class="shrink-0"
                aria-label="选中整组"
                @update:checked="(v) => toggleGroupTargetKeys(groupItems, v)"
                @click.stop
              />
              <VbenIcon
                :icon="collapsedTargetGroups.has(groupName) ? 'lucide:chevron-right' : 'lucide:chevron-down'"
                class="text-muted-foreground size-3 shrink-0"
              />
              <span class="min-w-0 flex-1 truncate text-xs font-semibold">{{ groupName }}</span>
              <span class="text-muted-foreground shrink-0 text-xs">{{ groupItems.length }}</span>
            </div>
            <!-- 分组条目 -->
            <ul
              v-if="!collapsedTargetGroups.has(groupName)"
              class="ml-3 flex flex-col gap-0.5"
            >
              <li
                v-for="o in groupItems"
                :key="o.value"
                class="rounded-md transition-colors duration-200 motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
              >
                <label
                  :for="`tgt-${o.value}`"
                  class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-left"
                >
                  <Checkbox
                    :id="`tgt-${o.value}`"
                    :checked="selectedTargetKeys.has(o.value)"
                    aria-label="选择"
                    class="shrink-0"
                    @update:checked="(v) => toggleTarget(o.value, v)"
                  />
                  <span class="min-w-0 flex-1">
                    <slot name="item" :option="o">
                      <span class="block truncate text-sm">{{ o.label }}</span>
                    </slot>
                  </span>
                </label>
              </li>
            </ul>
          </div>
          <div
            v-if="targetGroups.size === 0"
            class="text-muted-foreground py-8 text-center text-sm"
            role="status"
          >
            {{ emptyText }}
          </div>
        </template>
        <!-- 平铺模式（默认） -->
        <template v-else>
          <ul class="flex flex-col gap-0.5">
            <li
              v-for="o in filteredTarget"
              :key="o.value"
              class="rounded-md transition-colors duration-200 motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
            >
              <label
                :for="`tgt-${o.value}`"
                class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-left"
              >
                <Checkbox
                  :id="`tgt-${o.value}`"
                  :checked="selectedTargetKeys.has(o.value)"
                  aria-label="选择"
                  class="shrink-0"
                  @update:checked="(v) => toggleTarget(o.value, v)"
                />
                <span class="min-w-0 flex-1">
                  <slot name="item" :option="o">
                    <span class="block truncate text-sm">{{ o.label }}</span>
                    <span
                      v-if="o.description"
                      class="text-muted-foreground block truncate text-xs"
                    >
                      {{ o.description }}
                    </span>
                  </slot>
                </span>
              </label>
            </li>
            <li
              v-if="filteredTarget.length === 0"
              class="text-muted-foreground py-8 text-center text-sm"
              role="status"
            >
              {{ emptyText }}
            </li>
          </ul>
        </template>
      </ScrollArea>
    </div>
  </div>
</template>
