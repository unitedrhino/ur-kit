import type { DataAdapter } from './types';

import { barAdapter } from './barAdapter';
import { defaultAdapter } from './defaultAdapter';
import { horizontalBarAdapter } from './horizontalBarAdapter';
import { lineAdapter } from './lineAdapter';
import { pieAdapter } from './pieAdapter';
import { radarAdapter } from './radarAdapter';

/**
 * 适配器映射表 —— key 使用 chartKey 值（带 V 前缀）
 *
 * Phase 3.1 更新：
 * - key 从 'BarCommon' 统一为 'VBarCommon'（匹配运行时 chartKey）
 * - 新增 pieAdapter 用于饼图/环图
 * - 散点图复用 lineAdapter（数据结构相同）
 */
const adapterMap: Record<string, DataAdapter> = {
  // ── 柱状图 ──
  VBarCommon: barAdapter,
  VBarCrossrange: horizontalBarAdapter,
  VBarLine: barAdapter,
  // ── 折线图 ──
  VLineCommon: lineAdapter,
  VLineGradients: lineAdapter,
  VLineGradientSingle: lineAdapter,
  VLineLinearSingle: lineAdapter,
  // ── 饼图/环图 ──
  VPieCommon: pieAdapter,
  VPieCircle: pieAdapter,
  // ── 散点图（复用 lineAdapter） ──
  VScatterCommon: lineAdapter,
  VScatterLogarithmicRegression: lineAdapter,
  // ── 漏斗图（复用 pieAdapter 的 nameValue 模式） ──
  VFunnel: pieAdapter,
  // ── 雷达图 ──
  VRadar: radarAdapter,
};

/**
 * 兼容旧注册（无 V 前缀的 key 仍可命中）
 * 在 getAdapter 中 stripPrefix 查找
 */
const LEGACY_PREFIX_MAP: Record<string, string> = {
  BarCommon: 'VBarCommon',
  BarCrossrange: 'VBarCrossrange',
  LineCommon: 'VLineCommon',
  LineGradients: 'VLineGradients',
};

/** 根据 adapterType（优先）或 chartKey 获取适配器，未注册则返回通用适配器 */
export const getAdapter = (chartKey: string, adapterType?: string): DataAdapter => {
  // 1. adapterType 显式指定
  if (adapterType) {
    if (adapterMap[adapterType]) return adapterMap[adapterType];
    // 兼容旧 adapterType（无 V 前缀）
    const mapped = LEGACY_PREFIX_MAP[adapterType];
    if (mapped && adapterMap[mapped]) return adapterMap[mapped];
  }
  // 2. chartKey 直接匹配
  if (adapterMap[chartKey]) return adapterMap[chartKey];
  // 3. 兜底
  return defaultAdapter;
};

/** 获取所有已注册的适配器类型名，供封装弹窗下拉选择 */
export const getAdapterTypes = (): string[] => Object.keys(adapterMap);
