/**
 * IoT 单值/进度类组件的统一 mapping 解析器
 * 从 requestIoTDeviceConfig.mapping 和 _simplifiedData.mappings 中解析候选字段
 * 优先配置真源（requestMapping），桥接层（simplifiedMappings）只做 fallback
 */

export interface RequestMappingLike {
  valueField?: string;
  yFields?: string[];
}

export interface SimplifiedMappingsLike {
  value?: string;
  y?: string | string[];
}

/**
 * 按优先级返回候选字段列表
 * 顺序：requestMapping.yFields > requestMapping.valueField > simplifiedMappings.y > simplifiedMappings.value
 */
export function resolveCandidateFields(
  requestMapping?: RequestMappingLike,
  simplifiedMappings?: SimplifiedMappingsLike,
): string[] {
  return [
    ...(Array.isArray(requestMapping?.yFields) ? requestMapping.yFields : []),
    requestMapping?.valueField,
    ...(Array.isArray(simplifiedMappings?.y) ? simplifiedMappings.y : simplifiedMappings?.y ? [simplifiedMappings.y] : []),
    simplifiedMappings?.value,
  ].filter((field): field is string => Boolean(field));
}
