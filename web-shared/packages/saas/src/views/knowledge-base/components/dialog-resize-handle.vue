<!-- 文件说明：弹层右缘宽度拖拽手柄，拖拽逻辑委托父级 useDialogWidth.startResize。 -->
<script setup lang="ts">
/** resizeStart 上抛 pointerdown 事件，由父级持有并驱动 useDialogWidth。 */
const emit = defineEmits<{ resizeStart: [event: PointerEvent] }>();
</script>
<template>
  <div
    class="hover:bg-primary/50 bg-border/60 absolute inset-y-2 right-0 z-10 w-1.5 cursor-col-resize rounded-full"
    role="separator"
    aria-orientation="vertical"
    aria-label="拖拽调整弹层宽度"
    data-testid="kb-dialog-resize-handle"
    @pointerdown="emit('resizeStart', $event)"
  ></div>
</template>
