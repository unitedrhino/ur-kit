// Go场景类型定义（手动优化版本，用于前端表单交互）

//////////
// 比较操作类型
//////////

export type CmpType = 'eq' | 'not' | 'btw' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'all';

export const CmpTypeEq: CmpType = 'eq'; // 相等
export const CmpTypeNot: CmpType = 'not'; // 不相等
export const CmpTypeBtw: CmpType = 'btw'; // 在xx之间
export const CmpTypeGt: CmpType = 'gt'; // 大于
export const CmpTypeGte: CmpType = 'gte'; // 大于等于
export const CmpTypeLt: CmpType = 'lt'; // 小于
export const CmpTypeLte: CmpType = 'lte'; // 小于等于
export const CmpTypeIn: CmpType = 'in'; // 在xx值之中,可以有n个参数
export const CmpTypeAll: CmpType = 'all'; // 全部触发

//////////
// 触发器类型
//////////

export type TriggerType = 'device' | 'timer' | 'weather' | 'manual' | 'scene';

export const TriggerTypeDevice: TriggerType = 'device';
export const TriggerTypeTimer: TriggerType = 'timer';
export const TriggerTypeWeather: TriggerType = 'weather';
export const TriggerTypeManual: TriggerType = 'manual';
export const TriggerTypeScene: TriggerType = 'scene';

export interface If {
  triggers?: Trigger[];
}

export interface Trigger {
  type: TriggerType;
  order: number;
  areaID: number;
  device?: TriggerDevice;
  timer?: TriggerTimer;
  weather?: TriggerWeather;
  isAbnormal?: boolean;
  reason?: string;
}

//////////
// 场景基础类型
//////////

export type SceneType = 'manual' | 'auto';
export const SceneTypeManual: SceneType = 'manual';
export const SceneTypeAuto: SceneType = 'auto';

export type DeviceMode = 'single' | 'multi';
export const DeviceModeSingle: DeviceMode = 'single';
export const DeviceModeMulti: DeviceMode = 'multi';

export type Status = 1 | 2;
export const StatusNormal = 1;
export const StatusForbidden = 2;

export type Reason = string;
export const ReasonDeviceDelete = '设备被删除或解绑';
export const ReasonDeviceMove = '设备被挪动,无权限';
export const ReasonAreaDelete = '区域被删除';

export interface SceneInfo {
  id: number;
  tenantCode: string;
  projectID: number;
  areaID: number;
  headImg: string;
  flowPath: FlowInfo[];
  deviceMode: DeviceMode;
  productID?: string;
  deviceName?: string;
  deviceAlias?: string;
  lastRunTime: number;
  tag: string;
  logo: string;
  name: string;
  desc: string;
  createdTime: string;
  type: SceneType;
  if: If;
  when: When;
  then: Then;
  status: Status;
  isAbnormal?: boolean;
  reason: Reason;
  isCommon: boolean;
  body?: string;
  log?: Log;
  triggerSubType?: TriggerType;
  triggerDetail?: any;
}

export interface FlowInfo {
  type: string;
  subType: string;
  info: string;
}

//////////
// 状态保持
//////////

export type StateKeepType = 'duration' | 'repeat';

export interface StateKeep {
  type: StateKeepType;
  value: number;
}

//////////
// 设备触发器
//////////

export type SelectType = 'all' | 'fixed' | 'area' | 'group';

export type TriggerDeviceMode = 'edge' | 'level';
export const TriggerDeviceModeEdge: TriggerDeviceMode = 'edge';
export const TriggerDeviceModeLevel: TriggerDeviceMode = 'level';

export type TriggerDeviceType = 'connected' | 'disConnected' | 'propertyReport' | 'eventReport';

export type Cmps = Cmp[];

export interface Cmp {
  column: string;
  termType: CmpType;
  values: string[];
}

export interface Compare {
  dataID: string;
  dataName: string;
  termType?: CmpType;
  values?: string[];
  terms?: Cmps;
}

export interface TriggerDevice extends Compare {
  stateKeep?: StateKeep;
  productName?: string;
  productID?: string;
  selectType: SelectType;
  groupID?: number;
  areaID?: number;
  areaIDPath?: string;
  deviceName?: string;
  deviceAlias?: string;
  mode?: TriggerDeviceMode;
  type?: TriggerDeviceType;
  schemaAffordance: string;
  body?: string;
}

//////////
// 定时触发器
//////////

export type ExecType = 'at' | 'sunRises' | 'sunSet' | 'loop';

export type RepeatType = 'once' | 'week' | 'mount' | 'allDay' | 'customRange' | 'workday' | 'weekend' | 'holiday';

export interface TriggerTimer {
  execType: ExecType;
  execAdd?: number;
  execAt?: number;
  execLoopStart?: number;
  execLoopEnd?: number;
  execLoop?: number;
  repeatType?: RepeatType;
  execRepeat?: string;
  execRepeatStart?: string;
  execRepeatEnd?: string;
}

//////////
// 天气触发器
//////////

export type WeatherType = 'temp' | 'humidity';

export interface TermWeather {
  type: WeatherType;
  termType: CmpType;
  values: string[];
}

export interface TriggerWeather extends TermWeather {}

//////////
// When条件
//////////

export interface When {
  validRanges?: WhenRange[];
  invalidRanges?: WhenRange[];
  conditions?: Conditions;
}

export interface WhenRange {
  order: number;
  type: string;
  dateRange?: DateRange;
  timeRange?: TimeRange;
}

export type TimeRangeType = 'allDay' | 'light' | 'night' | 'customRange';

export type DateRangeType = 'allDay' | 'workday' | 'weekend' | 'holiday' | 'customRange' | 'customWeek';

export interface TimeRange {
  type: TimeRangeType;
  startTime?: number;
  endTime?: number;
}

export interface DateRange {
  type: DateRangeType;
  startDate?: string;
  endDate?: string;
  repeat?: string;
}

//////////
// 条件
//////////

export interface Conditions {
  terms?: Term[];
  type: TermCondType;
}

export type TermCondType = 'or' | 'and';

export type TermColumnType = 'property' | 'event' | 'time' | 'weather';

export interface Term {
  order: number;
  columnType: TermColumnType;
  property?: TermProperty;
  weather?: TermWeather;
  time?: TermTime;
  status: Status;
  isAbnormal: boolean;
  reason: string;
}

export interface TermProperty extends Compare {
  areaID?: number;
  productName?: string;
  productID?: string;
  deviceName?: string;
  deviceAlias?: string;
  schemaAffordance?: string;
}

export type TimeType = 'sys' | 'sunRises' | 'sunSet';

export interface TermTime {
  type: TimeType;
  termType: CmpType;
  values: string[];
}

//////////
// Then执行动作
//////////

export interface Then {
  actions: Action[];
}

export type ActionType = 'notify' | 'delay' | 'device' | 'alarm' | 'scene';

export interface Action {
  id: number;
  order: number;
  type: ActionType;
  delay?: number;
  alarm?: ActionAlarm;
  notify?: ActionNotify;
  device?: ActionDevice;
  scene?: ActionScene;
  status: Status;
  isAbnormal: boolean;
  reason: string;
}

export type ActionAlarmMode = 'trigger' | 'relieve';

export interface ActionAlarm {
  mode?: ActionAlarmMode;
}

export type ActionDeviceType = 'propertyControl' | 'action';

export interface ActionDevice {
  areaID?: number;
  areaName?: string;
  productID?: string;
  productName?: string;
  selectType?: SelectType;
  deviceName?: string;
  deviceAlias?: string;
  groupID?: number;
  type?: ActionDeviceType;
  dataID?: string;
  dataName?: string;
  schemaAffordance?: string;
  value?: string;
  values?: DeviceValue[];
  body?: string;
}

export interface DeviceValue {
  dataID: string;
  dataName: string;
  schemaAffordance: string;
  value: string;
}

export type NotifyUserType = 'account' | 'userID' | 'deviceOwner' | 'deviceProjectAdmin' | 'deviceAreaAdmin' | 'deviceProjectAll' | 'deviceAreaAll';

export interface ActionNotify {
  type: any;
  notifyCode: any;
  userType: NotifyUserType;
  accounts?: string[];
  userIDs?: string[];
  params?: Record<string, string>;
  str1?: string;
  str2?: string;
  str3?: string;
}

export interface ActionScene {
  areaID?: number;
  sceneID?: number;
  sceneType?: SceneType;
  sceneName?: string;
  status?: boolean;
}

//////////
// 日志相关
//////////

export interface Log {
  projectID: number;
  areaID: number;
  sceneID: number;
  type: SceneType;
  status: boolean;
  createdTime: string;
  trigger?: LogTrigger;
  actions: LogAction[];
}

export interface LogAction {
  type: ActionType;
  device?: LogActionDevice;
  alarm?: LogActionAlarm;
  delay?: number;
  scene?: LogActionScene;
  status: number;
  code: number;
  msg: string;
  msgToken: string;
}

export interface LogActionAlarm {
  mode: ActionAlarmMode;
}

export interface LogActionScene {
  sceneID: number;
  sceneName: string;
}

export interface LogActionDevice {
  productID: string;
  productName: string;
  deviceName: string;
  deviceAlias?: string;
  values: LogActionDeviceValue[];
}

export interface LogActionDeviceValue {
  dataID: string;
  dataName: string;
  value: string;
}

export interface LogTrigger {
  type: TriggerType;
  time: string;
  device?: LogTriggerDevice;
}

export interface LogTriggerDevice {
  productID?: string;
  deviceName?: string;
  deviceAlias?: string;
  type?: TriggerDeviceType;
  dataID: string;
  dataName: string;
  value: string;
}
