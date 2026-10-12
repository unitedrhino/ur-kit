<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import type { ChartEditStorageType } from './index.type';

import { computed } from 'vue';

import { PreviewScaleEnum } from '@/enums/styleEnum';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { getFilterStyle, setTitle } from '@/utils';

import { PreviewRenderList } from './components/PreviewRenderList';
import { useComInstall } from './hooks/useComInstall.hook';
import { useScale } from './hooks/useScale.hook';
import { useStore } from './hooks/useStore.hook';
import {
  dragCanvas,
  ensurePreviewRuntimeState,
  getEditCanvasConfigStyle,
  getSessionStorageInfo,
  installPreviewAsyncTracker,
  keyRecordHandle,
  markPreviewRuntimeSettled,
} from './utils';

// const localStorageInfo: ChartEditStorageType = getSessionStorageInfo() as ChartEditStorageType

await getSessionStorageInfo();
const chartEditStore = useChartEditStore() as unknown as ChartEditStorageType;
ensurePreviewRuntimeState();
installPreviewAsyncTracker();
markPreviewRuntimeSettled();

// cover 模式下注入优化样式 + 关闭 ECharts 动画，加速封面截图
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('coverMode') === '1') {
  // 1. 注入 CSS：强制所有过渡/动画瞬间完成（duration:0s 而非 paused，避免冻结在第 0 帧）
  const style = document.createElement('style');
  style.textContent = `
    .cover-mode-active *, .cover-mode-active *::before, .cover-mode-active *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `;
  document.head.appendChild(style);
  // 给 body 加标记，CSS 选择器生效
  requestAnimationFrame(() => {
    document.body.classList.add('cover-mode-active');
  });

  // 2. 关闭 ECharts 动画：patch echarts.init 拦截实例
  const tryPatchEchartsInit = () => {
    const echarts = (window as any).echarts;
    if (!echarts || !echarts.init) {
      setTimeout(tryPatchEchartsInit, 200);
      return;
    }
    const origInit = echarts.init;
    if (!(origInit as any).__coverPatched) {
      echarts.init = function (...args: any[]) {
        const instance = origInit.apply(this, args);
        const origSetOption = instance.setOption.bind(instance);
        instance.setOption = function (option: any, ...rest: any[]) {
          return origSetOption({ ...option, animation: false }, ...rest);
        };
        return instance;
      };
      (echarts.init as any).__coverPatched = true;
    }
  };
  tryPatchEchartsInit();
}

setTitle(editorT('bigscreenEditor.dynamic.previewTitle', { name: String(chartEditStore.editCanvasConfig.projectName) }));

const previewRefStyle = computed(() => {
  return {
    overflow: 'hidden',
    ...getEditCanvasConfigStyle(chartEditStore.editCanvasConfig),
    ...getFilterStyle(chartEditStore.editCanvasConfig),
  };
});

const showEntity = computed(() => {
  const type = chartEditStore.editCanvasConfig.previewScaleType;
  return type === PreviewScaleEnum.SCROLL_Y || type === PreviewScaleEnum.SCROLL_X;
});

useStore(chartEditStore);
const { entityRef, previewRef } = useScale(chartEditStore);
const { show } = useComInstall(chartEditStore);

// 开启键盘监听
keyRecordHandle();
</script>

<template>
  <div :class="`go-preview ${chartEditStore.editCanvasConfig.previewScaleType}`" @mousedown="dragCanvas">
    <template v-if="showEntity">
      <!-- 实体区域 -->
      <div ref="entityRef" class="go-preview-entity">
        <!-- 缩放层 -->
        <div ref="previewRef" class="go-preview-scale">
          <!-- 展示层 -->
          <div :style="previewRefStyle" v-if="show">
            <!-- 渲染层 -->
            <PreviewRenderList />
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- 缩放层 -->
      <div ref="previewRef" class="go-preview-scale">
        <!-- 展示层 -->
        <div :style="previewRefStyle" v-if="show">
          <!-- 渲染层 -->
          <PreviewRenderList />
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@include go('preview') {
  position: relative;
  // 宿主可能是带侧边栏/页头的布局容器（如 iot 应用内嵌预览），不能用 100vw/100vh 撑出可视区
  height: 100%;
  width: 100%;
  @include background-image('background-image');
  &.fit,
  &.full {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    .go-preview-scale {
      transform-origin: center center;
    }
  }
  &.scrollY {
    overflow-x: hidden;
    .go-preview-scale {
      transform-origin: left top;
    }
  }
  &.scrollX {
    overflow-y: hidden;
    .go-preview-scale {
      transform-origin: left top;
    }
  }
  .go-preview-entity {
    overflow: hidden;
  }
}
</style>
