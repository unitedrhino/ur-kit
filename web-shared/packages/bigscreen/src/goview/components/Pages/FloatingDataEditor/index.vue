<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { icon } from '@/plugins';
import { useWindowSize } from '@vueuse/core';

import { useFloatingPreview } from './useFloatingPreview';
import { ensureFloatingZIndex, getNextFloatingZIndex } from './useFloatingZIndex';

type SizeType = number | string;

const props = withDefaults(
  defineProps<{
    autoCloseOnConfirm?: boolean;
    height?: SizeType;
    livePreview?: boolean;
    minHeight?: number;
    minWidth?: number;
    previewDebounce?: number;
    showLivePreview?: boolean;
    title?: string;
    visible?: boolean;
    width?: SizeType;
    zIndex?: number;
  }>(),
  {
    autoCloseOnConfirm: true,
    height: 600,
    livePreview: false,
    minHeight: 300,
    minWidth: 400,
    previewDebounce: 300,
    showLivePreview: true,
    /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return editorT('bigscreenEditor.ui.dataEditor'); },
    visible: false,
    width: 800,
    zIndex: 9999,
  },
);

const emit = defineEmits<{
  (e: 'apply'): void;
  (e: 'cancel'): void;
  (e: 'confirm'): void;
  (e: 'previewApply'): void;
  (e: 'update:livePreview', value: boolean): void;
  (e: 'update:visible', value: boolean): void;
}>();

const { CloseIcon } = icon.ionicons5;

const panelRef = ref<HTMLDivElement | null>(null);
const headerRef = ref<HTMLDivElement | null>(null);

const visibleModel = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const livePreviewModel = computed({
  get: () => props.livePreview,
  set: (value: boolean) => emit('update:livePreview', value),
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const parseSize = (value: SizeType, viewport: number, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = Number.parseFloat(trimmed.slice(0, -1));
      if (!Number.isNaN(percent)) return (viewport * percent) / 100;
    }
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
};

const resolveInitialRect = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = clamp(Math.round(parseSize(props.width, viewportWidth, 800)), props.minWidth, Math.max(props.minWidth, viewportWidth - 24));
  const height = clamp(Math.round(parseSize(props.height, viewportHeight, 600)), props.minHeight, Math.max(props.minHeight, viewportHeight - 24));
  const x = Math.max(12, Math.round((viewportWidth - width) / 2));
  const y = Math.max(12, Math.round((viewportHeight - height) / 2));
  return { x, y, width, height };
};

const rect = ref(resolveInitialRect());
const initialized = ref(false);
const currentZIndex = ref(ensureFloatingZIndex(props.zIndex));
const { width: windowWidth, height: windowHeight } = useWindowSize();

const dragState = ref({ startX: 0, startY: 0, x: 0, y: 0 });
const resizeState = ref({ height: 0, startX: 0, startY: 0, width: 0 });
const isDragging = ref(false);
const isResizing = ref(false);

const constrainRect = () => {
  const maxX = Math.max(12, window.innerWidth - rect.value.width - 12);
  const maxY = Math.max(12, window.innerHeight - rect.value.height - 12);
  rect.value.x = clamp(rect.value.x, 12, maxX);
  rect.value.y = clamp(rect.value.y, 12, maxY);
};

const bringToFront = () => {
  currentZIndex.value = getNextFloatingZIndex();
};

const onDragMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  const nextX = dragState.value.x + (event.clientX - dragState.value.startX);
  const nextY = dragState.value.y + (event.clientY - dragState.value.startY);
  const maxX = Math.max(12, window.innerWidth - rect.value.width - 12);
  const maxY = Math.max(12, window.innerHeight - rect.value.height - 12);
  rect.value.x = clamp(nextX, 12, maxX);
  rect.value.y = clamp(nextY, 12, maxY);
};

const onDragEnd = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
};

const startDrag = (event: MouseEvent) => {
  if (event.button !== 0) return;
  if (!headerRef.value) return;
  bringToFront();
  isDragging.value = true;
  dragState.value = {
    startX: event.clientX,
    startY: event.clientY,
    x: rect.value.x,
    y: rect.value.y,
  };
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
};

const onResizeMove = (event: MouseEvent) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - resizeState.value.startX;
  const deltaY = event.clientY - resizeState.value.startY;

  const nextWidth = resizeState.value.width + deltaX;
  const nextHeight = resizeState.value.height + deltaY;
  const maxWidth = Math.max(props.minWidth, window.innerWidth - rect.value.x - 12);
  const maxHeight = Math.max(props.minHeight, window.innerHeight - rect.value.y - 12);

  rect.value.width = clamp(nextWidth, props.minWidth, maxWidth);
  rect.value.height = clamp(nextHeight, props.minHeight, maxHeight);
};

const onResizeEnd = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
};

const startResize = (event: MouseEvent) => {
  if (event.button !== 0) return;
  bringToFront();
  isResizing.value = true;
  resizeState.value = {
    startX: event.clientX,
    startY: event.clientY,
    width: rect.value.width,
    height: rect.value.height,
  };
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
};

const { cancelPreview, triggerPreview } = useFloatingPreview(() => {
  emit('previewApply');
}, props.previewDebounce);

const closeByCancel = () => {
  emit('cancel');
  visibleModel.value = false;
};

const closeByX = () => {
  emit('cancel');
  visibleModel.value = false;
};

const onApply = () => {
  emit('apply');
};

const onConfirm = () => {
  emit('confirm');
  if (props.autoCloseOnConfirm) {
    visibleModel.value = false;
  }
};

watch(
  () => props.visible,
  (show) => {
    if (show) {
      if (!initialized.value) {
        rect.value = resolveInitialRect();
        initialized.value = true;
      }
      nextTick(() => {
        constrainRect();
        bringToFront();
      });
      return;
    }
    cancelPreview();
    onDragEnd();
    onResizeEnd();
  },
  { immediate: true },
);

watch(
  () => [windowWidth.value, windowHeight.value],
  () => {
    if (!visibleModel.value) return;
    constrainRect();
    const maxWidth = Math.max(props.minWidth, window.innerWidth - rect.value.x - 12);
    const maxHeight = Math.max(props.minHeight, window.innerHeight - rect.value.y - 12);
    rect.value.width = clamp(rect.value.width, props.minWidth, maxWidth);
    rect.value.height = clamp(rect.value.height, props.minHeight, maxHeight);
  },
);

onBeforeUnmount(() => {
  cancelPreview();
  onDragEnd();
  onResizeEnd();
});

defineExpose({
  bringToFront,
  triggerPreview: () => {
    if (!props.showLivePreview) return;
    if (!livePreviewModel.value) return;
    triggerPreview();
  },
});

const panelStyle = computed(() => {
  return {
    height: `${Math.round(rect.value.height)}px`,
    left: `${Math.round(rect.value.x)}px`,
    top: `${Math.round(rect.value.y)}px`,
    width: `${Math.round(rect.value.width)}px`,
    zIndex: currentZIndex.value,
  };
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visibleModel" class="go-floating-editor-layer">
      <div ref="panelRef" class="go-floating-editor" :style="panelStyle" @mousedown="bringToFront">
        <div ref="headerRef" class="go-floating-editor-header" @mousedown.prevent="startDrag">
          <div class="go-floating-editor-title">
            <n-text>{{ title }}</n-text>
          </div>
          <div class="go-floating-editor-header-extra" @mousedown.stop>
            <slot name="header-extra"></slot>
          </div>
          <n-button quaternary circle size="small" @mousedown.stop @click="closeByX">
            <template #icon>
              <n-icon :component="CloseIcon" />
            </template>
          </n-button>
        </div>

        <div class="go-floating-editor-body">
          <slot></slot>
        </div>

        <div class="go-floating-editor-footer" @mousedown.stop>
          <n-space justify="space-between" :wrap-item="false" style="width: 100%">
            <n-space align="center" :size="10">
              <template v-if="showLivePreview">
                <n-switch v-model:value="livePreviewModel" size="small" />
                <n-text depth="3">{{ editorT('bigscreenEditor.ui.enableLivePreview') }}</n-text>
              </template>
              <slot name="footer-left"></slot>
            </n-space>

            <n-space>
              <n-button @click="closeByCancel">{{ editorT('orgManage.common.cancel') }}</n-button>
              <n-button type="warning" ghost @click="onApply">{{ editorT('bigscreenEditor.ui.applyWithoutClosing') }}</n-button>
              <n-button type="primary" @click="onConfirm">{{ editorT('bigscreenEditor.ui.finishAndClose') }}</n-button>
            </n-space>
          </n-space>
        </div>

        <div class="go-floating-editor-resize-handle" @mousedown.stop.prevent="startResize"></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.go-floating-editor-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.go-floating-editor {
  position: fixed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  background: rgb(35 35 36 / 95%);
  border: 1px solid rgb(55 55 57 / 80%);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgb(0 0 0 / 35%);
  backdrop-filter: blur(20px);
}

.go-floating-editor-header {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  cursor: move;
  user-select: none;
  background: rgb(42 42 43 / 50%);
  border-bottom: 1px solid rgb(42 42 43 / 80%);
}

.go-floating-editor-title {
  min-width: 120px;
  font-size: 14px;
  font-weight: 600;
}

.go-floating-editor-header-extra {
  display: flex;
  flex: 1;
  justify-content: flex-end;
}

.go-floating-editor-body {
  flex: 1;
  min-height: 0;
  padding: 10px 12px 4px;
  overflow: auto;
}

.go-floating-editor-footer {
  flex-shrink: 0;
  padding: 8px 12px 12px;
  background: rgb(42 42 43 / 30%);
  border-top: 1px solid rgb(42 42 43 / 80%);
}

.go-floating-editor-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 0 38%, rgb(255 255 255 / 35%) 38% 45%, transparent 45% 60%, rgb(255 255 255 / 35%) 60% 67%, transparent 67%);
}
</style>
