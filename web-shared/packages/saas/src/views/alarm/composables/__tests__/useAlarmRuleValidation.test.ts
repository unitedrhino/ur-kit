import type { AlarmRule, LeafCondition, NotifyLadder } from '../../types/alarm-v2.types';

/**
 * 文件说明：告警规则表单校验单元测试
 * 验证监控范围、动态条件值和通知方案的关键阻断边界。
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { installTestAlarmCapability } from '../../test-utils/alarm-capability';
import { validateAlarmRule } from '../useAlarmRuleValidation';

/** 创建一条可通过表单预检的最小规则。 */
function createValidRule(): AlarmRule {
  return {
    name: '冷库温度过高',
    target: {
      selectType: 'all',
      targetKind: 'product',
      productID: 'product-1',
      productName: '温度传感器',
      devices: [],
      areas: [],
      groups: [],
    },
    evalPeriod: 1,
    status: 1,
    if: {
      triggers: [
        {
          id: 'trigger-1',
          type: 'and',
          level: 'major',
          criteria: [
            {
              id: 'criterion-1',
              type: 'plain',
              plain: {
                logic: 'and',
                leaves: [
                  {
                    id: 'leaf-1',
                    sourceType: 'property',
                    dataID: 'temperature',
                    dataName: '温度',
                    compare: { termType: 'gt', values: ['80'] },
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
    notify: {
      ladders: [
        {
          id: 'ladder-1',
          order: 1,
          timing: 'trigger',
          levels: ['major'],
          channels: ['message'],
          channelTemplates: { message: '1' },
          delaySeconds: 0,
          targets: { userIDs: ['1'] },
          callbacks: [],
        },
      ],
    },
  };
}

beforeEach(() => {
  installTestAlarmCapability();
});

/** 获取测试规则的第一条叶子条件。 */
function getFirstLeaf(rule: AlarmRule): LeafCondition {
  return rule.if.triggers[0]?.criteria[0]?.plain?.leaves[0] as LeafCondition;
}

/** 获取测试规则的第一个通知阶梯。 */
function getFirstLadder(rule: AlarmRule): NotifyLadder {
  return rule.notify.ladders[0] as NotifyLadder;
}

describe('validateAlarmRule', () => {
  it('最小完整规则可以通过创建前检查', () => {
    expect(validateAlarmRule(createValidRule())).toEqual([]);
  });

  it('全部设备仍然必须限定产品或品类来源', () => {
    const rule = createValidRule();
    rule.target.productID = '';

    expect(validateAlarmRule(rule)).toContainEqual({
      step: 1,
      field: 'source',
      message: '请先选择需要监控的产品',
    });
  });

  it('介于比较必须填写两个边界值', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    leaf.compare = { termType: 'btw', values: ['10', ''] };

    expect(validateAlarmRule(rule)).toContainEqual({
      step: 2,
      field: '第 1 组触发条件的第 1 个判据的第 1 条条件',
      message: '第 1 组触发条件的第 1 个判据的第 1 条条件需要填写起始值和结束值',
      nodeId: 'leaf-1',
      control: 'compareValue',
    });
  });

  it('在线状态使用固定枚举时不要求物模型字段标识', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    leaf.sourceType = 'online';
    leaf.dataID = undefined;
    leaf.dataName = '在线状态';
    leaf.compare = { termType: 'eq', values: ['offline'] };

    expect(validateAlarmRule(rule)).toEqual([]);
  });

  it('消息渠道必须同时配置模板和接收人', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.channelTemplates = {};
    ladder.targets.userIDs = [];

    const messages = validateAlarmRule(rule).map((issue) => issue.message);
    expect(messages.some((message) => message.includes('消息模板'))).toBe(true);
    expect(messages.some((message) => message.includes('通知接收人'))).toBe(true);
  });

  it('通知模板必须使用后端可接收的正整数标识', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.channelTemplates.message = 'template-1';

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('第 1 个通知阶梯的 message 消息模板标识无效，请重新选择');
  });

  it('不能选择后端调度器尚未支持的消息渠道', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.channels = ['dingTalkBot'];
    ladder.channelTemplates = { dingTalkBot: '1' };

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('第 1 个通知阶梯包含后端暂不支持的通知渠道 dingTalkBot');
  });

  it('通知延迟必须是非负整数', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.delaySeconds = -1;

    const issue = validateAlarmRule(rule).find((item) => item.control === 'delaySeconds');
    expect(issue?.message).toContain('延迟秒数必须是大于或等于 0 的整数');
  });

  it('需要认证的回调必须填写令牌并使用有效超时和重试次数', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.callbacks = [
      {
        id: 'callback-1',
        url: 'https://example.com/webhook',
        method: 'POST',
        authType: 'bearer',
        authToken: '',
        timeoutSeconds: 0,
        retryTimes: -1,
      },
    ];

    const controls = validateAlarmRule(rule).map((issue) => issue.control);
    expect(controls).toContain('callbackAuthToken');
    expect(controls).toContain('callbackTimeoutSeconds');
    expect(controls).toContain('callbackRetryTimes');
  });

  it('合法接口回调可以作为独立通知渠道', () => {
    const rule = createValidRule();
    const ladder = getFirstLadder(rule);
    ladder.channels = [];
    ladder.channelTemplates = {};
    ladder.targets.userIDs = [];
    ladder.callbacks = [
      {
        id: 'callback-1',
        url: 'https://example.com/webhook',
        method: 'POST',
        authType: 'none',
        timeoutSeconds: 5,
        retryTimes: 1,
      },
    ];

    expect(validateAlarmRule(rule)).toEqual([]);
  });

  it('不同触发条件组不能重复绑定同一告警级别', () => {
    const rule = createValidRule();
    const firstTrigger = rule.if.triggers[0]!;
    rule.if.triggers.push({ ...firstTrigger, id: 'trigger-2' });

    const duplicateIssue = validateAlarmRule(rule).find((issue) => issue.nodeId === 'trigger-2' && issue.control === 'level');
    expect(duplicateIssue?.message).toContain('重复使用“重要”级别');
  });

  it('同一告警级别和通知时机不能重复绑定阶梯', () => {
    const rule = createValidRule();
    const firstLadder = getFirstLadder(rule);
    rule.notify.ladders.push({ ...firstLadder, id: 'ladder-2' });

    const duplicateIssue = validateAlarmRule(rule).find((issue) => issue.nodeId === 'ladder-2' && issue.control === 'levels');
    expect(duplicateIssue?.message).toContain('重复绑定“重要”级别的告警触发通知');
  });

  it('同一告警级别可分别配置触发和恢复通知', () => {
    const rule = createValidRule();
    const firstLadder = getFirstLadder(rule);
    rule.notify.ladders.push({ ...firstLadder, id: 'ladder-2', timing: 'recovery' });

    expect(validateAlarmRule(rule).filter((issue) => issue.control === 'levels')).toEqual([]);
  });

  it('通知方案必须覆盖触发条件使用的全部告警级别', () => {
    const rule = createValidRule();
    const firstTrigger = rule.if.triggers[0]!;
    rule.if.triggers.push({ ...firstTrigger, id: 'trigger-2', level: 'minor' });

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('触发条件使用了“次要”级别，请为该级别配置通知方案');
  });

  it('告警对象不允许区域或分组与指定设备混用', () => {
    const rule = createValidRule();
    rule.target.devices = [{ productID: 'product-1', name: 'device-1' }];
    rule.target.areas = [1];

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('区域或分组不能与指定设备同时选择');
  });

  it('指定设备必须包含设备标识', () => {
    const rule = createValidRule();
    rule.target.selectType = 'fixed';
    rule.target.devices = [{ productID: 'product-1', name: '' }];

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('指定设备中存在缺少设备标识的项目，请重新选择');
  });

  it('触发条件组合方式只能是 AND 或 OR', () => {
    const rule = createValidRule();
    rule.if.triggers[0]!.type = 'invalid' as 'and';

    const logicIssue = validateAlarmRule(rule).find((issue) => issue.control === 'logic');
    expect(logicIssue?.message).toContain('组合方式必须是满足所有或满足任一');
  });

  it('滚动聚合只能包含单个属性条件', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    rule.if.triggers[0]!.criteria = [
      {
        id: 'criterion-rolling',
        type: 'rollingAggregate',
        rollingAggregate: {
          windowSeconds: 300,
          aggregate: 'avg',
          threshold: 80,
          cmp: 'gt',
          child: {
            id: 'criterion-child',
            type: 'plain',
            plain: {
              logic: 'and',
              leaves: [leaf, { ...leaf, id: 'leaf-2' }],
            },
          },
        },
      },
    ];

    expect(validateAlarmRule(rule).map((issue) => issue.message)).toContain('第 1 组触发条件的第 1 个判据的子条件必须是单个数值属性条件');
  });

  it('滚动聚合原始属性选择器不校验独立比较和高级窗口字段', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    rule.if.triggers[0]!.criteria = [
      {
        id: 'criterion-rolling',
        type: 'rollingAggregate',
        rollingAggregate: {
          windowSeconds: 300,
          aggregate: 'avg',
          threshold: 80,
          cmp: 'gt',
          child: {
            id: 'criterion-selector',
            type: 'plain',
            plain: {
              logic: 'and',
              leaves: [
                {
                  ...leaf,
                  compare: { termType: 'gt', values: [''] },
                  period: 0,
                  continuePeriod: 0,
                },
              ],
            },
          },
        },
      },
    ];

    expect(validateAlarmRule(rule).filter((issue) => issue.step === 2)).toEqual([]);
  });

  it('事件和动作只允许是否发生或次数聚合', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    leaf.sourceType = 'event';
    leaf.dataID = 'high_temperature';
    leaf.aggregateMethod = 'avg';

    expect(validateAlarmRule(rule)).toContainEqual({
      step: 2,
      field: '第 1 组触发条件的第 1 个判据的第 1 条条件',
      message: '第 1 组触发条件的第 1 个判据的第 1 条条件不支持当前统计方式',
      nodeId: 'leaf-1',
      control: 'aggregate',
    });
  });

  it('事件参数过滤必须同时填写参数标识和比较值', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    leaf.sourceType = 'event';
    leaf.dataID = 'high_temperature';
    leaf.aggregateMethod = 'occurred';
    leaf.compare = {
      termType: 'gt',
      values: [''],
      terms: [{ column: 'temperature', termType: 'gte', values: [''] }],
    };

    expect(validateAlarmRule(rule)).toContainEqual({
      step: 2,
      field: '第 1 组触发条件的第 1 个判据的第 1 条条件',
      message:
        '第 1 组触发条件的第 1 个判据的第 1 条条件的第 1 个参数过滤尚未填写比较值',
      nodeId: 'leaf-1',
      control: 'filter',
    });
  });

  it('事件是否发生配置完整参数过滤时无需独立统计阈值', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    leaf.sourceType = 'event';
    leaf.dataID = 'high_temperature';
    leaf.aggregateMethod = 'occurred';
    leaf.compare = {
      termType: 'gt',
      values: [''],
      terms: [
        { column: 'temperature', termType: 'gte', values: ['80'] },
      ],
    };

    expect(validateAlarmRule(rule).filter((issue) => issue.step === 2)).toEqual(
      [],
    );
  });

  it('k-of-n 不允许包含语义相同的重复子判据', () => {
    const rule = createValidRule();
    const leaf = getFirstLeaf(rule);
    const trigger = rule.if.triggers[0];
    expect(trigger).toBeDefined();
    if (!trigger) return;
    trigger.criteria = [
      {
        id: 'criterion-k-of-n',
        type: 'kOfN',
        kOfN: {
          threshold: 1,
          children: [
            {
              id: 'criterion-child-1',
              type: 'plain',
              plain: { logic: 'and', leaves: [leaf] },
            },
            {
              id: 'criterion-child-2',
              type: 'plain',
              plain: { logic: 'and', leaves: [{ ...leaf, id: 'leaf-2' }] },
            },
          ],
        },
      },
    ];

    expect(validateAlarmRule(rule)).toContainEqual({
      step: 2,
      field: '第 1 组触发条件的第 1 个判据',
      message: '第 1 组触发条件的第 1 个判据的第 2 个子条件与第 1 个子条件重复，请配置不同的判断条件',
      nodeId: 'criterion-child-2',
      control: 'duplicate',
    });
  });
});

describe('useAlarmRuleValidation 数组属性点位必填', () => {
  it('数组属性 dataID 以尾点占位（未选点位）时应阻断并提示', () => {
    const rule = createValidRule();
    rule.if.triggers[0]!.criteria = [
      {
        id: 'criterion-array',
        type: 'plain',
        plain: {
          leaves: [
            {
              id: 'leaf-array',
              sourceType: 'property',
              dataID: 'bb.',
              compare: { termType: 'eq', values: ['1'] },
              period: 60,
              aggregateMethod: 'last',
              continuePeriod: 1,
            },
          ],
        },
      },
    ];

    const issues = validateAlarmRule(rule);
    const hit = issues.find((issue) => issue.message.includes('尚未选择数组点位'));
    expect(hit).toBeDefined();
    expect(hit?.control).toBe('dataID');
  });

  it('数组属性未拼接点位（纯属性名）不误报普通字段校验，由后端兜底', () => {
    const rule = createValidRule();
    rule.if.triggers[0]!.criteria = [
      {
        id: 'criterion-array2',
        type: 'plain',
        plain: {
          leaves: [
            {
              id: 'leaf-array2',
              sourceType: 'property',
              dataID: 'bb',
              compare: { termType: 'eq', values: ['1'] },
              period: 60,
              aggregateMethod: 'last',
              continuePeriod: 1,
            },
          ],
        },
      },
    ];

    const issues = validateAlarmRule(rule);
    // 纯属性名无法在前端区分数组/标量，不应产生"尚未选择数组点位"误报
    expect(issues.find((issue) => issue.message.includes('尚未选择数组点位'))).toBeUndefined();
  });
});
