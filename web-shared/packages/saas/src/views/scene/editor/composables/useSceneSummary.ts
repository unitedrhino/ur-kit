import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
/**
 * 卡片摘要生成：把一条规则描述成一句中文。
 */

import type {
  ActionDraft,
  ConditionTermDraft,
  RangeDraft,
  SceneDraft,
  TriggerDraft,
} from '../types';

/** getRepeatLabels 在摘要更新时读取当前语言的重复周期文案。 */
function getRepeatLabels(): Record<string, string> {
  return {
  once: $t('scene.ui.executeOnlyOnce'),
  allDay: $t('iotApp.project.scheduleDaily'),
  workday: $t('scene.ui.workingDays'),
  weekend: $t('scene.ui.weekend'),
  holiday: $t('scene.ui.statutoryHolidays'),
  week: $t('scene.ui.repeatByWeek'),
  mount: $t('scene.ui.repeatMonthly'),
  customRange: $t('scene.ui.customRange'),
  };
}

/** getCompareLabels 在摘要更新时读取当前语言的比较文案。 */
function getCompareLabels(): Record<string, string> {
  return {
  eq: '=',
  not: '≠',
  btw: '∈[A,B]',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: '∈{…}',
  all: $t('scene.ui.anyValue'),
  };
}

function timeFromMs(ts?: number): string {
  if (!ts) return '--:--';
  const d = new Date(ts);
  const h = `${d.getHours()}`.padStart(2, '0');
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

export function triggerSummary(t: TriggerDraft): string {
  if (t.type === 'timer' && t.timer) {
    const tm = t.timer;
    let s = '';
    if (tm.execType === 'at') s = $t('scene.ui.atTime', { time: timeFromMs(tm.execAt) });
    else if (tm.execType === 'sunRises') s = $t('scene.ui.atSunrise_7588e8');
    else if (tm.execType === 'sunSet') s = $t('scene.ui.atSunset_74d647');
    else if (tm.execType === 'loop') s = $t('scene.ui.everyCountUnit', { count: tm.execLoop ?? '?', unit: unitLabel(tm.execLoopUnit) });
    if (tm.repeatType) s += ` · ${getRepeatLabels()[tm.repeatType] || ''}`;
    return `⏰ ${$t('scene.ui.timingDetail', { detail: s })}`;
  }
  if (t.type === 'weather' && t.weather) {
    const w = t.weather;
    const tp = w.type === 'temp' ? $t('iotApp.productPage.temperature') : $t('scene.ui.humidity');
    return `🌦 ${$t('scene.ui.weatherTypeOperatorValue', { type: tp, operator: getCompareLabels()[w.termType] || w.termType, value: w.values?.join(',') || '?' })}`;
  }
  if (t.type === 'device' && t.device) {
    const d = t.device;
    const dev = d.deviceAlias || d.deviceName || d.productName || $t('scene.ui.noDeviceSelected');
    const typ = d.type
      ? {
          connected: $t('orgIotClient.deviceLogs.hubConnected'),
          disConnected: $t('orgIotClient.deviceStatus.offline'),
          propertyReport: $t('iotApp.dataFlow.propLabel'),
          eventReport: $t('orgIotClient.deviceLogs.hubEvent'),
        }[d.type] || ''
      : '';
    return `📱 ${$t('scene.ui.deviceNameEvent', { name: dev, event: typ })}`.trim();
  }
  return $t('scene.ui.triggerNotConfigured');
}

export function actionSummary(a: ActionDraft): string {
  if (a.type === 'delay') return `⏳ ${$t('scene.ui.delayCountSeconds', { count: a.delay ?? 0 })}`;
  if (a.type === 'alarm')
    return `🔔 ${a.alarm?.mode === 'trigger' ? $t('scene.ui.triggerAlarm') : $t('scene.ui.clearAlarm')}`;
  if (a.type === 'scene') {
    const st = a.scene?.sceneType === 'manual' ? $t('iotApp.project.triggerManual') : $t('iotApp.productPage.onlineAuto');
    return `🎬 ${$t('scene.ui.executionScenarioTypeName', { type: st, name: a.scene?.sceneName || $t('scene.ui.unselectedScene') })}`;
  }
  if (a.type === 'device') {
    const dev =
      a.device?.deviceAlias ||
      a.device?.deviceName ||
      a.device?.productName ||
      $t('scene.ui.noDeviceSelected');
    const cnt = a.device?.values?.length || 0;
    return `⚙️ ${$t('scene.ui.deviceControlNameCountParameters', { name: dev, count: cnt })}`;
  }
  return $t('scene.ui.noActionConfigured');
}

export function conditionSummary(c: ConditionTermDraft): string {
  if (c.columnType === 'property' && c.property) {
    const dev =
      c.property.deviceAlias ||
      c.property.deviceName ||
      c.property.productName ||
      $t('scene.ui.noDeviceSelected');
    return `📊 ${$t('scene.ui.attributeNameOperatorValue', { name: dev, operator: getCompareLabels()[c.property.termType || ''] || '', value: (c.property.values || []).join(',') })}`;
  }
  if (c.columnType === 'weather' && c.weather) {
    const tp = c.weather.type === 'temp' ? $t('iotApp.productPage.temperature') : $t('scene.ui.humidity');
    return `🌦 ${$t('scene.ui.weatherTypeOperatorValue', { type: tp, operator: getCompareLabels()[c.weather.termType || ''] || '', value: (c.weather.values || []).join(',') })}`;
  }
  if (c.columnType === 'time' && c.time) {
    return `⏰ ${$t('scene.ui.timeTypeOperator', { type: c.time.type === 'sys' ? $t('scene.ui.systemTime') : c.time.type === 'sunRises' ? $t('scene.ui.sunrise') : $t('scene.ui.sunset'), operator: getCompareLabels()[c.time.termType || ''] || '' })}`;
  }
  return $t('scene.ui.noConditionsConfigured');
}

export function rangeSummary(r: RangeDraft): string {
  if (r.type === 'time' && r.timeRange) {
    const tp = {
      allDay: $t('scene.ui.allDay'),
      light: $t('scene.ui.daytime'),
      night: $t('scene.ui.night'),
      customRange: $t('orgIotClient.deviceLogs.presetCustom'),
    }[r.timeRange.type];
    const suffix =
      r.timeRange.type === 'customRange'
        ? ` ${timeFromMs(r.timeRange.startTime)} - ${timeFromMs(r.timeRange.endTime)}`
        : '';
    return `⏰ ${$t('scene.ui.timePeriodRange', { range: `${tp}${suffix}` })}`;
  }
  if (r.type === 'date' && r.dateRange) {
    const tp = {
      allDay: $t('scene.ui.allDates'),
      workday: $t('scene.ui.workingDays'),
      weekend: $t('scene.ui.weekend'),
      holiday: $t('scene.ui.statutoryHolidays'),
      customRange: $t('console.token.expireCustom'),
      customWeek: $t('scene.ui.customizedWeek'),
    }[r.dateRange.type];
    return `📅 ${$t('scene.ui.dateRangeRange', { range: tp })}`;
  }
  return $t('scene.ui.noScopeConfigured');
}

function unitLabel(u?: string): string {
  if (u === 'hour') return $t('orgEnergy.ui.hour_99f690');
  if (u === 'minute') return $t('orgEnergy.ui.minutes');
  if (u === 'second') return $t('orgManage.cloneGroup.unitSeconds');
  return '';
}

/**
 * 顶层的"人话规则描述"，放在右侧摘要栏。
 */
export function describeSceneDraft(draft: SceneDraft): string[] {
  void preferences.app.locale;
  const lines: string[] = [];
  if (!draft.triggers.length && draft.type === 'auto') {
    lines.push($t('scene.ui.triggerNotConfiguredYet'));
  } else if (draft.triggers.length) {
    lines.push($t('scene.ui.ifAnyOfTheFollowingTriggersOccurs'));
    draft.triggers.forEach((t, i) =>
      lines.push(`   ${i + 1}. ${triggerSummary(t)}`),
    );
  }

  if (draft.conditions.length) {
    const logic = draft.conditionLogic === 'and' ? $t('scene.ui.all') : $t('scene.ui.any');
    lines.push($t('scene.ui.whenAlsoSatisfiesLogicConditions', { logic }));
    draft.conditions.forEach((c, i) =>
      lines.push(`   ${i + 1}. ${conditionSummary(c)}`),
    );
  }

  if (draft.validRanges.length) {
    lines.push($t('scene.ui.andIsValidDuringTheFollowingPeriods'));
    draft.validRanges.forEach((r, i) => lines.push(`   ${i + 1}. ${rangeSummary(r)}`));
  }
  if (draft.invalidRanges.length) {
    lines.push($t('scene.ui.exceptTheFollowingInvalidPeriods'));
    draft.invalidRanges.forEach((r, i) =>
      lines.push(`   ${i + 1}. ${rangeSummary(r)}`),
    );
  }

  if (!draft.actions.length) {
    lines.push($t('scene.ui.noExecutionActionHasBeenConfiguredYet'));
  } else {
    lines.push($t('scene.ui.thenExecution'));
    draft.actions.forEach((a, i) => lines.push(`   ${i + 1}. ${actionSummary(a)}`));
  }

  return lines;
}
