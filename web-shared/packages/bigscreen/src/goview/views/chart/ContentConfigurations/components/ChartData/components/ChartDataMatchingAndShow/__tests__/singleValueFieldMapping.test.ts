import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { describe, expect, it } from 'vitest';

import { readSingleValueField, writeSingleValueField } from '../singleValueFieldMapping';

describe('singleValueFieldMapping', () => {
  it('IoT 场景同时存在两套 mapping 时优先配置层回显字段', () => {
    const value = readSingleValueField({
      chartOption: {
        _simplifiedData: {
          mappings: {
            value: 'humidity',
          },
        },
      },
      fieldOptions: ['temperature', 'humidity'],
      iotDeviceConfig: {
        mapping: {
          valueField: 'temperature',
          yFields: ['temperature'],
        },
      },
      requestDataType: RequestDataTypeEnum.IoTDevice,
    });

    expect(value).toBe('temperature');
  });

  it('IoT 场景当 requestIoTDeviceConfig.mapping 为空时，fallback 到桥接层 mappings（旧模板兼容）', () => {
    const value = readSingleValueField({
      chartOption: {
        _simplifiedData: {
          mappings: {
            value: 'humidity',
          },
        },
      },
      fieldOptions: ['temperature', 'humidity'],
      iotDeviceConfig: {},
      requestDataType: RequestDataTypeEnum.IoTDevice,
    });

    expect(value).toBe('humidity');
  });

  it('IoT 场景优先从 requestIoTDeviceConfig.mapping 回显字段', () => {
    const value = readSingleValueField({
      chartOption: {
        _simplifiedData: {
          mappings: {
            value: 'humidity',
          },
        },
      },
      fieldOptions: ['temperature', 'humidity'],
      iotDeviceConfig: {
        mapping: {
          valueField: 'temperature',
          yFields: ['temperature'],
        },
      },
      requestDataType: RequestDataTypeEnum.IoTDevice,
    });

    expect(value).toBe('temperature');
  });

  it('非 IoT 场景优先从 _simplifiedData.mappings.value 回显字段', () => {
    const value = readSingleValueField({
      chartOption: {
        _simplifiedData: {
          mappings: {
            value: 'humidity',
          },
        },
      },
      fieldOptions: ['temperature', 'humidity'],
      requestDataType: RequestDataTypeEnum.AJAX,
    });

    expect(value).toBe('humidity');
  });

  it('IoT 场景只写配置层，不强制同步桥接层', () => {
    const iotDeviceConfig: any = {};
    const chartOption: any = {
      _simplifiedData: {
        mappings: {
          value: 'legacyValue',
          y: 'legacyValue',
        },
      },
    };

    writeSingleValueField({
      chartOption,
      iotDeviceConfig,
      requestDataType: RequestDataTypeEnum.IoTDevice,
      value: 'temperature',
    });

    expect(iotDeviceConfig.mapping).toEqual({
      mappingMode: 'singleValue',
      valueField: 'temperature',
      yFields: ['temperature'],
    });
    expect(chartOption._simplifiedData.mappings).toEqual({
      value: 'legacyValue',
      y: 'legacyValue',
    });
  });

  it('IoT 场景写入 requestIoTDeviceConfig.mapping', () => {
    const iotDeviceConfig: any = {};
    const chartOption: any = {};

    writeSingleValueField({
      chartOption,
      iotDeviceConfig,
      requestDataType: RequestDataTypeEnum.IoTDevice,
      value: 'temperature',
    });

    expect(iotDeviceConfig.mapping).toEqual({
      mappingMode: 'singleValue',
      valueField: 'temperature',
      yFields: ['temperature'],
    });
    expect(chartOption._simplifiedData).toBeUndefined();
  });

  it('非 IoT 场景写入 _simplifiedData.mappings.value 与 y', () => {
    const chartOption: any = {};

    writeSingleValueField({
      chartOption,
      requestDataType: RequestDataTypeEnum.AJAX,
      value: 'humidity',
    });

    expect(chartOption._simplifiedData.mappings).toEqual({
      value: 'humidity',
      y: 'humidity',
    });
  });
});
