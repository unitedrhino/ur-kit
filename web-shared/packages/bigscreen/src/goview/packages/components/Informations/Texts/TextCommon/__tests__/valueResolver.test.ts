import { describe, expect, it } from 'vitest';

import { extractSingleValueFromDataset } from '../valueResolver';

describe('TextCommon valueResolver', () => {
  it('IoT 场景同时存在两套 mapping 时优先配置层', () => {
    const result = extractSingleValueFromDataset(
      {
        dimensions: ['name', '温度', '湿度'],
        source: [
          {
            name: '设备A',
            温度: 23.5,
            湿度: 65,
          },
        ],
      },
      {
        requestMapping: {
          valueField: '温度',
          yFields: ['温度'],
        },
        simplifiedMappings: {
          value: '湿度',
          y: '湿度',
        },
      },
    );

    expect(result).toBe(23.5);
  });

  it('优先使用 _simplifiedData.mappings.value 读取单值字段', () => {
    const result = extractSingleValueFromDataset(
      {
        dimensions: ['name', '温度', '湿度'],
        source: [
          {
            name: '设备A',
            温度: 23.5,
            湿度: 65,
          },
        ],
      },
      {
        simplifiedMappings: {
          value: '湿度',
          y: '湿度',
        },
      },
    );

    expect(result).toBe(65);
  });

  it('当 _simplifiedData 未命中时回退到 request mapping', () => {
    const result = extractSingleValueFromDataset(
      {
        dimensions: ['name', '温度', '湿度'],
        source: [
          {
            name: '设备A',
            温度: 23.5,
            湿度: 65,
          },
        ],
      },
      {
        requestMapping: {
          valueField: '温度',
          yFields: ['温度'],
        },
      },
    );

    expect(result).toBe(23.5);
  });

  it('当没有 mapping 时回退到首个真实数据字段', () => {
    const result = extractSingleValueFromDataset(
      {
        dimensions: ['name', 'time', '温度'],
        source: [
          {
            name: '设备A',
            time: '2026-05-17T10:00:00',
            温度: 23.5,
          },
        ],
      },
      {},
    );

    expect(result).toBe(23.5);
  });
});

/** 质量异常不能被同一行其他字段或上一条值掩盖。 */
describe('TextCommon 质量空值', () => {
  it('指定属性为空时显示缺口，不改读其他良好属性', () => {
    expect(extractSingleValueFromDataset({ dimensions: ['time', 'Q', 'P'], source: [{ time: '19:00', P: null, Q: 50 }] }, { requestMapping: { valueField: 'P' } })).toBe('—');
  });
  it('无显式映射的异常空值显示缺口，真实零值仍可见', () => {
    expect(extractSingleValueFromDataset({ dimensions: ['time', 'P'], source: [{ time: '19:00', P: null }] }, {})).toBe('—');
    expect(extractSingleValueFromDataset({ dimensions: ['time', 'P'], source: [{ time: '19:01', P: 0 }] }, {})).toBe(0);
  });
});
