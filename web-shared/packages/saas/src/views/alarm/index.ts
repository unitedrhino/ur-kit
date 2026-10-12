/**
 * 文件说明：告警管理共享页面导出。
 * 页面由物联（apps/iot）与能源中心（apps/org-energy）等宿主应用通过
 * `import('@vben/saas').then((m) => ({ default: m.AlarmXxxPage }))` 复用。
 */
export { default as AlarmRulePage } from './rule/index.vue';
export { default as AlarmRuleEditPage } from './rule/edit/index.vue';
export { default as AlarmEventPage } from './event/index.vue';
export { default as AlarmDisposalPage } from './disposal/index.vue';
export { default as AlarmNotifyRecordPage } from './notify-record/index.vue';
export { setAlarmLevelLabels } from './types/alarm-v2.types';
export { default as AlarmConditionTemplatePage } from './template/condition/index.vue';
export { default as AlarmConditionTemplateEditPage } from './template/condition/edit/index.vue';
export { default as AlarmContentTemplatePage } from './template/content/index.vue';
export { default as AlarmContentTemplateEditPage } from './template/content/edit/index.vue';
