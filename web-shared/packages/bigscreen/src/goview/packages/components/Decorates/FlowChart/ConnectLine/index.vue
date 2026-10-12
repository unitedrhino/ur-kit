<!-- eslint-disable vue/block-order -->
<script setup lang="ts">
import type { CreateComponentType } from '@/packages/index.type';

import type { PropType } from 'vue';

import type { ConnectLinePathType, Point } from './path';

import { computed, ref, toRefs } from 'vue';

import { buildConnectLinePath, resolveConnectLinePathPoints } from './path';

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true,
  },
});

const { w, h } = toRefs(props.chartConfig.attr);
const currentOption = computed(() => props.chartConfig.option as typeof import('./config').option);
const isHovered = ref(false);

const safeWidth = computed(() => Math.max(Number(w.value) || 0, 1));
const safeHeight = computed(() => Math.max(Number(h.value) || 0, 1));

const filterId = computed(() => `connect-line-filter-${props.chartConfig.id}`);
const startMarkerId = computed(() => `connect-line-start-${props.chartConfig.id}`);
const endMarkerId = computed(() => `connect-line-end-${props.chartConfig.id}`);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getAnchorPoint = (anchor: string): Point => {
  switch (anchor) {
    case 'bottom': {
      return { x: safeWidth.value / 2, y: safeHeight.value };
    }
    case 'center': {
      return { x: safeWidth.value / 2, y: safeHeight.value / 2 };
    }
    case 'left': {
      return { x: 0, y: safeHeight.value / 2 };
    }
    case 'right': {
      return { x: safeWidth.value, y: safeHeight.value / 2 };
    }
    case 'top': {
      return { x: safeWidth.value / 2, y: 0 };
    }
  }
  return { x: 0, y: safeHeight.value / 2 };
};

const normalizePoint = (point: Partial<Point> | undefined, fallbackAnchor: string): Point => {
  if (!point || (point.x === undefined && point.y === undefined)) {
    return getAnchorPoint(fallbackAnchor);
  }
  return {
    x: clamp(Number(point.x) || 0, 0, safeWidth.value),
    y: clamp(Number(point.y) || 0, 0, safeHeight.value),
  };
};

const startPoint = computed(() => normalizePoint(currentOption.value.startPoint, currentOption.value.startAnchor));
const endPoint = computed(() => normalizePoint(currentOption.value.endPoint, currentOption.value.endAnchor));
const configuredPoints = computed(() => {
  const points = currentOption.value.points ?? [];
  if (points.length < 2) return [];
  return points.map((point, index) => normalizePoint(point, index === 0 ? currentOption.value.startAnchor : currentOption.value.endAnchor));
});

const toFiniteNumber = (value: unknown, fallback: number) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const sourcePoints = computed(() => {
  if (configuredPoints.value.length >= 2) {
    return configuredPoints.value;
  }

  return [startPoint.value, endPoint.value];
});

const elbowOrientation = computed<'horizontal' | 'vertical'>(() => {
  if (currentOption.value.startAnchor === 'top' || currentOption.value.startAnchor === 'bottom') return 'vertical';
  if (currentOption.value.startAnchor === 'left' || currentOption.value.startAnchor === 'right') return 'horizontal';
  const dx = Math.abs(endPoint.value.x - startPoint.value.x);
  const dy = Math.abs(endPoint.value.y - startPoint.value.y);
  return dx >= dy ? 'horizontal' : 'vertical';
});

// pathType 来自历史数据时可能是任意字符串，仅接受合法枚举值，否则兜底为默认 elbow
const pathType = computed<ConnectLinePathType>(() => {
  const value = currentOption.value.pathType;
  return value === 'elbow' || value === 'roundedElbow' || value === 'straight' ? value : 'elbow';
});

const pathPoints = computed(() => {
  const ratio = clamp(toFiniteNumber(currentOption.value.bendRatio, 0.5), 0, 1);
  return resolveConnectLinePathPoints(sourcePoints.value, pathType.value, ratio, elbowOrientation.value);
});

const pathD = computed(() => {
  return buildConnectLinePath(
    pathPoints.value,
    pathType.value,
    Number(currentOption.value.cornerRadius) || 0,
    Number(currentOption.value.bendRatio) || 0,
  );
});

const lineJoin = computed(() => (currentOption.value.pathType === 'roundedElbow' ? 'round' : 'miter'));

const baseStroke = computed(() => {
  if (currentOption.value.disabled) return currentOption.value.disabledColor;
  return isHovered.value ? currentOption.value.selectedColor : currentOption.value.baseColor;
});

const effectStroke = computed(() => {
  if (currentOption.value.disabled) return currentOption.value.disabledColor;
  return isHovered.value ? currentOption.value.selectedColor : currentOption.value.effectColor;
});

const startArrowStroke = computed(() => (currentOption.value.disabled ? currentOption.value.disabledColor : currentOption.value.startArrowColor));
const endArrowStroke = computed(() => (currentOption.value.disabled ? currentOption.value.disabledColor : currentOption.value.endArrowColor));
const pointFill = computed(() => (currentOption.value.disabled ? currentOption.value.disabledColor : currentOption.value.pointColor));
const labelFill = computed(() => (currentOption.value.disabled ? currentOption.value.disabledTextColor : currentOption.value.labelColor));

const isAnimationActive = computed(() => !currentOption.value.disabled && currentOption.value.animate && currentOption.value.direction !== 'static');
const showEffectLine = computed(() => !currentOption.value.disabled && currentOption.value.animate);
const hasFilterEffect = computed(() => currentOption.value.glow || currentOption.value.shadow);
const filterUrl = computed(() => (hasFilterEffect.value ? `url(#${filterId.value})` : undefined));

const arrowMarkerSize = computed(() => Math.max(Number(currentOption.value.arrowSize) || 0, 1));
const arrowShouldFill = computed(() => currentOption.value.arrowStyle !== 'open');
const arrowRefX = computed(() => (currentOption.value.arrowStyle === 'diamond' ? 9 : 10));
const arrowPath = computed(() => {
  switch (currentOption.value.arrowStyle) {
    case 'diamond': {
      return 'M 1 5 L 5 1 L 9 5 L 5 9 Z';
    }
    case 'open': {
      return 'M 1 1 L 9 5 L 1 9';
    }
    case 'triangle': {
      return 'M 1 1 L 9 5 L 1 9 Z';
    }
  }
  return 'M 1 1 L 9 5 L 1 9 Z';
});

const hasArrowStart = computed(() => currentOption.value.arrow === 'start' || currentOption.value.arrow === 'both');
const hasArrowEnd = computed(() => currentOption.value.arrow === 'end' || currentOption.value.arrow === 'both');
const startMarkerUrl = computed(() => (hasArrowStart.value ? `url(#${startMarkerId.value})` : undefined));
const endMarkerUrl = computed(() => (hasArrowEnd.value ? `url(#${endMarkerId.value})` : undefined));

const dashOffsetDistance = computed(() => {
  const distanceValue = Math.max(Number(currentOption.value.dashLength) || 0, 0) + Math.max(Number(currentOption.value.gapLength) || 0, 0);
  if (currentOption.value.direction === 'reverse') return `${distanceValue}`;
  return `${-distanceValue}`;
});

const animationIterationCount = computed(() =>
  currentOption.value.playCount === 'infinite' ? 'infinite' : `${Math.max(Number(currentOption.value.playCount) || 1, 1)}`,
);

const effectPathStyle = computed(() => ({
  strokeDasharray: `${Math.max(Number(currentOption.value.dashLength) || 0, 0)} ${Math.max(Number(currentOption.value.gapLength) || 0, 0)}`,
  '--dash-shift': dashOffsetDistance.value,
  '--connect-line-animation-duration': `${Math.max(Number(currentOption.value.duration) || 0.1, 0.1)}s`,
  '--connect-line-animation-iteration-count': animationIterationCount.value,
  '--connect-line-animation-play-state': isAnimationActive.value && currentOption.value.autoPlay ? 'running' : 'paused',
  '--connect-line-animation-name': isAnimationActive.value ? 'connect-line-flow' : 'none',
}));

const visiblePoints = computed(() => pathPoints.value);
const labelPosition = computed(() => {
  const points = visiblePoints.value;
  const xValues = points.map((point) => point.x);
  const yValues = points.map((point) => point.y);

  return {
    x: (Math.min(...xValues) + Math.max(...xValues)) / 2,
    y: (Math.min(...yValues) + Math.max(...yValues)) / 2,
  };
});

const labelRect = computed(() => {
  const text = currentOption.value.labelText || '';
  return {
    width: Math.max(text.length * 12 + 16, 28),
    height: 24,
  };
});

const labelBackgroundFill = computed(() => (currentOption.value.disabled ? currentOption.value.disabledBgColor : currentOption.value.labelBgColor));
const showLabelBackground = computed(() => labelBackgroundFill.value && labelBackgroundFill.value !== 'transparent');
</script>

<template>
  <svg :width="safeWidth" :height="safeHeight" class="connect-line-svg">
    <defs>
      <template v-if="hasArrowStart || hasArrowEnd">
        <marker
          v-if="hasArrowStart"
          :id="startMarkerId"
          markerUnits="strokeWidth"
          orient="auto-start-reverse"
          :markerWidth="arrowMarkerSize"
          :markerHeight="arrowMarkerSize"
          :refX="arrowRefX"
          refY="5"
          viewBox="0 0 10 10"
        >
          <path :d="arrowPath" :fill="arrowShouldFill ? startArrowStroke : 'none'" :stroke="startArrowStroke" stroke-width="1.2" stroke-linejoin="round" />
        </marker>
        <marker
          v-if="hasArrowEnd"
          :id="endMarkerId"
          markerUnits="strokeWidth"
          orient="auto"
          :markerWidth="arrowMarkerSize"
          :markerHeight="arrowMarkerSize"
          :refX="arrowRefX"
          refY="5"
          viewBox="0 0 10 10"
        >
          <path :d="arrowPath" :fill="arrowShouldFill ? endArrowStroke : 'none'" :stroke="endArrowStroke" stroke-width="1.2" stroke-linejoin="round" />
        </marker>
      </template>

      <filter v-if="hasFilterEffect" :id="filterId" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow
          v-if="currentOption.shadow"
          dx="0"
          dy="0"
          :stdDeviation="Math.max(currentOption.shadowBlur, 0)"
          :flood-color="currentOption.shadowColor"
          flood-opacity="0.7"
        />
        <template v-if="currentOption.glow">
          <feGaussianBlur in="SourceGraphic" :stdDeviation="Math.max(currentOption.glowBlur / 2, 0)" result="glow-blur" />
          <feColorMatrix
            in="glow-blur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="glow-color"
          />
          <feMerge>
            <feMergeNode in="glow-color" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </template>
      </filter>
    </defs>

    <path
      :d="pathD"
      fill="none"
      stroke-linecap="round"
      :stroke-linejoin="lineJoin"
      :stroke="baseStroke"
      :stroke-width="currentOption.lineWidth"
      :marker-start="startMarkerUrl"
      :marker-end="endMarkerUrl"
      :filter="filterUrl"
      pointer-events="stroke"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    />

    <path
      v-if="showEffectLine"
      :d="pathD"
      class="connect-line-effect"
      fill="none"
      stroke-linecap="round"
      :stroke-linejoin="lineJoin"
      :stroke="effectStroke"
      :stroke-width="Math.max(currentOption.lineWidth, 1)"
      :marker-start="startMarkerUrl"
      :marker-end="endMarkerUrl"
      :filter="filterUrl"
      :style="effectPathStyle"
      pointer-events="none"
    />

    <circle
      v-for="(point, index) in currentOption.pointRadius > 0 ? visiblePoints : []"
      :key="`${index}-${point.x}-${point.y}`"
      :cx="point.x"
      :cy="point.y"
      :r="currentOption.pointRadius"
      :fill="pointFill"
      :filter="filterUrl"
      pointer-events="none"
    />

    <g v-if="currentOption.showLabel && currentOption.labelText">
      <rect
        v-if="showLabelBackground"
        :x="labelPosition.x - labelRect.width / 2"
        :y="labelPosition.y - labelRect.height / 2"
        :rx="4"
        :ry="4"
        :width="labelRect.width"
        :height="labelRect.height"
        :fill="labelBackgroundFill"
        pointer-events="none"
      />
      <text
        :x="labelPosition.x"
        :y="labelPosition.y"
        text-anchor="middle"
        dominant-baseline="middle"
        :fill="labelFill"
        class="connect-line-label"
        pointer-events="none"
      >
        {{ currentOption.labelText }}
      </text>
    </g>
  </svg>
</template>

<style>
.connect-line-svg {
  overflow: visible;
  pointer-events: none;
}

.connect-line-effect {
  will-change: stroke-dashoffset;
  animation-name: var(--connect-line-animation-name);
  animation-duration: var(--connect-line-animation-duration);
  animation-iteration-count: var(--connect-line-animation-iteration-count);
  animation-play-state: var(--connect-line-animation-play-state);
  animation-timing-function: linear;
  animation-fill-mode: both;
}

.connect-line-label {
  font-size: 12px;
  pointer-events: none;
}

@keyframes connect-line-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: var(--dash-shift);
  }
}
</style>
