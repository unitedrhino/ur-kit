import type { ChartMappingV2 } from './types'

/**
 * 图表对数据的期望描述 —— 让 chartKey 成为配置决策的一等公民。
 *
 * Phase 3.1 第一批：LineCommon / BarCommon / PieCommon / ScatterCommon
 * 未注册的 chartKey 走 DEFAULT_EXPECTATION 兜底。
 */

/** 图表对数据的期望 */
export interface ChartDataExpectation {
  /** 语义类型：trend=趋势, comparison=对比, distribution=分布, single-value=单值, composite=复合 */
  semantic: 'trend' | 'comparison' | 'distribution' | 'single-value' | 'composite'
  /** 推荐的 X 轴类型 */
  preferredXAxis: 'time' | 'category' | 'none'
  /** log 模式下是否需要聚合 */
  needsAggregation: boolean
  /** 映射模式：标准 X/Y 还是 name+value */
  mappingMode: 'xy' | 'nameValue'
}

// ── 矩阵数据 ──

const CHART_EXPECTATIONS: Record<string, ChartDataExpectation> = {
  // ── 趋势类：折线图 ──
  VLineCommon:    { semantic: 'trend',       preferredXAxis: 'time',     needsAggregation: false, mappingMode: 'xy' },
  VLineGradients: { semantic: 'trend',       preferredXAxis: 'time',     needsAggregation: false, mappingMode: 'xy' },
  VLineGradientSingle: { semantic: 'trend',  preferredXAxis: 'time',     needsAggregation: false, mappingMode: 'xy' },
  VLineLinearSingle:   { semantic: 'trend',  preferredXAxis: 'time',     needsAggregation: false, mappingMode: 'xy' },

  // ── 对比类：柱状图 ──
  VBarCommon:     { semantic: 'comparison',  preferredXAxis: 'category', needsAggregation: true,  mappingMode: 'xy' },
  VBarCrossrange: { semantic: 'comparison',  preferredXAxis: 'category', needsAggregation: true,  mappingMode: 'xy' },
  VBarLine:       { semantic: 'comparison',  preferredXAxis: 'category', needsAggregation: true,  mappingMode: 'xy' },

  // ── 分布类：饼图/环图 ──
  VPieCommon:     { semantic: 'distribution', preferredXAxis: 'none',    needsAggregation: false, mappingMode: 'nameValue' },
  VPieCircle:     { semantic: 'distribution', preferredXAxis: 'none',    needsAggregation: false, mappingMode: 'nameValue' },

  // ── 趋势类：散点图 ──
  VScatterCommon: { semantic: 'trend',       preferredXAxis: 'time',     needsAggregation: false, mappingMode: 'xy' },

  // ── 分布类：漏斗图 ──
  VFunnel:        { semantic: 'distribution', preferredXAxis: 'none',    needsAggregation: false, mappingMode: 'nameValue' },

  // ── 多维类：雷达图 ──
  VRadar:         { semantic: 'distribution', preferredXAxis: 'none',    needsAggregation: false, mappingMode: 'nameValue' },

  // ── 单值类：水球图 ──
  VWaterPolo:     { semantic: 'single-value', preferredXAxis: 'none',    needsAggregation: false, mappingMode: 'nameValue' },
}

const DEFAULT_EXPECTATION: ChartDataExpectation = {
  semantic: 'trend',
  preferredXAxis: 'time',
  needsAggregation: false,
  mappingMode: 'xy',
}

/** 获取图表期望，未注册的 chartKey 走默认 */
export function getChartExpectation(chartKey: string): ChartDataExpectation {
  return CHART_EXPECTATIONS[chartKey] ?? DEFAULT_EXPECTATION
}

/**
 * 图表感知版 Smart Default
 * @param chartKey  图表标识
 * @param strategy  API 策略 prop | device
 * @param mode      数据模式 latest | log
 */
export function getSmartDefault(
  chartKey: string,
  strategy: 'prop' | 'device',
  mode: 'latest' | 'log',
): ChartMappingV2 {
  const exp = getChartExpectation(chartKey)

  // nameValue 模式：饼图/漏斗
  if (exp.mappingMode === 'nameValue') {
    return {
      mode: 'nameValue',
      nameField: strategy === 'device' ? 'device' : 'name',
      valueField: '',  // 由调用方填入第一个属性 ID
      isUserOverride: false,
    }
  }

  // XY 模式
  let xDimension: 'time' | 'device' | 'property' = 'time'

  switch (exp.preferredXAxis) {
    case 'time':
      xDimension = 'time'
      break
    case 'category':
      xDimension = strategy === 'device' ? 'device' : 'property'
      break
    case 'none':
      xDimension = strategy === 'device' ? 'device' : 'property'
      break
  }

  return {
    mode: 'xy',
    xDimension,
    yMetrics: [],  // 由调用方填入所有属性 ID
    isUserOverride: false,
  }
}
