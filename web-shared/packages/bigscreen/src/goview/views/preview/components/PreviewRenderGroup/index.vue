<script setup lang="ts">
import type { CreateComponentGroupType } from '@/packages/index.type';

import type { CSSProperties, PropType } from 'vue';

import { computed } from 'vue';

import { useBorderLoader } from '@/composables/useBorderLoader';
import { useCompositeGroupDataBinding } from '@/hooks/useCompositeGroupDataBinding.hook';
import { useLifeHandler } from '@/hooks';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { computeGroupContentScale } from '@/utils/groupScale';
import { animationsClass, getBlendModeStyle, getFilterStyle, getTransformStyle } from '@/utils';

import { getComponentAttrStyle, getPreviewConfigStyle, getSizeStyle, getStatusStyle } from '../../utils';

const props = defineProps({
  groupData: {
    type: Object as PropType<CreateComponentGroupType>,
    required: true,
  },
  themeSetting: {
    type: Object,
    required: true,
  },
  themeColor: {
    type: Object,
    required: true,
  },
  groupIndex: {
    type: Number,
    required: true,
  },
});

useCompositeGroupDataBinding(props.groupData, useChartEditStore);

const isBorderContainer = computed(() => props.groupData.option?.containerType === 'border');
const isBorder04 = computed(() => props.groupData.option?.borderKey === 'Border04');

const borderKeyRef = computed(() => props.groupData.option?.borderKey || 'Border01');
const groupOptionRef = computed(() => props.groupData.option);
const { borderComponent, computeTitleConfig, computeTitleStyle } = useBorderLoader(borderKeyRef, groupOptionRef);

const fakeBorderConfig = computed(() => {
  if (!isBorderContainer.value) return null;
  return {
    attr: props.groupData.attr,
    option: props.groupData.option?.borderOption || {},
  };
});

const titleConfig = computed(() => {
  if (!isBorderContainer.value) return null;
  return computeTitleConfig();
});

const titleStyle = computed<CSSProperties | undefined>(() => {
  if (!titleConfig.value) return undefined;
  return computeTitleStyle(titleConfig.value) as CSSProperties;
});

const titleHeight = computed(() => {
  if (isBorder04.value) return props.groupData.option?.borderOption?.borderTitleHeight || 52;
  if (!titleConfig.value?.show) return 0;
  return titleConfig.value.fontSize + 10;
});

const padding = computed(() => props.groupData.option?.padding || 0);
const designW = computed(() => props.groupData.option?.designWidth || props.groupData.attr.w);
const designH = computed(() => props.groupData.option?.designHeight || props.groupData.attr.h);

const contentScale = computed(() => computeGroupContentScale({
  containerWidth: props.groupData.attr?.w || 0,
  containerHeight: props.groupData.attr?.h || 0,
  designWidth: designW.value,
  designHeight: designH.value,
  padding: isBorderContainer.value ? padding.value : 0,
  titleHeight: isBorderContainer.value ? titleHeight.value : 0,
}));

const showTitle = computed(() => {
  if (isBorder04.value) return false;
  return isBorderContainer.value && !!titleConfig.value?.show && !!titleConfig.value?.text;
});

const groupStyle = computed<CSSProperties>(() => {
  return {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...getFilterStyle(props.groupData.styles),
  } as CSSProperties;
});

const contentStyle = computed<CSSProperties>(() => {
  return {
    position: 'absolute',
    left: `${contentScale.value.left}px`,
    top: `${contentScale.value.top}px`,
    width: `${designW.value}px`,
    height: `${designH.value}px`,
    transform: `scale(${contentScale.value.scaleX}, ${contentScale.value.scaleY})`,
    transformOrigin: 'left top',
    zIndex: 3,
  } as CSSProperties;
});
</script>

<template>
  <div :class="animationsClass(groupData.styles.animations)" :style="groupStyle">
    <component
      v-if="isBorderContainer && borderComponent && fakeBorderConfig"
      :is="borderComponent"
      :chart-config="fakeBorderConfig"
      class="preview-group-border"
    />
    <div v-if="showTitle" class="preview-group-title" :style="titleStyle">
      {{ titleConfig?.text }}
    </div>
    <div :style="contentStyle">
      <div
        class="chart-item"
        v-for="item in groupData.groupList"
        :class="animationsClass(item.styles.animations)"
        :key="item.id"
        :style="{
          ...getComponentAttrStyle(item.attr, groupIndex),
          ...getStatusStyle(item.status),
          ...getPreviewConfigStyle(item.preview),
          ...(getBlendModeStyle(item.styles) as any),
        }"
      >
        <component
          :is="item.chartConfig.chartKey"
          :id="item.id"
          :chart-config="item"
          :theme-setting="themeSetting"
          :theme-color="themeColor"
          :style="{
            ...getSizeStyle(item.attr),
            ...getFilterStyle(item.styles),
            ...getTransformStyle(item.styles),
          }"
          v-on="useLifeHandler(item)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-item {
  position: absolute;
}

.preview-group-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.preview-group-title {
  position: absolute;
  z-index: 2;
  white-space: nowrap;
  pointer-events: none;
}
</style>
