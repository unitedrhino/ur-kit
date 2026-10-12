import type { IoTMetadata } from './types';

import { resolveIoTConsumerContext } from './iotConsumerContext';
import { buildSeriesFromMappings, parseIoTMetaToSeries } from './iotSeriesParser';

export function resolveIoTAdapterSeries(
  currentOption: Record<string, any>,
  dimensions: string[],
  chartType: string,
): {
  chartKey: string;
  iotMeta?: IoTMetadata;
  series: ReturnType<typeof parseIoTMetaToSeries>['series'];
} {
  const context = resolveIoTConsumerContext(currentOption as any);
  const { iotMeta, mappings } = context;

  let series: ReturnType<typeof parseIoTMetaToSeries>['series'] = [];

  if (mappings && Object.keys(mappings).length > 0) {
    series = buildSeriesFromMappings(mappings as Record<string, string | string[]>, chartType, dimensions);
  }

  if (!series.length && iotMeta) {
    series = parseIoTMetaToSeries(dimensions, iotMeta, chartType).series;
  }

  return {
    chartKey: context.chartKey,
    iotMeta,
    series,
  };
}
