import { describe, expect, it } from 'vitest';

import { applyIoTDatasetToComponent } from '../applyIoTDatasetToComponent';
import { barAdapter } from '../barAdapter';
import { defaultAdapter } from '../defaultAdapter';
import { lineAdapter } from '../lineAdapter';

describe('applyIoTDatasetToComponent', () => {
  it('将 IoT dataset 统一写回 option 与 _simplifiedData', () => {
    const currentOption = {
      _simplifiedData: {
        adapterType: 'VBarCommon',
      },
      dataset: {
        dimensions: [],
        source: [],
      },
      series: [],
      xAxis: {
        type: 'category',
      },
      yAxis: {
        type: 'value',
      },
    } as any;

    const dataset = {
      _iotMeta: {
                dataUnits: {
          总有功功率: 'kW',
        },
        dataView: 'prop',
        mode: 'latest',
      },
      dimensions: ['name', '总有功功率'],
      source: [
        {
          name: 'D-001',
          总有功功率: 214.57,
        },
      ],
    } as any;

    const { nextOption, standardDataset } = applyIoTDatasetToComponent({
      adapterType: 'VBarCommon',
      chartKey: 'VBarCommon',
      currentOption,
      dataset,
      mapping: {
        mappingMode: 'xy',
        xField: 'name',
        yFields: ['总有功功率'],
      } as any,
    });

    expect(standardDataset.meta).toEqual({
      chartKey: 'VBarCommon',
      dataUnits: {
        总有功功率: 'kW',
      },
      dataView: 'prop',
      extra: {},
      mappings: {
        x: 'name',
        y: ['总有功功率'],
      },
      mode: 'latest',
      outputView: undefined,
      timeAxisLabelFormat: undefined,
    });

    expect(nextOption._simplifiedData).toMatchObject({
      _iotMeta: dataset._iotMeta,
      chartKey: 'VBarCommon',
    });
    // mappings 真源为 requestIoTDeviceConfig.mapping，不应再桥接写入 _simplifiedData（上方 toMatchObject 已断言 _simplifiedData 存在）
    expect(nextOption._simplifiedData?.mappings).toBeUndefined();

    expect((nextOption.dataset as any)._iotMeta).toEqual(dataset._iotMeta);
    expect((nextOption.dataset as any).dimensions).toEqual(['name', '总有功功率']);
    expect((nextOption.dataset as any).source).toEqual([
      {
        name: 'D-001',
        总有功功率: 214.57,
      },
    ]);
    expect(nextOption.series).toBeTruthy();
  });

  it('nameValue 映射应写入 itemName/value，并保留已有坐标轴属性', () => {
    const currentOption = {
      _simplifiedData: {
        adapterType: 'VPieCommon',
      },
      dataset: {
        dimensions: [],
        source: [],
      },
      series: [],
      xAxis: {
        axisLabel: {
          color: '#fff',
        },
        name: '原始X轴',
        type: 'category',
      },
      yAxis: {
        axisLabel: {
          color: '#0f0',
        },
        name: '原始Y轴',
        type: 'value',
      },
    } as any;

    const dataset = {
      _iotMeta: {
                dataView: 'deviceInfo',
        mode: 'latest',
        outputView: 'fields',
      },
      dimensions: ['name', 'value'],
      source: [
        { name: '在线设备数', value: 12 },
        { name: '离线设备数', value: 3 },
      ],
    } as any;

    const { nextOption, standardDataset } = applyIoTDatasetToComponent({
      adapterType: 'VPieCommon',
      chartKey: 'VPieCommon',
      currentOption,
      dataset,
      mapping: {
        mappingMode: 'nameValue',
        nameField: 'name',
        valueField: 'value',
      } as any,
    });

    expect(standardDataset.meta.mappings).toEqual({
      itemName: 'name',
      value: 'value',
    });

    expect(nextOption._simplifiedData).toMatchObject({
      _iotMeta: dataset._iotMeta,
      chartKey: 'VPieCommon',
    });
    // mappings 真源为 requestIoTDeviceConfig.mapping，不应再桥接写入 _simplifiedData（上方 toMatchObject 已断言 _simplifiedData 存在）
    expect(nextOption._simplifiedData?.mappings).toBeUndefined();

    expect(nextOption.xAxis).toEqual({
      axisLabel: {
        color: '#fff',
      },
      name: '原始X轴',
      type: 'category',
    });

    expect(nextOption.yAxis).toEqual({
      axisLabel: {
        color: '#0f0',
      },
      name: '原始Y轴',
      type: 'value',
    });

    expect((nextOption.dataset as any)._iotMeta).toEqual(dataset._iotMeta);
    expect(nextOption.series).toBeTruthy();
  });

  it('singleValue 映射应桥接为 value 与 y，供运行态兼容消费', () => {
    const currentOption = {
      _simplifiedData: {
        adapterType: 'TextCommon',
      },
      dataset: 0,
      series: [],
      xAxis: {
        type: 'category',
      },
      yAxis: {
        type: 'value',
      },
    } as any;

    const dataset = {
      _iotMeta: {
                dataView: 'deviceStatus',
        mode: 'latest',
        outputView: 'fields',
      },
      dimensions: ['name', 'value'],
      source: [
        { name: '在线设备数', value: 12 },
      ],
    } as any;

    const { nextOption, standardDataset } = applyIoTDatasetToComponent({
      adapterType: 'TextCommon',
      chartKey: 'TextCommon',
      currentOption,
      dataset,
      mapping: {
        mappingMode: 'singleValue',
        valueField: 'value',
        yFields: ['value'],
      } as any,
    });

    expect(standardDataset.meta.mappings).toEqual({
      value: 'value',
      y: ['value'],
    });

    expect(nextOption._simplifiedData).toMatchObject({
      _iotMeta: dataset._iotMeta,
      chartKey: 'TextCommon',
    });
    // mappings 真源为 requestIoTDeviceConfig.mapping，不应再桥接写入 _simplifiedData（上方 toMatchObject 已断言 _simplifiedData 存在）
    expect(nextOption._simplifiedData?.mappings).toBeUndefined();
  });
});

/** 查询窗口变成无有效样本时，旧图表数据必须清空。 */
it('空历史响应清空旧 GOOD 曲线与系列', () => {
  const { nextOption } = applyIoTDatasetToComponent({
    chartKey: 'VLineCommon',
    currentOption: { dataset: { dimensions: ['time', 'P'], source: [{ time: '2026-09-16', P: 15 }] }, series: [{ type: 'line', data: [15] }], xAxis: {}, yAxis: {} } as any,
    dataset: { dimensions: ['time'], source: [], _iotMeta: { dataView: 'prop', mode: 'log' } } as any,
  });
  expect((nextOption.dataset as any).source).toEqual([]);
  expect(nextOption.series).toEqual([]);
});
