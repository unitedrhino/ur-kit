/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { IoTMetadata, IoTSeriesConfig, ChartMapping } from './types';

import cloneDeep from 'lodash-es/cloneDeep';

/**
 * 根据 IoT 元数据智能推导 series 配置骨架。
 *
 * 纯函数、无状态——只负责根据 dimensions 实际列名推导出：
 *   1. X 轴绑定的维度名（数据驱动：有 time 列用 time，否则取首列）
 *   2. Y 轴维度列表
 *   3. 每个 Y 维度对应一条 series（type / encode / name）
 *
 * 入口分离，逻辑下沉——barAdapter / lineAdapter 各自调用后注入图表特有属性。
 */

/** 非数据维度：时间戳等元字段，不应作为 Y 轴度量 */
const NON_DATA_DIMS = new Set([editorT('orgManage.pointLog.time'), '_timestamp']);

/**
 * 根据设备数和属性数决定列名策略
 * - N:1（多设备单属性）→ 列名=设备名
 * - 1:N（单设备多属性）→ 列名=属性名
 * - N:N（多设备多属性）→ 列名=设备_属性 组合
 */
export function buildColumnName(
  deviceName: string,
  propName: string,
  deviceCount: number,
  propCount: number,
): string {
  if (deviceCount > 1 && propCount === 1) return deviceName;
  if (deviceCount === 1 && propCount > 1) return propName;
  return `${deviceName}_${propName}`;
}

/**
 * 根据 IoT 元数据推导 series 配置（数据驱动：以 dimensions 实际列名为准）
 */
export function parseIoTMetaToSeries(
  dimensions: string[],
  _iotMeta: IoTMetadata,
  chartType: string,
): IoTSeriesConfig {
  // 数据驱动：看 dimensions 里是否有 time 列，而非硬编码 mode === 'log'
  const hasTimeCol = dimensions.includes('time');
  // dimensions 为空时 yDims 亦为空、xDim 无实际消费，此兜底仅为满足严格索引类型收窄
  const xDim = hasTimeCol ? 'time' : (dimensions[0] ?? '');

  // Y 轴维度 = 除 X 轴和非数据维度外的所有维度
  const yDims = dimensions.filter(d => d !== xDim && !NON_DATA_DIMS.has(d));

  // 构建 series 骨架
  const series = yDims.map(yDim => ({
    type: chartType,
    encode: { x: xDim, y: yDim },
    name: yDim,
  }));

  return { series };
}

export function applySeriesTemplateCycle(
  series: IoTSeriesConfig['series'],
  templates?: Array<Record<string, any>>,
): IoTSeriesConfig['series'] {
  if (!Array.isArray(templates) || templates.length === 0) return series;

  return series.map((item, index) => {
    const template = cloneDeep(templates[index % templates.length] ?? {});
    return {
      ...template,
      ...item,
      type: template.type || item.type,
      name: item.name,
      encode: item.encode,
    };
  });
}

/**
 * 从用户在 SmartMapping 中配置的 mappings 反向构建 series
 * 防御 2：UI 映射优先于推导
 * @deprecated 保留兼容旧 SmartMapping，新代码使用 parseMappingToSeries
 */
export function buildSeriesFromMappings(
  mappings: Record<string, string | string[]>,
  chartType: string,
  availableDimensions?: string[],
): Array<{ type: string; encode: { x: string; y: string }; name: string }> {
  const xValue = mappings['x'] ?? mappings['xAxis'] ?? '';
  const yFields = mappings['y'] ?? mappings['yAxis'] ?? [];
  const xField = Array.isArray(xValue) ? (xValue[0] ?? '') : xValue;
  const availableDimSet = Array.isArray(availableDimensions) && availableDimensions.length > 0
    ? new Set(availableDimensions)
    : null;

  if (!xField) return [];
  if (availableDimSet && !availableDimSet.has(xField)) return [];

  const yArr = Array.isArray(yFields) ? yFields : [yFields];
  const validYFields = yArr
    .filter((y): y is string => !!y)
    .filter(y => y !== xField)
    .filter(y => !availableDimSet || availableDimSet.has(y))
    .filter((y, index, arr) => arr.indexOf(y) === index);

  if (validYFields.length === 0) return [];

  return validYFields
    .map(y => ({
      type: chartType,
      encode: { x: xField as string, y: y as string },
      name: y as string,
    }));
}

/**
 * @deprecated Phase 3.2 不再使用。保留供后续迭代参考。
 * Phase 3: 根据用户在 BI 映射 UI 中设定的 ChartMapping 生成 series
 * 映射驱动——xDimension 决定 X 轴维度名，yMetrics 决定 Y 轴度量和 series 数量
 */
export function parseMappingToSeries(
  mapping: ChartMapping,
  dimensions: string[],
  chartType: string,
): IoTSeriesConfig {
  // xDimension → 实际维度名
  const xDim = mapping.xDimension === 'time' ? 'time'
    : mapping.xDimension === 'device' ? 'device'
    : 'name'; // property → 对应 prop 数据的 name 维度

  // yMetrics 优先，无则 fallback 到除 X 外的所有维度（排除非数据维度）
  const yDims = mapping.yMetrics.length > 0
    ? mapping.yMetrics
    : dimensions.filter(d => d !== xDim && !NON_DATA_DIMS.has(d));

  const series = yDims.map(y => ({
    type: chartType,
    encode: { x: xDim, y },
    name: y,
  }));

  return { series };
}

/**
 * 从 IoTMetadata.dataUnits 推导 yAxis 轴标题（单位）
 *
 * 规则：
 * - 所有 Y 维度共享同一 unit → 直接用该 unit
 * - 多个不同 unit → 不自动注入，避免误导
 * - 无 unit → 不注入
 */
export function deriveYAxisUnit(
  iotMeta: IoTMetadata,
  dimensions: string[],
): string {
  const units = iotMeta.dataUnits;
  if (!units || Object.keys(units).length === 0) return '';

  const hasTimeCol = dimensions.includes('time');
  const xDim = hasTimeCol ? 'time' : dimensions[0];

  const yDims = dimensions.filter(d => d !== xDim && !NON_DATA_DIMS.has(d));

  // 收集 Y 维度对应的 unit（去重）
  const unitSet = new Set<string>();
  for (const yDim of yDims) {
    if (units[yDim]) unitSet.add(units[yDim]);
  }

  // 所有 Y 维度同一 unit → 直接使用
  // unitSet.size===1 时唯一元素必存在，此兜底仅为满足严格索引类型收窄
  if (unitSet.size === 1) return [...unitSet][0] ?? '';

  // 兜底：dataUnits 所有值相同时直接使用（列名可能由 dataName 生成，与 identifier 不一致）
  const allValues = Object.values(units);
  // allValues.length>0 时首项必存在，此兜底仅为满足严格索引类型收窄
  if (allValues.length > 0 && allValues.every(v => v === allValues[0])) {
    return allValues[0] ?? '';
  }

  // 多个不同 unit 或无 unit → 不自动注入
  return '';
}
