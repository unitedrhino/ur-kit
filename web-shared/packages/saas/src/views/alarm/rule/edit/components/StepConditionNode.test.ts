import type { AlarmObjectSchema, Criterion, Trigger } from '../../../types/alarm-v2.types';

/**
 * 文件说明：嵌套子判据编辑器组件测试。
 * 验证复杂判据内的普通条件可以修改，并将完整判据同步给父组件。
 */
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it } from 'vitest';

import AlarmSelect from '../../../components/AlarmSelect.vue';
import { installTestAlarmCapability } from '../../../test-utils/alarm-capability';
import StepConditionNode from './StepConditionNode.vue';

/** 嵌套编辑测试使用的内置在线状态字段。 */
const schema: AlarmObjectSchema = {
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

const numericSchema: AlarmObjectSchema = {
  actionFields: [],
  eventFields: [],
  metricFields: [
    {
      dataID: 'temperature',
      id: 'temperature',
      name: '温度',
      sourceType: 'property',
      valueType: 'float',
    },
  ],
  onlineFields: [],
};

/** boolSchema 用于验证新增判据不会生成后端拒绝的数值大小比较。 */
const boolSchema: AlarmObjectSchema = {
  actionFields: [],
  eventFields: [],
  metricFields: [
    {
      dataID: 'enabled',
      id: 'enabled',
      name: '启用状态',
      sourceType: 'property',
      valueType: 'bool',
    },
  ],
  onlineFields: [],
};

/** 创建默认选择离线状态的普通子判据。 */
function createCriterion(): Criterion {
  return {
    id: 'criterion-child',
    type: 'plain',
    plain: {
      logic: 'and',
      leaves: [
        {
          id: 'leaf-child',
          sourceType: 'online',
          dataID: '_online',
          dataName: '在线状态',
          compare: { termType: 'eq', values: ['offline'] },
          period: 60,
          aggregateMethod: 'last',
          continuePeriod: 1,
        },
      ],
    },
  };
}

/** 创建承载子判据的最小触发条件。 */
function createTrigger(criterion: Criterion): Trigger {
  return {
    id: 'trigger-1',
    type: 'and',
    level: 'major',
    criteria: [criterion],
  };
}

describe('stepConditionNode', () => {
  beforeEach(() => {
    installTestAlarmCapability();
  });

  it('单条嵌套条件不应在卡片内部额外绘制顶边线', () => {
    const criterion = createCriterion();
    const wrapper = mount(StepConditionNode, {
      props: {
        criterion,
        schema,
        trigger: createTrigger(criterion),
      },
    });

    const editor = wrapper.get('[data-testid="nested-condition-editor"]');
    expect(editor.element.children[1]?.classList.contains('border-t')).toBe(false);
  });

  it('可以编辑嵌套普通条件的在线状态并向父组件提交更新', async () => {
    const criterion = createCriterion();
    const wrapper = mount(StepConditionNode, {
      props: {
        criterion,
        schema,
        trigger: createTrigger(criterion),
      },
    });

    const onlineSelect = wrapper
      .findAllComponents(AlarmSelect)
      .find((item) => item.props('modelValue') === 'offline');
    expect(onlineSelect).toBeDefined();
    onlineSelect?.vm.$emit('update:modelValue', 'online');
    await wrapper.vm.$nextTick();

    const updated = wrapper.emitted<Criterion[]>('update')?.[0]?.[0];
    expect(updated?.plain?.leaves[0]?.compare.values).toEqual(['online']);
  });

  it('bool 属性新增同级条件时使用能力矩阵允许的等值比较', async () => {
    const criterion: Criterion = {
      id: 'criterion-bool',
      type: 'plain',
      plain: {
        logic: 'and',
        leaves: [
          {
            id: 'leaf-bool',
            sourceType: 'property',
            dataID: 'enabled',
            dataName: '启用状态',
            compare: { termType: 'eq', values: ['true'] },
            period: 60,
            aggregateMethod: 'last',
            continuePeriod: 1,
          },
        ],
      },
    };
    const wrapper = mount(StepConditionNode, {
      props: {
        criterion,
        schema: boolSchema,
        trigger: createTrigger(criterion),
      },
    });
    const addButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('添加同级条件'));
    expect(addButton).toBeDefined();

    await addButton!.trigger('click');

    const updated = wrapper.emitted<Criterion[]>('update')?.[0]?.[0];
    expect(updated?.plain?.leaves[1]?.compare.termType).toBe('eq');
  });

  it('滚动聚合内部只展示原始数值属性选择器', () => {
    const criterion: Criterion = {
      id: 'criterion-rolling-child',
      type: 'plain',
      plain: {
        logic: 'and',
        leaves: [
          {
            id: 'leaf-temperature',
            sourceType: 'property',
            dataID: 'temperature',
            dataName: '温度',
            compare: { termType: 'gt', values: ['30'] },
            period: 60,
            aggregateMethod: 'avg',
            continuePeriod: 2,
          },
        ],
      },
    };
    const wrapper = mount(StepConditionNode, {
      props: {
        advanced: true,
        criterion,
        schema: numericSchema,
        selectorOnly: true,
        trigger: createTrigger(criterion),
      },
    });

    expect(wrapper.text()).not.toContain('统计周期');
    expect(wrapper.text()).not.toContain('持续');
    expect(wrapper.find('option[value="event"]').exists()).toBe(false);
    expect(wrapper.find('option[value="avg"]').exists()).toBe(false);
    expect(wrapper.findAll('input')).toHaveLength(0);
  });

  it('滚动聚合按聚合值、比较符、阈值的语序排列', () => {
    const criterion: Criterion = {
      id: 'criterion-rolling',
      type: 'rollingAggregate',
      rollingAggregate: {
        aggregate: 'avg',
        child: {
          id: 'rolling-plain',
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [{
              id: 'rolling-leaf',
              sourceType: 'property',
              dataID: 'temperature',
              compare: { termType: 'gt', values: ['30'] },
              dataName: '温度',
            }],
          },
        },
        cmp: 'gt',
        threshold: 30,
        windowSeconds: 300,
      },
    };
    const wrapper = mount(StepConditionNode, {
      props: {
        criterion,
        schema: numericSchema,
        trigger: createTrigger(criterion),
      },
    });

    const html = wrapper.html();
    expect(html.indexOf('nested-rolling-compare'))
      .toBeLessThan(html.indexOf('nested-rolling-threshold'));
  });

  it('按能力矩阵编辑持续时长包 K-of-N 和 K-of-N 包滚动聚合', () => {
    const rollingChild: Criterion = {
      id: 'rolling-child',
      type: 'rollingAggregate',
      rollingAggregate: {
        aggregate: 'avg',
        child: {
          id: 'rolling-plain',
          type: 'plain',
          plain: {
            logic: 'and',
            leaves: [{
              id: 'rolling-leaf',
              sourceType: 'property',
              dataID: 'temperature',
              dataName: '温度',
              compare: { termType: 'gt', values: ['30'] },
            }],
          },
        },
        cmp: 'gt',
        threshold: 30,
        windowSeconds: 300,
      },
    };
    const criterion: Criterion = {
      id: 'duration-parent',
      type: 'duration',
      duration: {
        windowSeconds: 600,
        child: {
          id: 'kofn-child',
          type: 'kOfN',
          kOfN: { threshold: 1, children: [rollingChild] },
        },
      },
    };
    const wrapper = mount(StepConditionNode, {
      props: {
        criterion,
        schema: numericSchema,
        trigger: createTrigger(criterion),
      },
    });

    expect(wrapper.find('[data-testid="nested-duration-editor"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nested-kofn-editor"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nested-rolling-editor"]').exists()).toBe(true);
  });
});
