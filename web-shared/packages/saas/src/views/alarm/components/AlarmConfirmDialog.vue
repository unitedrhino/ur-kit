<script setup lang="ts">
/**
 * 文件说明：告警管理统一确认弹窗
 * 以 saas-ui/shadcn Dialog 承载删除、解除模板绑定等需要二次确认的操作。
 */
import { Button } from '@unitedrhino/saas-ui/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unitedrhino/saas-ui/ui/dialog';

/** 组件属性描述确认弹窗的可见状态和操作文案。 */
defineProps<{
  confirmText?: string;
  description: string;
  open: boolean;
  title: string;
}>();

/** 组件事件用于同步弹窗状态并提交用户确认。 */
const emit = defineEmits<{
  confirm: [];
  'update:open': [value: boolean];
}>();

/** confirm 完成确认并关闭当前弹窗。 */
function confirm() {
  emit('confirm');
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
        <Button variant="destructive" @click="confirm">{{ confirmText || '确认' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
