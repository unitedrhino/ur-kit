/** 属性质量与时间的公共展示规则，保留缺失值并避免异常数据参与数值计算。 */

/** 属性记录携带的质量与平台接收元数据；旧版本缺少质量时按良好兼容。 */
export interface PropertyQualityMetadata {
  /** 对外质量名称，未知名称不按良好处理。 */
  quality?: string | null;
  /** 数据时间，零表示从未上报。 */
  timestamp?: number | string | null;
  /** 平台接收毫秒时间，历史未知为 0；兼容旧版字符串与空值。 */
  receivedTime?: number | string | null;
  /** 原始属性值，允许异常采集为空。 */
  value?: unknown;
}

/** propertyQualityLabel 返回质量文字；未上报占位不显示为良好。 */
export function propertyQualityLabel(record?: PropertyQualityMetadata | null): string {
  if (!record || record.timestamp === 0 || record.timestamp === '0') return '未上报';
  switch (record.quality) {
    case undefined:
    case 'GOOD': return '良好';
    case 'UNCERTAIN': return '不确定';
    case 'BAD': return '异常';
    default: return '未知';
  }
}

/** propertyQualityTone 返回现有标签组件支持的语义颜色。 */
export function propertyQualityTone(record?: PropertyQualityMetadata | null): 'default' | 'error' | 'success' | 'warning' {
  const label = propertyQualityLabel(record);
  if (label === '良好') return 'success';
  if (label === '异常') return 'error';
  if (label === '不确定' || label === '未知') return 'warning';
  return 'default';
}

/** formatPropertyTime 格式化毫秒时间，未知接收时间不补当前时间或显示 1970 年。 */
export function formatPropertyTime(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleString()}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

/** nullablePropertyNumber 转换有效数值，空值、布尔值及非数值字符串不会隐式补零。 */
export function nullablePropertyNumber(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** goodPropertyNumber 仅提取真实良好记录的数值，非良好记录保留为曲线缺口。 */
export function goodPropertyNumber(record?: PropertyQualityMetadata | null): number | null {
  return propertyQualityLabel(record) === '良好' ? nullablePropertyNumber(record?.value) : null;
}

/** sumPropertyNumbers 汇总已有的有效数值；完全没有有效样本时保持空值。 */
export function sumPropertyNumbers(values: unknown[]): number | null {
  const numbers = values.map(nullablePropertyNumber).filter((value): value is number => value !== null);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) : null;
}
