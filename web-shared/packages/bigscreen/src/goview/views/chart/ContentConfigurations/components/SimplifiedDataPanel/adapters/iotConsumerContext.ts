import type { IoTMetadata } from './types';

type RequestMapping = {
  itemName?: string;
  mappingMode?: 'nameValue' | 'singleValue' | 'xy';
  valueField?: string;
  xField?: string;
  yFields?: string[];
};

export type IoTConsumerMappings = {
  itemName?: string;
  value?: string;
  x?: string;
  y?: string[];
};

export type IoTConsumerContext = {
  chartKey: string;
  iotMeta?: IoTMetadata;
  mappingMode: 'nameValue' | 'xy' | null;
  mappings?: IoTConsumerMappings;
};

export function resolveIoTConsumerContext(
  currentOption: {
    _simplifiedData?: {
      _iotMeta?: IoTMetadata;
      chartKey?: string;
      mappings?: IoTConsumerMappings;
    };
  },
  options?: {
    requestDataType?: 'iot' | 'non-iot';
    requestMapping?: RequestMapping;
  },
): IoTConsumerContext {
  const simplifiedData = currentOption?._simplifiedData;
  const fallbackMappings = simplifiedData?.mappings;
  const requestMapping = options?.requestMapping;

  const mappings: IoTConsumerMappings | undefined =
    options?.requestDataType === 'iot' && requestMapping
      ? requestMapping.mappingMode === 'xy'
        ? {
            x: requestMapping.xField,
            y: requestMapping.yFields ?? [],
          }
        : {
            itemName: requestMapping.itemName,
            value: requestMapping.valueField,
          }
      : fallbackMappings;

  let mappingMode: 'nameValue' | 'xy' | null = null;
  if (mappings?.itemName || mappings?.value) {
    mappingMode = 'nameValue';
  } else if (mappings?.x || (Array.isArray(mappings?.y) && mappings.y.length > 0)) {
    mappingMode = 'xy';
  }

  return {
    chartKey: simplifiedData?.chartKey ?? '',
    iotMeta: simplifiedData?._iotMeta,
    mappingMode,
    mappings,
  };
}
