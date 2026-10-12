/**
 * useAlarmConvert 单元测试
 * 验证告警 V2 前端类型与后端 API 类型双向映射的正确性
 */

import { describe, expect, it } from 'vitest';

import {
  fromAlarmInfo,
  fromBackendTarget,
  fromBackendTargets,
  fromNotifyTemplate,
  toAlarmInfoCreateReq,
  toBackendTarget,
  toBackendTargets,
  toConditionTemplateCreateReq,
  toNotifyTemplateCreateReq,
  type ContentTemplate,
} from '../useAlarmConvert';
import type { AlarmRule, ConditionTemplate } from '../../types/alarm-v2.types';
import type { ThingsApi } from '@vben/api';

describe('useAlarmConvert', () => {
  describe('target 映射', () => {
    const frontendTarget: AlarmRule['target'] = {
      selectType: 'all',
      targetKind: 'product',
      productID: 'prod-001',
      categoryID: 'cat-001',
      devices: [{ productID: 'prod-001', name: 'device-1', alias: '设备1' }],
      areas: [1],
      groups: [1],
    };

    it('toBackendTarget 应只保留后端所需字段', () => {
      const backend = toBackendTarget(frontendTarget);
      expect(backend.selectType).toBe('all');
      expect(backend.productID).toBe('prod-001');
      expect(backend.categoryID).toBe('cat-001');
      expect(backend.devices).toHaveLength(1);
      expect(backend.devices![0]).toEqual({
        productID: 'prod-001',
        name: 'device-1',
        alias: '设备1',
      });
      expect(backend.areas).toHaveLength(1);
      expect(backend.groups).toHaveLength(1);
    });

    it('fromBackendTarget 应补充前端展示字段', () => {
      const backend: ThingsApi.AlarmTarget = {
        selectType: 'all',
        productID: 'prod-002',
      };
      const front = fromBackendTarget(backend);
      expect(front.selectType).toBe('all');
      expect(front.targetKind).toBe('product');
      expect(front.productID).toBe('prod-002');
      expect(front.devices).toEqual([]);
    });

    it('回填品类目标时应恢复为品类来源', () => {
      const backend: ThingsApi.AlarmTarget = {
        selectType: 'all',
        categoryID: '3',
      };

      const front = fromBackendTarget(backend);

      expect(front.targetKind).toBe('category');
      expect(front.categoryID).toBe('3');
      expect(front.productID).toBeUndefined();
    });
  });

  describe('AlarmRule 完整映射', () => {
    const rule: AlarmRule = {
      id: 'rule-001',
      name: 'E2E 测试规则',
      desc: '测试描述',
      evalPeriod: 5,
      target: {
        selectType: 'all',
        targetKind: 'product',
      },
      if: {
        triggers: [
          {
            id: 'trigger-1',
            type: 'and',
            level: 'major',
            criteria: [
              {
                id: 'crit-1',
                type: 'plain',
                plain: {
                  logic: 'and',
                  leaves: [
                    {
                      id: 'leaf-1',
                      sourceType: 'property',
                      dataID: 'temp',
                      dataName: '温度',
                      compare: {
                        termType: 'gt',
                        values: ['80'],
                      },
                      period: 120,
                      aggregateMethod: 'avg',
                      continuePeriod: 3,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      notify: {
        ladders: [
          {
            id: 'ladder-1',
            order: 1,
            timing: 'trigger',
            levels: ['major'],
            channels: ['sms'],
            channelTemplates: { sms: '1' },
            delaySeconds: 0,
            targets: { userIDs: ['1', '2'] },
            callbacks: [
              {
                id: 'cb-1',
                url: 'http://example.com/webhook',
                method: 'POST',
                authType: 'none',
                timeoutSeconds: 5,
                retryTimes: 1,
              },
            ],
          },
        ],
      },
      status: 1,
    };

    it('toAlarmInfoCreateReq 应正确映射为后端请求', () => {
      const req = toAlarmInfoCreateReq(rule);
      expect(req.name).toBe('E2E 测试规则');
      expect(req.desc).toBe('测试描述');
      expect(req.evalPeriod).toBe(5);
      expect(req.target?.selectType).toBe('all');
      expect(req.if?.triggers).toHaveLength(1);
      expect(req.if?.triggers?.[0]?.criteria).toHaveLength(1);
      const leaf = req.if?.triggers?.[0]?.criteria?.[0]?.plain?.leaves?.[0];
      expect(leaf?.period).toBe(120);
      expect(leaf?.aggregateMethod).toBe('avg');
      expect(leaf?.continuePeriod).toBe(3);
      expect((leaf as typeof leaf & { filters?: Array<{ column: string }> })?.filters).toBeUndefined();
      expect(req.ladders).toHaveLength(1);
      expect(req.ladders?.[0]?.channels).toEqual(['sms']);
      // channelTemplates 前端 string -> 后端 number
      expect(req.ladders?.[0]?.channelTemplates).toEqual({ sms: 1 });
      // targets 前端 number[] -> 后端 string[]
      expect(req.ladders?.[0]?.targets?.userIDs).toEqual(['1', '2']);
      expect(req.ladders?.[0]?.callbacks?.[0]?.url).toBe('http://example.com/webhook');
      // 前端渲染 ID 应稳定转换为 proto int64 可接收的十进制字符串。
      expect(req.if?.triggers?.[0]?.id).toMatch(/^[1-9]\d*$/);
      expect(req.if?.triggers?.[0]?.criteria?.[0]?.id).toMatch(/^[1-9]\d*$/);
      expect(toAlarmInfoCreateReq(rule).if?.triggers?.[0]?.id).toBe(req.if?.triggers?.[0]?.id);
    });

    it('滚动聚合子条件只提交原始属性选择器', () => {
      const rollingRule = structuredClone(rule);
      rollingRule.if.triggers[0]!.criteria = [
        {
          id: 'criterion-rolling',
          type: 'rollingAggregate',
          rollingAggregate: {
            aggregate: 'avg',
            cmp: 'gt',
            threshold: 50,
            windowSeconds: 300,
            child: {
              id: 'criterion-selector',
              type: 'plain',
              plain: {
                logic: 'and',
                leaves: [
                  {
                    id: 'leaf-selector',
                    sourceType: 'property',
                    dataID: 'temp',
                    dataName: '温度',
                    compare: { termType: 'gt', values: ['80'] },
                    period: 120,
                    aggregateMethod: 'avg',
                    continuePeriod: 3,
                  },
                ],
              },
            },
          },
        },
      ];

      const selector = toAlarmInfoCreateReq(rollingRule).if?.triggers?.[0]?.criteria?.[0]?.rollingAggregate?.child?.plain?.leaves?.[0];

      expect(selector).toMatchObject({
        dataID: 'temp',
        sourceType: 'property',
      });
      expect((selector as typeof selector & { id?: string })?.id).toMatch(/^[1-9]\d*$/);
    });

    it('事件参数过滤应通过 filters 双向传输且不污染标量比较', () => {
      const eventRule = structuredClone(rule);
      const leaf = eventRule.if.triggers[0]?.criteria[0]?.plain?.leaves[0];
      expect(leaf).toBeDefined();
      if (!leaf) return;
      leaf.sourceType = 'event';
      leaf.dataID = 'overheat';
      leaf.aggregateMethod = 'occurred';
      leaf.compare = {
        termType: 'gt',
        values: [''],
        terms: [{ column: 'temperature', termType: 'gte', values: ['80'] }],
      };

      const requestLeaf = toAlarmInfoCreateReq(eventRule).if?.triggers?.[0]?.criteria?.[0]?.plain?.leaves?.[0] as
        | (ThingsApi.AlarmLeafCondition & {
            filters?: Array<{
              cmpType: string;
              column: string;
              values: string[];
            }>;
          })
        | undefined;
      expect(requestLeaf?.filters).toEqual([
        {
          cmpType: 'gte',
          column: 'temperature',
          values: ['80'],
        },
      ]);

      const restored = fromAlarmInfo({
        name: '事件参数过滤',
        target: { selectType: 'all', productID: 'product-1' },
        if: {
          triggers: [
            {
              type: 'and',
              level: 'major',
              criteria: [
                {
                  type: 'plain',
                  plain: { leaves: [requestLeaf!] },
                },
              ],
            },
          ],
        },
      });
      expect(restored.if.triggers[0]?.criteria[0]?.plain?.leaves[0]?.compare.terms).toEqual([
        {
          column: 'temperature',
          termType: 'gte',
          values: ['80'],
        },
      ]);
    });

    it('fromAlarmInfo 应正确还原前端规则', () => {
      const info: ThingsApi.AlarmInfo = {
        id: 'rule-001',
        name: '后端规则',
        evalPeriod: 10,
        status: 1,
        target: { selectType: 'fixed' },
        if: {
          triggers: [
            {
              id: 'trigger-1',
              type: 'and',
              level: 'minor',
              criteria: [
                {
                  id: 'crit-1',
                  type: 'plain',
                  plain: {
                    leaves: [
                      {
                        dataID: 'humi',
                        sourceType: 'property',
                        compare: { cmpType: 'lt', values: ['30'] },
                        period: 60,
                        aggregateMethod: 'last',
                        continuePeriod: 1,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        ladders: [
          {
            order: 1,
            timing: 'trigger',
            levels: ['minor'],
            channelTemplates: { email: 2 },
            targets: { userIDs: ['3'] },
          },
        ],
      };
      const front = fromAlarmInfo(info);
      expect(front.id).toBe('rule-001');
      expect(front.name).toBe('后端规则');
      expect(front.target.selectType).toBe('fixed');
      expect(front.if.triggers).toHaveLength(1);
      const leaf = front.if.triggers[0]?.criteria[0]?.plain?.leaves[0];
      expect(leaf?.period).toBe(60);
      expect(leaf?.aggregateMethod).toBe('last');
      expect(front.notify.ladders).toHaveLength(1);
      // 后端领域转换不回填 channels 时，应由真实生效的渠道模板映射恢复选中渠道
      expect(front.notify.ladders[0]?.channels).toEqual(['email']);
      // channelTemplates 后端 number -> 前端 string
      expect(front.notify.ladders[0]?.channelTemplates).toEqual({ email: '2' });
      // targets 后端 string[] -> 前端 number[]
      expect(front.notify.ladders[0]?.targets?.userIDs).toEqual(['3']);
    });

    it('回显时应忽略零值条件模板引用并保留真实模板引用', () => {
      const zeroTemplateRule = fromAlarmInfo({
        name: '旧规则',
        target: { selectType: 'all' },
        if: {
          triggers: [
            {
              level: 'major',
              templateID: '0',
              templateName: '历史错误模板',
              type: 'and',
            },
            {
              level: 'minor',
              templateID: '12',
              templateName: '真实模板',
              type: 'and',
            },
          ],
        },
      });

      expect(zeroTemplateRule.if.triggers[0]?.templateID).toBeUndefined();
      expect(zeroTemplateRule.if.triggers[0]?.templateName).toBeUndefined();
      expect(zeroTemplateRule.if.triggers[1]?.templateID).toBe('12');
      expect(zeroTemplateRule.if.triggers[1]?.templateName).toBe('真实模板');
    });

    it('通知阶梯提交和回显都应按视觉顺序重建 order', () => {
      const reorderedRule = structuredClone(rule);
      reorderedRule.notify.ladders = [
        { ...reorderedRule.notify.ladders[0]!, id: 'ladder-2', order: 8 },
        { ...reorderedRule.notify.ladders[0]!, id: 'ladder-1', order: 3 },
      ];

      expect(toAlarmInfoCreateReq(reorderedRule).ladders?.map((ladder) => ladder.order)).toEqual([1, 2]);

      const restored = fromAlarmInfo({
        name: '顺序测试',
        target: { selectType: 'all' },
        if: { triggers: [] },
        ladders: [
          { order: 2, timing: 'recovery' },
          { order: 1, timing: 'trigger' },
        ],
      });
      expect(restored.notify.ladders.map((ladder) => ladder.timing)).toEqual(['trigger', 'recovery']);
      expect(restored.notify.ladders.map((ladder) => ladder.order)).toEqual([1, 2]);
    });
  });

  describe('触发条件模板映射', () => {
    const tpl: ConditionTemplate = {
      id: 'tpl-001',
      name: '高温模板',
      summary: '温度大于阈值',
      trigger: {
        id: 'trigger-1',
        type: 'and',
        level: 'major',
        criteria: [
          {
            id: 'crit-1',
            type: 'plain',
            plain: {
              logic: 'and',
              leaves: [
                {
                  id: 'leaf-1',
                  sourceType: 'property',
                  dataID: 'temp',
                  dataName: '温度',
                  compare: { termType: 'gt', values: ['80'], terms: [] },
                  period: 180,
                  aggregateMethod: 'max',
                  continuePeriod: 2,
                },
              ],
            },
          },
        ],
      },
    };

    it('toConditionTemplateCreateReq 应正确绑定到品类并携带叶子扩展字段', () => {
      const req = toConditionTemplateCreateReq(tpl, 'category', 'cat-001');
      expect(req.name).toBe('高温模板');
      expect(req.desc).toBe('温度大于阈值');
      expect(req.productCategoryID).toBe('cat-001');
      expect(req.productID).toBeUndefined();
      expect(req.if?.triggers?.[0]?.level).toBe('major');
      const leaf = req.if?.triggers?.[0]?.criteria?.[0]?.plain?.leaves?.[0];
      expect(leaf?.period).toBe(180);
      expect(leaf?.aggregateMethod).toBe('max');
      expect(leaf?.continuePeriod).toBe(2);
      // 模板节点同样提交稳定的数值字符串 ID。
      expect(req.if?.triggers?.[0]?.id).toMatch(/^[1-9]\d*$/);
      expect(req.if?.triggers?.[0]?.criteria?.[0]?.id).toMatch(/^[1-9]\d*$/);
    });

    it('toConditionTemplateCreateReq 应正确绑定到产品', () => {
      const req = toConditionTemplateCreateReq(tpl, 'product', 'prod-001');
      expect(req.productID).toBe('prod-001');
      expect(req.productCategoryID).toBeUndefined();
    });
  });

  describe('通知内容模板映射', () => {
    const tpl: ContentTemplate = {
      id: 'ntpl-001',
      name: '短信模板',
      channel: 'sms',
      ref: 0,
      status: 1,
      remark: '备注',
      triggerTitle: '告警触发',
      triggerBody: '设备{{deviceName}}触发告警',
      recoveryTitle: '告警恢复',
      recoveryBody: '设备{{deviceName}}已恢复',
    };

    it('toNotifyTemplateCreateReq 应正确映射', () => {
      const req = toNotifyTemplateCreateReq(tpl);
      expect(req.name).toBe('短信模板');
      expect(req.channel).toBe('sms');
      expect(req.desc).toBe('备注');
      expect(req.subject).toBe('告警触发');
      expect(req.triggerBody).toBe('设备{{deviceName}}触发告警');
      expect(req.recoveryBody).toBe('设备{{deviceName}}已恢复');
    });

    it('fromNotifyTemplate 应正确还原', () => {
      const backend: ThingsApi.AlarmNotifyTemplate = {
        id: 'ntpl-002',
        name: '邮件模板',
        channel: 'email',
        refCount: 3,
        status: 1,
        desc: '邮件备注',
        subject: '告警邮件',
        triggerBody: 'trigger body',
        recoveryBody: 'recovery body',
      };
      const front = fromNotifyTemplate(backend);
      expect(front.id).toBe('ntpl-002');
      expect(front.channel).toBe('email');
      expect(front.ref).toBe(3);
      expect(front.status).toBe(1);
      expect(front.triggerTitle).toBe('告警邮件');
      expect(front.recoveryTitle).toBe('告警邮件');
    });
  });
});

describe('useAlarmConvert targets 直接地址映射', () => {
  it('toBackendTargets 透传直接填写的手机号/邮箱', () => {
    const result = toBackendTargets({
      userIDs: ['1'],
      phones: ['13800138000'],
      emails: ['alert@example.com'],
    });
    expect(result).toBeDefined();
    expect(result?.phones).toEqual(['13800138000']);
    expect(result?.emails).toEqual(['alert@example.com']);
    expect(result?.userIDs).toEqual(['1']);
  });

  it('toBackendTargets 过滤空地址且全空时返回 undefined', () => {
    expect(toBackendTargets({ phones: [], emails: [] })).toBeUndefined();
    const filtered = toBackendTargets({ phones: ['13800138000', ''] });
    expect(filtered?.phones).toEqual(['13800138000']);
  });

  it('fromBackendTargets 回显直接地址', () => {
    const result = fromBackendTargets({
      userIDs: ['1'],
      phones: ['13800138000'],
      emails: ['alert@example.com'],
    });
    expect(result.phones).toEqual(['13800138000']);
    expect(result.emails).toEqual(['alert@example.com']);
    expect(result.userIDs).toEqual(['1']);
  });
});
