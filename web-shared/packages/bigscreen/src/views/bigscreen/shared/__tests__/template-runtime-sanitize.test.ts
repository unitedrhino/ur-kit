import { describe, expect, it } from 'vitest';

import { sanitizeTemplateRuntimeForScreen } from '../template-runtime-sanitize';

describe('sanitizeTemplateRuntimeForScreen', () => {
  it('removes iot runtime dataset snapshots but keeps request config and field selection', () => {
    const source = [
      {
        option: {
          _simplifiedData: {
            _iotMeta: { dataView: 'deviceStatus', mode: 'latest' },
            columns: [{ key: 'value', title: 'value' }],
            mappings: { value: 'systemUptimeDays' },
            rows: [{ value: 12 }],
          },
          _lastDynamicDataset: { source: [{ value: 12 }], _iotMeta: { dataView: 'deviceStatus', mode: 'latest' } },
          dataset: { source: [{ value: 12 }] },
        },
        request: {
          requestDataType: 5,
          requestIoTDeviceConfig: {
            queryType: 'deviceStatus',
            selectedFields: ['systemUptimeDays', 'systemStartTime'],
          },
        },
      },
    ];

    const [result] = sanitizeTemplateRuntimeForScreen(source);

    expect(result.request.requestIoTDeviceConfig.selectedFields).toEqual(['systemUptimeDays', 'systemStartTime']);
    expect(result.option.dataset).toBeUndefined();
    expect(result.option._lastDynamicDataset).toBeUndefined();
    expect(result.option._simplifiedData._iotMeta).toBeUndefined();
    expect(result.option._simplifiedData.rows).toBeUndefined();
    expect(result.option._simplifiedData.columns).toBeUndefined();
    expect(result.option._simplifiedData.mappings).toEqual({ value: 'systemUptimeDays' });
  });

  it('sanitizes nested iot children inside group components', () => {
    const source = [
      {
        groupList: [
          {
            option: {
              _simplifiedData: {
                _iotMeta: { dataView: 'deviceStatus', mode: 'latest' },
                rows: [{ value: 8 }],
              },
              dataset: { source: [{ value: 8 }] },
            },
            request: {
              requestDataType: 5,
              requestIoTDeviceConfig: {
                selectedFields: ['onlineCount'],
              },
            },
          },
        ],
        option: {},
        request: {
          requestDataType: 0,
        },
      },
    ];

    const [result] = sanitizeTemplateRuntimeForScreen(source);
    const child = result.groupList[0];

    expect(child.option.dataset).toBeUndefined();
    expect(child.option._simplifiedData._iotMeta).toBeUndefined();
    expect(child.option._simplifiedData.rows).toBeUndefined();
    expect(child.request.requestIoTDeviceConfig.selectedFields).toEqual(['onlineCount']);
  });

  it('does not modify non-iot static dataset components', () => {
    const source = [
      {
        option: {
          dataset: { source: [{ name: 'A', value: 1 }] },
        },
        request: {
          requestDataType: 0,
        },
      },
    ];

    const [result] = sanitizeTemplateRuntimeForScreen(source);

    expect(result.option.dataset).toEqual({ source: [{ name: 'A', value: 1 }] });
  });

  it('sanitizes ajax runtime dataset snapshots for dynamic text components', () => {
    const source = [
      {
        option: {
          _simplifiedData: {
            rows: [{ value: 99 }],
          },
          dataset: '99',
        },
        request: {
          requestDataType: 1,
        },
      },
    ];

    const [result] = sanitizeTemplateRuntimeForScreen(source);

    expect(result.option.dataset).toBeUndefined();
    expect(result.option._simplifiedData.rows).toBeUndefined();
  });

  it('sanitizes dataset service runtime snapshots but keeps dataset binding config', () => {
    const source = [
      {
        option: {
          _simplifiedData: {
            columns: [{ key: 'x', title: 'X' }],
            mappings: { x: 'time', y: ['value'] },
            rows: [{ time: '2026-05-12T00:00:00', value: 10 }],
          },
          dataset: { dimensions: ['time', 'value'], source: [{ time: '2026-05-12T00:00:00', value: 10 }] },
        },
        request: {
          requestDataType: 4,
          requestDatasetId: 123,
        },
      },
    ];

    const [result] = sanitizeTemplateRuntimeForScreen(source);

    expect(result.request.requestDatasetId).toBe(123);
    expect(result.option.dataset).toBeUndefined();
    expect(result.option._simplifiedData.rows).toBeUndefined();
    expect(result.option._simplifiedData.columns).toBeUndefined();
    expect(result.option._simplifiedData.mappings).toEqual({ x: 'time', y: ['value'] });
  });
});
