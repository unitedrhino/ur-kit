/** 大屏数据源请求与实时更新；保留挂载前响应，并分别管理历史和数据集轮询。 */
/* eslint-disable @typescript-eslint/no-unused-vars, no-console, no-new-func, unicorn/no-useless-switch-case */

import type { CreateComponentType } from '@/packages/index.type';

import type VChart from 'vue-echarts';

import { onScopeDispose, ref, toRaw, toRefs, watch, type Ref } from 'vue';

import { previewDataset } from '@/api/dataset';
import { customizeHttp } from '@/api/http';
import { getDeviceList, getPropertyLogBatch } from '@/api/thingsDevice';
import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { useChartDataPondFetch } from '@/hooks/';
import { ChartFrameEnum } from '@/packages/index.type';
import { setOption } from '@/packages/public/chart';
import { registerRealtimeInterest } from '@/realtime/projectRealtime';
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore';
import { intervalUnitHandle, isPreview } from '@/utils';
import { sandboxExecute } from '@/utils/sandboxExecute';
import { isSingleValueChart } from '@/views/chart/ContentConfigurations/components/ChartData/components/ChartDataIoTDevice/queryTypeSupport';
import { getAdapter } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters';
import { applyIoTDatasetToComponent } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters/applyIoTDatasetToComponent';
import { applyRealtimePropToDataset, buildIoTDataset } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters/iotDatasetBuilder';
import { buildColumnName } from '@/views/chart/ContentConfigurations/components/SimplifiedDataPanel/adapters/iotSeriesParser';
import { isCustomComponent } from '@/views/chart/ContentConfigurations/utils/isCustomComponent';
import { canExecuteDynamicJs } from '@app/shared/dynamic-js-policy';
import { isNil } from 'lodash-es';

import { shouldRunIotAutoFetch } from './iotAutoFetchGuard';

// 获取类型
type ChartEditStoreType = typeof useChartEditStore;
const IOT_SINGLE_VALUE_SELF_RENDER_CHARTS = new Set(['VPieCircle', 'VProcess', 'VWaterPolo', 'VDial']);

/**
 * setdata 数据监听与更改
 * @param targetComponent
 * @param useChartEditStore 若直接引会报错，只能动态传递
 * @param updateCallback 自定义更新函数
 */
export const useChartDataFetch = (
  targetComponent: CreateComponentType,
  useChartEditStore: ChartEditStoreType,
  updateCallback?: (...args: any) => any,
): { vChartRef: Ref<null | typeof VChart> } => {
  // 显式返回类型注解：避免 TS 推断展开 vue-echarts 内部类型导致 TS4023 无法命名
  const vChartRef = ref<null | typeof VChart>(null);
  let fetchInterval: any = 0;
  /** 数据集轮询独立管理，避免初始化时清掉设备历史轮询。 */
  let pondFetchInterval: ReturnType<typeof setInterval> | undefined;
  /** 图表异步挂载期间只保留最近的数据响应，挂载后补绘。 */
  let pendingEchartsDataset: any;
  let fetchGeneration = 0; // 防止过期 API 响应覆盖新数据
  // WS 实时推送兴趣注销函数（IoTDevice latest/deviceStatus 模式注册）
  let unregisterRealtime: (() => void) | null = null;

  // 组件模式模拟数据预览：跳过真实请求
  const isComponentMockPreview = () => {
    const store = useChartEditStore();
    return store.getIsComponentMode && (store.getComponentMockPreview ?? true);
  };

  // 数据池
  const { addGlobalDataInterface } = useChartDataPondFetch();

  // 组件类型
  const { chartFrame } = targetComponent.chartConfig;

  // eCharts 组件配合 vChart 库更新方式
  const echartsUpdateHandle = (dataset: any) => {
    if (chartFrame === ChartFrameEnum.ECHARTS && !vChartRef.value) {
      pendingEchartsDataset = dataset;
      return;
    }
    if (chartFrame === ChartFrameEnum.ECHARTS && vChartRef.value) {
      // 自定义组件：API 响应经过 Adapter 转换
      // 自定义组件 或 IoT 数据：经过 Adapter 转换
      if (isCustomComponent(targetComponent) || !!dataset?._iotMeta) {
        const rows = Array.isArray(dataset) ? dataset : (dataset?.source ?? []);
        const hasIoTMeta = !!dataset?._iotMeta;

        if (hasIoTMeta) {
          const { nextOption } = applyIoTDatasetToComponent({
            adapterType: targetComponent.option._simplifiedData?.adapterType,
            chartKey: targetComponent.chartConfig.chartKey,
            currentOption: targetComponent.option as any,
            dataset,
            mapping: (targetComponent.request?.requestIoTDeviceConfig as any)?.mapping,
          });
          targetComponent.option = nextOption as any;

          const shouldSkipIoTAdapterSeriesOverride = IOT_SINGLE_VALUE_SELF_RENDER_CHARTS.has(targetComponent.chartConfig.chartKey);
          if (vChartRef.value && !shouldSkipIoTAdapterSeriesOverride) {
            const immediateOption: any = { dataset: targetComponent.option.dataset };
            if (targetComponent.option.series) immediateOption.series = targetComponent.option.series;
            if (targetComponent.option.xAxis) immediateOption.xAxis = targetComponent.option.xAxis;
            if (targetComponent.option.yAxis) immediateOption.yAxis = targetComponent.option.yAxis;
            // vue-echarts 8 自动模式不接受组件 setOption；更新其暴露的真实实例。
            const chart = (vChartRef.value as any).chart ?? vChartRef.value;
            chart.setOption(immediateOption, {
              lazyUpdate: false,
              replaceMerge: targetComponent.option.series ? ['series'] : undefined,
            });
          }
        } else {
          const adapter = getAdapter(targetComponent.chartConfig.chartKey, targetComponent.option._simplifiedData?.adapterType);
          const newOption = adapter.toOption(rows, targetComponent.option);
          setOption(vChartRef.value, newOption, false);
        }

        // 冗余双写
        if (targetComponent.option._simplifiedData) {
          targetComponent.option._simplifiedData.rows = [...rows];
          // 从 dataset.dimensions 推导 columns，供 SmartMapping 使用
          if (dataset?.dimensions) {
            targetComponent.option._simplifiedData.columns = dataset.dimensions.map((dim: string) => ({
              key: dim,
              title: dim,
              type: dim === 'time' ? 'date' : 'number',
            }));
          }
        }
      } else {
        // 基础组件：检测同值 Y 轴并修复范围
        const optionPayload: any = { dataset };
        try {
          const dims = dataset?.dimensions;
          if (dataset?.source && Array.isArray(dataset.source) && dataset.source.length >= 2 && Array.isArray(dims) && dims.length >= 2) {
            // 收集所有值维度的数据
            const allValues: number[] = [];
            for (let d = 1; d < dims.length; d++) {
              dataset.source.forEach((r: any) => {
                const v = Number(r[dims[d]]);
                if (!Number.isNaN(v)) allValues.push(v);
              });
            }
            const allSame = allValues.length >= 2 && allValues.every((v: number) => v === allValues[0]);
            if (allSame) {
              const val = allValues[0];
              // allSame 判断已确保 allValues.length>=2，val 必然存在；此处仅做类型收窄
              if (val !== undefined) {
                const pad = val === 0 ? 10 : Math.abs(val) * 0.2;
                optionPayload.yAxis = { min: val - pad, max: val + pad };
              }
            } else {
              // 非全同值：重置 yAxis 为自动计算
              optionPayload.yAxis = { min: null, max: null };
            }
          }
        } catch {
          /* ignore */
        }
        setOption(vChartRef.value, optionPayload, false);
      }
    }
  };

  // 图表组件可以晚于请求完成挂载，不能丢掉首次真实数据。
  watch(vChartRef, (chart) => {
    if (chart && pendingEchartsDataset !== undefined) {
      const dataset = pendingEchartsDataset;
      pendingEchartsDataset = undefined;
      echartsUpdateHandle(dataset);
    }
  });

  const requestIntervalFn = () => {
    const chartEditStore = useChartEditStore();

    // 组件编辑模式 + 模拟预览：跳过真实请求
    if (isComponentMockPreview()) return;

    // 全局数据
    const { requestOriginUrl, requestIntervalUnit: globalUnit, requestInterval: globalRequestInterval } = toRefs(chartEditStore.getRequestGlobalConfig ?? {});

    // 目标组件
    const { requestDataType, requestUrl, requestIntervalUnit: targetUnit, requestInterval: targetInterval } = toRefs(targetComponent.request ?? {});

    // 非请求类型
    if (requestDataType?.value !== RequestDataTypeEnum.AJAX) return;

    try {
      // 处理地址
      // @ts-ignore -- requestUrl may be undefined in some component configs
      if (requestUrl?.value) {
        // requestOriginUrl 允许为空，此时使用相对路径请求（如 /api/...）
        // 注意：当全局请求源为空时，completePath 可能是纯相对路径（如 /api/...），这在开发环境会被 Vite 代理转发

        clearInterval(fetchInterval);

        const fetchFn = async () => {
          try {
            const res = await customizeHttp(toRaw(targetComponent.request), toRaw(chartEditStore.getRequestGlobalConfig));
            if (res) {
              const filter = targetComponent.filter;
              const { data } = res;
              const filtered = await sandboxExecute(data, res, filter);
              // 自动适配 view 服务数据集格式：无过滤器时若响应包含 dataset 对象则直接使用
              let finalData = filtered;
              if (
                !filter &&
                filtered &&
                typeof filtered === 'object' &&
                filtered.dataset &&
                typeof filtered.dataset === 'object' &&
                Array.isArray(filtered.dataset.dimensions) &&
                Array.isArray(filtered.dataset.source)
              ) {
                finalData = filtered.dataset;
              }
              echartsUpdateHandle(finalData);
              // 更新回调函数
              if (updateCallback) {
                updateCallback(finalData);
              }
            }
          } catch (error) {
            console.error(error);
          }
        };

        // 普通初始化与组件交互处理监听
        watch(
          () => targetComponent.request.requestParams,
          () => {
            fetchFn();
          },
          {
            immediate: true,
            deep: true,
          },
        );

        // 定时时间
        const time = targetInterval?.value && !isNil(targetInterval.value) ? targetInterval.value : globalRequestInterval?.value;
        // 单位
        const unit = targetInterval?.value && !isNil(targetInterval.value) ? targetUnit?.value : globalUnit?.value;
        // 开启轮询
        if (time) {
          fetchInterval = setInterval(fetchFn, intervalUnitHandle(time, unit));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // IoT 设备属性数据获取
  const iotDeviceFn = () => {
    // 组件模式模拟预览：跳过 IoT 请求
    if (isComponentMockPreview()) return;

    const { requestDataType } = targetComponent.request;
    const cfg = targetComponent.request.requestIoTDeviceConfig;
    // cfg 为空时 shouldRunIotAutoFetch 必返回 false，前置空值守卫与其判定等价，仅为收窄类型
    if (!cfg || !shouldRunIotAutoFetch(requestDataType, cfg)) return;

    {
      clearInterval(fetchInterval);
      unregisterRealtime?.();
      unregisterRealtime = null;
      const currentGen = ++fetchGeneration;

      // 最近一次成功获取的数据集（实时合并以此为基线）
      let lastDataset: any = null;

      const runSharedFetch = async () => {
        try {
          const dataset = await buildIoTDataset(cfg, (targetComponent.chartConfig as any)?.chartKey ?? targetComponent.chartConfig?.key ?? '');
          if (currentGen !== fetchGeneration) return;

          lastDataset = dataset;
          echartsUpdateHandle(dataset);
          if (updateCallback) updateCallback(dataset);
        } catch (error) {
          console.error('[IoTDevice] 数据获取失败:', error);
        }
      };

      void runSharedFetch();

      // 实时推送模式（替代轮询）：
      // - property + latest（无 chartMode）：首载后订阅项目频道，WS 增量合并，不再 setInterval
      // - deviceStatus：首载后由设备上下线消息防抖触发重取，不再每轮拉全量设备列表
      // 其余（log 历史/聚合、chartMode 模板模式、deviceInfo）保持原轮询逻辑
      const queryType = cfg?.queryType ?? 'property';
      const realtimeProp = queryType === 'property' && cfg?.mode === 'latest' && !cfg?.chartMode;
      const realtimeStatus = queryType === 'deviceStatus';

      if (realtimeProp || realtimeStatus) {
        if (realtimeProp) {
          unregisterRealtime = registerRealtimeInterest({
            applyProps: (msgs) => {
              if (!lastDataset) return;
              const merged = applyRealtimePropToDataset(lastDataset, cfg, msgs);
              if (!merged) return;
              lastDataset = merged;
              echartsUpdateHandle(merged);
              if (updateCallback) updateCallback(merged);
            },
            chartKey: (targetComponent.chartConfig as any)?.chartKey ?? '',
            dataIDs: cfg?.dataIDs ?? [],
            deviceNames: cfg?.deviceNames ?? (cfg?.deviceName ? [cfg.deviceName] : []),
            productID: cfg?.productID,
            refetch: runSharedFetch,
          });
        } else {
          // deviceStatus：上下线事件防抖 2s 后重取统计（事件稀疏，代价远低于周期轮询）
          let connDebounce: any = 0;
          unregisterRealtime = registerRealtimeInterest({
            applyConn: () => {
              clearTimeout(connDebounce);
              connDebounce = setTimeout(() => void runSharedFetch(), 2000);
            },
            chartKey: (targetComponent.chartConfig as any)?.chartKey ?? '',
            refetch: runSharedFetch,
          });
        }
        return;
      }

      const chartEditStore = useChartEditStore();
      const { requestIntervalUnit: globalUnit, requestInterval: globalRequestInterval } = toRefs(chartEditStore.getRequestGlobalConfig ?? {});
      const { requestIntervalUnit: targetUnit, requestInterval: targetInterval } = toRefs(targetComponent.request ?? {});
      const time = targetInterval?.value && !isNil(targetInterval.value) ? targetInterval.value : globalRequestInterval?.value;
      const unit = targetInterval?.value && !isNil(targetInterval.value) ? targetUnit?.value : globalUnit?.value;
      if (time) {
        fetchInterval = setInterval(runSharedFetch, intervalUnitHandle(time, unit));
      }
    }

  };

  // IoT 设备属性：响应式监听 requestDataType 和 IoT 配置变化，动态触发数据获取
  // 组件编辑模式模拟数据预览：跳过 IoT 请求
  // 解决：组件挂载时 requestDataType 可能还是默认值 0，用户在数据面板切换后需要自动触发
  // 只监听影响数据查询的核心字段，避免格式化配置等变化触发不必要的重新请求
  let lastIotConfigStr = '';
  watch(
    () => {
      const req = targetComponent.request;
      if (req.requestDataType !== RequestDataTypeEnum.IoTDevice) return null;
      const cfg = req.requestIoTDeviceConfig;
      // 只读取影响数据查询的核心字段，排除格式化配置等不影响数据的字段
      return {
        productID: cfg?.productID,
        productCategoryID: cfg?.productCategoryID,
        productCategoryCode: cfg?.productCategoryCode,
        queryType: cfg?.queryType,
        outputView: cfg?.outputView,
        selectedFields: cfg?.selectedFields?.join(','),
        areaIDs: cfg?.areaIDs?.join(','),
        deviceNames: cfg?.deviceNames?.join(','),
        dataIDs: cfg?.dataIDs?.join(','),
        mode: cfg?.mode,
        aggFunc: cfg?.aggFunc,
        chartMode: cfg?.chartMode,
        timeRange: cfg?.timeRange,
        intervalUnit: cfg?.intervalUnit,
        groupBy: cfg?.groupBy,
        sortBy: cfg?.sortBy,
        limit: cfg?.limit,
        logInterval: cfg?.logInterval,
        logTimeRange: cfg?.logTimeRange,
        customTimeRange: cfg?.customTimeRange?.join(','),
        mapping: cfg?.mapping ? JSON.stringify(cfg.mapping) : undefined,
        // 轮询间隔变化也需重新触发（重建 setInterval）
        requestInterval: req.requestInterval,
        requestIntervalUnit: req.requestIntervalUnit,
      };
    },
    (val) => {
      // 使用 JSON 序列化比较，避免对象引用变化导致误触发
      const currentStr = JSON.stringify(val);
      if (currentStr === lastIotConfigStr) return;
      lastIotConfigStr = currentStr;

      clearInterval(fetchInterval);
      if (val) {
        iotDeviceFn();
      } else {
        // 数据源切换离开 IoTDevice：注销实时兴趣
        unregisterRealtime?.();
        unregisterRealtime = null;
      }
    },
    { immediate: true },
  );

  // 组件卸载时分别释放历史/数据集轮询及实时订阅，避免后台继续请求。
  onScopeDispose(() => {
    clearInterval(fetchInterval);
    clearInterval(pondFetchInterval);
    pendingEchartsDataset = undefined;
    unregisterRealtime?.();
    unregisterRealtime = null;
  });

  // 组件编辑模式模拟数据预览：跳过所有真实请求，使用组件内置的静态 dataset 渲染
  if (isComponentMockPreview()) {
    // 静态数据已经存在于 option.dataset 中，无需额外请求
    return { vChartRef };
  }

  // 分发其他数据获取逻辑
  const { requestDataType } = targetComponent.request;

  switch (requestDataType) {
    case RequestDataTypeEnum.Pond: {
      // 预览模式：注册全局数据池接口
      if (isPreview()) {
        addGlobalDataInterface(targetComponent, useChartEditStore, (newData: any) => {
          echartsUpdateHandle(newData);
          if (updateCallback) updateCallback(newData);
        });
      }
      // Pond 轮询由下方 watch 统一管理（支持编辑模式动态切换）

      break;
    }
    default: {
      requestIntervalFn();
    }
  }

  // Pond 模式轮询：响应式监听 requestDataType 和 _datasetConfig 变化
  // 解决：编辑器中用户切换到动态数据后，轮询能自动启动
  let lastPondPollingKey = '';
  watch(
    () => {
      const req = targetComponent.request;
      if (req.requestDataType !== RequestDataTypeEnum.Pond) return null;
      const cfg = targetComponent.option?._datasetConfig;
      return {
        pollingEnabled: cfg?.pollingEnabled ?? false,
        selectedModel: cfg?.selectedModel ?? null,
        pollingInterval: cfg?.pollingInterval ?? 5,
        pollingUnit: cfg?.pollingUnit ?? '秒',
      };
    },
    (val) => {
      // 清理旧的轮询定时器
      clearInterval(pondFetchInterval);
      pondFetchInterval = undefined;

      if (!val || !val.pollingEnabled || !val.selectedModel) return;

      const key = JSON.stringify(val);
      if (key === lastPondPollingKey) return;
      lastPondPollingKey = key;

      const modelId = Number(val.selectedModel);
      const intervalMs = intervalUnitHandle(val.pollingInterval ?? 5, val.pollingUnit ?? '秒');

      const datasetPollFn = async () => {
        try {
          // 每次轮询时重新读取最新的 _datasetConfig（用户可能在轮询期间修改了映射字段）
          const datasetConfig = targetComponent.option?._datasetConfig;
          if (!datasetConfig?.selectedModel) return;

          const res = await previewDataset(modelId);
          let rows = (() => {
            try {
              return JSON.parse(res.data?.rows || '[]');
            } catch {
              return [];
            }
          })();
          if (!Array.isArray(rows) || rows.length === 0) return;

          // 执行 JS 过滤脚本（与编辑器中 handleExecuteAndRender 保持一致）
          const { jsFilterEnabled, jsFilterCode, selectedDimension, selectedMetrics = [] } = datasetConfig;
          if (jsFilterEnabled && jsFilterCode && canExecuteDynamicJs(jsFilterCode, 'useChartDataFetch dataset polling jsFilter')) {
            try {
              const sandbox = new Function('data', jsFilterCode);
              const result = sandbox(rows);
              if (Array.isArray(result)) rows = result;
            } catch (error) {
              console.error('[dataset polling] JS filter error:', error);
            }
          }
          if (rows.length === 0) return;

          // 单值组件判断：复用 IoT 数据映射器的统一定义
          const chartKey = targetComponent.chartConfig?.key || (targetComponent as any).chartKey || '';
          const noAxis = isSingleValueChart(chartKey) || !selectedDimension;
          if (noAxis) {
            const metric = selectedMetrics[0] || Object.keys(rows[0] || {})[0] || '';
            const rawValue = rows[0]?.[metric];
            const singleValue = chartKey === 'TextCommon' ? (rawValue ?? '') : Number(rawValue) || 0;
            targetComponent.option.dataset = singleValue;
            if (updateCallback) updateCallback(singleValue);
          } else {
            const dimensions = [selectedDimension, ...selectedMetrics].filter(Boolean) as string[];
            const source = rows.map((row: any) => {
              const r = { ...row };
              selectedMetrics.forEach((m: string) => {
                const num = Number(row[m]);
                r[m] = Number.isFinite(num) ? num : row[m];
              });
              return r;
            });
            const dataset = { dimensions, source };
            echartsUpdateHandle(dataset);
            if (updateCallback) updateCallback(dataset);
          }
        } catch (error) {
          console.error('[dataset polling]', error);
        }
      };

      pondFetchInterval = setInterval(datasetPollFn, intervalMs);
    },
    { immediate: true },
  );
  return { vChartRef };
};
