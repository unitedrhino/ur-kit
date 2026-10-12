/**
 * SceneDraft 的增删改查 composable。所有对 draft 的结构化操作走这里，保证响应性与 uid 稳定。
 */

import { reactive, readonly, ref } from 'vue';
import type {
  ActionDraft,
  ConditionTermDraft,
  DeviceActionValueDraft,
  RangeDraft,
  SceneDraft,
  TriggerDraft,
} from '../types';
import { createEmptyDraft, genUid } from '../types';
import type { SceneType } from '../../scene-types';

export function useSceneDraft(initial?: SceneDraft, sceneType: SceneType = 'auto') {
  const draft = reactive<SceneDraft>(initial ?? createEmptyDraft(sceneType));
  /** 标记编辑态是否被修改过，用于关闭时确认 */
  const dirty = ref(false);

  function markDirty() {
    dirty.value = true;
  }

  function reset(next: SceneDraft) {
    Object.assign(draft, next);
    dirty.value = false;
  }

  // ---- 通用移动/删除 ----
  function move<T>(list: T[], idx: number, step: number) {
    const target = idx + step;
    if (target < 0 || target >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(target, 0, item!);
    markDirty();
  }

  function removeAt<T>(list: T[], idx: number) {
    list.splice(idx, 1);
    markDirty();
  }

  // ---- Triggers ----
  function addTrigger(t: TriggerDraft) {
    draft.triggers.push(t);
    markDirty();
  }
  function duplicateTrigger(idx: number) {
    const src = draft.triggers[idx];
    if (!src) return;
    const copy: TriggerDraft = JSON.parse(JSON.stringify(src));
    copy.uid = genUid('trig');
    draft.triggers.splice(idx + 1, 0, copy);
    markDirty();
  }

  // ---- Actions ----
  function addAction(a: ActionDraft) {
    draft.actions.push(a);
    markDirty();
  }
  function duplicateAction(idx: number) {
    const src = draft.actions[idx];
    if (!src) return;
    const copy: ActionDraft = JSON.parse(JSON.stringify(src));
    copy.uid = genUid('act');
    if (copy.device?.values) {
      copy.device.values = copy.device.values.map((v) => ({
        ...v,
        uid: genUid('val'),
      }));
    }
    draft.actions.splice(idx + 1, 0, copy);
    markDirty();
  }

  function addDeviceActionValue(action: ActionDraft) {
    if (!action.device) action.device = { values: [] };
    if (!action.device.values) action.device.values = [];
    const val: DeviceActionValueDraft = { uid: genUid('val') };
    action.device.values.push(val);
    markDirty();
  }

  function removeDeviceActionValue(action: ActionDraft, idx: number) {
    action.device?.values?.splice(idx, 1);
    markDirty();
  }

  // ---- Conditions ----
  function setConditionLogic(logic: SceneDraft['conditionLogic']) {
    draft.conditionLogic = logic;
    markDirty();
  }
  function addCondition(c: ConditionTermDraft) {
    draft.conditions.push(c);
    markDirty();
  }
  function duplicateCondition(idx: number) {
    const src = draft.conditions[idx];
    if (!src) return;
    const copy: ConditionTermDraft = JSON.parse(JSON.stringify(src));
    copy.uid = genUid('cond');
    draft.conditions.splice(idx + 1, 0, copy);
    markDirty();
  }

  // ---- Ranges ----
  function addRange(bucket: 'valid' | 'invalid', r: RangeDraft) {
    const list = bucket === 'valid' ? draft.validRanges : draft.invalidRanges;
    list.push(r);
    markDirty();
  }
  function duplicateRange(bucket: 'valid' | 'invalid', idx: number) {
    const list = bucket === 'valid' ? draft.validRanges : draft.invalidRanges;
    const src = list[idx];
    if (!src) return;
    const copy: RangeDraft = JSON.parse(JSON.stringify(src));
    copy.uid = genUid('rng');
    list.splice(idx + 1, 0, copy);
    markDirty();
  }

  // ---- AI Patch ----
  /**
   * 直接把 AI 返回的 ScenePatch 合并进 draft。
   * 为了避免 useSceneDraft 依赖 ai 模块（造成环形引用），这里只做最小字段覆盖；
   * 对 triggers/actions/conditions/ranges 复杂补齐逻辑放在 ai/applyPatch.ts。
   * 外部调用方式：
   *   ```ts
   *   import { applyScenePatch } from '../ai/applyPatch';
   *   applyScenePatch(ctx, patch);
   *   ```
   * 这里保留一个简化版 setMeta 用于仅改 name/desc 的轻量场景。
   */
  function setMeta(meta: { name?: string; desc?: string }) {
    if (meta.name !== undefined) draft.name = meta.name;
    if (meta.desc !== undefined) draft.desc = meta.desc;
    markDirty();
  }

  return {
    draft,
    dirty: readonly(dirty),
    markDirty,
    reset,
    // helpers
    move,
    removeAt,
    // triggers
    addTrigger,
    duplicateTrigger,
    // actions
    addAction,
    duplicateAction,
    addDeviceActionValue,
    removeDeviceActionValue,
    // conditions
    setConditionLogic,
    addCondition,
    duplicateCondition,
    // ranges
    addRange,
    duplicateRange,
    // meta
    setMeta,
  };
}

export type SceneDraftContext = ReturnType<typeof useSceneDraft>;
