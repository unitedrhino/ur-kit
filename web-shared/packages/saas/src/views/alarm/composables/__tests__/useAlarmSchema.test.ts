/**
 * 文件说明：告警规则物模型加载回归测试。
 * 确保真实接口为空或失败时不会把演示字段伪装成当前告警来源的物模型。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAlarmSchema } from '../useAlarmSchema';

const apiMocks = vi.hoisted(() => ({
  getCategorySchema: vi.fn(),
  getDeviceSchema: vi.fn(),
  getProductSchema: vi.fn(),
}));

vi.mock('@vben/api', () => ({
  ThingsApi: {
    postApiV1ThingsDeviceSchemaGetList: apiMocks.getDeviceSchema,
    postApiV1ThingsProductSchemaGetList: apiMocks.getProductSchema,
    postApiV1ThingsSchemaCommonGetList: apiMocks.getCategorySchema,
  },
}));

describe('useAlarmSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('品类物模型为空时不应回退到演示字段', async () => {
    apiMocks.getCategorySchema.mockResolvedValue({ list: [] });
    const { error, loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      categoryID: '3',
      selectType: 'all',
      targetKind: 'category',
    });

    expect(error.value).toBe('');
    expect(schema.value.metricFields).toEqual([]);
    expect(schema.value.eventFields).toEqual([]);
    expect(schema.value.actionFields).toEqual([]);
    expect(schema.value.onlineFields.map((field) => field.dataID)).toEqual(['_online']);
  });

  it('产品属性应从 affordance 解析数据类型与单位', async () => {
    apiMocks.getProductSchema.mockResolvedValue({
      list: [
        {
          identifier: 'temperature',
          name: '温度',
          type: 1,
          affordance: JSON.stringify({
            define: { type: 'float', unit: '℃' },
          }),
        },
        {
          identifier: 'mode',
          name: '模式',
          type: 1,
          affordance: JSON.stringify({
            define: { type: 'string' },
          }),
        },
      ],
    });
    const { loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      productID: 'product-1',
      selectType: 'all',
      targetKind: 'product',
    });

    expect(schema.value.metricFields).toEqual([
      {
        id: 'temperature',
        dataID: 'temperature',
        name: '温度',
        sourceType: 'property',
        unit: '℃',
        valueType: 'float',
      },
      {
        id: 'mode',
        dataID: 'mode',
        name: '模式',
        sourceType: 'property',
        unit: undefined,
        valueType: 'string',
      },
    ]);
  });

  it('事件与行为参数应解析为可用于原始记录过滤的子字段', async () => {
    apiMocks.getProductSchema.mockResolvedValue({
      list: [
        {
          identifier: 'overheat',
          name: '过热事件',
          type: 2,
          affordance: JSON.stringify({
            params: [
              {
                identifier: 'temperature',
                name: '温度',
                define: { type: 'float', unit: '℃' },
              },
            ],
          }),
        },
        {
          identifier: 'setTarget',
          name: '设置目标温度',
          type: 3,
          affordance: JSON.stringify({
            input: [
              {
                identifier: 'target',
                name: '目标值',
                define: { type: 'int', unit: '℃' },
              },
            ],
          }),
        },
      ],
    });
    const { loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      productID: 'product-1',
      selectType: 'all',
      targetKind: 'product',
    });

    expect(schema.value.eventFields[0]?.children).toEqual([
      {
        id: 'temperature',
        dataID: 'temperature',
        name: '温度',
        sourceType: 'event',
        unit: '℃',
        valueType: 'float',
      },
    ]);
    expect(schema.value.actionFields[0]?.children?.[0]?.dataID).toBe('target');
  });

  it('事件参数为对象映射时也应保留参数标识和类型', async () => {
    apiMocks.getProductSchema.mockResolvedValue({
      list: [
        {
          identifier: 'overheat',
          name: '过热事件',
          type: 2,
          affordance: JSON.stringify({
            params: {
              code: { type: 'string' },
              temperature: { type: 'float', unit: '℃' },
            },
          }),
        },
      ],
    });
    const { loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      productID: 'product-1',
      selectType: 'all',
      targetKind: 'product',
    });

    expect(schema.value.eventFields[0]?.children).toEqual([
      {
        dataID: 'code',
        id: 'code',
        name: 'code',
        sourceType: 'event',
        unit: undefined,
        valueType: 'string',
      },
      {
        dataID: 'temperature',
        id: 'temperature',
        name: 'temperature',
        sourceType: 'event',
        unit: '℃',
        valueType: 'float',
      },
    ]);
  });

  it('结构体属性应展开为后端可查询的点分成员字段', async () => {
    apiMocks.getProductSchema.mockResolvedValue({
      list: [
        {
          identifier: 'location',
          name: '定位',
          type: 1,
          affordance: JSON.stringify({
            define: {
              type: 'struct',
              specs: [
                {
                  id: 'longitude',
                  name: '经度',
                  dataType: { type: 'float', unit: '度' },
                },
                {
                  id: 'valid',
                  name: '定位有效',
                  dataType: { type: 'bool' },
                },
              ],
            },
          }),
        },
      ],
    });
    const { loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      productID: 'product-1',
      selectType: 'all',
      targetKind: 'product',
    });

    expect(schema.value.metricFields).toEqual([
      {
        dataID: 'location.longitude',
        id: 'location.longitude',
        name: '定位 / 经度',
        sourceType: 'property',
        unit: '度',
        valueType: 'float',
      },
      {
        dataID: 'location.valid',
        id: 'location.valid',
        name: '定位 / 定位有效',
        sourceType: 'property',
        unit: undefined,
        valueType: 'bool',
      },
    ]);
  });

  it('数组属性应保留整字段并携带点位级联元数据', async () => {
    apiMocks.getProductSchema.mockResolvedValue({
      list: [
        {
          identifier: 'strain',
          name: '应变计',
          type: 1,
          affordance: JSON.stringify({
            define: { type: 'array', max: '3', arrayInfo: { type: 'float' } },
          }),
        },
        {
          identifier: 'gnss',
          name: 'GNSS位移',
          type: 1,
          affordance: JSON.stringify({
            define: {
              type: 'array',
              max: '2',
              arrayInfo: {
                type: 'struct',
                specs: [
                  { identifier: 'east', name: '东向位移', dataType: { type: 'float', unit: 'mm' } },
                  { identifier: 'up', name: '垂直位移', dataType: { type: 'int' } },
                ],
              },
            },
          }),
        },
      ],
    });
    const { loadSchema, schema } = useAlarmSchema();

    await loadSchema({
      productID: 'product-1',
      selectType: 'all',
      targetKind: 'product',
    });

    // 纯数组：整字段保留 + arrayMeta（max=3、元素类型 float、非结构体）
    const strain = schema.value.metricFields.find((f) => f.dataID === 'strain');
    expect(strain?.valueType).toBe('array');
    expect(strain?.arrayMeta).toEqual({
      max: 3,
      struct: false,
      elementValueType: 'float',
      specs: [],
    });

    // 结构体数组：arrayMeta.struct=true、成员携带 valueType 与单位
    const gnss = schema.value.metricFields.find((f) => f.dataID === 'gnss');
    expect(gnss?.valueType).toBe('array');
    expect(gnss?.arrayMeta?.struct).toBe(true);
    expect(gnss?.arrayMeta?.max).toBe(2);
    expect(gnss?.arrayMeta?.specs).toEqual([
      { identifier: 'east', name: '东向位移', valueType: 'float', unit: 'mm' },
      { identifier: 'up', name: '垂直位移', valueType: 'int', unit: undefined },
    ]);
  });
});
