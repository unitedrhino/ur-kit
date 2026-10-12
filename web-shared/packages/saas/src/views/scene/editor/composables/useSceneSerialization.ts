/**
 * SceneDraft <-> 后端协议序列化 / 反序列化
 *
 * 提交时需要：
 *  1. trigger.timer.execAt 毫秒 → 秒（秒偏移）
 *  2. trigger.weather.values 统一转字符串
 *  3. trigger.device 拆 dataID_* → 合并 dataID
 *  4. action.device.values 每项拆 dataID_* → 合并 dataID；type 补 'propertyControl'
 *  5. when.conditions.terms[].property 拆 column_data_* → 合并 dataID
 *  6. when.validRanges / invalidRanges.timeRange.customRange：毫秒 → 秒
 *  7. when.validRanges / invalidRanges.dateRange.customRange：毫秒 → YYYY-MM-DD
 *
 * 回显时走 body JSON（包含拆字段），优先直接使用；若 body 缺失再从 if/then/when 反推（兼容极老数据）。
 */

import type {
  Action,
  ActionDevice,
  DeviceValue,
  If,
  SceneInfo,
  Term,
  TermProperty,
  Then,
  Trigger,
  TriggerDevice,
  When,
  WhenRange,
} from '../../scene-types';
import type {
  DeviceActionValueDraft,
  RangeDraft,
  SceneDraft,
} from '../types';
import { createEmptyDraft, genUid } from '../types';

// -----------------------------------------------------------------------------
// 工具
// -----------------------------------------------------------------------------

function assembleDataID(parts: {
  dataID_data?: string;
  dataID_00?: string;
  dataID_00_aa?: string;
  dataID_aa?: string;
  dataID_bb?: string;
  dataID_bb_cc?: string;
}): string {
  return [
    parts.dataID_data,
    parts.dataID_00,
    parts.dataID_00_aa,
    parts.dataID_aa,
    parts.dataID_bb,
    parts.dataID_bb_cc,
  ]
    .filter((p) => p !== undefined && p !== null && p !== '')
    .join('.');
}

function assembleColumnPath(p: {
  column_data?: string;
  column_data_00?: string;
  column_data_00_aa?: string;
  column_data_aa?: string;
  column_data_bb?: string;
  column_data_bb_cc?: string;
}): string {
  return [
    p.column_data,
    p.column_data_00,
    p.column_data_00_aa,
    p.column_data_aa,
    p.column_data_bb,
    p.column_data_bb_cc,
  ]
    .filter((x) => x !== undefined && x !== null && x !== '')
    .join('.');
}

function msToSecondsOfDay(ts: number | undefined): number {
  if (!ts) return 0;
  const d = new Date(ts);
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function formatYMD(v: number | string | undefined): string {
  if (!v) return '';
  const d = new Date(v as any);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// -----------------------------------------------------------------------------
// Draft → Payload（提交给后端）
// -----------------------------------------------------------------------------

export interface ScenePayload {
  /** 用于老接口 areaID 字段 */
  areaID: string;
  status: number;
  tag: string;
  type: string;
  name?: string;
  desc?: string;
  /** JSON 字符串 */
  if: string;
  /** JSON 字符串 */
  then: string;
  /** JSON 字符串 */
  when: string;
  /** 原始编辑态 JSON —— 用于回显 */
  body: string;
  id?: number;
}

export interface SerializeOptions {
  tag?: string;
  areaID?: string;
}

export function serializeDraft(
  draft: SceneDraft,
  options: SerializeOptions = {},
): ScenePayload {
  const triggers: Trigger[] = draft.triggers.map((t, i) => {
    const base = { type: t.type, order: i, areaID: 0 } as Trigger;
    if (t.type === 'timer' && t.timer) {
      const timer = { ...t.timer };
      // execAt 毫秒 → 秒（一天内秒偏移）
      if (typeof timer.execAt === 'number') {
        timer.execAt = msToSecondsOfDay(timer.execAt);
      }
      // 删除 UI only 字段
      delete (timer as any).execLoopUnit;
      return { ...base, timer: timer as any };
    }
    if (t.type === 'weather' && t.weather) {
      return {
        ...base,
        weather: {
          ...t.weather,
          values: (t.weather.values || []).map((v) => String(v)),
        },
      };
    }
    if (t.type === 'device' && t.device) {
      const d = t.device;
      const dev: TriggerDevice = {
        dataID: assembleDataID(d),
        dataName: '',
        productID: d.productID,
        productName: d.productName,
        selectType: (d.selectType || 'all') as any,
        areaID: d.areaID,
        groupID: d.groupID,
        deviceName: d.deviceName,
        deviceAlias: d.deviceAlias,
        mode: d.mode,
        type: d.type,
        termType: d.termType,
        values: d.values,
        stateKeep: d.stateKeep,
        schemaAffordance: '',
      };
      return { ...base, device: dev };
    }
    return base;
  });

  const actions: Action[] = draft.actions.map((a, i) => {
    const base: Action = {
      id: 0,
      order: i,
      type: a.type,
      status: 1,
      isAbnormal: false,
      reason: '',
    };
    if (a.type === 'delay') {
      base.delay = a.delay || 0;
    }
    if (a.type === 'alarm' && a.alarm) {
      base.alarm = { mode: a.alarm.mode };
    }
    if (a.type === 'scene' && a.scene) {
      base.scene = {
        areaID: a.scene.areaID,
        sceneID:
          typeof a.scene.sceneID === 'string'
            ? Number(a.scene.sceneID)
            : a.scene.sceneID,
        sceneType: a.scene.sceneType,
        sceneName: a.scene.sceneName,
        status:
          typeof a.scene.status === 'string'
            ? a.scene.status === '1' || a.scene.status === 'true'
            : !!a.scene.status,
      };
    }
    if (a.type === 'device' && a.device) {
      const values: DeviceValue[] = (a.device.values || []).map(
        (v: DeviceActionValueDraft) => ({
          dataID: assembleDataID(v),
          dataName: '',
          schemaAffordance: '',
          value: v.value || '',
        }),
      );
      const dev: ActionDevice = {
        areaID: a.device.areaID,
        productID: a.device.productID,
        productName: a.device.productName,
        selectType: a.device.selectType,
        deviceName: a.device.deviceName,
        deviceAlias: a.device.deviceAlias,
        groupID: a.device.groupID,
        type: a.device.type || 'propertyControl',
        values,
      };
      base.device = dev;
    }
    return base;
  });

  const ifObj: If = { triggers };
  const thenObj: Then = { actions };

  // when
  const terms: Term[] = draft.conditions.map((c, i) => {
    const term: Term = {
      order: i,
      columnType: c.columnType,
      status: 1,
      isAbnormal: false,
      reason: '',
    };
    if (c.columnType === 'property' && c.property) {
      const p: TermProperty = {
        dataID: assembleColumnPath(c.property),
        dataName: '',
        productID: c.property.productID,
        productName: c.property.productName,
        deviceName: c.property.deviceName,
        deviceAlias: c.property.deviceAlias,
        areaID: c.property.areaID,
        termType: c.property.termType,
        values: c.property.values,
      };
      term.property = p;
    }
    if (c.columnType === 'weather' && c.weather) {
      term.weather = {
        type: c.weather.type || 'temp',
        termType: (c.weather.termType || 'eq') as any,
        values: (c.weather.values || []).map((v) => String(v)),
      };
    }
    if (c.columnType === 'time' && c.time) {
      const vals = (c.time.values || []).map((v) => {
        if (c.time?.type === 'sys' && typeof v === 'number') {
          return String(msToSecondsOfDay(v));
        }
        return String(v);
      });
      term.time = {
        type: c.time.type || 'sys',
        termType: (c.time.termType || 'btw') as any,
        values: vals,
      };
    }
    return term;
  });

  const whenObj: When = {
    conditions: draft.conditionLogic
      ? { type: draft.conditionLogic, terms }
      : undefined,
    validRanges: draft.validRanges.map((r, i) => serializeRange(r, i)),
    invalidRanges: draft.invalidRanges.map((r, i) => serializeRange(r, i)),
  };

  // body：存原始 draft JSON 回显。去掉 UI only 字段（_collapsed）但保留 uid，方便恢复排序。
  const bodyDraft = stripUIOnly(draft);

  return {
    areaID: options.areaID || '1',
    status: draft.status || 1,
    tag: options.tag || 'webAdmin',
    type: draft.type,
    name: draft.name,
    desc: draft.desc,
    if: JSON.stringify(ifObj),
    then: JSON.stringify(thenObj),
    when: JSON.stringify(whenObj),
    body: JSON.stringify(bodyDraft),
    ...(draft.id ? { id: draft.id } : {}),
  };
}

function serializeRange(r: RangeDraft, order: number): WhenRange {
  const out: WhenRange = { order, type: r.type };
  if (r.type === 'date' && r.dateRange) {
    const dr = { ...r.dateRange };
    if (dr.type === 'customRange') {
      dr.startDate = formatYMD(dr.startDate);
      dr.endDate = formatYMD(dr.endDate);
    }
    out.dateRange = dr as any;
  }
  if (r.type === 'time' && r.timeRange) {
    const tr = { ...r.timeRange };
    if (tr.type === 'customRange') {
      tr.startTime = msToSecondsOfDay(tr.startTime);
      tr.endTime = msToSecondsOfDay(tr.endTime);
    }
    out.timeRange = tr as any;
  }
  return out;
}

function stripUIOnly(draft: SceneDraft): SceneDraft {
  const clone: SceneDraft = JSON.parse(JSON.stringify(draft));
  clone.triggers.forEach((t) => delete t._collapsed);
  clone.actions.forEach((a) => delete a._collapsed);
  clone.conditions.forEach((c) => delete c._collapsed);
  clone.validRanges.forEach((r) => delete r._collapsed);
  clone.invalidRanges.forEach((r) => delete r._collapsed);
  return clone;
}

// -----------------------------------------------------------------------------
// SceneInfo → Draft（编辑回显）
// -----------------------------------------------------------------------------

export function deserializeScene(sceneInfo: Partial<SceneInfo>): SceneDraft {
  // body 优先（旧版 create.vue 存的就是拆字段版 draft）
  if (sceneInfo.body) {
    try {
      const parsed = JSON.parse(sceneInfo.body);
      return normalizeLegacyDraft(parsed, sceneInfo);
    } catch {
      /* fallthrough */
    }
  }
  // TODO: 极老数据没有 body，先返回空 draft，避免新旧混用时崩溃
  const draft = createEmptyDraft((sceneInfo.type as any) || 'auto');
  draft.name = sceneInfo.name || '';
  draft.desc = sceneInfo.desc || '';
  draft.id = sceneInfo.id;
  return draft;
}

/**
 * 旧版 body 的 shape 是：
 *   { name, desc, if: { triggers: [...] }, then: { actions: [...] }, when: { ... } }
 * 把它扁平成新 draft。
 */
function normalizeLegacyDraft(
  raw: any,
  sceneInfo: Partial<SceneInfo>,
): SceneDraft {
  const draft = createEmptyDraft((sceneInfo.type as any) || raw?.type || 'auto');
  draft.id = sceneInfo.id;
  draft.name = raw?.name ?? sceneInfo.name ?? '';
  draft.desc = raw?.desc ?? sceneInfo.desc ?? '';

  const rawTriggers: any[] = raw?.if?.triggers || [];
  draft.triggers = rawTriggers.map((t) => ({
    uid: t.uid || genUid('trig'),
    type: t.type,
    timer: t.timer,
    weather: t.weather,
    device: t.device,
  }));

  const rawActions: any[] = raw?.then?.actions || [];
  draft.actions = rawActions.map((a) => ({
    uid: a.uid || genUid('act'),
    type: a.type,
    delay: a.delay,
    device: a.device
      ? {
          ...a.device,
          values: (a.device.values || []).map((v: any) => ({
            uid: v.uid || genUid('val'),
            ...v,
          })),
        }
      : undefined,
    alarm: a.alarm,
    scene: a.scene,
    notify: a.notify,
  }));

  const rawConditions = raw?.when?.conditions;
  if (rawConditions?.type) {
    draft.conditionLogic = rawConditions.type;
    draft.conditions = (rawConditions.terms || []).map((c: any) => ({
      uid: c.uid || genUid('cond'),
      columnType: c.columnType,
      property: c.property,
      weather: c.weather,
      time: c.time,
    }));
  }

  draft.validRanges = (raw?.when?.validRanges || []).map((r: any) => ({
    uid: r.uid || genUid('rng'),
    type: r.type,
    dateRange: r.dateRange,
    timeRange: r.timeRange,
  }));
  draft.invalidRanges = (raw?.when?.invalidRanges || []).map((r: any) => ({
    uid: r.uid || genUid('rng'),
    type: r.type,
    dateRange: r.dateRange,
    timeRange: r.timeRange,
  }));

  return draft;
}
