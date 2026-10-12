<script setup lang="ts">
/**
 * 全局 AI 场景助手抽屉。
 *
 * 挂载位置：`layouts/basic.vue`，紧邻其他 fixed widgets；
 * 内容绑定在模块级单例 `sceneAiHost` 上，业务页面通过 `openSceneAi(ctx, ...)` 激活。
 *
 * 布局方式：不是悬浮蒙层，而是「挤压主内容」——
 *   - 桌面 (>= sm)：打开时给 `<html>` 加 `padding-right: 420px`，
 *     BasicLayout 内部用 `w-full` 自然收缩，面板与主内容左右并列。
 *   - 移动端 (< sm)：面板全屏覆盖，`<html>` 的 padding 不设置（保留 body 原始宽度）。
 */
import { onBeforeUnmount, watch } from 'vue';

import SceneAiAssistant from '../views/scene/editor/ai/SceneAiAssistant.vue';
import {
  sceneAiCtx,
  sceneAiOnApplied,
  sceneAiOpen,
  sceneAiType,
  closeSceneAi,
} from '../views/scene/editor/ai/sceneAiHost';

const PANEL_WIDTH_PX = 420;
const MQ_DESKTOP = '(min-width: 640px)';

function applyLayoutShift(open: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDesktop = window.matchMedia(MQ_DESKTOP).matches;
  if (open && isDesktop) {
    root.style.setProperty(
      'transition',
      'padding-right 0.24s cubic-bezier(0.16,1,0.3,1)',
    );
    root.style.paddingRight = `${PANEL_WIDTH_PX}px`;
  } else {
    root.style.paddingRight = '';
  }
}

function onViewportResize() {
  if (sceneAiOpen.value) applyLayoutShift(true);
}

watch(
  sceneAiOpen,
  (v) => {
    applyLayoutShift(v);
  },
  { immediate: true },
);

if (typeof window !== 'undefined') {
  window.addEventListener('resize', onViewportResize);
}

onBeforeUnmount(() => {
  applyLayoutShift(false);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', onViewportResize);
  }
});

function onApplied() {
  sceneAiOnApplied.value?.();
}
</script>

<template>
  <Transition name="scene-ai-panel">
    <div
      v-if="sceneAiOpen && sceneAiCtx"
      class="bg-background border-border fixed inset-y-0 right-0 flex w-full flex-col border-l shadow-2xl sm:w-[420px] sm:max-w-[90vw]"
      style="z-index: 9999"
    >
      <SceneAiAssistant
        :ctx="sceneAiCtx"
        :scene-type="sceneAiType"
        @applied="onApplied"
        @close="closeSceneAi"
      />
    </div>
  </Transition>
</template>

<style>
.scene-ai-panel-enter-active,
.scene-ai-panel-leave-active {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
.scene-ai-panel-enter-from,
.scene-ai-panel-leave-to {
  transform: translateX(100%);
}
</style>
