<script setup lang="ts">
import { computed, toRefs } from 'vue';

import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { useSettingStore } from '@/store/modules/settingStore/settingStore';

import { contextmenuBoxSelect, mousedownBoxSelect } from '../../hooks/useDrag.hook';
import { useSizeStyle } from '../../hooks/useStyle.hook';
import { EditAlignLine } from '../EditAlignLine';
import { EditSelect } from '../EditSelect';
import { EditWatermark } from '../EditWatermark';
import EditDistanceHint from './components/EditDistanceHint/index.vue';

const chartEditStore = useChartEditStore();
const settingStore = useSettingStore();

const { getEditCanvasConfig, getEditCanvas } = toRefs(chartEditStore);

const isComponentMode = computed(() => chartEditStore.getIsComponentMode);
const isDrawingConnectLine = computed(() => getEditCanvas.value.isCreate && getEditCanvas.value.createComponentConfig?.key === 'ConnectLine');

const size = computed(() => {
  return {
    w: getEditCanvasConfig.value.width,
    h: getEditCanvasConfig.value.height,
  };
});

const rangeStyle = computed(() => {
  // 缩放
  const scale = {
    transform: `scale(${getEditCanvas.value.scale})`,
  };
  // @ts-ignore
  return { ...useSizeStyle(size.value), ...scale, cursor: isDrawingConnectLine.value ? 'crosshair' : 'default' };
});

// 模态层
const rangeModelStyle = computed(() => {
  const dragStyle = getEditCanvas.value.isCreate && { 'z-index': 99_999 };
  // @ts-ignore
  return { ...useSizeStyle(size.value), ...dragStyle };
});
</script>

<template>
  <div class="go-edit-range go-transition" :style="rangeStyle" @mousedown="mousedownBoxSelect($event, undefined)" @contextmenu="contextmenuBoxSelect">
    <slot></slot>
    <!-- 水印（组件模式下隐藏） -->
    <EditWatermark v-if="!isComponentMode" />
    <!-- 拖拽时的辅助线 -->
    <EditAlignLine />
    <!-- 框选时的样式框 -->
    <EditSelect />
    <!-- 安全区覆盖层（组件模式下隐藏） -->
    <div v-if="!isComponentMode && settingStore.getShowSafeZone" class="go-edit-safe-zone"></div>
    <!-- Alt 测距提示 -->
    <EditDistanceHint />
    <!-- 拖拽时的遮罩 -->
    <div class="go-edit-range-model" :style="rangeModelStyle"></div>
  </div>
</template>

<style lang="scss" scoped>
@include go(edit-range) {
  position: relative;
  transform-origin: left top;
  background-size: cover;
  overflow: hidden;
  @include fetch-border-color('hover-border-color');
  @include fetch-bg-color('background-color2');
  @include go(edit-range-model) {
    z-index: -1;
    position: absolute;
    left: 0;
    top: 0;
  }
}

.go-edit-safe-zone {
  position: absolute;
  inset: 24px;
  border: 1px dashed rgba(255, 220, 50, 0.6);
  pointer-events: none;
  z-index: 2;
  box-sizing: border-box;
}
</style>
