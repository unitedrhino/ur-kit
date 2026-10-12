<!--
  文件说明：FormRenderer — 部门树递归节点（dept-picker-field 内部组件）。
  单选模式点击行触发 select；多选模式行内 Checkbox 触发 check。
-->
<script setup lang="ts">
import type { SystemDeptApi } from '../../../../api/system/dept';

import { Checkbox } from '@unitedrhino/saas-ui/ui/checkbox';

defineOptions({ name: 'DeptTreeNode' });

defineProps<{
  /** 树层级（控制缩进） */
  depth: number;
  /** 是否多选 */
  multiple: boolean;
  /** 当前层级的部门节点列表 */
  nodes: SystemDeptApi.SystemDept[];
  /** 已选部门 id 集合 */
  selectedIds: string[];
}>();

const emit = defineEmits<{
  /** 多选模式切换某个部门勾选态 */
  check: [dept: SystemDeptApi.SystemDept, checked: boolean];
  /** 单选模式选中某个部门 */
  select: [dept: SystemDeptApi.SystemDept];
}>();
</script>

<template>
  <div>
    <template v-for="dept in nodes" :key="dept.id">
      <div
        class="hover:bg-accent flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm"
        :style="{ paddingLeft: `${12 + depth * 16}px` }"
        @click="multiple ? emit('check', dept, !selectedIds.includes(dept.id)) : emit('select', dept)"
      >
        <Checkbox v-if="multiple" :model-value="selectedIds.includes(dept.id)" class="pointer-events-none mr-1" />
        <span class="flex-1 truncate">{{ dept.name }}</span>
        <span v-if="!multiple && selectedIds.includes(dept.id)" class="icon-[carbon--checkmark] text-primary size-4 shrink-0" aria-hidden="true"></span>
      </div>
      <DeptTreeNode
        v-if="dept.children?.length"
        :nodes="dept.children"
        :selected-ids="selectedIds"
        :multiple="multiple"
        :depth="depth + 1"
        @select="(d) => emit('select', d)"
        @check="(d, c) => emit('check', d, c)"
      />
    </template>
  </div>
</template>
