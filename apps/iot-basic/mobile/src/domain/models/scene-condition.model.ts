// 场景生效条件(When)模型 —— 对齐后端 backend/things/service/udsvr/internal/domain/scene

import type { CmpType, Cmp } from './scene-trigger.model';

// ======================== 时间/日期范围 ========================

export type WhenRangeType = 'date' | 'time';

export type TimeRangeType = 'allDay' | 'light' | 'night' | 'customRange';

export type DateRangeType =
  | 'allDay'
  | 'workday'
  | 'weekend'
  | 'holiday'
  | 'customRange'
  | 'customWeek';

export interface TimeRange {
  type: TimeRangeType;
  startTime?: number;              // 0 点起秒数
  endTime?: number;
}

export interface DateRange {
  type: DateRangeType;
  startDate?: string;              // yyyy-MM-dd
  endDate?: string;
  repeat?: string;                 // 自定义周:7 位二进制
}

export interface WhenRange {
  order: number;
  type: WhenRangeType;
  dateRange?: DateRange;
  timeRange?: TimeRange;
}

// ======================== 条件(Conditions) ========================

export type TermColumnType = 'property' | 'event' | 'time' | 'weather';

export type TermCondType = 'and' | 'or';

// 物模型条件
export interface TermProperty {
  areaID?: string;
  productID: string;
  productName?: string;
  deviceName: string;
  deviceAlias?: string;
  schemaAffordance?: string;
  // Compare
  dataID: string;
  dataName?: string;
  termType?: CmpType;
  values?: string[];
  terms?: Cmp[];
}

// 时间条件
export type TimeConditionType = 'sys' | 'sunRises' | 'sunSet';
export interface TermTime {
  type: TimeConditionType;
  termType: CmpType;
  values: string[];
}

// 天气条件
export type WeatherConditionType = 'temp' | 'humidity';
export interface TermWeather {
  type: WeatherConditionType;
  termType: CmpType;
  values: string[];
}

export interface Term {
  order: number;
  columnType: TermColumnType;
  property?: TermProperty;
  weather?: TermWeather;
  time?: TermTime;
  status?: number;
  isAbnormal?: boolean;
  reason?: string;
}

export interface Conditions {
  terms: Term[];
  type: TermCondType;
}

// ======================== When 整体 ========================

export interface SceneCondition {
  validRanges: WhenRange[];
  invalidRanges: WhenRange[];
  conditions: Conditions;
}

/** 创建一个空的场景生效条件(When)。纯领域工厂，无 DTO 映射。 */
export function createEmptyCondition(): SceneCondition {
  return {
    validRanges: [],
    invalidRanges: [],
    conditions: { terms: [], type: 'and' },
  };
}
