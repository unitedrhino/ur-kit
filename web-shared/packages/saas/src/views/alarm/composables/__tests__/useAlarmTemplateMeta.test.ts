/**
 * 文件说明：告警条件模板元数据回归测试。
 * 确保模板编辑器直接使用真实物模型状态，不会二次回退到演示字段。
 */
import { ref } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import { useAlarmTemplateMeta } from '../useAlarmTemplateMeta';

const apiMocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getProducts: vi.fn(),
}));

const emptySchema = {
  actionFields: [],
  eventFields: [],
  metricFields: [],
  onlineFields: [
    {
      dataID: '_online',
      id: '_online',
      name: '在线状态',
      sourceType: 'online' as const,
      valueType: 'bool' as const,
    },
  ],
};

vi.mock('@vben/api', () => ({
  ThingsApi: {
    postApiV1ThingsProductCategoryGetList: apiMocks.getCategories,
    postApiV1ThingsProductInfoGetList: apiMocks.getProducts,
  },
}));

vi.mock('../useAlarmSchema', () => ({
  useAlarmSchema: () => ({
    loadSchema: vi.fn(),
    schema: ref(emptySchema),
  }),
}));

describe('useAlarmTemplateMeta', () => {
  it('真实物模型为空时不应二次回退到演示字段', () => {
    const { schema } = useAlarmTemplateMeta();

    expect(schema.value.metricFields).toEqual([]);
    expect(schema.value.eventFields).toEqual([]);
    expect(schema.value.actionFields).toEqual([]);
    expect(schema.value.onlineFields.map((field) => field.dataID)).toEqual(['_online']);
  });

  it('真实绑定范围为空时不应回退到演示品类和产品', async () => {
    apiMocks.getCategories.mockResolvedValue({ list: [] });
    apiMocks.getProducts.mockResolvedValue({ list: [] });

    const { bindOptions, load } = useAlarmTemplateMeta();
    await load();

    expect(bindOptions.value).toEqual([
      { children: [], label: 'iotApp.alarmCondTpl.categoryOpt', value: 'category' },
      { children: [], label: 'iotApp.alarmRule.productLabel', value: 'product' },
    ]);
  });
});
