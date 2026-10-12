import type { SceneTrigger } from '../models/scene-trigger.model';
import type { SceneAction } from '../models/scene-action.model';
import type { SceneCondition } from '../models/scene-condition.model';

export interface SceneEntity {
  id: string;
  name: string;
  status: number;         // 1=启用 2=禁用 3=异常
  type: 'auto' | 'manual' | string;
  desc: string;
  isCommon: number;
  avatar: string;
  logo: string;
  lastRunTime: number;
  createdTime: number;
  updatedTime: number;
  areaID: string;
  triggers: SceneTrigger[];
  conditions: SceneCondition;
  actions: SceneAction[];
  tag: string;
  reason: string;
  headImg: string;
  productID: string;
  deviceName: string;
  deviceAlias: string;
  deviceMode: 'single' | 'multi' | '';
  body: string;
}

export interface SceneLogEntity {
  id: string;
  sceneID: string;
  areaID: string;
  type: string;           // 'auto' | 'manual'
  status: number;         // 1=成功 2=失败
  trigger: string;
  actions: string;
  desc: string;
  createdTime: number;
}
