import type VChart from 'vue-echarts'

import type { EchartsDataType } from '../index.type'

import { globalThemeJson } from '@/settings/chartThemes/index'
import merge from 'lodash/merge'
import pick from 'lodash/pick'

/**
 * 修复全等 Y 值时 yAxis 范围退化问题
 * 当 dataset 中所有数据点的 Y 值完全相同时，ECharts 自动计算的 yAxis min≈max，
 * 折线绘制在图表顶端/底端，视觉上不可见。
 * 此函数在 mergeTheme 后的 option 上设置 yAxis 范围，使折线居中显示。
 * @param option mergeTheme 返回的新对象（可安全修改）
 */
export const fixSameValueYAxis = (option: any) => {
  try {
    const ds = option?.dataset
    if (!ds?.source || !Array.isArray(ds.source) || ds.source.length < 2) return
    const dims = ds.dimensions
    if (!Array.isArray(dims) || dims.length < 2) return

    // 收集所有值维度（dims[0] 是分类维度，其余是值维度）的数据
    const allValues: number[] = []
    for (let d = 1; d < dims.length; d++) {
      ds.source.forEach((r: any) => {
        const v = Number(r[dims[d]])
        if (!Number.isNaN(v)) allValues.push(v)
      })
    }
    if (allValues.length < 2) return

    // 只有当所有值维度的所有数据点都完全相同时，才手动设置 yAxis 范围
    const allSame = allValues.every((v: number) => v === allValues[0])
    if (!allSame) return

    const val = allValues[0]
    // 前面已确认 allValues.length >= 2，此守卫仅为类型收窄，运行时不会触发
    if (val === undefined) return
    const pad = val === 0 ? 10 : Math.abs(val) * 0.2

    const applyRangeToValueAxis = (axis: any) => {
      if (!axis || typeof axis !== 'object') return false
      if ((axis.type ?? 'value') !== 'value') return false
      axis.min = val - pad
      axis.max = val + pad
      return true
    }

    const xAxis = option.xAxis
    const yAxis = option.yAxis

    if (Array.isArray(yAxis)) {
      if (yAxis.some((axis) => applyRangeToValueAxis(axis))) return
    } else if (applyRangeToValueAxis(yAxis)) {
      return
    }

    if (Array.isArray(xAxis)) {
      xAxis.some((axis) => applyRangeToValueAxis(axis))
    } else {
      applyRangeToValueAxis(xAxis)
    }
  } catch { /* ignore */ }
}

/**
 * 合并 color 和全局配置项
 * @param option 配置
 * @param themeSetting 设置
 * @param includes 包含元素
 * @returns object
 */
export const mergeTheme = <T, U>(option: T, themeSetting: U, includes: string[]) => {
  const merged = merge({}, pick(themeSetting, includes), option)
  fixSameValueYAxis(merged)
  return merged
}

/**
 * ECharts option 统一前置处理
 * @param option
 * @return option
 */
export const echartOptionProfixHandle = (option: any, includes: string[] = []) => {
  option.backgroundColor = 'rgba(0,0,0,0)'
  return mergeTheme(option, globalThemeJson, includes)
}

/**
 * 设置数据
 * @param option
 * @return option
 */
export const setData = (option: any, data: EchartsDataType) => {
  option.dataset = data
  return option
}

/**
 * 配置公共 setOption 方法
 * @param instance
 * @param data
 */
export const setOption = <T extends typeof VChart | undefined, D>(instance: T, data: D, notMerge = true) => {
  if (!instance) return
  const option = instance.getOption()
  option.dataset = null
  instance.setOption(data, {
    notMerge
  })
}
