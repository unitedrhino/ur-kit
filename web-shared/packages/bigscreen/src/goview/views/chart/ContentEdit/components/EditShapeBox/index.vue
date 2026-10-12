<script setup lang="ts">
import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import type { PropType } from 'vue';

import { computed } from 'vue';

import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { EditCanvasTypeEnum } from '@/store/modules/chartEditStore/chartEditStore.type';
import { useDesignStore } from '@/store/modules/designStore/designStore';

import { startConnectLineAppendMode, useMouseConnectLinePointHandle, useMousePointHandle } from '../../hooks/useDrag.hook';
import { useEndpointStyle, usePointStyle, useSizeStyle } from '../../hooks/useStyle.hook';

type ConnectLineOptionLike = {
  endPoint?: { x?: number; y?: number };
  points?: Array<{ x?: number; y?: number }>;
  startPoint?: { x?: number; y?: number };
};

type ConnectLineControlPointItem = {
  key: 'endPoint' | 'startPoint' | `point-${number}`;
  point?: { x?: number; y?: number };
};

const props = defineProps({
  item: {
    type: Object as PropType<CreateComponentGroupType | CreateComponentType>,
    required: true,
  },
  hiddenPoint: {
    type: Boolean,
    required: false,
  },
  isGroupIsolation: {
    type: Boolean,
    default: false,
  },
});

const designStore = useDesignStore();
const chartEditStore = useChartEditStore();

const pointList = ['t', 'r', 'b', 'l', 'lt', 'rt', 'lb', 'rb'];
const endpointList = ['startPoint', 'endPoint'] as const;
const cursorResize = ['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'];

const isConnectLine = computed(() => props.item.chartConfig.key === 'ConnectLine');

const themeColor = computed(() => designStore.getAppTheme);

const hover = computed(() => {
  const isDrag = chartEditStore.getEditCanvas[EditCanvasTypeEnum.IS_DRAG];
  if (isDrag || props.item.status.lock) return false;
  return props.item.id === chartEditStore.getTargetChart.hoverId;
});

const select = computed(() => {
  const id = props.item.id;
  if (props.item.status.lock) return false;
  return chartEditStore.getTargetChart.selectId.find((value: string) => value === id);
});

const lock = computed(() => props.item.status.lock);
const hide = computed(() => props.item.status.hide);

const connectLineControlPoints = computed<ConnectLineControlPointItem[]>(() => {
  const option = props.item.option as ConnectLineOptionLike;
  const points = option.points ?? [];

  if (points.length >= 2) {
    return points.map((point, index) => ({
      key: `point-${index}`,
      point,
    }));
  }

  return endpointList.map((endpoint) => ({
    key: endpoint,
    point: option[endpoint],
  }));
});

const getEndpointStyle = (point: undefined | { x?: number; y?: number }) => useEndpointStyle(point, props.item.attr);
</script>

<template>
  <div class="go-shape-box" :class="{ lock, hide, 'group-isolation-active': isGroupIsolation, 'connect-line-shape-box': isConnectLine }">
    <slot></slot>
    <template v-if="!hiddenPoint">
      <template v-if="!isConnectLine">
        <div
          v-for="(point, index) in select ? pointList : []"
          :key="point"
          :class="`shape-point ${point}`"
          :style="usePointStyle(point, index, item.attr, cursorResize)"
          @mousedown="useMousePointHandle($event, point, item)"
        ></div>
      </template>
      <template v-else>
        <div
          v-for="controlPoint in select ? connectLineControlPoints : []"
          :key="controlPoint.key"
          class="shape-point shape-point-endpoint"
          :style="getEndpointStyle(controlPoint.point)"
          @mousedown="useMouseConnectLinePointHandle($event, controlPoint.key, item)"
          @click="startConnectLineAppendMode($event, controlPoint.key, item)"
        ></div>
      </template>
    </template>

    <div class="shape-modal" :class="{ 'shape-modal-connect-line': isConnectLine }" :style="useSizeStyle(item.attr)">
      <div class="shape-modal-select" :class="{ active: select && !isConnectLine }"></div>
      <div class="shape-modal-change" :class="{ selectActive: select, hoverActive: hover, isolationActive: isGroupIsolation }"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include go(shape-box) {
  position: absolute;
  cursor: move;

  &.lock {
    cursor: default !important;
  }

  &.hide {
    display: none;
  }

  &.group-isolation-active {
    z-index: 1000;

    > .shape-modal {
      pointer-events: none;
    }
  }

  &.connect-line-shape-box {
    pointer-events: none;

    .shape-point-endpoint {
      pointer-events: auto;
    }
  }

  .shape-point {
    z-index: 30;
    position: absolute;
    width: 7px;
    height: 7px;
    border: 3px solid v-bind('themeColor');
    border-radius: 5px;
    background-color: #fff;
    transform: translate(-40%, -30%);

    &.t {
      width: 30px;
      transform: translate(-50%, -50%);
    }

    &.b {
      width: 30px;
      transform: translate(-50%, -30%);
    }

    &.l,
    &.r {
      height: 30px;
    }

    &.r {
      transform: translate(-20%, -50%);
    }

    &.l {
      transform: translate(-45%, -50%);
    }

    &.rt,
    &.rb {
      transform: translate(-30%, -30%);
    }
  }

  .shape-point-endpoint {
    width: 10px;
    height: 10px;
    border-width: 2px;
    transform: translate(-50%, -50%);
  }

  .shape-modal {
    position: absolute;
    top: 0;
    left: 0;

    &.shape-modal-connect-line {
      .shape-modal-select,
      .shape-modal-change {
        display: none;
      }
    }

    .shape-modal-select,
    .shape-modal-change {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }

    .shape-modal-select {
      opacity: 0.1;
      top: 2px;
      left: 2px;

      &.active {
        background-color: v-bind('themeColor');
      }
    }

    .shape-modal-change {
      border: 2px solid rgba(0, 0, 0, 0);

      &.selectActive,
      &.hoverActive {
        border-color: v-bind('themeColor');
        border-width: 2px;
      }

      &.hoverActive {
        border-style: dotted;
      }

      &.selectActive {
        border-style: solid;
      }

      &.isolationActive {
        border-color: v-bind('themeColor');
        border-width: 2px;
        border-style: dashed;
      }
    }
  }
}
</style>
