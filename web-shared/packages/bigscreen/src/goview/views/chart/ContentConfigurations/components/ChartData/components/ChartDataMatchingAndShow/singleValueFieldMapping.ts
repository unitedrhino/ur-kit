import { RequestDataTypeEnum } from '@/enums/httpEnum';

type ReadParams = {
  chartOption: any;
  fieldOptions: string[];
  iotDeviceConfig?: any;
  requestDataType?: number;
};

type WriteParams = {
  chartOption: any;
  iotDeviceConfig?: any;
  requestDataType?: number;
  value: string;
};

export function readSingleValueField({
  chartOption,
  fieldOptions,
  iotDeviceConfig,
  requestDataType,
}: ReadParams): string {
  if (requestDataType === RequestDataTypeEnum.IoTDevice) {
    const mapping = iotDeviceConfig?.mapping;
    const primary = mapping?.valueField || (Array.isArray(mapping?.yFields) ? mapping.yFields[0] : '');
    if (primary) return primary;

    // fallback: 旧模板可能只有桥接层 mappings（只读兼容，不再主写）
    const bridgeMappings = chartOption?._simplifiedData?.mappings;
    const fallback =
      bridgeMappings?.value ||
      (Array.isArray(bridgeMappings?.y) ? bridgeMappings.y[0] : bridgeMappings?.y) ||
      '';
    if (fallback) return fallback;

    return fieldOptions[0] || '';
  }

  const mappings = chartOption?._simplifiedData?.mappings;
  return mappings?.value || fieldOptions[0] || '';
}

export function writeSingleValueField({
  chartOption,
  iotDeviceConfig,
  requestDataType,
  value,
}: WriteParams): void {
  if (requestDataType === RequestDataTypeEnum.IoTDevice && iotDeviceConfig) {
    iotDeviceConfig.mapping = {
      mappingMode: 'singleValue',
      valueField: value || '',
      yFields: value ? [value] : [],
    };
    return;
  }

  if (!chartOption._simplifiedData) {
    chartOption._simplifiedData = {};
  }
  if (!chartOption._simplifiedData.mappings) {
    chartOption._simplifiedData.mappings = {};
  }
  chartOption._simplifiedData.mappings.value = value || '';
  chartOption._simplifiedData.mappings.y = value || '';
}
