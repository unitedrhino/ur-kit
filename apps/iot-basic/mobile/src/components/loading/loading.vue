<template>
<view :class="`loading ${fullscreen ? 'loading--fullscreen' : ''}`">
  <view class="loading__spinner" :style="spinnerStyle">
    <view v-for="(item, index) in segments" :key="item.key" class="loading__spinner-dot" :style="item.style"></view>
  </view>
  <text v-if="text" class="loading__text">{{text}}</text>
</view>

</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: number;
  color?: string;
  text?: string;
  fullscreen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 32,
  color: '',
  text: '',
  fullscreen: false,
});

const DOT_OPACITIES = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.28, 0.16];

const spinnerStyle = computed(() => {
  const safeSize = Number.isFinite(props.size) ? Math.max(12, Math.round(props.size)) : 32;
  return `width: ${safeSize}px; height: ${safeSize}px;`;
});

const segments = computed(() => {
  const safeSize = Number.isFinite(props.size) ? Math.max(12, Math.round(props.size)) : 32;
  const dotSize = Math.max(3, Math.round(safeSize * 0.18));
  const radius = Math.max(0, Math.floor(safeSize / 2 - dotSize / 2));
  const tone = props.color || 'var(--color-primary)';
  return DOT_OPACITIES.map((opacity, index) => ({
    key: `segment-${index}`,
    style: [
      `width: ${dotSize}px;`,
      `height: ${dotSize}px;`,
      `margin-left: -${dotSize / 2}px;`,
      `margin-top: -${dotSize / 2}px;`,
      `background: ${tone};`,
      `transform: rotate(${index * 45}deg) translateY(-${radius}px);`,
      `opacity: ${opacity};`,
    ].join(' '),
  }));
});

// legacy stub removed
const _placeholder = (): void => {};
_placeholder();
/* eslint-disable */
// type SpinnerSegment = {
//   key: string;
//   style: string;
// };
// 
// type SpinnerState = {
//   spinnerStyle: string;
//   segments: SpinnerSegment[];
// };
// 
// const DOT_OPACITIES = [1, 0.88, 0.76, 0.64, 0.52, 0.4, 0.28, 0.16];
// 
// export function buildSpinnerState(size: number, color: string): SpinnerState {
//   const safeSize = Number.isFinite(size) ? Math.max(12, Math.round(size)) : 32;
//   const dotSize = Math.max(3, Math.round(safeSize * 0.18));
//   const radius = Math.max(0, Math.floor(safeSize / 2 - dotSize / 2));
//   const tone = color || 'var(--color-primary)';
// 
//   return {
//     spinnerStyle: `width: ${safeSize}px; height: ${safeSize}px;`,
//     segments: DOT_OPACITIES.map((opacity, index) => ({
//       key: `segment-${index}`,
//       style: [
//         `width: ${dotSize}px;`,
//         `height: ${dotSize}px;`,
//         `margin-left: -${dotSize / 2}px;`,
//         `margin-top: -${dotSize / 2}px;`,
//         `background: ${tone};`,
//         `transform: rotate(${index * 45}deg) translateY(-${radius}px);`,
//         `opacity: ${opacity};`,
//       ].join(' '),
//     })),
//   };
// }
// 
// const initialSpinnerState = buildSpinnerState(32, '');
// 
// Component({
//   properties: {
//     size: { type: Number, value: 32 },
//     color: { type: String, value: '' },
//     text: { type: String, value: '' },
//     fullscreen: { type: Boolean, value: false },
//   },
// 
//   data: {
//     spinnerStyle: initialSpinnerState.spinnerStyle,
//     segments: initialSpinnerState.segments,
//   },
// 
//   lifetimes: {
//     attached(this: any) {
//       this.applySpinnerState(this.properties.size, this.properties.color);
//     },
//   },
// 
//   observers: {
//     'size, color'(this: any, size: number, color: string) {
//       this.applySpinnerState(size, color);
//     },
//   },
// 
//   methods: {
//     applySpinnerState(this: any, size: number, color: string) {
//       this.setData(buildSpinnerState(size, color));
//     },
//   },
// });
// 
</script>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.loading--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-bg);
  z-index: 999;
}

.loading__spinner {
  position: relative;
  flex-shrink: 0;
  animation: loading-spin 0.8s linear infinite;
}

.loading__spinner-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 999px;
}

.loading__text {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

@keyframes loading-spin {
  to { transform: rotate(360deg); }
}

</style>
