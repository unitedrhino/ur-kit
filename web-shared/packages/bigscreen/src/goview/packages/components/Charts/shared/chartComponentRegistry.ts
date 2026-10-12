import { markRaw } from 'vue'

type ComponentModule = {
  default: any
}

const chartViewModules: Record<string, ComponentModule> = import.meta.glob('../**/index.vue', {
  eager: true,
})

const chartConfigModules: Record<string, ComponentModule> = import.meta.glob('../**/config.vue', {
  eager: true,
})

const resolveChartComponent = (modules: Record<string, ComponentModule>, chartKey?: string) => {
  if (!chartKey) return null

  for (const path in modules) {
    const pathList = path.split('/')
    const moduleRecord = modules[path]
    // glob 记录与 key 一一对应，索引必然有效；此处守卫仅为类型收窄
    if (!moduleRecord) continue
    if (pathList[pathList.length - 2] === chartKey) {
      return markRaw(moduleRecord.default)
    }
  }

  return null
}

export const resolveRawChartViewComponent = (chartKey?: string) => {
  return resolveChartComponent(chartViewModules, chartKey)
}

export const resolveRawChartConfigComponent = (chartKey?: string) => {
  return resolveChartComponent(chartConfigModules, chartKey)
}
