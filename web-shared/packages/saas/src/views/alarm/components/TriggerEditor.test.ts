import type { AlarmObjectSchema, Trigger } from '../types/alarm-v2.types';

/**
 * 文件说明：告警触发条件编辑器物模型可用性测试。
 * 覆盖空物模型的类型禁用，以及历史规则失效字段的原值保留。
 */
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it } from 'vitest';

import { installTestAlarmCapability } from '../test-utils/alarm-capability';
import AlarmSelect from './AlarmSelect.vue';
import TriggerEditor from './TriggerEditor.vue';

const emptySchema: AlarmObjectSchema = {
  actionFields: [],
  eventFields: [],
  metricFields: [],
  onlineFields: [
    {
      dataID: '_online',
      id: '_online',
      name: '在线状态',
      sourceType: 'online',
      valueType: 'bool',
    },
  ],
};

/** 事件和在线历史聚合测试使用的物模型。 */
const historySchema: AlarmObjectSchema = {
  actionFields: [],
  eventFields: [
    {
      dataID: 'overheat',
      id: 'overheat',
      name: '过热事件',
      sourceType: 'event',
      valueType: 'struct',
      children: [
        {
          dataID: 'temperature',
          id: 'temperature',
          name: '温度',
          sourceType: 'event',
          unit: '℃',
          valueType: 'float',
        },
      ],
    },
  ],
  metricFields: [],
  onlineFields: emptySchema.onlineFields,
};

const triggerWithRemovedField: Trigger = {
  criteria: [
    {
      id: 'criterion-1',
      plain: {
        leaves: [
          {
            compare: { termType: 'gt', values: ['50'] },
            dataID: 'removed_property',
            dataName: '历史温度',
            id: 'leaf-1',
            sourceType: 'property',
          },
        ],
        logic: 'and',
      },
      type: 'plain',
    },
  ],
  id: 'trigger-1',
  level: 'major',
  type: 'and',
};

describe('triggerEditor 物模型字段状态', () => {
  beforeEach(() => {
    installTestAlarmCapability();
  });

  it('条件组应使用单层卡片边框且不重复绘制上下边线', () => {
    const wrapper = mount(TriggerEditor, {
      props: { schema: emptySchema, trigger: triggerWithRemovedField },
    });

    expect(wrapper.classes()).toContain('rounded-md');
    expect(wrapper.classes()).toContain('border');
    expect(wrapper.findAll('.border-y')).toHaveLength(0);
  });

  it('没有属性物模型时应禁用属性类型', () => {
    const wrapper = mount(TriggerEditor, {
      props: { schema: emptySchema, trigger: triggerWithRemovedField },
    });

    const sourceSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((item) =>
        item
          .props('options')
          .some(
            (option: { value: number | string }) =>
              option.value === 'property',
          ),
      );
    const propertyOption = sourceSelect
      ?.props('options')
      .find(
        (option: { value: number | string }) => option.value === 'property',
      );
    expect(propertyOption?.disabled).toBe(true);
  });

  it('编辑历史规则时应保留并标记已失效字段', () => {
    const wrapper = mount(TriggerEditor, {
      props: { schema: emptySchema, trigger: triggerWithRemovedField },
    });

    const fieldSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((item) =>
        item
          .props('options')
          .some(
            (option: { value: number | string }) =>
              option.value === 'removed_property',
          ),
      );
    const removedOption = fieldSelect
      ?.props('options')
      .find(
        (option: { value: number | string }) =>
          option.value === 'removed_property',
      );
    expect(removedOption?.label).toContain('历史温度（已失效）');
  });

  it('嵌套子判据修改后应同步更新触发条件', async () => {
    const nestedTrigger: Trigger = {
      id: 'trigger-nested',
      type: 'and',
      level: 'major',
      criteria: [
        {
          id: 'criterion-duration',
          type: 'duration',
          duration: {
            windowSeconds: 300,
            child: {
              id: 'criterion-child',
              type: 'plain',
              plain: {
                logic: 'and',
                leaves: [
                  {
                    id: 'leaf-online',
                    sourceType: 'online',
                    dataID: '_online',
                    dataName: '在线状态',
                    compare: { termType: 'eq', values: ['offline'] },
                  },
                ],
              },
            },
          },
        },
      ],
    };
    const wrapper = mount(TriggerEditor, {
      props: { schema: emptySchema, trigger: nestedTrigger },
    });

    const onlineSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((item) => item.props('modelValue') === 'offline');
    expect(onlineSelect).toBeDefined();
    onlineSelect?.vm.$emit('update:modelValue', 'online');
    await wrapper.vm.$nextTick();

    const updated = wrapper.emitted<Trigger[]>('update:trigger')?.[0]?.[0];
    expect(updated?.criteria[0]?.duration?.child.plain?.leaves[0]?.compare.values).toEqual(['online']);
  });

  it('事件是否发生只展示事件统计能力且不要求独立阈值', () => {
    const eventTrigger: Trigger = {
      id: 'trigger-event',
      type: 'and',
      level: 'major',
      criteria: [
        {
          id: 'criterion-event',
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [
              {
                id: 'leaf-event',
                sourceType: 'event',
                dataID: 'overheat',
                dataName: '过热事件',
                compare: { termType: 'gt', values: [''] },
                aggregateMethod: 'occurred',
                period: 60,
                continuePeriod: 1,
              },
            ],
          },
        },
      ],
    };
    const wrapper = mount(TriggerEditor, {
      props: { advanced: true, schema: historySchema, trigger: eventTrigger },
    });

    const aggregateSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((item) => item.props('modelValue') === 'occurred');
    expect(
      aggregateSelect
        ?.props('options')
        .map((option: { value: number | string }) => option.value),
    ).toEqual(['occurred', 'count']);
    expect(wrapper.find('input[placeholder="比较值"]').exists()).toBe(false);
  });

  it('事件发生条件应支持按事件参数过滤原始记录', async () => {
    const eventTrigger: Trigger = {
      id: 'trigger-event-filter',
      type: 'and',
      level: 'major',
      criteria: [
        {
          id: 'criterion-event-filter',
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [
              {
                id: 'leaf-event-filter',
                sourceType: 'event',
                dataID: 'overheat',
                dataName: '过热事件',
                compare: { termType: 'gt', values: [''] },
                aggregateMethod: 'occurred',
                period: 60,
                continuePeriod: 1,
              },
            ],
          },
        },
      ],
    };
    const wrapper = mount(TriggerEditor, {
      props: { advanced: true, schema: historySchema, trigger: eventTrigger },
    });

    const addFilter = wrapper
      .findAll('button')
      .find((button) => button.text().includes('添加参数过滤'));
    expect(addFilter).toBeDefined();
    await addFilter?.trigger('click');

    const updated = wrapper.emitted<Trigger[]>('update:trigger')?.[0]?.[0];
    expect(updated?.criteria[0]?.plain?.leaves[0]?.compare.terms).toEqual([
      {
        column: 'temperature',
        termType: 'eq',
        values: [''],
      },
    ]);
  });

  it('在线历史时长使用数值比较而不是在线离线枚举', () => {
    const onlineDurationTrigger: Trigger = {
      id: 'trigger-online-duration',
      type: 'and',
      level: 'major',
      criteria: [
        {
          id: 'criterion-online-duration',
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [
              {
                id: 'leaf-online-duration',
                sourceType: 'online',
                dataID: '_online',
                dataName: '在线状态',
                compare: { termType: 'gte', values: ['300'] },
                aggregateMethod: 'onlineDuration',
                period: 600,
                continuePeriod: 1,
              },
            ],
          },
        },
      ],
    };
    const wrapper = mount(TriggerEditor, {
      props: {
        advanced: true,
        schema: historySchema,
        trigger: onlineDurationTrigger,
      },
    });

    expect(wrapper.find('input[placeholder="比较值"]').exists()).toBe(true);
    expect(
      wrapper
        .findAllComponents(AlarmSelect)
        .some((item) =>
          item
            .props('options')
            .some(
              (option: { value: number | string }) =>
                option.value === 'offline',
            ),
        ),
    ).toBe(false);
  });
});
