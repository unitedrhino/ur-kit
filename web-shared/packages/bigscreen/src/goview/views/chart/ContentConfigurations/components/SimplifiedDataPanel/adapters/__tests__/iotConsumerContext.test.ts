import { describe, expect, it } from 'vitest';

import { resolveIoTConsumerContext } from '../iotConsumerContext';

describe('iotConsumerContext', () => {
  it('IoT 场景同时存在配置层与桥接层 mapping 时优先配置层', () => {
    const currentOption = {
      _simplifiedData: {
        _iotMeta: {
                    dataView: 'prop',
          mode: 'latest',
        },
        chartKey: 'VBarCommon',
        mappings: {
          x: 'fallbackX',
          y: ['fallbackY'],
        },
      },
    } as any;

    expect(
      resolveIoTConsumerContext(currentOption, {
        requestDataType: 'iot',
        requestMapping: {
          mappingMode: 'xy',
          xField: 'name',
          yFields: ['总有功功率'],
        },
      }),
    ).toEqual({
      chartKey: 'VBarCommon',
      iotMeta: {
                dataView: 'prop',
        mode: 'latest',
      },
      mappingMode: 'xy',
      mappings: {
        x: 'name',
        y: ['总有功功率'],
      },
    });
  });

  it('从 _simplifiedData 读取 xy 映射与 IoT meta', () => {
    const currentOption = {
      _simplifiedData: {
        _iotMeta: {
                    dataUnits: {
            总有功功率: 'kW',
          },
          dataView: 'prop',
          mode: 'latest',
        },
        chartKey: 'VBarCommon',
        mappings: {
          x: 'name',
          y: ['总有功功率'],
        },
      },
    } as any;

    expect(resolveIoTConsumerContext(currentOption)).toEqual({
      chartKey: 'VBarCommon',
      iotMeta: {
                dataUnits: {
          总有功功率: 'kW',
        },
        dataView: 'prop',
        mode: 'latest',
      },
      mappingMode: 'xy',
      mappings: {
        x: 'name',
        y: ['总有功功率'],
      },
    });
  });

  it('从 _simplifiedData 读取 nameValue 映射', () => {
    const currentOption = {
      _simplifiedData: {
        _iotMeta: {
                    dataView: 'deviceInfo',
          mode: 'latest',
          outputView: 'fields',
        },
        chartKey: 'VPieCommon',
        mappings: {
          itemName: 'name',
          value: 'value',
        },
      },
    } as any;

    expect(resolveIoTConsumerContext(currentOption)).toEqual({
      chartKey: 'VPieCommon',
      iotMeta: {
                dataView: 'deviceInfo',
        mode: 'latest',
        outputView: 'fields',
      },
      mappingMode: 'nameValue',
      mappings: {
        itemName: 'name',
        value: 'value',
      },
    });
  });

  it('在缺少 IoT meta 时返回空上下文', () => {
    expect(resolveIoTConsumerContext({ _simplifiedData: {} } as any)).toEqual({
      chartKey: '',
      iotMeta: undefined,
      mappingMode: null,
      mappings: undefined,
    });
  });
});
