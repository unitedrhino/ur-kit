<template>
  <div class="go-edit-align-line">
    <div
      v-for="item in line.lineArr"
      :key="item"
      class="line"
      :class="[item.includes('row') ? 'row' : 'col', line.select.has(item) && 'visible']"
      :style="lineStyle(line.select.get(item))"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import { computed, reactive, watch } from 'vue';

import { useDesignStore } from '@/store/modules/designStore/designStore';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { useSettingStore } from '@/store/modules/settingStore/settingStore';
import { computeGroupContentScale } from '@/utils/groupScale';
import { getGroupContentBounds } from '@/utils/groupBounds';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';

type AlignLineStyle = {
  height?: number;
  width?: number;
  x: number;
  y: number;
};

const designStore = useDesignStore();
const chartEditStore = useChartEditStore();
const settingStore = useSettingStore();

const line = reactive({
  lineArr: ['rowt', 'rowc', 'rowb', 'coll', 'colc', 'colr'],
  select: new Map<string, AlignLineStyle>(),
  sorptioned: {
    x: false,
    y: false,
  },
});

const themeColor = computed(() => designStore.getAppTheme);
const minDistance = computed(() => settingStore.getChartAlignRange);
const isComputedLine = computed(() => chartEditStore.getEditCanvas[EditCanvasTypeEnum.IS_DRAG] && !!window.$KeyboardActive?.alt);
const selectId = computed(() => chartEditStore.getTargetChart.selectId);

const activeIsolationGroup = computed(() => {
  const editCanvas = chartEditStore.getEditCanvas;
  if (!editCanvas.isGroupIsolation || !editCanvas.activeGroupId) return undefined;
  return chartEditStore.getComponentList.find((item) => item.isGroup && item.id === editCanvas.activeGroupId) as CreateComponentGroupType | undefined;
});

const isolationMetrics = computed(() => {
  const group = activeIsolationGroup.value;
  if (!group) return null;

  const bounds = getGroupContentBounds(group);
  const titleHeight =
    group.option?.containerType === 'border'
      ? group.option?.borderKey === 'Border04'
        ? (group.option?.borderOption?.borderTitleHeight ?? 52)
        : (group.option?.borderOption?.borderTitle?.show && group.option?.borderOption?.borderTitle?.text
            ? (group.option?.borderOption?.borderTitle?.fontSize ?? 18) + 10
            : 0)
      : 0;

  return computeGroupContentScale({
    containerWidth: group.attr.w,
    containerHeight: group.attr.h,
    designWidth: bounds.width,
    designHeight: bounds.height,
    padding: group.option?.padding ?? 0,
    titleHeight,
  });
});

const selectTarget = computed(() => {
  const group = activeIsolationGroup.value;
  if (group && selectId.value.length === 1) {
    return group.groupList.find((item) => item.id === selectId.value[0]);
  }
  return chartEditStore.getComponentList[chartEditStore.fetchTargetIndex()];
});

// 选中目标不存在时返回零值兜底，保证 attr 字段结构完整；实际消费处已先校验 selectTarget 存在
const selectAttr = computed(() => selectTarget.value?.attr || { h: 0, offsetX: 0, offsetY: 0, w: 0, x: 0, y: 0, zIndex: 0 });

const virtualCanvas = computed(() => {
  const group = activeIsolationGroup.value;
  if (!group) {
    return {
      height: cloneDeep(chartEditStore.getEditCanvasConfig.height),
      offsetX: 0,
      offsetY: 0,
      scaleX: 1,
      scaleY: 1,
      width: cloneDeep(chartEditStore.getEditCanvasConfig.width),
    };
  }

  const bounds = getGroupContentBounds(group);
  const metrics = isolationMetrics.value;
  return {
    height: bounds.height,
    offsetX: group.attr.x + (metrics?.left ?? 0),
    offsetY: group.attr.y + (metrics?.top ?? 0),
    scaleX: metrics?.scaleX ?? 1,
    scaleY: metrics?.scaleY ?? 1,
    width: bounds.width,
  };
});

const isSorption = (selectValue: number, componentValue: number) => Math.abs(selectValue - componentValue) <= minDistance.value;

const lineStyle = (style?: AlignLineStyle) => {
  if (!style) return {};

  const maxX = chartEditStore.getEditCanvasConfig.width - 1;
  const maxY = chartEditStore.getEditCanvasConfig.height - 1;
  return {
    left: `${Math.min(style.x, maxX)}px`,
    top: `${Math.min(style.y, maxY)}px`,
    ...(style.width !== undefined ? { width: `${style.width}px` } : {}),
    ...(style.height !== undefined ? { height: `${style.height}px` } : {}),
  };
};

const applyTargetPosition = (x: number, y: number) => {
  if (!selectTarget.value) return;
  selectTarget.value.attr.x = x;
  selectTarget.value.attr.y = y;
};

const buildRowLine = (y: number): AlignLineStyle => ({
  width: virtualCanvas.value.width * virtualCanvas.value.scaleX,
  x: virtualCanvas.value.offsetX,
  y: virtualCanvas.value.offsetY + y * virtualCanvas.value.scaleY,
});

const buildColLine = (x: number): AlignLineStyle => ({
  height: virtualCanvas.value.height * virtualCanvas.value.scaleY,
  x: virtualCanvas.value.offsetX + x * virtualCanvas.value.scaleX,
  y: virtualCanvas.value.offsetY,
});

watch(
  () => chartEditStore.getMousePosition,
  throttle(() => {
    try {
      if (!isComputedLine.value || selectId.value.length !== 1 || !selectTarget.value) return;

      const selectW = selectAttr.value.w;
      const selectH = selectAttr.value.h;
      const selectLeftX = selectAttr.value.x;
      const selectHalfX = selectLeftX + selectW / 2;
      const selectRightX = selectLeftX + selectW;
      const selectTopY = selectAttr.value.y;
      const selectHalfY = selectTopY + selectH / 2;
      const selectBottomY = selectTopY + selectH;

      line.select.clear();
      line.sorptioned.y = false;

      const componentList = activeIsolationGroup.value
        ? activeIsolationGroup.value.groupList.map((item: CreateComponentType) => ({ id: item.id, attr: item.attr }))
        : chartEditStore.getComponentList.map((item: CreateComponentType | CreateComponentGroupType) => ({ id: item.id, attr: item.attr }));

      componentList.push({
        id: '0',
        attr: {
          h: virtualCanvas.value.height,
          offsetX: 0,
          offsetY: 0,
          w: virtualCanvas.value.width,
          x: 0,
          y: 0,
          zIndex: 0,
        },
      });

      line.lineArr.forEach((lineItem) => {
        componentList.forEach((component) => {
          if (selectId.value[0] === component.id) return;

          const componentW = component.attr.w;
          const componentH = component.attr.h;
          const componentLeftX = component.attr.x;
          const componentHalfX = componentLeftX + componentW / 2;
          const componentRightX = componentLeftX + componentW;
          const componentTopY = component.attr.y;
          const componentHalfY = componentTopY + componentH / 2;
          const componentBottomY = componentTopY + componentH;

          if (lineItem === 'rowt') {
            if (isSorption(selectTopY, componentTopY)) {
              line.select.set(lineItem, buildRowLine(componentTopY));
              applyTargetPosition(selectLeftX, componentTopY);
            }
            if (isSorption(selectTopY, componentHalfY)) {
              line.select.set(lineItem, buildRowLine(componentHalfY));
              applyTargetPosition(selectLeftX, componentHalfY);
            }
            if (isSorption(selectTopY, componentBottomY)) {
              line.select.set(lineItem, buildRowLine(componentBottomY));
              applyTargetPosition(selectLeftX, componentBottomY);
            }
          }

          if (lineItem === 'rowc') {
            if (isSorption(selectHalfY, componentTopY)) {
              line.select.set(lineItem, buildRowLine(componentTopY));
              applyTargetPosition(selectLeftX, componentTopY - selectH / 2);
            }
            if (isSorption(selectHalfY, componentHalfY)) {
              line.select.set(lineItem, buildRowLine(componentHalfY));
              applyTargetPosition(selectLeftX, componentHalfY - selectH / 2);
            }
            if (isSorption(selectHalfY, componentBottomY)) {
              line.select.set(lineItem, buildRowLine(componentBottomY));
              applyTargetPosition(selectLeftX, componentBottomY - selectH / 2);
            }
          }

          if (lineItem === 'rowb') {
            if (isSorption(selectBottomY, componentTopY)) {
              line.select.set(lineItem, buildRowLine(componentTopY));
              applyTargetPosition(selectLeftX, componentTopY - selectH);
            }
            if (isSorption(selectBottomY, componentHalfY)) {
              line.select.set(lineItem, buildRowLine(componentHalfY));
              applyTargetPosition(selectLeftX, componentHalfY - selectH);
            }
            if (isSorption(selectBottomY, componentBottomY)) {
              line.select.set(lineItem, buildRowLine(componentBottomY));
              applyTargetPosition(selectLeftX, componentBottomY - selectH);
            }
          }

          if (lineItem === 'coll') {
            if (isSorption(selectLeftX, componentLeftX)) {
              line.select.set(lineItem, buildColLine(componentLeftX));
              applyTargetPosition(componentLeftX, selectTopY);
            }
            if (isSorption(selectLeftX, componentHalfX)) {
              line.select.set(lineItem, buildColLine(componentHalfX));
              applyTargetPosition(componentHalfX, selectTopY);
            }
            if (isSorption(selectLeftX, componentRightX)) {
              line.select.set(lineItem, buildColLine(componentRightX));
              applyTargetPosition(componentRightX, selectTopY);
            }
          }

          if (lineItem === 'colc') {
            if (isSorption(selectHalfX, componentLeftX)) {
              line.select.set(lineItem, buildColLine(componentLeftX));
              applyTargetPosition(componentLeftX - selectW / 2, selectTopY);
            }
            if (isSorption(selectHalfX, componentHalfX)) {
              line.select.set(lineItem, buildColLine(componentHalfX));
              applyTargetPosition(componentHalfX - selectW / 2, selectTopY);
            }
            if (isSorption(selectHalfX, componentRightX)) {
              line.select.set(lineItem, buildColLine(componentRightX));
              applyTargetPosition(componentRightX - selectW / 2, selectTopY);
            }
          }

          if (lineItem === 'colr') {
            if (isSorption(selectRightX, componentLeftX)) {
              line.select.set(lineItem, buildColLine(componentLeftX));
              applyTargetPosition(componentLeftX - selectW, selectTopY);
            }
            if (isSorption(selectRightX, componentHalfX)) {
              line.select.set(lineItem, buildColLine(componentHalfX));
              applyTargetPosition(componentHalfX - selectW, selectTopY);
            }
            if (isSorption(selectRightX, componentRightX)) {
              line.select.set(lineItem, buildColLine(componentRightX));
              applyTargetPosition(componentRightX - selectW, selectTopY);
            }
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  }, 200),
  {
    deep: true,
  },
);

watch(
  () => isComputedLine.value,
  (val: boolean) => {
    if (!val) {
      line.select.clear();
      line.sorptioned.y = false;
    }
  },
);
</script>

<style lang="scss" scoped>
@include go(edit-align-line) {
  .line {
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    border-width: 1px;
    border-style: solid;
    border-color: v-bind('themeColor');
    opacity: 0.7;

    &.visible {
      display: block;
    }
  }

  .row {
    width: 100%;
  }

  .col {
    height: 100%;
  }
}
</style>
