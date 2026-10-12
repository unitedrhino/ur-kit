import { localizedSceneState } from '../locales';
/**
 * SceneDraft —— 编辑器内部编辑态类型
 *
 * 设计原则：
 * 1. 字段形状尽量贴近旧版 create.vue 的 form values（包含 dataID_data / dataID_00 等拆字段），
 *    保证与旧版 body JSON 互相可读（编辑回显 / 灰度切换旧版都不会丢数据）。
 * 2. 每张卡片携带一个稳定 uid 作为 key，便于 Vue 渲染排序与卡片折叠状态管理。
 * 3. 序列化时再统一拼装 dataID / 做时间戳转换（参见 useSceneSerialization）。
 */
import { $t } from '@vben/locales';

import type {
  ActionAlarmMode,
  ActionDeviceType,
  ActionType,
  CmpType,
  DateRangeType,
  DeviceMode,
  ExecType,
  NotifyUserType,
  RepeatType,
  SceneType,
  SelectType,
  Status,
  StateKeep,
  TermCondType,
  TermColumnType,
  TimeRangeType,
  TimeType,
  TriggerDeviceMode,
  TriggerDeviceType,
  TriggerType,
  WeatherType,
} from '../scene-types';

// -----------------------------------------------------------------------------
// 公共
// -----------------------------------------------------------------------------

export type UID = string;

/** 为每个可编辑节点生成稳定 uid */
export function genUid(prefix = 'n'): UID {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// -----------------------------------------------------------------------------
// 设备路径选择（拆字段与旧版保持一致）
// -----------------------------------------------------------------------------

export interface DeviceDataPath {
  dataID_data?: string;
  dataID_00?: string;
  dataID_00_aa?: string;
  dataID_aa?: string;
  dataID_bb?: string;
  dataID_bb_cc?: string;
}

export interface WhenDataPath {
  column_data?: string;
  column_data_00?: string;
  column_data_00_aa?: string;
  column_data_aa?: string;
  column_data_bb?: string;
  column_data_bb_cc?: string;
}

// -----------------------------------------------------------------------------
// Trigger 编辑态
// -----------------------------------------------------------------------------

export interface TimerTriggerDraft {
  execType: ExecType;
  /** 指定时间点：HBuilder 的 Time 选择器返回毫秒时间戳 */
  execAt?: number;
  execAdd?: number;
  execLoop?: number;
  /** loop 单位：小时/分钟/秒（仅前端展示用，不进协议） */
  execLoopUnit?: 'hour' | 'minute' | 'second';
  repeatType?: RepeatType;
  execRepeat?: string;
}

export interface WeatherTriggerDraft {
  type: WeatherType;
  termType: CmpType;
  values: string[];
}

export interface DeviceTriggerDraft extends DeviceDataPath {
  productID?: string;
  productName?: string;
  selectType?: SelectType;
  areaID?: number;
  groupID?: number;
  deviceName?: string;
  deviceAlias?: string;
  mode?: TriggerDeviceMode;
  type?: TriggerDeviceType;
  termType?: CmpType;
  values?: string[];
  stateKeep?: StateKeep;
}

export interface TriggerDraft {
  uid: UID;
  type: TriggerType;
  /** 折叠状态仅属于 UI，不进协议 */
  _collapsed?: boolean;
  timer?: TimerTriggerDraft;
  weather?: WeatherTriggerDraft;
  device?: DeviceTriggerDraft;
}

// -----------------------------------------------------------------------------
// Action 编辑态
// -----------------------------------------------------------------------------

export interface DeviceActionValueDraft extends DeviceDataPath {
  uid: UID;
  value?: string;
}

export interface DeviceActionDraft {
  productID?: string;
  productName?: string;
  selectType?: SelectType;
  areaID?: number;
  groupID?: number;
  deviceName?: string;
  deviceAlias?: string;
  type?: ActionDeviceType;
  values?: DeviceActionValueDraft[];
}

export interface AlarmActionDraft {
  mode?: ActionAlarmMode;
}

export interface SceneActionDraft {
  sceneType?: SceneType;
  sceneID?: number | string;
  sceneName?: string;
  status?: string | boolean;
  areaID?: number;
}

export interface NotifyActionDraft {
  userType?: NotifyUserType;
  notifyCode?: string;
  accounts?: string[];
  userIDs?: string[];
}

export interface ActionDraft {
  uid: UID;
  type: ActionType;
  _collapsed?: boolean;
  delay?: number;
  device?: DeviceActionDraft;
  alarm?: AlarmActionDraft;
  scene?: SceneActionDraft;
  notify?: NotifyActionDraft;
}

// -----------------------------------------------------------------------------
// Condition 编辑态
// -----------------------------------------------------------------------------

export interface PropertyConditionDraft extends WhenDataPath {
  productID?: string;
  productName?: string;
  deviceName?: string;
  deviceAlias?: string;
  areaID?: number;
  termType?: CmpType;
  values?: string[];
}

export interface WeatherConditionDraft {
  type?: WeatherType;
  termType?: CmpType;
  values?: string[];
}

export interface TimeConditionDraft {
  type?: TimeType;
  termType?: CmpType;
  /** sys 类型时为毫秒时间戳；sunRises/sunSet 为偏移秒数 */
  values?: Array<number | string>;
}

export interface ConditionTermDraft {
  uid: UID;
  columnType: TermColumnType;
  _collapsed?: boolean;
  property?: PropertyConditionDraft;
  weather?: WeatherConditionDraft;
  time?: TimeConditionDraft;
}

// -----------------------------------------------------------------------------
// 生效/无效时间段
// -----------------------------------------------------------------------------

export interface RangeDraft {
  uid: UID;
  /** 'date' | 'time' */
  type: 'date' | 'time';
  _collapsed?: boolean;
  dateRange?: {
    type: DateRangeType;
    startDate?: string | number;
    endDate?: string | number;
    repeat?: string;
  };
  timeRange?: {
    type: TimeRangeType;
    /** 毫秒时间戳 */
    startTime?: number;
    endTime?: number;
  };
}

// -----------------------------------------------------------------------------
// Scene Draft 顶层
// -----------------------------------------------------------------------------

export interface SceneDraft {
  id?: number;
  name: string;
  desc?: string;
  type: SceneType;
  status?: Status;
  /** if.triggers */
  triggers: TriggerDraft[];
  /** then.actions */
  actions: ActionDraft[];
  /** when.conditions */
  conditionLogic?: TermCondType;
  conditions: ConditionTermDraft[];
  validRanges: RangeDraft[];
  invalidRanges: RangeDraft[];
}

export function createEmptyDraft(sceneType: SceneType = 'auto'): SceneDraft {
  return {
    name: '',
    desc: '',
    type: sceneType,
    triggers: [],
    actions: [],
    conditions: [],
    validRanges: [],
    invalidRanges: [],
  };
}

// -----------------------------------------------------------------------------
// 卡片模板（用于 +添加 触发器/动作/条件 菜单）
// -----------------------------------------------------------------------------

export interface TriggerTemplate {
  type: TriggerType;
  label: string;
  icon: string;
  build: () => TriggerDraft;
}

export interface ActionTemplate {
  type: ActionType;
  label: string;
  icon: string;
  build: () => ActionDraft;
}

export interface ConditionTemplate {
  columnType: TermColumnType;
  label: string;
  icon: string;
  build: () => ConditionTermDraft;
}

export interface RangeTemplate {
  type: 'date' | 'time';
  label: string;
  icon: string;
  build: () => RangeDraft;
}

export const TRIGGER_TEMPLATES: TriggerTemplate[] = localizedSceneState(() => ([
  {
    type: 'timer',
    label: $t('orgManage.cloneGroup.trgSchedule'),
    icon: 'mdi:clock-time-four-outline',
    build: () => ({
      uid: genUid('trig'),
      type: 'timer',
      timer: { execType: 'at', repeatType: 'allDay' },
    }),
  },
  {
    type: 'device',
    label: $t('scene.ui.deviceTrigger'),
    icon: 'mdi:devices',
    build: () => ({
      uid: genUid('trig'),
      type: 'device',
      device: {},
    }),
  },
  {
    type: 'weather',
    label: $t('scene.ui.weatherTrigger'),
    icon: 'mdi:weather-partly-cloudy',
    build: () => ({
      uid: genUid('trig'),
      type: 'weather',
      weather: { type: 'temp', termType: 'gt', values: ['20'] },
    }),
  },
]));

export const ACTION_TEMPLATES: ActionTemplate[] = localizedSceneState(() => ([
  {
    type: 'device',
    label: $t('orgEnergy.ui.deviceControl'),
    icon: 'mdi:toggle-switch-outline',
    build: () => ({
      uid: genUid('act'),
      type: 'device',
      device: { values: [] },
    }),
  },
  {
    type: 'delay',
    label: $t('scene.ui.delayExecution'),
    icon: 'mdi:timer-sand',
    build: () => ({
      uid: genUid('act'),
      type: 'delay',
      delay: 5,
    }),
  },
  {
    type: 'alarm',
    label: $t('orgIotClient.deviceLogs.toneAlert'),
    icon: 'mdi:alert-circle-outline',
    build: () => ({
      uid: genUid('act'),
      type: 'alarm',
      alarm: { mode: 'trigger' },
    }),
  },
  {
    type: 'scene',
    label: $t('scene.ui.executeAnotherScene'),
    icon: 'mdi:playlist-play',
    build: () => ({
      uid: genUid('act'),
      type: 'scene',
      scene: { sceneType: 'auto' },
    }),
  },
]));

export const CONDITION_TEMPLATES: ConditionTemplate[] = localizedSceneState(() => ([
  {
    columnType: 'property',
    label: $t('iotApp.deviceDetail.deviceProps'),
    icon: 'mdi:devices',
    build: () => ({
      uid: genUid('cond'),
      columnType: 'property',
      property: { values: [] },
    }),
  },
  {
    columnType: 'weather',
    label: $t('scene.ui.weatherConditions'),
    icon: 'mdi:weather-partly-cloudy',
    build: () => ({
      uid: genUid('cond'),
      columnType: 'weather',
      weather: { type: 'temp', termType: 'gt', values: ['20'] },
    }),
  },
  {
    columnType: 'time',
    label: $t('scene.ui.timeCondition'),
    icon: 'mdi:clock-outline',
    build: () => ({
      uid: genUid('cond'),
      columnType: 'time',
      time: { type: 'sys', termType: 'btw', values: [] },
    }),
  },
]));

export const RANGE_TEMPLATES: RangeTemplate[] = localizedSceneState(() => ([
  {
    type: 'time',
    label: $t('scene.ui.timePeriod'),
    icon: 'mdi:clock-outline',
    build: () => ({
      uid: genUid('rng'),
      type: 'time',
      timeRange: { type: 'allDay' },
    }),
  },
  {
    type: 'date',
    label: $t('scene.ui.dateSegment'),
    icon: 'mdi:calendar-range',
    build: () => ({
      uid: genUid('rng'),
      type: 'date',
      dateRange: { type: 'allDay' },
    }),
  },
]));

// -----------------------------------------------------------------------------
// 校验问题
// -----------------------------------------------------------------------------

export type ValidationLevel = 'error' | 'warn';

export interface ValidationIssue {
  level: ValidationLevel;
  /** 规则节点定位 uid（可为空，表示全局问题） */
  uid?: UID;
  /** 规则大类 */
  section: 'basic' | 'trigger' | 'action' | 'condition' | 'range';
  message: string;
}

// 可配置的通知类型等常量可以继续扩展
export const DeviceMode_Edge: TriggerDeviceMode = 'edge';
export const DeviceMode_Level: TriggerDeviceMode = 'level';
export const _ExhaustDeviceMode: DeviceMode[] = ['single', 'multi'];
