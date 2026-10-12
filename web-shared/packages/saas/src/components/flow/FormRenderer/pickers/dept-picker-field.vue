<!--
  文件说明：FormRenderer — 选部门字段控件（component=dept）。
  Popover 弹层渲染部门树（SystemDeptApi.getDeptList，@vben/saas/api），
  支持单选/多选；值为 deptID 字符串（多选为 string[]，见设计方案 2.6）。
-->
<script setup lang="ts">
import type { SystemDeptApi } from '../../../../api/system/dept';

import { computed, onMounted, ref } from 'vue';

import { Button } from '@unitedrhino/saas-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@unitedrhino/saas-ui/ui/popover';
import { ScrollArea } from '@unitedrhino/saas-ui/ui/scroll-area';

import { getDeptList } from '../../../../api/system/dept';
import DeptTreeNode from './dept-tree-node.vue';

const props = withDefaults(
  defineProps<{
    /** 是否禁用（只读态） */
    disabled?: boolean;
    /** 选中值：deptID 字符串，multiple 时为 string[] */
    modelValue?: string | string[];
    /** 是否多选 */
    multiple?: boolean;
    /** 占位文案 */
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    multiple: false,
    disabled: false,
    placeholder: '点击选择部门',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined];
}>();

/** 弹层开关 */
const open = ref(false);
/** 部门树 */
const deptTree = ref<SystemDeptApi.SystemDept[]>([]);
/** 加载中 */
const loading = ref(false);
/** 名称缓存（deptID → name，用于回显） */
const nameCache = ref<Map<string, string>>(new Map());

/** 已选值集合（统一转数组处理） */
const selectedIds = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue;
  return props.modelValue ? [props.modelValue] : [];
});

/** 已选展示文案 */
const displayText = computed(() => {
  const ids = selectedIds.value;
  if (ids.length === 0) return '';
  return ids.map((id) => nameCache.value.get(id) || id).join('、');
});

/** cacheDept 递归缓存部门名称。 */
function cacheDept(list: SystemDeptApi.SystemDept[]) {
  for (const dept of list) {
    nameCache.value.set(dept.id, dept.name);
    if (dept.children?.length) cacheDept(dept.children);
  }
}

/** loadDepts 拉取部门树（组件挂载时）。 */
async function loadDepts() {
  loading.value = true;
  try {
    deptTree.value = await getDeptList();
    cacheDept(deptTree.value);
  } finally {
    loading.value = false;
  }
}

/** removeSelected 移除一个已选部门。 */
function removeSelected(id: string) {
  if (props.multiple) {
    emit(
      'update:modelValue',
      selectedIds.value.filter((v) => v !== id),
    );
  } else {
    emit('update:modelValue', undefined);
  }
}

/** onSingleSelect 单选模式选中部门并收起弹层。 */
function onSingleSelect(dept: SystemDeptApi.SystemDept) {
  emit('update:modelValue', dept.id);
  open.value = false;
}

onMounted(() => {
  void loadDepts();
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" role="combobox" class="w-full justify-between font-normal" :disabled="props.disabled">
          <span :class="displayText ? 'text-foreground' : 'text-muted-foreground'">
            {{ displayText || props.placeholder }}
          </span>
          <span class="icon-[carbon--chevron-down] size-4 shrink-0 opacity-50" aria-hidden="true"></span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-72 p-0" align="start">
        <ScrollArea class="h-64">
          <div v-if="loading" class="text-muted-foreground p-4 text-center text-sm">加载中...</div>
          <div v-else-if="deptTree.length === 0" class="text-muted-foreground p-4 text-center text-sm">暂无部门</div>
          <DeptTreeNode
            v-else
            :nodes="deptTree"
            :selected-ids="selectedIds"
            :multiple="props.multiple"
            :depth="0"
            @select="onSingleSelect"
            @check="(d, c) => emit('update:modelValue', c === true ? [...selectedIds, d.id] : selectedIds.filter((v) => v !== d.id))"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <!-- 多选已选标签 -->
    <template v-if="props.multiple && selectedIds.length > 0">
      <span v-for="id in selectedIds" :key="id" class="bg-muted text-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
        {{ nameCache.get(id) || id }}
        <button v-if="!props.disabled" type="button" class="text-muted-foreground hover:text-foreground" @click="removeSelected(id)">×</button>
      </span>
    </template>
  </div>
</template>
