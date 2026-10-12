/** 文件说明：IoT 图表数据构建回归，验证语言切换只更新展示标签而不改变状态计数。 */
import { i18n } from '@vben/saas/locales';
import editorEn from '../../../../../../../../../../saas/src/locales/langs/en-US/bigscreenEditor.json';
import parkEn from '../../../../../../../../../../saas/src/locales/langs/en-US/orgPark.json';
import iotEn from '../../../../../../../../../../saas/src/locales/langs/en-US/iotApp.json';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vben/saas', () => ({
  useDictStore: () => ({
    getDictMap: () => [],
  }),
}));

vi.mock('@vben/stores', () => ({
  useProjectStore: () => ({
    currentProject: {
      createdTime: Date.UTC(2026, 0, 1),
    },
  }),
}));

vi.mock('@/api/thingsDevice', () => ({
  getDeviceInfoOne: vi.fn(),
  getDeviceList: vi.fn(),
  getPropertyLatest: vi.fn(),
  getPropertyLogAgg: vi.fn(),
  getPropertyLogBatch: vi.fn(),
  getPropertyLogBatchLatest: vi.fn(),
  getPropertyLogList: vi.fn(),
  getUserAreaTree: vi.fn(),
}));

import {
  getDeviceInfoOne,
  getDeviceList,
  getPropertyLatest,
  getPropertyLogAgg,
  getPropertyLogBatch,
} from '@/api/thingsDevice';

import { applyRealtimePropToDataset, buildIoTDataset } from '../iotDatasetBuilder';

describe('iotDatasetBuilder core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('property + latest + 单设备多属性输出宽表并标记 prop 视图', async () => {
    vi.mocked(getPropertyLatest).mockResolvedValue({
      data: {
        list: [
          { dataID: 'P', dataName: '总有功功率', value: 214.57 },
          { dataID: 'PF', dataName: '总功率因数', value: 0.99 },
        ],
      },
    } as any);

    const dataset = await buildIoTDataset(
      {
        areaIDs: [],
        dataIDNames: { P: '总有功功率', PF: '总功率因数' },
        dataIDs: ['P', 'PF'],
        deviceNames: ['D-001'],
        mode: 'latest',
        productID: '1001',
        queryType: 'property',
      } as any,
      'VBarCommon',
    );

    expect(dataset.dimensions).toEqual(['name', '总有功功率', '总功率因数']);
    expect(dataset.source).toEqual([
      {
        name: 'D-001',
        总功率因数: 0.99,
        总有功功率: 214.57,
      },
    ]);
    expect(dataset._iotMeta).toMatchObject({
            dataView: 'prop',
      mode: 'latest',
    });
  });

  it('property + latest + 多设备单属性输出设备宽表并标记 device 视图', async () => {
    vi.mocked(getPropertyLatest)
      .mockResolvedValueOnce({
        data: {
          list: [{ dataID: 'P', dataName: '总有功功率', value: 100 }],
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          list: [{ dataID: 'P', dataName: '总有功功率', value: 200 }],
        },
      } as any);

    const dataset = await buildIoTDataset(
      {
        areaIDs: [],
        dataIDNames: { P: '总有功功率' },
        dataIDs: ['P'],
        deviceNames: ['D-001', 'D-002'],
        mode: 'latest',
        productID: '1001',
        queryType: 'property',
      } as any,
      'VLineCommon',
    );

    expect(dataset.dimensions).toEqual(['device', '总有功功率']);
    expect(dataset.source).toEqual([
      { device: 'D-001', 总有功功率: 100 },
      { device: 'D-002', 总有功功率: 200 },
    ]);
    expect(dataset._iotMeta).toMatchObject({
            dataView: 'device',
      mode: 'latest',
    });
  });

  it('property + log 输出时间维度并标记 log 模式', async () => {
    vi.mocked(getPropertyLogBatch).mockResolvedValue({
      data: {
        lists: [
          [
            { dataID: 'P', dataName: '总有功功率', time: '2026-05-17T10:00:00.000Z', value: 120 },
            { dataID: 'P', dataName: '总有功功率', time: '2026-05-17T10:10:00.000Z', value: 130 },
          ],
          [
            { dataID: 'PF', dataName: '总功率因数', time: '2026-05-17T10:00:00.000Z', value: 0.95 },
            { dataID: 'PF', dataName: '总功率因数', time: '2026-05-17T10:10:00.000Z', value: 0.97 },
          ],
        ],
      },
    } as any);

    const dataset = await buildIoTDataset(
      {
        areaIDs: [],
        dataIDNames: { P: '总有功功率', PF: '总功率因数' },
        dataIDs: ['P', 'PF'],
        deviceNames: ['D-001'],
        logTimeRange: '1h',
        mode: 'log',
        productID: '1001',
        queryType: 'property',
      } as any,
      'VLineCommon',
    );

    expect(dataset.dimensions).toEqual(['time', '总有功功率', '总功率因数']);
    expect(dataset.source).toEqual([
      {
        time: '2026-05-17T10:00:00',
        总功率因数: 0.95,
        总有功功率: 120,
      },
      {
        time: '2026-05-17T10:10:00',
        总功率因数: 0.97,
        总有功功率: 130,
      },
    ]);
    expect(dataset._iotMeta).toMatchObject({
      dataView: 'prop',
      mode: 'log',
    });
  });

  it('deviceStatus 对非单值图表输出字段宽表并标记 deviceStatus 视图', async () => {
    vi.mocked(getDeviceList).mockResolvedValue({
      data: {
        list: [
          { deviceName: 'D-001', deviceStatus: '2' },
          { deviceName: 'D-002', deviceStatus: '3' },
          { deviceName: 'D-003', deviceStatus: '1' },
        ],
      },
    } as any);

    const dataset = await buildIoTDataset(
      {
        areaIDs: [],
        deviceNames: [],
        mode: 'latest',
        productID: '1001',
        queryType: 'deviceStatus',
        selectedFields: ['totalCount', 'onlineCount', 'offlineCount', 'inactiveCount'],
      } as any,
      'VBarCommon',
    );

    expect(dataset.dimensions).toEqual(['name', '总设备数', '在线设备数', '离线设备数', '未激活设备数']);
    expect(dataset.source).toEqual([
      {
        name: '状态统计',
        总设备数: 3,
        在线设备数: 1,
        离线设备数: 1,
        未激活设备数: 1,
      },
    ]);
    expect(dataset._iotMeta).toMatchObject({
      dataView: 'deviceStatus',
      mode: 'latest',
      outputView: 'fields',
    });
  });

  it('英文状态标签不改变在线、离线和未激活设备的计数', async () => {
    const previousLocale = i18n.global.locale.value;
    const previousMessages = i18n.global.getLocaleMessage('en-US');
    i18n.global.mergeLocaleMessage('en-US', { bigscreenEditor: editorEn, orgPark: parkEn, iotApp: iotEn });
    i18n.global.locale.value = 'en-US';
    try {
      vi.mocked(getDeviceList).mockResolvedValue({ data: { list: [
        { deviceName: 'D-001', deviceStatus: '2' },
        { deviceName: 'D-002', deviceStatus: 'online' },
        { deviceName: 'D-003', deviceStatus: '3' },
        { deviceName: 'D-004', deviceStatus: '1' },
      ] } } as any);
      const dataset = await buildIoTDataset({
        areaIDs: [], deviceNames: [], mode: 'latest', productID: '1001',
        queryType: 'deviceStatus', selectedFields: ['totalCount', 'onlineCount', 'offlineCount', 'inactiveCount'],
      } as any, 'VBarCommon');
      expect(dataset.source).toEqual([{
        name: editorEn.ui.statusStatistics,
        [parkEn.ui.totalDevices]: 4,
        [iotEn.project.onlineDevices]: 2,
        [editorEn.ui.offlineDevices]: 1,
        [editorEn.ui.inactiveDevices]: 1,
      }]);
      expect(dataset._iotMeta).toMatchObject({ dataView: 'deviceStatus', outputView: 'fields' });
    } finally {
      i18n.global.locale.value = previousLocale;
      i18n.global.setLocaleMessage('en-US', previousMessages);
    }
  });

  it('deviceInfo 对非单值图表输出字段宽表并标记 deviceInfo 视图', async () => {
    vi.mocked(getDeviceInfoOne).mockResolvedValue({
      data: {
        device: {
          deviceAlias: '测试设备',
          deviceName: 'D-001',
          isOnline: true,
          powerStatus: 1,
          signalStrength: 88,
        },
      },
    } as any);

    const dataset = await buildIoTDataset(
      {
        areaIDs: [],
        deviceNames: ['D-001'],
        mode: 'latest',
        productID: '1001',
        queryType: 'deviceInfo',
        selectedFields: ['isOnline', 'powerStatus', 'signalStrength'],
      } as any,
      'VBarCommon',
    );

    expect(dataset.dimensions).toEqual(['name', '在线状态（isOnline）', 'powerStatus', 'signalStrength']);
    expect(dataset.source).toEqual([
      {
        name: '测试设备',
        '在线状态（isOnline）': '离线',
        powerStatus: 1,
        signalStrength: 88,
      },
    ]);
    expect(dataset._iotMeta).toMatchObject({
      dataView: 'deviceInfo',
      mode: 'latest',
      outputView: 'fields',
    });
  });
});

/** 使用业务指定的混合质量样本验证前端原始查询兜底，避免均值和分母污染。 */
describe('属性质量数据集', () => {
  const start = Date.UTC(2026, 8, 16, 0);
  const config = {
    areaIDs: [], dataIDNames: { temperature: '温度' }, dataIDs: ['temperature'],
    deviceNames: ['task124'], productID: 'quality', queryType: 'property', mode: 'log',
    logTimeRange: 'custom', customTimeRange: [start, start + 3600000],
    logInterval: '10m', logAggregationMode: 'intraday', aggFunc: 'avg',
  };
  it.each([['avg', 15], ['sum', 30], ['min', 10], ['max', 20], ['count', 2]])('%s 只计算 GOOD，非 GOOD 单独成桶保持空缺', async (aggFunc, expected) => {
    vi.mocked(getPropertyLogBatch).mockResolvedValue({ data: { lists: [[
      { dataID: 'temperature', timestamp: start, value: '10', quality: 'GOOD' },
      { dataID: 'temperature', timestamp: start + 1000, value: '100', quality: 'UNCERTAIN' },
      { dataID: 'temperature', timestamp: start + 2000, value: '1000', quality: 'BAD' },
      { dataID: 'temperature', timestamp: start + 3000, value: '20', quality: 'GOOD' },
      { dataID: 'temperature', timestamp: start + 600000, value: null, quality: 'BAD' },
    ]] } } as any);
    const dataset = await buildIoTDataset({ ...config, aggFunc } as any, 'VLineCommon');
    const values = dataset.source.map((row: any) => Object.values(row).find((value) => typeof value !== 'string'));
    expect(values).toEqual([expected, aggFunc === 'count' ? 0 : null]);
  });
  it('原始曲线保留异常点缺口且属性按时间对齐', async () => {
    vi.mocked(getPropertyLogBatch).mockResolvedValue({ data: { lists: [[
      { dataID: 'temperature', timestamp: start, value: '0', quality: 'GOOD' },
      { dataID: 'temperature', timestamp: start + 1000, value: null, quality: 'BAD' },
      { dataID: 'humidity', timestamp: start + 1000, value: '10', quality: 'GOOD' },
    ]] } } as any);
    const dataset = await buildIoTDataset({ ...config, dataIDs: ['temperature', 'humidity'], logInterval: '0' } as any, 'VLineCommon');
    expect(dataset.source.map((row: any) => [row['温度'], row.humidity])).toEqual([[0, null], [null, 10]]);
  });
  it('实时仅质量变坏时覆盖旧值为空，不保留旧良好值', () => {
    const previous = { _iotMeta: { dataView: 'prop', mode: 'latest' }, dimensions: ['name', '温度'], source: [{ name: 'task124', 温度: 10 }] };
    const dataset = applyRealtimePropToDataset(previous, { ...config, mode: 'latest' } as any, [{ device: { productID: 'quality', deviceName: 'task124' }, identifier: 'temperature', param: 10, quality: 'BAD' }]);
    expect(dataset.source[0]['温度']).toBeNull();
    expect(previous.source[0]['温度']).toBe(10);
  });
});

/** 后端排除非 GOOD 后可能整桶缺失，图表不能跨过缺测日连接两个有效值。 */
it('后端日聚合遗漏中间桶时补 null，真实零值仍保留', async () => {
  const start = Date.UTC(2026, 8, 10);
  vi.mocked(getPropertyLogAgg).mockResolvedValue({ data: { list: [{ values: [
    { dataID: 'P', timeWindow: String(start), values: { avg: { value: '0' } } },
    { dataID: 'P', timeWindow: String(start + 2 * 86400000), values: { avg: { value: '15' } } },
  ] }] } } as any);
  const dataset = await buildIoTDataset({
    productID: 'p', deviceNames: ['d'], dataIDs: ['P'], mode: 'log', queryType: 'property',
    logTimeRange: 'custom', customTimeRange: [start, start + 3 * 86400000],
    logAggregationMode: 'day', logInterval: '1d', aggFunc: 'avg',
  } as any, 'VLineCommon');
  expect(dataset.source.map((row: any) => row.d_P)).toEqual([0, null, 15]);
  expect(dataset.source[1].time).toBe('2026-09-11T00:00:00');
});

/** 非 GOOD 样本被后端全部排除属于正常空结果，不能阻止页面清空旧数据。 */
it.each(['prop', 'device'])('日聚合 %s 视图无 GOOD 样本时正常返回空集', async (dataView) => {
  vi.mocked(getPropertyLogAgg).mockResolvedValue({ data: { list: [] } } as any);
  const start = Date.UTC(2026, 8, 10);
  const dataset = await buildIoTDataset({
    productID: 'p', deviceNames: dataView === 'device' ? ['d1', 'd2'] : ['d'], dataIDs: ['P'], mode: 'log', queryType: 'property', dataView,
    logTimeRange: 'custom', customTimeRange: [start, start + 3 * 86400000],
    logAggregationMode: 'day', logInterval: '1d', aggFunc: 'avg',
  } as any, 'VLineCommon');
  expect(dataset.source).toEqual([]);
});
