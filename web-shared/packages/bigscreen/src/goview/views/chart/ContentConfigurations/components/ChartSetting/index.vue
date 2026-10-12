<script setup lang="ts">
import { computed } from 'vue';

import { NameSetting, PositionSetting, SizeSetting, StylesSetting } from '@/components/Pages/ChartItemSetting';
import { fetchConfigComponent } from '@/packages';

import { isCustomComponent } from '../../utils/isCustomComponent';
import { useTargetData } from '../hooks/useTargetData.hook';

const { targetData, chartEditStore } = useTargetData();

const exposedProps = computed(() => {
  if (!targetData.value) return null;
  if (!isCustomComponent(targetData.value)) return null;
  return targetData.value.option?._simplifiedData?.exposedProps ?? null;
});

const isEnhancedGroup = computed(() => targetData.value?.isGroup);

/** 画布基础能力：无论是否为自定义组件，始终可见 */
const alwaysVisibleProps = new Set(['conKey', 'position']);

/** 配置区块是否可见：无白名单 = 全部可见；基础能力始终可见 */
const isPropVisible = (propKey: string): boolean => {
  if (alwaysVisibleProps.has(propKey)) return true;
  if (!exposedProps.value) return true;
  return exposedProps.value.includes(propKey);
};

/** 是否渲染自定义配置面板：旧数据 conKey='group' 时跳过（向后兼容） */
const shouldRenderCustomPanel = computed(() => {
  if (!targetData.value) return false;
  if (isEnhancedGroup.value) return true;
  const conKey = targetData.value.chartConfig?.conKey;
  // 旧数据 conKey === 'group' 不渲染，保持原有行为
  if (conKey === 'group') return false;
  // 其他情况正常渲染
  return isPropVisible('conKey');
});

const customPanelComponent = computed(() => {
  if (!targetData.value || !shouldRenderCustomPanel.value) return null;
  if (isEnhancedGroup.value) return 'VEnhancedGroupConfig';
  return fetchConfigComponent(targetData.value.chartConfig);
});
</script>

<template>
  <div class="go-chart-configurations-setting" v-if="targetData">
    <!-- 名称 -->
    <NameSetting v-if="isPropVisible('name')" :chart-config="targetData.chartConfig" />
    <!-- 尺寸 -->
    <SizeSetting v-if="isPropVisible('size')" :is-group="targetData.isGroup" :chart-attr="targetData.attr" />
    <!-- 位置 -->
    <PositionSetting v-if="isPropVisible('position')" :chart-id="targetData.id" :chart-attr="targetData.attr" :canvas-config="chartEditStore.getEditCanvasConfig" />
    <!-- 滤镜 -->
    <StylesSetting v-if="isPropVisible('styles')" :is-group="targetData.isGroup" :chart-styles="targetData.styles" />
    <!-- 自定义配置项：仅在非旧数据时渲染 -->
    <component v-if="customPanelComponent" :is="customPanelComponent" :key="targetData.id" :option-data="targetData.option" />
  </div>
</template>

<style lang="scss" scoped>
@include go('chart-configurations-setting') {
}
</style>
