/** 验证真实请求早于图表挂载时的数据保留、历史轮询与卸载释放。 */
import { afterEach, expect, it, vi } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';

vi.mock('@/api/dataset', () => ({ previewDataset: vi.fn() }));
vi.mock('@/api/http', () => ({ customizeHttp: vi.fn() }));
vi.mock('@/api/thingsDevice', () => ({ getDeviceList: vi.fn(), getPropertyLogBatch: vi.fn() }));
vi.mock('@/hooks/', () => ({ useChartDataPondFetch: () => ({ addGlobalDataInterface: vi.fn() }) }));
vi.mock('@/packages/public/chart', () => ({ setOption: vi.fn() }));
vi.mock('@/realtime/projectRealtime', () => ({ registerRealtimeInterest: vi.fn() }));
vi.mock('@/store/modules/chartEditStore/chartEditStore', () => ({ useChartEditStore: vi.fn() }));
vi.mock('@/utils', () => ({ intervalUnitHandle: (n: number) => n * 1000, isPreview: () => false }));
vi.mock('@/utils/sandboxExecute', () => ({ sandboxExecute: vi.fn() }));
vi.mock('@app/shared/dynamic-js-policy', () => ({ canExecuteDynamicJs: () => false }));
vi.mock('@/views/chart/ContentConfigurations/components/ChartData/components/ChartDataIoTDevice/queryTypeSupport', () => ({ isSingleValueChart: () => false }));
vi.mock('@/views/chart/ContentConfigurations/utils/isCustomComponent', () => ({ isCustomComponent: () => false }));
vi.mock('@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters/iotDatasetBuilder', () => ({ buildIoTDataset: vi.fn(), applyRealtimePropToDataset: vi.fn() }));

import { buildIoTDataset } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters/iotDatasetBuilder';
import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { useChartDataFetch } from '../useChartDataFetch.hook';

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it('首个响应早于图表挂载仍绘制真实零值和缺口，历史轮询不被其他数据源清除', async () => {
  vi.useFakeTimers();
  /** 模拟接口返回的已过滤历史桶，保留真实零值与无效桶。 */
  const dataset = { dimensions: ['time', 'P'], source: [{ time: '2026-09-16 10:00', P: 0 }, { time: '2026-09-16 11:00', P: null }], _iotMeta: { dataView: 'prop', mode: 'log' } };
  vi.mocked(buildIoTDataset).mockResolvedValue(dataset);
  /** 从空图表配置开始，避免旧元数据掩盖首帧问题。 */
  const target = reactive({
    chartConfig: { chartFrame: 'echarts', chartKey: 'VLineCommon' },
    option: { dataset: { source: [] }, series: [{ type: 'line' }], xAxis: {}, yAxis: {} },
    request: { requestDataType: RequestDataTypeEnum.IoTDevice, requestInterval: 2, requestIntervalUnit: 'second', requestIoTDeviceConfig: { productID: 'p', deviceNames: ['d'], dataIDs: ['P'], mode: 'log', queryType: 'property' } },
  });
  const scope = effectScope();
  try {
    const store = () => ({ getIsComponentMode: false, getRequestGlobalConfig: reactive({}) });
    const result = scope.run(() => useChartDataFetch(target as any, store as any))!;
    await vi.advanceTimersByTimeAsync(0);
    /** 晚于 HTTP 响应挂载的图表实例。 */
    const nativeChart = { setOption: vi.fn() };
    // vue-echarts 8 的自动模式封装 setOption 不执行，真实实例通过 chart 暴露。
    const chart = { setOption: vi.fn(), chart: nativeChart };
    result.vChartRef.value = chart as any;
    await nextTick();
    expect(nativeChart.setOption).toHaveBeenCalled();
    expect(chart.setOption).not.toHaveBeenCalled();
    const rendered = nativeChart.setOption.mock.calls.at(-1)![0];
    expect(rendered.dataset.source.map((row: any) => row.P)).toEqual([0, null]);
    expect(rendered.series[0]).toMatchObject({ connectNulls: false, encode: { x: 'timeLabel', y: 'P' } });
    await vi.advanceTimersByTimeAsync(2000);
    expect(buildIoTDataset).toHaveBeenCalledTimes(2);
  } finally {
    scope.stop();
  }
  await vi.advanceTimersByTimeAsync(4000);
  expect(buildIoTDataset).toHaveBeenCalledTimes(2);
});
