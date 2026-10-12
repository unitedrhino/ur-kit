/**
 * 校验 SceneDraft：生成可视化的校验问题清单。
 * 规则按"必填即 error，建议即 warn"。
 */
import { $t } from '@vben/locales';

import type { SceneDraft, ValidationIssue } from '../types';

export function validateDraft(draft: SceneDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 基础
  if (!draft.name || !draft.name.trim()) {
    issues.push({ level: 'error', section: 'basic', message: $t('scene.ui.sceneNameIsRequired') });
  }

  // 自动化场景必须至少 1 个触发器
  if (draft.type === 'auto' && draft.triggers.length === 0) {
    issues.push({
      level: 'error',
      section: 'trigger',
      message: $t('scene.ui.automationScenarioRequiresAtLeast1Trigger'),
    });
  }

  // 每个 trigger 的细化校验
  draft.triggers.forEach((t, i) => {
    const prefix = $t('scene.ui.triggerIndex', { index: i + 1 });
    if (t.type === 'timer') {
      if (!t.timer?.execType) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.noExecutionMethodSelected')}`,
        });
      }
      if (t.timer?.execType === 'at' && !t.timer.execAt) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.noTimePointSelected')}`,
        });
      }
      if (t.timer?.execType === 'loop' && !t.timer.execLoop) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.intervalTimeNotSet')}`,
        });
      }
      if (!t.timer?.repeatType) {
        issues.push({
          level: 'warn',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.noRepeatMethodSelected')}`,
        });
      }
    }
    if (t.type === 'device') {
      if (!t.device?.productID) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.noProductSelected')}`,
        });
      }
      if (!t.device?.selectType) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.noDeviceRangeSelected')}`,
        });
      }
      if (
        t.device?.selectType === 'fixed' &&
        !t.device?.deviceName
      ) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.theSpecifiedDeviceIsNotSelected')}`,
        });
      }
    }
    if (t.type === 'weather') {
      if (!t.weather?.values?.length) {
        issues.push({
          level: 'error',
          uid: t.uid,
          section: 'trigger',
          message: `${prefix}: ${$t('scene.ui.theWeatherConditionValueIsNotFilledIn')}`,
        });
      }
    }
  });

  // Actions
  if (draft.actions.length === 0) {
    issues.push({
      level: 'error',
      section: 'action',
      message: $t('scene.ui.atLeast1ExecutionActionIsRequired'),
    });
  }
  draft.actions.forEach((a, i) => {
    const prefix = $t('scene.ui.actionIndex', { index: i + 1 });
    if (a.type === 'delay' && (a.delay == null || a.delay < 0)) {
      issues.push({
        level: 'error',
        uid: a.uid,
        section: 'action',
        message: `${prefix}: ${$t('scene.ui.delayTimeNeedsToBe0')}`,
      });
    }
    if (a.type === 'device') {
      if (!a.device?.productID) {
        issues.push({
          level: 'error',
          uid: a.uid,
          section: 'action',
          message: `${prefix}: ${$t('scene.ui.noProductSelected')}`,
        });
      }
      if (!a.device?.selectType) {
        issues.push({
          level: 'error',
          uid: a.uid,
          section: 'action',
          message: `${prefix}: ${$t('scene.ui.noDeviceRangeSelected')}`,
        });
      }
      if (!a.device?.values?.length) {
        issues.push({
          level: 'error',
          uid: a.uid,
          section: 'action',
          message: `${prefix}: ${$t('scene.ui.addAtLeast1ControlParameter')}`,
        });
      } else {
        a.device.values.forEach((v, vi) => {
          if (!v.dataID_data) {
            issues.push({
              level: 'error',
              uid: a.uid,
              section: 'action',
              message: `${prefix} ${$t('scene.ui.parameterIndex', { index: vi + 1 })}：未选择属性`,
            });
          }
          if (v.value === undefined || v.value === '') {
            issues.push({
              level: 'error',
              uid: a.uid,
              section: 'action',
              message: `${prefix} ${$t('scene.ui.parameterIndex', { index: vi + 1 })}：未填写参数值`,
            });
          }
        });
      }
    }
    if (a.type === 'scene' && !a.scene?.sceneID) {
      issues.push({
        level: 'error',
        uid: a.uid,
        section: 'action',
        message: `${prefix}: ${$t('scene.ui.noScenarioSelectedForExecution')}`,
      });
    }
  });

  // Conditions
  draft.conditions.forEach((c, i) => {
    const prefix = $t('scene.ui.conditionIndex', { index: i + 1 });
    if (c.columnType === 'property' && !c.property?.productID) {
      issues.push({
        level: 'error',
        uid: c.uid,
        section: 'condition',
        message: `${prefix}: ${$t('scene.ui.noProductSelected')}`,
      });
    }
  });

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
