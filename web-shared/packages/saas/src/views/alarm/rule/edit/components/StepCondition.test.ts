import type { AlarmObjectSchema } from '../../../types/alarm-v2.types';

/**
 * 文件说明：告警规则条件步骤物模型状态提示测试。
 * 确保空物模型和接口错误都向用户展示真实状态，不再伪装为正常字段列表。
 */
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import StepCondition from './StepCondition.vue';

const schemaState = vi.hoisted(() => ({
  error: '',
  loadSchema: vi.fn(),
  loading: false,
  schema: {
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
  } satisfies AlarmObjectSchema,
}));

vi.mock('../../../api/alarm-condition-template.api', () => ({
  getConditionTemplateList: vi.fn().mockResolvedValue({ list: [] }),
}));

vi.mock('../../../composables/useAlarmSchema', async () => {
  const { ref } = await import('vue');
  return {
    useAlarmSchema: () => ({
      error: ref(schemaState.error),
      loadSchema: schemaState.loadSchema,
      loading: ref(schemaState.loading),
      schema: ref(schemaState.schema),
    }),
  };
});

describe('stepCondition 物模型状态', () => {
  beforeEach(() => {
    schemaState.error = '';
    schemaState.loading = false;
    schemaState.loadSchema.mockClear();
  });

  it('真实物模型为空时应提示仅可使用在线状态', () => {
    const wrapper = mount(StepCondition, {
      props: {
        target: { categoryID: '3', selectType: 'all', targetKind: 'category' },
        triggers: [],
      },
    });

    expect(wrapper.text()).toContain('当前告警来源未配置属性、事件或行为物模型');
    expect(wrapper.text()).toContain('仅可使用在线状态条件');
  });

  it('规则概览应使用标题、重点摘要和次级状态的清晰层级', () => {
    const wrapper = mount(StepCondition, {
      props: {
        target: { categoryID: '3', selectType: 'all', targetKind: 'category' },
        triggers: [],
      },
    });

    const overview = wrapper.get('[data-testid="condition-overview"]');
    const summary = wrapper.get('[data-testid="step-summary"]');
    expect(overview.find('h2').exists()).toBe(true);
    expect(overview.classes()).not.toContain('grid');
    // 摘要条采用卡片化设计：圆角 + 卡片背景 + 轻阴影 + 主题色强调条
    expect(summary.classes()).toContain('rounded-xl');
    expect(summary.classes()).toContain('bg-card');
    expect(summary.classes()).toContain('shadow-sm');
    expect(summary.find('.bg-primary').exists()).toBe(true);
  });

  it('物模型接口失败时应展示失败原因', () => {
    schemaState.error = '网络异常';
    const wrapper = mount(StepCondition, {
      props: {
        target: { productID: 'product-1', selectType: 'all', targetKind: 'product' },
        triggers: [],
      },
    });

    expect(wrapper.text()).toContain('物模型加载失败：网络异常');
  });
});
