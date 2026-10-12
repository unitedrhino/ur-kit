<!--
  AI 悬浮聊天入口：负责全局显示右下角按钮、打开居中聊天工作台，并支持拖动避让页面操作区。
-->
<script lang="ts" setup>
import { $t } from '@vben/saas/locales';
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useAccessStore } from '@vben/stores';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { checkAiAvailable } from './api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@unitedrhino/saas-ui';

defineOptions({ name: 'AiChatFloat' });

const AiChatPanel = defineAsyncComponent(() => import('./AiChatPanel.vue'));

/** 工作台独立挂载，通过 Teleport 移入弹窗；关闭不销毁草稿或 SSE。 */
const workspaceTarget = ref<HTMLElement>();
/** 关闭弹窗后把键盘焦点交还当前入口。 */
const triggerButton = ref<HTMLButtonElement>();
const initialized = ref(false);

const BUTTON_SIZE_PX = 56;
const DEFAULT_MARGIN_PX = 24;
const DRAG_AREA_HEIGHT_PX = 260;
const DRAG_AREA_WIDTH_PX = 360;
const DRAG_THRESHOLD_PX = 4;
const FLOAT_POSITION_STORAGE_KEY = 'ai_chat_float_position';

interface FloatPosition {
  /** 悬浮按钮距离视口左侧的像素值。 */
  left: number;
  /** 悬浮按钮距离视口顶部的像素值。 */
  top: number;
}

interface DragState {
  /** 是否已经超过拖动阈值，超过后本次 click 不再打开面板。 */
  moved: boolean;
  /** 拖动开始前按钮距离视口左侧的像素值。 */
  originLeft: number;
  /** 拖动开始前按钮距离视口顶部的像素值。 */
  originTop: number;
  /** 当前拖动对应的指针 ID，用于过滤多指或过期事件。 */
  pointerId: number;
  /** 指针按下时的横坐标。 */
  startX: number;
  /** 指针按下时的纵坐标。 */
  startY: number;
}

const aiAvailable = ref(false);
const visible = ref(false);
watch(visible, (open) => { if (open) initialized.value = true; });
const route = useRoute();
const accessStore = useAccessStore();
const floatPosition = ref<FloatPosition | null>(loadStoredPosition());
const dragState = ref<DragState | null>(null);
const suppressNextClick = ref(false);
let suppressClickTimer: number | undefined;

const currentAppID = import.meta.env.VITE_GLOB_APPID ?? '77';
const currentAppName = document.title || '';
/** 路由随页面导航更新，用于工具理解当前操作位置。 */
const currentRoute = computed(() => route.fullPath);

const buttonStyle = computed(() => {
  if (!floatPosition.value) return {};
  return {
    bottom: 'auto',
    left: `${floatPosition.value.left}px`,
    right: 'auto',
    top: `${floatPosition.value.top}px`,
  };
});

const canCheckAiAvailable = computed(() => {
  return !!accessStore.accessToken && !route.path.startsWith('/auth') && route.path !== '/init';
});

/** loadStoredPosition 读取上次拖动后的悬浮按钮位置，并在视口尺寸变化后重新夹紧。 */
function loadStoredPosition(): FloatPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FLOAT_POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FloatPosition>;
    if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') return null;
    return clampPosition({ left: parsed.left, top: parsed.top });
  } catch {
    return null;
  }
}

/** clampPosition 将按钮限制在右下角操作区内，避免拖到页面主体区域。 */
function clampPosition(position: FloatPosition): FloatPosition {
  if (typeof window === 'undefined') return position;
  const maxLeft = Math.max(DEFAULT_MARGIN_PX, window.innerWidth - BUTTON_SIZE_PX - DEFAULT_MARGIN_PX);
  const maxTop = Math.max(DEFAULT_MARGIN_PX, window.innerHeight - BUTTON_SIZE_PX - DEFAULT_MARGIN_PX);
  const minLeft = Math.max(DEFAULT_MARGIN_PX, window.innerWidth - DRAG_AREA_WIDTH_PX);
  const minTop = Math.max(DEFAULT_MARGIN_PX, window.innerHeight - DRAG_AREA_HEIGHT_PX);
  return {
    left: Math.min(Math.max(position.left, minLeft), maxLeft),
    top: Math.min(Math.max(position.top, minTop), maxTop),
  };
}

/** saveFloatPosition 持久化用户调整后的位置，让分页等操作区长期保持可点。 */
function saveFloatPosition(position: FloatPosition) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FLOAT_POSITION_STORAGE_KEY, JSON.stringify(position));
}

async function refreshAiAvailability() {
  try {
    const resp = await checkAiAvailable();
    aiAvailable.value = resp.available;
  } catch {
    aiAvailable.value = false;
  }
}

watch(
  canCheckAiAvailable,
  (canCheck) => {
    if (!canCheck) {
      aiAvailable.value = false;
      visible.value = false;
      return;
    }
    void refreshAiAvailability();
  },
  { immediate: true },
);

function onViewportResize() {
  if (floatPosition.value) {
    floatPosition.value = clampPosition(floatPosition.value);
    saveFloatPosition(floatPosition.value);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', onViewportResize);
}

onBeforeUnmount(() => {
  clearSuppressClickTimer();
  removeDragListeners();
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onViewportResize);
  }
});

/** onPointerDown 记录拖动起点，并监听窗口级移动事件保证拖动不中断。 */
function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  dragState.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originLeft: floatPosition.value?.left ?? rect.left,
    originTop: floatPosition.value?.top ?? rect.top,
    moved: false,
  };
  target.setPointerCapture?.(event.pointerId);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}

/** onPointerMove 根据指针偏移更新按钮位置，并用阈值区分点击与拖动。 */
function onPointerMove(event: PointerEvent) {
  const state = dragState.value;
  if (!state || event.pointerId !== state.pointerId) return;
  const deltaX = event.clientX - state.startX;
  const deltaY = event.clientY - state.startY;
  if (!state.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
  state.moved = true;
  suppressNextClick.value = true;
  floatPosition.value = clampPosition({
    left: state.originLeft + deltaX,
    top: state.originTop + deltaY,
  });
}

/** onPointerUp 完成拖动并保存位置。 */
function onPointerUp(event: PointerEvent) {
  const state = dragState.value;
  if (!state || event.pointerId !== state.pointerId) return;
  if (state.moved && floatPosition.value) {
    saveFloatPosition(floatPosition.value);
    scheduleSuppressClickReset();
  }
  dragState.value = null;
  removeDragListeners();
}

/** scheduleSuppressClickReset 短暂吞掉拖动后的误触 click，避免影响后续正常点击。 */
function scheduleSuppressClickReset() {
  if (typeof window === 'undefined') return;
  clearSuppressClickTimer();
  suppressClickTimer = window.setTimeout(() => {
    suppressNextClick.value = false;
    suppressClickTimer = undefined;
  }, 250);
}

/** clearSuppressClickTimer 清理误触保护计时器。 */
function clearSuppressClickTimer() {
  if (!suppressClickTimer || typeof window === 'undefined') return;
  window.clearTimeout(suppressClickTimer);
  suppressClickTimer = undefined;
}

/** removeDragListeners 清理拖动监听，避免组件卸载后残留窗口事件。 */
function removeDragListeners() {
  if (typeof window === 'undefined') return;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
}

/** toggle 打开或关闭聊天面板，拖动结束触发的 click 会被忽略。 */
function toggle() {
  if (suppressNextClick.value) {
    suppressNextClick.value = false;
    clearSuppressClickTimer();
    return;
  }
  visible.value = !visible.value;
}
</script>

<template>
  <template v-if="aiAvailable">
    <Dialog v-model:open="visible">
      <DialogContent class="ai-workspace-dialog !flex !gap-0 !p-0 overflow-hidden" :z-index="9999" :close-label="$t('aiChat.ui.closeAiWorkbench')" overlay-class="!bg-black/30 backdrop-blur-sm" @interact-outside.prevent @close-auto-focus.prevent="triggerButton?.focus()">
        <DialogTitle class="sr-only">{{ $t('aiChat.ui.aiWorkspace') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ $t('aiChat.ui.selectHistoricalConversationsOnTheLeftViewAnalys') }}</DialogDescription>
        <div ref="workspaceTarget" class="h-full min-h-0 w-full min-w-0" />
      </DialogContent>
    </Dialog>
    <div class="hidden" aria-hidden="true">
      <Teleport v-if="initialized" :to="workspaceTarget || 'body'" :disabled="!visible || !workspaceTarget">
        <AiChatPanel :open="visible" workspace :current-app-i-d="currentAppID" :current-app-name="currentAppName" :current-route="currentRoute" @close="visible = false" />
      </Teleport>
    </div>

    <!-- 悬浮触发按钮（面板收起时显示） -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 scale-75"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-75"
    >
      <button
        ref="triggerButton"
        v-if="!visible"
        class="bg-primary hover:bg-primary/90 focus-visible:ring-primary group fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95"
        :class="{ 'cursor-grabbing': dragState, 'cursor-grab': !dragState }"
        :style="buttonStyle"
        :aria-label="$t('aiChat.ui.openAiAssistant')"
        aria-haspopup="dialog"
        @pointerdown="onPointerDown"
        @click="toggle"
      >
        <VbenIcon icon="lucide:sparkles" class="text-primary-foreground size-6 drop-shadow-sm" />
      </button>
    </Transition>
  </template>
</template>

<style>
.ai-workspace-dialog { width: min(1280px, 92vw); max-width: none !important; height: 88vh; border-radius: 18px; }
@media (max-width: 639px) { .ai-workspace-dialog { width: 100vw; height: 100dvh; border-radius: 0; } }
@media (prefers-reduced-motion: reduce) { .ai-workspace-dialog { animation: none !important; transition: none !important; } }
</style>
