import { describe, expect, it } from 'vitest';

import { buildNotifyRecordListRequest } from '../notify-record-query';

describe('buildNotifyRecordListRequest', () => {
  it('将页面筛选条件转换为通知记录接口参数', () => {
    const createdStart = '2026-07-20T10:00';
    const createdEnd = '2026-07-20T18:00';

    expect(
      buildNotifyRecordListRequest(
        {
          channel: 'email',
          createdEnd,
          createdStart,
          ruleName: '告警模拟',
          status: 'success',
          targetName: 'alarm_sim',
          timing: 'trigger',
        },
        2,
        20,
      ),
    ).toEqual({
      channel: ['email'],
      createdTimeRange: {
        end: new Date(createdEnd).getTime(),
        start: new Date(createdStart).getTime(),
      },
      page: { page: 2, size: 20 },
      alarmName: '告警模拟',
      status: ['success'],
      targetName: 'alarm_sim',
      timing: 'trigger',
    });
  });

  it('空筛选条件只保留分页参数', () => {
    expect(
      buildNotifyRecordListRequest(
        {
          channel: '',
          createdEnd: '',
          createdStart: '',
          ruleName: '',
          status: '',
          targetName: '',
          timing: '',
        },
        1,
        20,
      ),
    ).toEqual({ page: { page: 1, size: 20 } });
  });
});
