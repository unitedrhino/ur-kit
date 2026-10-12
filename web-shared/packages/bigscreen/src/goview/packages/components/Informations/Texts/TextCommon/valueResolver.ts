/** 文本指标取值：显式字段为空时保留缺口，不以其他字段替代采集失败。 */
import { resolveCandidateFields } from '@/packages/components/shared/iotMappingResolver';

type ResolverDataset = {
  dimensions?: string[];
  source?: Record<string, any>[];
};

type ExtractSingleValueOptions = {
  requestMapping?: { valueField?: string; yFields?: string[] };
  simplifiedMappings?: { value?: string; y?: string | string[] };
};

const IGNORE_KEYS = new Set(['name', 'time', 'device', 'metric', 'status', 'agg', 'key']);

/** extractSingleValueFromDataset 按配置字段读取末条样本；空数值显示缺口，静态文本仍原样返回。 */
export function extractSingleValueFromDataset(
  newData: ResolverDataset | number | string | null | undefined,
  options: ExtractSingleValueOptions,
): number | string {
  if (newData && typeof newData === 'object' && Array.isArray(newData.source)) {
    const rows = newData.source.filter((item) => item && typeof item === 'object');
    const row = rows.at(-1) ?? rows[0];
    if (!row || typeof row !== 'object') return '—';

    const candidateFields = resolveCandidateFields(options.requestMapping, options.simplifiedMappings);

    // 已指定指标时，即便为空也不能改读另一项指标。
    const selectedField = candidateFields[0];
    if (selectedField) return row[selectedField] ?? '—';

    if ('value' in row) return row.value ?? '—';

    const fallbackField = (Array.isArray(newData.dimensions) ? newData.dimensions.map(String) : Object.keys(row)).find((field) => !IGNORE_KEYS.has(field));
    if (fallbackField) return row[fallbackField] ?? '—';

    return '';
  }

  // 非法数据（对象但无 source 数组）无法展示，兜底为空文本
  return typeof newData === 'object' ? '' : newData ?? '';
}
