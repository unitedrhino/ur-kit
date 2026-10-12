<template>
  <template v-if="visible">
    <!-- 上方距离线 -->
    <div class="dist-line" :style="{ left: `${compX}px`, width: `${compW}px`, height: `${distances.top}px`, top: '0' }"></div>
    <span class="dist-label" :style="{ left: `${compX + compW / 2}px`, top: `${distances.top / 2}px` }">{{ distances.top }}px</span>

    <!-- 下方距离线 -->
    <div class="dist-line" :style="{ left: `${compX}px`, width: `${compW}px`, height: `${distances.bottom}px`, top: `${compY + compH}px` }"></div>
    <span class="dist-label" :style="{ left: `${compX + compW / 2}px`, top: `${compY + compH + distances.bottom / 2}px` }">{{ distances.bottom }}px</span>

    <!-- 左方距离线 -->
    <div class="dist-line" :style="{ top: `${compY}px`, height: `${compH}px`, width: `${distances.left}px`, left: '0' }"></div>
    <span class="dist-label" :style="{ top: `${compY + compH / 2}px`, left: `${distances.left / 2}px` }">{{ distances.left }}px</span>

    <!-- 右方距离线 -->
    <div class="dist-line" :style="{ top: `${compY}px`, height: `${compH}px`, width: `${distances.right}px`, left: `${compX + compW}px` }"></div>
    <span class="dist-label" :style="{ top: `${compY + compH / 2}px`, left: `${compX + compW + distances.right / 2}px` }">{{ distances.right }}px</span>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'

const chartEditStore = useChartEditStore()

const isAlt = ref(false)

const onKeyDown = (e: KeyboardEvent) => { if (e.keyCode === 18) isAlt.value = true }
const onKeyUp = (e: KeyboardEvent) => { if (e.keyCode === 18) isAlt.value = false }

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
})

const canvasW = computed(() => chartEditStore.getEditCanvasConfig.width)
const canvasH = computed(() => chartEditStore.getEditCanvasConfig.height)

const selectId = computed(() => chartEditStore.getTargetChart.selectId)
const selectTarget = computed(() => chartEditStore.getComponentList[chartEditStore.fetchTargetIndex()])
const attr = computed(() => selectTarget.value?.attr)

const visible = computed(() => isAlt.value && selectId.value.length === 1 && !!attr.value)

const compX = computed(() => attr.value?.x ?? 0)
const compY = computed(() => attr.value?.y ?? 0)
const compW = computed(() => attr.value?.w ?? 0)
const compH = computed(() => attr.value?.h ?? 0)

const distances = computed(() => ({
  top: Math.round(compY.value),
  bottom: Math.round(canvasH.value - compY.value - compH.value),
  left: Math.round(compX.value),
  right: Math.round(canvasW.value - compX.value - compW.value)
}))
</script>

<style scoped>
.dist-line {
  position: absolute;
  background: rgba(255, 80, 80, 0.15);
  border: 1px dashed rgba(255, 80, 80, 0.7);
  pointer-events: none;
  z-index: 3;
  box-sizing: border-box;
}

.dist-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(220, 50, 50, 0.9);
  color: #fff;
  font-size: 11px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 4;
}
</style>
