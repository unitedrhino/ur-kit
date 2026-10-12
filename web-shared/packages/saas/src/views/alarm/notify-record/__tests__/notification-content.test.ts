import { describe, expect, it } from 'vitest';

import { needsLegacyNotificationEvent, renderLegacyNotificationContent, resolveNotificationRecordDisplay } from '../notification-content';

describe('renderLegacyNotificationContent', () => {
  it('使用告警事件快照渲染历史通知模板变量', () => {
    const content = [
      '{{.policyName}}',
      '{{.object}}',
      '{{.currentLevelFmt}}',
      '{{.currentValueContent}}',
      '{{.triggerTimeFmt}}',
      '{{.recoveryTimeFmt}}',
      '{{.consoleLink}}',
    ].join('|');

    expect(
      renderLegacyNotificationContent(content, 'trigger', {
        alarmName: '告警模拟值超过50',
        deviceName: 'alarm_sim_001',
        firstTriggerTime: '1784535842039',
        level: 'major',
        recoveryTime: '1784535962029',
        targetName: 'alarm_sim_001',
        triggerContent: '设备 alarm_sim_001 触发告警',
      }),
    ).toBe('告警模拟值超过50|alarm_sim_001|重要|设备 alarm_sim_001 触发告警|2026-07-20 16:24:02||');
  });

  it('优先使用通知记录接口返回的规则名称和告警对象', () => {
    expect(
      resolveNotificationRecordDisplay({
        alarmID: '5',
        alarmName: '接口规则名称',
        eventID: '3',
        targetName: '接口告警对象',
      }),
    ).toEqual({ device: '接口告警对象', ruleName: '接口规则名称' });
  });

  it('仅为仍含模板变量的历史通知查询事件详情', () => {
    expect(needsLegacyNotificationEvent('告警正文')).toBe(false);
    expect(needsLegacyNotificationEvent('告警 {{.policyName}}')).toBe(true);
  });
});
