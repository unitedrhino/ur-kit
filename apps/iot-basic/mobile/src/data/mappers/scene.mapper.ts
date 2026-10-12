import type { SceneEntity, SceneLogEntity } from '../../domain/entities/scene.entity';
import type { SceneTrigger } from '../../domain/models/scene-trigger.model';
import type { SceneAction } from '../../domain/models/scene-action.model';
import type { SceneCondition } from '../../domain/models/scene-condition.model';
import { createEmptyCondition } from '../../domain/models/scene-condition.model';

export { createEmptyCondition };

type SceneIfPayload = {
  triggers?: SceneTrigger[];
};

type SceneThenPayload = {
  actions?: SceneAction[];
};

function safeParseJSON<T>(json: unknown, fallback: T): T {
  if (!json || typeof json !== 'string') return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function parseTriggers(ifStr: unknown): SceneTrigger[] {
  const parsed = safeParseJSON<SceneIfPayload | SceneTrigger[] | SceneTrigger>(ifStr, []);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if ('triggers' in parsed && Array.isArray(parsed.triggers)) return parsed.triggers;
    return [parsed as SceneTrigger];
  }
  return [];
}

function parseCondition(whenStr: unknown): SceneCondition {
  const empty = createEmptyCondition();
  const parsed = safeParseJSON<Partial<SceneCondition>>(whenStr, {});
  if (!parsed || typeof parsed !== 'object') return empty;
  return {
    validRanges: Array.isArray(parsed.validRanges) ? parsed.validRanges : [],
    invalidRanges: Array.isArray(parsed.invalidRanges) ? parsed.invalidRanges : [],
    conditions:
      parsed.conditions && typeof parsed.conditions === 'object'
        ? {
            terms: Array.isArray(parsed.conditions.terms) ? parsed.conditions.terms : [],
            type: parsed.conditions.type === 'or' ? 'or' : 'and',
          }
        : { terms: [], type: 'and' },
  };
}

function parseActions(thenStr: unknown): SceneAction[] {
  const parsed = safeParseJSON<SceneThenPayload | SceneAction[] | SceneAction>(thenStr, []);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if ('actions' in parsed && Array.isArray(parsed.actions)) return parsed.actions;
    return [parsed as SceneAction];
  }
  return [];
}

export class SceneMapper {
  static toEntity(dto: Record<string, unknown>): SceneEntity {
    return {
      id: String(dto.id || ''),
      name: String(dto.name || ''),
      status: Number(dto.status || 1),
      type: String(dto.type || '') as SceneEntity['type'],
      desc: String(dto.desc || ''),
      isCommon: Number(dto.isCommon || 0),
      avatar: String(dto.headImg || dto.avatar || ''),
      logo: String(dto.logo || ''),
      lastRunTime: Number(dto.lastRunTime || 0),
      createdTime: Number(dto.createdTime || 0),
      updatedTime: Number(dto.updatedTime || 0),
      areaID: String(dto.areaID || ''),
      triggers: parseTriggers(dto.if),
      conditions: parseCondition(dto.when),
      actions: parseActions(dto.then),
      tag: String(dto.tag || ''),
      reason: String(dto.reason || ''),
      headImg: String(dto.headImg || ''),
      productID: String(dto.productID || ''),
      deviceName: String(dto.deviceName || ''),
      deviceAlias: String(dto.deviceAlias || ''),
      deviceMode: (dto.deviceMode === 'single' || dto.deviceMode === 'multi')
        ? dto.deviceMode
        : '',
      body: String(dto.body || ''),
    };
  }

  static toDTO(entity: Partial<SceneEntity>): Record<string, unknown> {
    const dto: Record<string, unknown> = {};

    if (entity.id !== undefined) dto.id = entity.id;
    if (entity.name !== undefined) dto.name = entity.name;
    if (entity.desc !== undefined) dto.desc = entity.desc;
    if (entity.areaID !== undefined && entity.areaID !== '') dto.areaID = entity.areaID;
    if (entity.type !== undefined) dto.type = entity.type;
    if (entity.status !== undefined) dto.status = entity.status;
    if (entity.tag !== undefined) dto.tag = entity.tag;
    if (entity.headImg !== undefined) dto.headImg = entity.headImg;
    if (entity.logo !== undefined) dto.logo = entity.logo;
    if (entity.productID !== undefined) dto.productID = entity.productID;
    if (entity.deviceName !== undefined) dto.deviceName = entity.deviceName;
    if (entity.deviceAlias !== undefined) dto.deviceAlias = entity.deviceAlias;
    if (entity.deviceMode !== undefined) dto.deviceMode = entity.deviceMode;
    if (entity.body !== undefined) dto.body = entity.body;
    if (entity.isCommon !== undefined) dto.isCommon = entity.isCommon;

    if (entity.triggers !== undefined) {
      dto.if = JSON.stringify({ triggers: entity.triggers });
    }
    if (entity.conditions !== undefined) {
      dto.when = JSON.stringify(entity.conditions);
    }
    if (entity.actions !== undefined) {
      dto.then = JSON.stringify({ actions: entity.actions });
    }

    return dto;
  }

  static toLogEntity(dto: Record<string, unknown>): SceneLogEntity {
    return {
      id: String(dto.id || ''),
      sceneID: String(dto.sceneID || ''),
      areaID: String(dto.areaID || ''),
      type: String(dto.type || ''),
      status: Number(dto.status || 0),
      trigger: String(dto.trigger || ''),
      actions: String(dto.actions || ''),
      desc: String(dto.desc || ''),
      createdTime: Number(dto.createdTime || 0),
    };
  }
}
