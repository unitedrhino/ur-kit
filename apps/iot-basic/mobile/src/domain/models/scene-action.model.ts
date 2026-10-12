// 场景动作模型 —— 对齐后端 backend/things/service/udsvr/internal/domain/scene

import type { SelectType } from './scene-trigger.model';

// ======================== 通用类型 ========================

export type ActionType = 'device' | 'delay' | 'notify' | 'alarm' | 'scene';

export type ActionDeviceType = 'propertyControl' | 'action';

// 对齐 def.NotifyType
export type NotifyType =
  | 'sms'
  | 'email'
  | 'dingTalk'
  | 'wxMini'
  | 'message'
  | 'phoneCall'
  | 'wxEWebhook';

// 通知对象类型
export type NotifyUserType =
  | 'account'
  | 'userID'
  | 'deviceOwner'
  | 'deviceProjectAdmin'
  | 'deviceAreaAdmin'
  | 'deviceProjectAll'
  | 'deviceAreaAll';

export type AlarmMode = 'trigger' | 'relieve';

// 场景类型
export type ActionSceneType = 'manual' | 'auto';

// ======================== 设备动作 ========================

export interface DeviceValue {
  dataID: string;
  dataName?: string;
  schemaAffordance?: string;
  value: string;
}

export interface ActionDevice {
  areaID?: string;
  areaIDPath?: string;
  areaName?: string;
  productID: string;
  productName?: string;
  selectType: SelectType;
  deviceName?: string;
  deviceAlias?: string;
  groupID?: string;
  type: ActionDeviceType;
  dataID?: string;
  dataName?: string;
  schemaAffordance?: string;
  value?: string;
  values?: DeviceValue[];
  body?: string;
}

// ======================== 通知动作 ========================

export interface ActionNotify {
  type: NotifyType;
  notifyCode: string;              // ruleScene | ruleDeviceAlarm
  userType: NotifyUserType;
  accounts?: string[];
  userIDs?: string[];
  params?: Record<string, string>;
  str1?: string;
  str2?: string;
  str3?: string;
}

// ======================== 告警动作 ========================

export interface ActionAlarm {
  mode: AlarmMode;
}

// ======================== 执行其他场景 ========================

export interface ActionScene {
  areaID?: string;
  sceneID: string;
  sceneType?: ActionSceneType;
  sceneName?: string;
  status?: number;                 // 自动化场景时修改的状态
}

// ======================== 动作容器 ========================

export interface SceneAction {
  id?: string;
  type: ActionType;
  order: number;
  delay?: number;                  // 延时秒数
  device?: ActionDevice;
  notify?: ActionNotify;
  alarm?: ActionAlarm;
  scene?: ActionScene;
  status?: number;
  isAbnormal?: boolean;
  reason?: string;
}
