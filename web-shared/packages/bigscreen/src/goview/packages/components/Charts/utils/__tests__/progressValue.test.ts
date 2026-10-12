import { describe, expect, it } from 'vitest';

import { extractNullableSingleMetricValue, extractSingleMetricValue } from '../progressValue';

describe('progressValue extractSingleMetricValue', () => {
  it('IoT 场景同时存在配置层与桥接层 mapping 时优先配置层', () => {
    const value = extractSingleMetricValue(
      {
        source: [
          {
            humidity: 65,
            temperature: 23.5,
          },
        ],
      },
      {
        option: {
          _simplifiedData: {
            mappings: {
              value: 'humidity',
              y: 'humidity',
            },
          },
        },
        request: {
          requestIoTDeviceConfig: {
            mapping: {
              valueField: 'temperature',
              yFields: ['temperature'],
            },
          },
        },
      },
    );

    expect(value).toBe(23.5);
  });

  it('没有配置层 mapping 时回退桥接层字段', () => {
    const value = extractSingleMetricValue(
      {
        source: [
          {
            humidity: 65,
            temperature: 23.5,
          },
        ],
      },
      {
        option: {
          _simplifiedData: {
            mappings: {
              value: 'humidity',
              y: 'humidity',
            },
          },
        },
      },
    );

    expect(value).toBe(65);
  });
});

it('最新数值为空时不从旧行或另一个属性寻找替代值', () => {
  expect(extractNullableSingleMetricValue({ dimensions: ['name', 'value'], source: [{ name: '旧记录', value: 12 }, { name: '最新', value: null }] })).toBeNull();
  expect(extractNullableSingleMetricValue({ source: [{ temperature: null, humidity: 55 }] }, { request: { requestIoTDeviceConfig: { mapping: { valueField: 'temperature' } } } })).toBeNull();
  expect(extractNullableSingleMetricValue({ source: [{ value: 0 }] })).toBe(0);
});
