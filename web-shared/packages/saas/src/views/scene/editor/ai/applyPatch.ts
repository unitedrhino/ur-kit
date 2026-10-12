import { localizedSceneState } from '../../locales';
/**
 * 将 AI 产出的 ScenePatch 应用到 useSceneDraft 上下文。
 *
 * 规则：
 * - mode='merge'（默认）：触发器/动作/条件/时段 追加；name/desc 仅在非空时覆盖
 * - mode='replace'：对 patch 中「显式存在」的数组字段做整列替换
 * - uid 由前端补齐，保证响应性与 key 稳定
 */
import { $t } from '@vben/locales';

import { genUid } from '../types';
import type {
  ActionDraft,
  ConditionTermDraft,
  RangeDraft,
  SceneDraft,
  TriggerDraft,
} from '../types';
import type { SceneDraftContext } from '../composables/useSceneDraft';
import {
  actionSummary,
  conditionSummary,
  rangeSummary,
  triggerSummary,
} from '../composables/useSceneSummary';
import type {
  PartialAction,
  PartialCondition,
  PartialRange,
  PartialTrigger,
  ScenePatch,
} from './patch-types';

function normalizeTrigger(p: PartialTrigger): TriggerDraft {
  return {
    ...p,
    uid: p.uid || genUid('trig'),
  } as TriggerDraft;
}

function normalizeAction(p: PartialAction): ActionDraft {
  const a = { ...p, uid: p.uid || genUid('act') } as ActionDraft;
  if (a.device?.values && Array.isArray(a.device.values)) {
    a.device.values = a.device.values.map((v) => ({
      ...v,
      uid: v.uid || genUid('val'),
    }));
  }
  return a;
}

function normalizeCondition(p: PartialCondition): ConditionTermDraft {
  return {
    ...p,
    uid: p.uid || genUid('cond'),
  } as ConditionTermDraft;
}

function normalizeRange(p: PartialRange): RangeDraft {
  return {
    ...p,
    uid: p.uid || genUid('rng'),
  } as RangeDraft;
}

/**
 * 计算节点的"语义 key"：深拷贝后剥离所有 uid 字段再 JSON.stringify。
 * 用于 base 和 LLM 产出之间的等价检测（防止"一模一样的节点被追加两份"）。
 */
function semanticKey(obj: unknown): string {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === 'object') {
      const src = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(src).sort()) {
        if (k === 'uid') continue;
        out[k] = strip(src[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(strip(obj));
}

/**
 * 智能合并：
 *  1. LLM 若带已有 uid → 覆盖（增量修改）
 *  2. 无 uid / uid 陌生 → 按 semanticKey 查重
 *     - 已存在语义相同的节点（仅 uid 不同）→ 跳过，不重复追加
 *     - 否则补 uid 后 append
 *
 * 注意调用顺序：必须在 **raw patch item 未 normalize** 时调本函数，
 * 因为 normalize 会补 uid，一旦补上就无法区分 "LLM 复用的 uid" 和 "我们补的新 uid"。
 */
function mergeArrayWithDedup<RAW extends { uid?: string }, T extends { uid?: string }>(
  base: T[],
  incomingRaw: RAW[],
  normalize: (p: RAW) => T,
): T[] {
  const result = base.slice();
  const keyMap = new Map<string, T>();
  for (const b of base) keyMap.set(semanticKey(b), b);

  for (const raw of incomingRaw) {
    // 1. LLM 带 uid 且 base 里存在 → 直接覆盖
    if (raw.uid) {
      const idx = result.findIndex((x) => x.uid === raw.uid);
      if (idx !== -1) {
        const normalized = normalize(raw);
        result[idx] = normalized;
        keyMap.set(semanticKey(normalized), normalized);
        continue;
      }
    }
    // 2. 语义去重
    const k = semanticKey(raw);
    if (keyMap.has(k)) continue;
    const normalized = normalize(raw);
    keyMap.set(semanticKey(normalized), normalized);
    result.push(normalized);
  }
  return result;
}

export function applyScenePatch(ctx: SceneDraftContext, patch: ScenePatch) {
  const mode = patch.mode || 'merge';
  const d = ctx.draft;

  if (patch.name !== undefined && patch.name !== null) {
    d.name = patch.name;
  }
  if (patch.desc !== undefined && patch.desc !== null) {
    d.desc = patch.desc;
  }

  if (Array.isArray(patch.triggers)) {
    if (mode === 'replace') {
      d.triggers = patch.triggers.map(normalizeTrigger);
    } else {
      d.triggers = mergeArrayWithDedup(d.triggers, patch.triggers, normalizeTrigger);
    }
  }

  if (Array.isArray(patch.actions)) {
    if (mode === 'replace') {
      d.actions = patch.actions.map(normalizeAction);
    } else {
      d.actions = mergeArrayWithDedup(d.actions, patch.actions, normalizeAction);
    }
  }

  if (Array.isArray(patch.conditions)) {
    if (mode === 'replace') {
      d.conditions = patch.conditions.map(normalizeCondition);
    } else {
      d.conditions = mergeArrayWithDedup(d.conditions, patch.conditions, normalizeCondition);
    }
  }

  if (Array.isArray(patch.validRanges)) {
    if (mode === 'replace') {
      d.validRanges = patch.validRanges.map(normalizeRange);
    } else {
      d.validRanges = mergeArrayWithDedup(d.validRanges, patch.validRanges, normalizeRange);
    }
  }

  if (Array.isArray(patch.invalidRanges)) {
    if (mode === 'replace') {
      d.invalidRanges = patch.invalidRanges.map(normalizeRange);
    } else {
      d.invalidRanges = mergeArrayWithDedup(d.invalidRanges, patch.invalidRanges, normalizeRange);
    }
  }

  ctx.markDirty();
}

/**
 * 对一个 patch 做粗略差异统计，用于 UI 预览。
 */
export function summarizePatch(patch: ScenePatch): {
  triggers: number;
  actions: number;
  conditions: number;
  validRanges: number;
  invalidRanges: number;
  nameChanged: boolean;
  descChanged: boolean;
  mode: 'merge' | 'replace';
} {
  return {
    mode: patch.mode || 'merge',
    triggers: patch.triggers?.length || 0,
    actions: patch.actions?.length || 0,
    conditions: patch.conditions?.length || 0,
    validRanges: patch.validRanges?.length || 0,
    invalidRanges: patch.invalidRanges?.length || 0,
    nameChanged: patch.name !== undefined && patch.name !== null,
    descChanged: patch.desc !== undefined && patch.desc !== null,
  };
}

/** 单条 diff 记录，给前端按组分区展示 */
export interface PatchDiffItem {
  /** 大类 */
  section:
    | 'name'
    | 'desc'
    | 'triggers'
    | 'actions'
    | 'conditions'
    | 'validRanges'
    | 'invalidRanges';
  /** 变更类型 */
  kind: 'add' | 'update' | 'remove' | 'change';
  /** 人话描述（会显示在 UI 列表里） */
  label: string;
  /** 变更前（update / change / remove 时有值） */
  before?: string;
  /** 变更后（add / update / change 时有值） */
  after?: string;
}

const SECTION_LABEL: Record<PatchDiffItem['section'], string> = localizedSceneState(() => ({
  name: $t('scene.ui.sceneName'),
  desc: $t('orgEnergy.ui.description'),
  triggers: $t('scene.ui.trigger'),
  actions: $t('iotApp.deviceDetail.action'),
  conditions: $t('orgManage.cloneGroup.conditionPlaceholder'),
  validRanges: $t('scene.ui.effectivePeriod'),
  invalidRanges: $t('scene.ui.invalidPeriod'),
}));

export function getSectionLabel(s: PatchDiffItem['section']): string {
  return SECTION_LABEL[s];
}

type ArrayKey =
  | 'triggers'
  | 'actions'
  | 'conditions'
  | 'validRanges'
  | 'invalidRanges';

/**
 * 根据 patch + 当前 draft 计算差异列表。
 * - merge 模式：未给 uid 的视作 add；给了 uid 且在 draft 里能找到的视作 update；否则 add
 * - replace 模式：逐一对比 patch 数组与 draft 数组，多/少/变分别产生 add/remove/update
 */
export function diffPatch(
  patch: ScenePatch,
  draft: SceneDraft,
): PatchDiffItem[] {
  const out: PatchDiffItem[] = [];
  const mode = patch.mode || 'merge';

  if (patch.name !== undefined && patch.name !== null && patch.name !== draft.name) {
    out.push({
      section: 'name',
      kind: 'change',
      label: $t('scene.ui.sceneName'),
      before: draft.name || $t('scene.ui.empty'),
      after: patch.name,
    });
  }
  if (patch.desc !== undefined && patch.desc !== null && patch.desc !== draft.desc) {
    out.push({
      section: 'desc',
      kind: 'change',
      label: $t('orgEnergy.ui.description'),
      before: draft.desc || $t('scene.ui.empty'),
      after: patch.desc,
    });
  }

  function pushArrayDiff<
    T extends { uid?: string },
  >(
    key: ArrayKey,
    incoming: T[] | undefined,
    summarize: (x: T) => string,
  ) {
    if (!Array.isArray(incoming)) return;
    const base = draft[key] as unknown as T[];
    if (mode === 'replace') {
      const baseIds = new Set(base.map((x) => x.uid).filter(Boolean));
      const incomingIds = new Set(incoming.map((x) => x.uid).filter(Boolean));
      // 新增 / 更新
      for (const item of incoming) {
        if (item.uid && baseIds.has(item.uid)) {
          const old = base.find((b) => b.uid === item.uid)!;
          const oldSum = summarize(old);
          const newSum = summarize(item);
          if (oldSum !== newSum) {
            out.push({
              section: key,
              kind: 'update',
              label: newSum,
              before: oldSum,
              after: newSum,
            });
          }
        } else {
          out.push({
            section: key,
            kind: 'add',
            label: summarize(item),
            after: summarize(item),
          });
        }
      }
      // 被移除
      for (const item of base) {
        if (item.uid && !incomingIds.has(item.uid)) {
          out.push({
            section: key,
            kind: 'remove',
            label: summarize(item),
            before: summarize(item),
          });
        }
      }
    } else {
      // merge：与 mergeArrayWithDedup 保持同样的判定
      const baseKeys = new Set(base.map((b) => semanticKey(b)));
      for (const item of incoming) {
        if (item.uid) {
          const idx = base.findIndex((b) => b.uid === item.uid);
          if (idx !== -1) {
            const oldSum = summarize(base[idx]!);
            const newSum = summarize(item);
            if (oldSum !== newSum) {
              out.push({
                section: key,
                kind: 'update',
                label: newSum,
                before: oldSum,
                after: newSum,
              });
            }
            continue;
          }
        }
        // 无 uid 或 uid 陌生：语义去重——LLM 想新加但 base 已有等价节点时跳过
        if (baseKeys.has(semanticKey(item))) continue;
        out.push({
          section: key,
          kind: 'add',
          label: summarize(item),
          after: summarize(item),
        });
      }
    }
  }

  pushArrayDiff<TriggerDraft>(
    'triggers',
    patch.triggers as TriggerDraft[] | undefined,
    triggerSummary,
  );
  pushArrayDiff<ActionDraft>(
    'actions',
    patch.actions as ActionDraft[] | undefined,
    actionSummary,
  );
  pushArrayDiff<ConditionTermDraft>(
    'conditions',
    patch.conditions as ConditionTermDraft[] | undefined,
    conditionSummary,
  );
  pushArrayDiff<RangeDraft>(
    'validRanges',
    patch.validRanges as RangeDraft[] | undefined,
    rangeSummary,
  );
  pushArrayDiff<RangeDraft>(
    'invalidRanges',
    patch.invalidRanges as RangeDraft[] | undefined,
    rangeSummary,
  );

  return out;
}
