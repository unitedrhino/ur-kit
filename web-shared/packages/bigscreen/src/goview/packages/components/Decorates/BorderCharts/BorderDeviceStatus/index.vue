<!-- 文件说明：共享大屏编辑器页面及交互，界面文案随当前语言更新。 -->
<template>
  <div style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- 边框层：固定使用 Border04 -->
    <component
      v-if="borderComponent"
      :is="borderComponent"
      :chartConfig="fakeBorderConfig"
      style="position: absolute; inset: 0; pointer-events: none; z-index: 1"
    />
    <!-- 设备状态内容层 -->
    <div
      class="go-device-status"
      :style="{
        position: 'absolute',
        inset: 0,
        padding: `${paddingTop}px ${padding}px ${padding}px`,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }"
    >
      <!-- 3列环形布局 -->
      <div
        class="ring-container"
        :style="{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          width: '100%',
          gap: `${ringMetricsOption.layoutGap}px`
        }"
      >
        <div
          v-for="(metric, index) in ringMetricsOption.metrics"
          :key="index"
          class="ring-metric-item"
          :style="{ textAlign: 'center', flex: 1 }"
        >
          <!-- 环形进度条 -->
          <div
            class="ring-progress"
            :style="{
              width: `${ringMetricsOption.ringSize}px`,
              height: `${ringMetricsOption.ringSize}px`,
              background: `conic-gradient(${getActiveColor(metric)} ${metric.percent}%, #1a1a1a 0)`,
              borderRadius: '50%',
              margin: '0 auto',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }"
          >
            <!-- 内圆形成环形效果 -->
            <div
              class="ring-inner"
              :style="{
                width: `${ringMetricsOption.ringSize - ringMetricsOption.ringThickness * 2}px`,
                height: `${ringMetricsOption.ringSize - ringMetricsOption.ringThickness * 2}px`,
                background: '#0a0a0a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }"
            >
              <!-- 百分比 -->
              <div
                :style="{
                  fontSize: `${ringMetricsOption.percentOption.fontSize}px`,
                  color: ringMetricsOption.percentOption.fontColor,
                  fontWeight: ringMetricsOption.percentOption.fontWeight,
                  letterSpacing: `${ringMetricsOption.percentOption.letterSpacing}px`,
                  textShadow: ringMetricsOption.percentOption.showShadow
                    ? `${ringMetricsOption.percentOption.hShadow}px ${ringMetricsOption.percentOption.vShadow}px ${ringMetricsOption.percentOption.blurShadow}px ${ringMetricsOption.percentOption.colorShadow}`
                    : 'none'
                }"
              >
                {{ metric.percent }}%
              </div>
            </div>
          </div>

          <!-- 数量 -->
          <div
            :style="{
              marginTop: '12px',
              fontSize: `${ringMetricsOption.countOption.fontSize}px`,
              color: ringMetricsOption.countOption.fontColor,
              fontWeight: ringMetricsOption.countOption.fontWeight,
              letterSpacing: `${ringMetricsOption.countOption.letterSpacing}px`,
              textShadow: ringMetricsOption.countOption.showShadow
                ? `${ringMetricsOption.countOption.hShadow}px ${ringMetricsOption.countOption.vShadow}px ${ringMetricsOption.countOption.blurShadow}px ${ringMetricsOption.countOption.colorShadow}`
                : 'none'
            }"
          >
            {{ metric.count }}{{ editorT('orgManage.renewal.unitDevices') }}
          </div>

          <!-- 标签 -->
          <div
            :style="{
              marginTop: '8px',
              fontSize: `${ringMetricsOption.labelOption.fontSize}px`,
              color: ringMetricsOption.labelOption.fontColor,
              fontWeight: ringMetricsOption.labelOption.fontWeight,
              letterSpacing: `${ringMetricsOption.labelOption.letterSpacing}px`,
              textShadow: ringMetricsOption.labelOption.showShadow
                ? `${ringMetricsOption.labelOption.hShadow}px ${ringMetricsOption.labelOption.vShadow}px ${ringMetricsOption.labelOption.blurShadow}px ${ringMetricsOption.labelOption.colorShadow}`
                : 'none'
            }"
          >
            {{ metric.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { $t as editorT } from '@vben/saas/locales';

import { type PropType, computed, shallowRef } from 'vue'
import type { CreateComponentType } from '@/packages/index.type'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { useChartDataFetch } from '@/hooks'
import type { RingMetricsOptionType, DeviceMetricType, Border04OptionType, ThresholdColorType, CompareOperator } from './config'

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
    console.warn(`[BorderDeviceStatus] 未找到边框模块: ${path}`)
    return
  }
  const mod = (await loader()) as any
  borderComponent.value = mod.default
}

// 组件加载时立即加载边框
loadBorderComponent()

// 内边距
const padding = computed(() => props.chartConfig.option.padding ?? 20)

// 顶部内边距（考虑边框标题栏高度，Border04 标题栏约占用 32-53px）
const paddingTop = computed(() => {
  const basePadding = props.chartConfig.option.padding ?? 20
  const borderTitleHeight = props.chartConfig.option.borderOption?.borderTitleHeight ?? 32
  return basePadding + borderTitleHeight + 10 // 额外 10px 间距
})

// 边框子配置
const fakeBorderConfig = computed(() => ({
  ...props.chartConfig,
  option: props.chartConfig.option.borderOption as Border04OptionType,
}))

// 环形配置引用
const ringMetricsOption = computed(() => props.chartConfig.option.ringMetricsOption as RingMetricsOptionType)

// 根据百分比和阈值配置获取当前颜色
const getActiveColor = (metric: DeviceMetricType): string => {
  if (!metric.useThreshold || !metric.thresholds?.length) {
    return metric.color
  }
  const match = metric.thresholds.find((t: ThresholdColorType) => {
    const ops: Record<CompareOperator, (a: number, b: number) => boolean> = {
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '=': (a, b) => a === b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
    }
    // 改为（兼容旧数据没有 operator 字段的情况）：
    return (ops[t.operator ?? '>='])?.(metric.percent, t.value)
  })
  return match?.color ?? metric.color
}

// 数据获取
useChartDataFetch(props.chartConfig, useChartEditStore, (newData: any) => {
  // 支持 IoT 格式：{ dimensions: ['status', 'count'], source: [...] }
  if (newData?.dimensions?.[0] === 'status' && Array.isArray(newData.source)) {
    const statusMap: Record<string, number> = { normal: 0, offline: 0, alarm: 0 }
    let total = 0

    newData.source.forEach((row: any) => {
      if (row.status && typeof row.count === 'number') {
        statusMap[row.status] = row.count
        total += row.count
      }
    })

    // 更新 3 个指标的 percent 和 count
    props.chartConfig.option.ringMetricsOption.metrics.forEach((m: DeviceMetricType) => {
      const key = m.label === '正常' ? 'normal' : m.label === '离线' ? 'offline' : 'alarm'
      m.count = statusMap[key] || 0
      m.percent = total > 0 ? Math.round((m.count / total) * 100) : 0
    })
    return
  }

  // 支持简单对象格式：{ normal: 85, offline: 10, alarm: 5 }
  if (typeof newData === 'object' && newData !== null) {
    if (newData.normal !== undefined || newData.offline !== undefined || newData.alarm !== undefined) {
      const normal = newData.normal || 0
      const offline = newData.offline || 0
      const alarm = newData.alarm || 0
      const total = normal + offline + alarm

      props.chartConfig.option.ringMetricsOption.metrics.forEach((m: DeviceMetricType) => {
        if (m.label === '正常') {
          m.count = normal
          m.percent = total > 0 ? Math.round((normal / total) * 100) : 0
        } else if (m.label === '离线') {
          m.count = offline
          m.percent = total > 0 ? Math.round((offline / total) * 100) : 0
        } else if (m.label === '告警') {
          m.count = alarm
          m.percent = total > 0 ? Math.round((alarm / total) * 100) : 0
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
@include go('device-status') {
  width: 100%;
  height: 100%;
}
</style>
