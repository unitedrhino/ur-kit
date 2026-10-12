/** 将真实 IoT 数据和当前质量元数据转换为图表配置，保证首帧与后续更新一致。 */
import type { GlobalThemeJsonType } from '@/settings/chartThemes';
import type { RequestIoTDeviceConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import type { IoTMetadata, StandardIoTDataset } from './types';

import { getAdapter } from './index';

const toMeta = (dataset: { _iotMeta?: IoTMetadata }, chartKey: string, mapping?: RequestIoTDeviceConfigType['mapping']): StandardIoTDataset['meta'] => ({
  chartKey,
  dataView: dataset._iotMeta?.dataView ?? 'prop',
  mode: dataset._iotMeta?.mode ?? 'latest',
  outputView: dataset._iotMeta?.outputView,
  dataUnits: dataset._iotMeta?.dataUnits,
  timeAxisLabelFormat: dataset._iotMeta?.timeAxisLabelFormat,
  mappings:
    mapping?.mappingMode === 'xy' && mapping.xField
      ? {
          x: mapping.xField,
          y: mapping.yFields ?? [],
        }
      : mapping?.mappingMode === 'nameValue' && mapping.nameField
        ? {
            itemName: mapping.nameField,
            value: mapping.valueField,
          }
        : mapping?.mappingMode === 'singleValue'
          ? {
              value: mapping.valueField,
              y: mapping.yFields ?? [],
            }
          : undefined,
  extra: {
    ...(dataset._iotMeta?.dimensionLabels ? { dimensionLabels: dataset._iotMeta.dimensionLabels } : {}),
    ...(dataset._iotMeta?._accumulated !== undefined ? { accumulated: dataset._iotMeta._accumulated } : {}),
  },
});

export type ApplyIoTDatasetParams = {
  adapterType?: string;
  chartKey: string;
  currentOption: GlobalThemeJsonType & {
    _simplifiedData?: Record<string, any>;
    xAxis?: any;
    yAxis?: any;
  };
  dataset: {
    _iotMeta?: IoTMetadata;
    dimensions?: string[];
    source?: Record<string, any>[];
  };
  mapping?: RequestIoTDeviceConfigType['mapping'];
};

export type ApplyIoTDatasetResult = {
  nextOption: ApplyIoTDatasetParams['currentOption'];
  standardDataset: StandardIoTDataset;
};

export function applyIoTDatasetToComponent({
  adapterType,
  chartKey,
  currentOption,
  dataset,
  mapping,
}: ApplyIoTDatasetParams): ApplyIoTDatasetResult {
  const rows = Array.isArray(dataset?.source) ? dataset.source : [];
  const adapter = getAdapter(chartKey, adapterType);
  // 首次绑定尚无旧元数据，必须以本次响应识别时序列和空桶。
  // 空结果也必须覆盖旧 dataset/series，防止继续显示上一个窗口的 GOOD 数据。
  const optionPatch = rows.length === 0
    ? { dataset: { dimensions: dataset.dimensions ?? [], source: [] }, series: [] }
    : adapter.toOption(rows, {
        ...currentOption,
        _simplifiedData: { ...currentOption._simplifiedData, _iotMeta: dataset._iotMeta },
      } as any);
  const meta = toMeta(dataset, chartKey, mapping);

  const nextOption = {
    ...currentOption,
    _simplifiedData: {
      ...(currentOption._simplifiedData ?? {}),
      _iotMeta: dataset._iotMeta,
      chartKey,
      // mappings 真源为 requestIoTDeviceConfig.mapping，不再桥接写入 _simplifiedData
    },
  } as ApplyIoTDatasetParams['currentOption'];

  if (optionPatch.series) {
    nextOption.series = optionPatch.series as any;
  }

  if (optionPatch.xAxis && nextOption.xAxis) {
    nextOption.xAxis = {
      ...nextOption.xAxis,
      ...optionPatch.xAxis,
    };
  }

  if (optionPatch.yAxis && nextOption.yAxis) {
    nextOption.yAxis = {
      ...nextOption.yAxis,
      ...optionPatch.yAxis,
    };
  }

  if (optionPatch.dataset) {
    nextOption.dataset = {
      ...(optionPatch.dataset as any),
      ...(dataset?._iotMeta ? { _iotMeta: dataset._iotMeta } : {}),
    } as any;
  }

  return {
    nextOption,
    standardDataset: {
      dataset:
        optionPatch.dataset && typeof optionPatch.dataset === 'object'
          ? ({
              dimensions: (optionPatch.dataset as any).dimensions ?? dataset.dimensions ?? [],
              source: (optionPatch.dataset as any).source ?? rows,
            } as any)
          : ({
              dimensions: dataset.dimensions ?? [],
              source: rows,
            } as any),
      meta,
    },
  };
}
