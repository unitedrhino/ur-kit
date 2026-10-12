import type { App } from 'vue'
import { defineAsyncComponent } from 'vue'
import { GoSkeleton } from '@/components/GoSkeleton'
import { GoLoading } from '@/components/GoLoading'
import { SketchRule } from 'vue3-sketch-ruler'

/**
 * 全局注册自定义组件
 * @param app
 */
export function setupCustomComponents(app: App) {
  app.component('GoSkeleton', GoSkeleton)
  app.component('GoLoading', GoLoading)
  app.component('SketchRule', SketchRule)
  // 复合组件（边框+图表）：使用 defineAsyncComponent 懒加载，避免静态 import 引入
  // chartEditStore → settingStore 循环依赖导致的 TDZ 错误
  app.component('VBorderChartBase', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderChartBase/index.vue')
  ))
  app.component('VCBorderChartBase', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderChartBase/config.vue')
  ))
  // 边框+指标翻牌器组件
  app.component('VBorderMetricFlipper', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderMetricFlipper/index.vue')
  ))
  app.component('VCBorderMetricFlipper', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderMetricFlipper/config.vue')
  ))
  // 边框+设备状态组件
  app.component('VBorderDeviceStatus', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderDeviceStatus/index.vue')
  ))
  app.component('VCBorderDeviceStatus', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderDeviceStatus/config.vue')
  ))
  // 边框+双图表组件
  app.component('VBorderDualChart', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderDualChart/index.vue')
  ))
  app.component('VCBorderDualChart', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderDualChart/config.vue')
  ))
  // 边框+累计运行时间组件
  app.component('VBorderRunningTimer', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderRunningTimer/index.vue')
  ))
  app.component('VCBorderRunningTimer', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderRunningTimer/config.vue')
  ))
  app.component('VCBorderRunningTimerDataConfig', defineAsyncComponent(
    () => import('@/packages/components/Decorates/BorderCharts/BorderRunningTimer/dataConfig.vue')
  ))
  // 增强版 Group 配置面板
  app.component('VEnhancedGroupConfig', defineAsyncComponent(
    () => import('@/packages/components/Groups/EnhancedGroup/config.vue')
  ))
}
