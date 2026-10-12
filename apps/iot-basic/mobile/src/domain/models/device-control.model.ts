import type { DeviceEntity } from '../entities/device.entity';

/** 物模型 define.type 全集（仅前 6 种在本版 UI 中被渲染） */
export type DefineType =
  | 'bool'
  | 'int'
  | 'float'
  | 'string'
  | 'enum'
  | 'timestamp'
  | 'struct'
  | 'array';

/** 本版公版详情页支持渲染的 define 类型 */
export const SUPPORTED_DEFINE_TYPES: DefineType[] = [
  'bool',
  'int',
  'float',
  'string',
  'enum',
  'timestamp',
];

/** 物模型字段定义（保留最常用字段，不做判别联合严格化以兼容后端松散返回） */
export interface ThingModelDefine {
  type: DefineType;
  /** bool / enum: {"0":"关","1":"开", ...} */
  mapping?: Record<string, string>;
  /** int / float */
  min?: string;
  max?: string;
  step?: string;
  unit?: string;
  /** string */
  maxLen?: string;
  /** struct / array 原样保留，供后续迭代使用 */
  specs?: unknown;
  arrayInfo?: unknown;
}

export type PropertyMode = 'r' | 'rw';
export type DirType = 'up' | 'down';

export interface ThingModelProperty {
  identifier: string;
  name: string;
  mode: PropertyMode;
  define: ThingModelDefine;
  /** funcGroup 表示功能分类：1 普通功能，2 系统功能；缺失或 0 按普通功能处理。 */
  funcGroup?: number;
}

export interface ActionParam {
  identifier: string;
  name: string;
  define: ThingModelDefine;
}

export interface ThingModelAction {
  identifier: string;
  name: string;
  dir: DirType;
  input: ActionParam[];
  output: ActionParam[];
}

export interface ThingModelEvent {
  identifier: string;
  name: string;
  type: string;
  params: ActionParam[];
}

export interface ThingModelSchema {
  properties: ThingModelProperty[];
  events: ThingModelEvent[];
  actions: ThingModelAction[];
}

/** UI 属性卡片模型：schema + 最新值合并结果 */
export interface PropertyItem {
  identifier: string;
  name: string;
  mode: PropertyMode;
  define: ThingModelDefine;
  /** funcGroup 表示功能分类：1 普通功能，2 系统功能；缺失或 0 按普通功能处理。 */
  funcGroup?: number;
  /** 设备最新上报值；未上报过则为 null */
  value: unknown;
  /** 毫秒时间戳；未上报过则为 0 */
  timestamp: number;
}

/** UI 行为卡片模型：仅 dir==='down' 且所有入参均为受支持类型 */
export interface ActionItem {
  identifier: string;
  name: string;
  input: ActionParam[];
}

export interface DeviceControlModel {
  device: DeviceEntity;
  properties: PropertyItem[];
  actions: ActionItem[];
  thingModel: ThingModelSchema;
  pendingCommands: string[];
}

/** 内部使用：property-latest 接口返回条目 */
export interface PropertyState {
  dataID: string;
  dataName: string;
  value: unknown;
  timestamp: number;
}
