/**
 * 文件说明：告警模板前后端契约映射测试
 * 覆盖通用条件模板的互斥绑定，以及通知模板扩展请求头的往返转换。
 */
import type { ThingsApi } from '@vben/api';

import { describe, expect, it } from 'vitest';

import type { ConditionTemplate } from '../../types/alarm-v2.types';
import { fromNotifyTemplate, toConditionTemplateCreateReq, toNotifyTemplateCreateReq, toNotifyTemplateUpdateReq } from '../useAlarmConvert';

const conditionTemplate: ConditionTemplate = {
  id: '',
  name: '设备离线模板',
  summary: '设备离线时命中',
  trigger: {
    id: 'trigger-local',
    type: 'and',
    level: 'major',
    criteria: [
      {
        id: 'criterion-local',
        type: 'plain',
        plain: {
          logic: 'and',
          leaves: [
            {
              id: 'leaf-local',
              sourceType: 'online',
              dataID: '_online',
              compare: { termType: 'eq', values: ['offline'] },
            },
          ],
        },
      },
    ],
  },
};

describe('触发条件模板绑定契约', () => {
  it('通用模板不应提交产品和产品品类', () => {
    const request = toConditionTemplateCreateReq(conditionTemplate, 'none', '');
    expect(request.productID).toBeUndefined();
    expect(request.productCategoryID).toBeUndefined();
    expect(request.if?.triggers).toHaveLength(1);
  });
});

describe('通知内容模板 headers 契约', () => {
  const backendTemplate: ThingsApi.AlarmNotifyTemplate = {
    id: '100',
    name: '机器人通知',
    channel: 'message',
    subject: '告警通知',
    triggerBody: '触发内容',
    recoveryBody: '恢复内容',
    headers: { Authorization: 'Bearer token', 'X-Source': 'alarm' },
    status: 1,
  };

  it('详情转换应保留后端扩展请求头', () => {
    expect(fromNotifyTemplate(backendTemplate).headers).toEqual(backendTemplate.headers);
  });

  it('创建和更新请求都应提交扩展请求头', () => {
    const template = fromNotifyTemplate(backendTemplate);
    expect(toNotifyTemplateCreateReq(template).headers).toEqual(backendTemplate.headers);
    expect(toNotifyTemplateUpdateReq(template).headers).toEqual(backendTemplate.headers);
  });
});
