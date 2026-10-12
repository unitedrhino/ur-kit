// 场景触发器模型 —— 对齐后端 backend/things/service/udsvr/internal/domain/scene

// ======================== 通用类型 ========================

export type TriggerType = 'device' | 'timer' | 'weather' | 'manual' | 'scene';

export type SelectType =
  | 'all'               // 产品下所有设备
  | 'fixed'             // 指定设备
  | 'area'              // 某区域下设备
  | 'areaWithChildren'  // 区域及子区域
  | 'group';            // 分组

export type TriggerDeviceMode = 'edge' | 'level';  // edge:边缘触发(默认) level:水平触发

export type TriggerDeviceType =
  | 'connected'         // 上线
  | 'disConnected'      // 下线
  | 'propertyReport'    // 属性上报
  | 'eventReport';      // 事件上报

export type CmpType =
  | 'eq' | 'not' | 'btw' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'all';

// 比较条件 —— 对齐 scene.Cmp
export interface Cmp {
  column: string;
  termType: CmpType;
  values: string[];
}

// 状态保持
export interface StateKeep {
  type: '' | 'duration' | 'repeat';
  value: number;
}

// ======================== 设备触发 ========================

export interface TriggerDevice {
  productID: string;
  productName?: string;
  selectType: SelectType;
  groupID?: string;
  areaID?: string;
  areaIDPath?: string;
  deviceName?: string;
  deviceAlias?: string;
  mode?: TriggerDeviceMode;
  type: TriggerDeviceType;
  stateKeep?: StateKeep;
  // Compare 内嵌字段
  dataID: string;
  dataName?: string;
  termType?: CmpType;
  values?: string[];
  terms?: Cmp[];
  schemaAffordance?: string;
  body?: string;
}

// ======================== 定时触发 ========================

export type ExecType = 'at' | 'sunRises' | 'sunSet' | 'loop';

export type RepeatType = 'once' | 'week' | 'mount' | 'allDay' | 'customRange';

export interface TriggerTimer {
  execType: ExecType;
  execAdd?: number;              // 日出日落前后秒数
  execAt?: number;               // 执行时间点(从 0 点起秒数)
  execLoopStart?: number;
  execLoopEnd?: number;
  execLoop?: number;             // 循环时间间隔(秒)
  repeatType: RepeatType;
  execRepeat?: string;           // 二进制字符串
  execRepeatStart?: string;      // yyyy-MM-dd
  execRepeatEnd?: string;
}

// ======================== 天气触发 ========================

export type WeatherType = 'temp' | 'humidity';

export interface TriggerWeather {
  type: WeatherType;
  termType: CmpType;
  values: string[];
}

// ======================== 触发器容器 ========================

export interface SceneTrigger {
  type: TriggerType;
  order: number;
  areaID?: string;
  device?: TriggerDevice;
  timer?: TriggerTimer;
  weather?: TriggerWeather;
  isAbnormal?: boolean;
  reason?: string;
}
