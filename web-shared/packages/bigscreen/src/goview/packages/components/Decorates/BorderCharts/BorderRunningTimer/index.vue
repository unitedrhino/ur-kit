<template>
  <div style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- 边框层：固定使用 Border04 -->
    <component
      v-if="borderComponent"
      :is="borderComponent"
      :chartConfig="fakeBorderConfig"
      style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
    />
    <!-- 累计运行时间内容层 -->
    <div
      class="go-running-timer"
      :style="{
        position: 'absolute',
        inset: 0,
        padding: `${paddingTop}px ${padding}px ${padding}px`,
        zIndex: 2,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '40px'
      }"
    >
      <!-- 天数翻牌器 -->
      <div style="display: flex; align-items: baseline; gap: 8px">
        <n-space :size="dayOption.flipperGap" align="center" justify="center">
          <flipper
            :count="item"
            :width="dayOption.flipperWidth"
            :height="dayOption.flipperHeight"
            :front-color="dayOption.flipperTextColor"
            :back-color="dayOption.flipperBgColor"
            :radius="dayOption.flipperRadius"
            :flip-type="dayOption.flipperType"
            :duration="dayOption.flipperSpeed"
            :border-width="dayOption.flipperBorderWidth"
            v-for="(item, index) in dayFlipperData"
            :key="'d' + index"
            class="go-d-block"
          />
        </n-space>
        <!-- 天单位 -->
        <span
          v-if="dayUnitOption.text"
          :style="unitStyle(dayUnitOption)"
        >
          {{ dayUnitOption.text }}
        </span>
      </div>

      <!-- 小时翻牌器 -->
      <div style="display: flex; align-items: baseline; gap: 8px">
        <n-space :size="hourOption.flipperGap" align="center" justify="center">
          <flipper
            :count="item"
            :width="hourOption.flipperWidth"
            :height="hourOption.flipperHeight"
            :front-color="hourOption.flipperTextColor"
            :back-color="hourOption.flipperBgColor"
            :radius="hourOption.flipperRadius"
            :flip-type="hourOption.flipperType"
            :duration="hourOption.flipperSpeed"
            :border-width="hourOption.flipperBorderWidth"
            v-for="(item, index) in hourFlipperData"
            :key="'h' + index"
            class="go-d-block"
          />
        </n-space>
        <!-- 小时单位 -->
        <span
          v-if="hourUnitOption.text"
          :style="unitStyle(hourUnitOption)"
        >
          {{ hourUnitOption.text }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, watch, ref, shallowRef, computed } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import { Flipper } from '@/components/Pages/Flipper'
import type { FlipperOptionType, UnitOptionType, Border04OptionType } from './config'

// 用 import.meta.glob 预声明所有边框模块
const borderModules = import.meta.glob('../../Borders/*/index.vue')

const props = defineProps({
  chartConfig: {
    type: Object as PropType<CreateComponentType>,
    required: true
  }
})

// 动态加载边框 Vue 组件（固定 Border04）
const borderComponent = shallowRef<any>(null)

const loadBorderComponent = async () => {
  const path = '../../Borders/Border04/index.vue'
  const loader = borderModules[path]
  if (!loader) {
    console.warn(`[BorderRunningTimer] 未找到边框模块: ${path}`)
    return
  }
  const mod = (await loader()) as any
  borderComponent.value = mod.default
}

loadBorderComponent()

// 内边距
const padding = computed(() => props.chartConfig.option.padding ?? 20)

// 顶部内边距（考虑边框标题栏高度）
const paddingTop = computed(() => {
  const base = props.chartConfig.option.padding ?? 20
  const borderOpt = props.chartConfig.option.borderOption
  const titleHeight = borderOpt?.borderTitleHeight ?? 32
  return base + titleHeight + 10
})

// 边框子配置
const fakeBorderConfig = computed(() => ({
  ...props.chartConfig,
  option: props.chartConfig.option.borderOption as Border04OptionType,
}))

// 配置引用
const dayOption = computed(() => props.chartConfig.option.dayOption as FlipperOptionType)
const hourOption = computed(() => props.chartConfig.option.hourOption as FlipperOptionType)
const dayUnitOption = computed(() => props.chartConfig.option.dayUnitOption as UnitOptionType)
const hourUnitOption = computed(() => props.chartConfig.option.hourUnitOption as UnitOptionType)

// 单位样式计算
const unitStyle = (opt: UnitOptionType) => ({
  fontSize: `${opt.fontSize}px`,
  color: opt.fontColor,
  fontWeight: opt.fontWeight,
  letterSpacing: `${opt.letterSpacing}px`,
  textShadow: opt.showShadow
    ? `${opt.hShadow}px ${opt.vShadow}px ${opt.blurShadow}px ${opt.colorShadow}`
    : 'none',
})

// 翻牌器数据
const dayFlipperData = ref<string[] | number[]>([])
const hourFlipperData = ref<string[] | number[]>([])

const getFlipperData = (val: string | number, length: number) => {
  return val
    .toString()
    .padStart(length, '0')
    .split('')
    .slice(length * -1)
}

const updateDayHandler = (val: string | number) => {
  dayFlipperData.value = getFlipperData(val, dayOption.value.flipperLength)
}

const updateHourHandler = (val: string | number) => {
  hourFlipperData.value = getFlipperData(val, hourOption.value.flipperLength)
}

// 监听配置变化
watch(
  () => props.chartConfig.option.dayOption,
  newVal => {
    try { updateDayHandler((newVal as FlipperOptionType).dataset) } catch {}
  },
  { immediate: true, deep: true }
)

watch(
  () => props.chartConfig.option.hourOption,
  newVal => {
    try { updateHourHandler((newVal as FlipperOptionType).dataset) } catch {}
  },
  { immediate: true, deep: true }
)

// 数据获取
useChartDataFetch(props.chartConfig, useChartEditStore, (newVal: any) => {
  // 支持 { days, hours } 格式
  if (typeof newVal === 'object' && newVal !== null) {
    if (newVal.days !== undefined) {
      updateDayHandler(newVal.days)
      // 回写 store，使 previewHandle 捕获最新值（供预览窗口直接显示，无需等 AJAX）
      try { (props.chartConfig.option.dayOption as any).dataset = newVal.days } catch {}
    }
    if (newVal.hours !== undefined) {
      updateHourHandler(newVal.hours)
      try { (props.chartConfig.option.hourOption as any).dataset = newVal.hours } catch {}
    }
  }
})
</script>

<style lang="scss" scoped>
@include go('running-timer') {
  width: 100%;
  height: 100%;
}
</style>
