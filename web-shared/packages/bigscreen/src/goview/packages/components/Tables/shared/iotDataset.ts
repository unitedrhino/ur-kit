/** 文件说明：组件动态提示读取宿主语言，保留业务名称与参数。 */
import { $t as editorT } from '@vben/saas/locales';
type DatasetColumn = {
  key: string;
  title: string;
};

type ObjectDataset = {
  dimensions?: Array<DatasetColumn | string>;
  source?: Record<string, any>[];
};

type IoTDatasetMetaLike = {
  dataUnits?: Record<string, string>;
};

type IoTDatasetLike = {
  _iotMeta?: IoTDatasetMetaLike;
};

const isRecord = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null;

const extractColumnKey = (column: DatasetColumn | string) => (typeof column === 'string' ? column : column.key);

const extractColumnTitle = (column: DatasetColumn | string) => (typeof column === 'string' ? column : column.title || column.key);

const inferKeysFromRows = (rows: Record<string, any>[]) => {
  const firstRow = rows[0];
  if (!firstRow) return [];
  return Object.keys(firstRow).filter((key) => key !== 'key');
};

const ensureRowKeys = (rows: Record<string, any>[]) =>
  rows.map((row, index) => (Object.prototype.hasOwnProperty.call(row, 'key') ? row : { key: index, ...row }));

const normalizeObjectDataset = (dataset: unknown): null | { keys: string[]; rows: Record<string, any>[]; titles: string[] } => {
  if (!isRecord(dataset)) return null;

  const source = Array.isArray(dataset.source) ? dataset.source.filter(isRecord) : [];
  if (source.length === 0) return null;

  if (Array.isArray(dataset.dimensions) && dataset.dimensions.length > 0) {
    const keys = dataset.dimensions.map(extractColumnKey).filter(Boolean);
    const titles = dataset.dimensions.map(extractColumnTitle);
    return { keys, rows: ensureRowKeys(source), titles };
  }

  const inferredKeys = inferKeysFromRows(source);
  return { keys: inferredKeys, rows: ensureRowKeys(source), titles: inferredKeys };
};

export const normalizeDatasetForTablesBasic = (dataset: unknown, previousDataset?: unknown) => {
  const normalized = normalizeObjectDataset(dataset);
  if (!normalized) return dataset;

  const previousNormalized = normalizeObjectDataset(previousDataset);
  const previousTitleMap = new Map<string, string>();
  previousNormalized?.keys.forEach((key, index) => {
    previousTitleMap.set(key, previousNormalized.titles[index] || key);
  });

  return {
    dimensions: normalized.keys.map((key, index) => ({
      key,
      title: previousTitleMap.get(key) || normalized.titles[index] || key,
    })),
    source: normalized.rows,
  };
};

export const normalizeDatasetForTableScrollBoard = (dataset: unknown) => {
  const normalized = normalizeObjectDataset(dataset);
  if (!normalized) {
    return {
      dataset: Array.isArray(dataset) ? dataset : [],
      header: [],
    };
  }

  return {
    dataset: normalized.rows.map((row) => normalized.keys.map((key) => row[key] ?? '')),
    header: normalized.titles,
  };
};

export const normalizeDatasetForTableList = (dataset: unknown) => {
  if (Array.isArray(dataset)) {
    return dataset
      .filter(isRecord)
      .map((row) => ({
        name: String(row.name ?? row.metric ?? row.status ?? row.device ?? ''),
        value: Number(row.value ?? row.count ?? 0),
      }))
      .filter((row) => row.name);
  }

  const normalized = normalizeObjectDataset(dataset);
  if (!normalized) return dataset;

  const hasTimeDimension = normalized.keys.includes('time');
  if (hasTimeDimension) {
    return normalized.rows
      .map((row, index) => {
        const valueField =
          normalized.keys.find((key) => key !== 'time' && typeof row[key] === 'number') ??
          normalized.keys.find((key) => key !== 'time') ??
          '';

        return {
          name: String(row.time ?? editorT('bigscreenEditor.dynamic.bucketNumber', { index: String(index + 1) })),
          value: Number(row[valueField] ?? 0),
        };
      })
      .filter((row) => row.name);
  }

  const sample = normalized.rows[0] ?? {};
  const categoryField =
    normalized.keys.find((key) => ['status', 'device', 'name', 'metric'].includes(key)) ??
    normalized.keys.find((key) => typeof sample[key] === 'string') ??
    normalized.keys[0] ??
    '';

  const valueField =
    normalized.keys.find((key) => key !== categoryField && ['count', 'value'].includes(key)) ??
    normalized.keys.find((key) => key !== categoryField && typeof sample[key] === 'number') ??
    normalized.keys.find((key) => key !== categoryField) ??
    '';

  return normalized.rows
    .map((row) => ({
      name: String(row[categoryField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }))
    .filter((row) => row.name);
};

const resolveIoTDatasetMeta = (dataset: unknown): IoTDatasetMetaLike | undefined => {
  if (!isRecord(dataset)) return undefined;

  const directMeta = (dataset as IoTDatasetLike)._iotMeta;
  if (isRecord(directMeta)) return directMeta;

  const nestedDataset = (dataset as { dataset?: unknown }).dataset;
  if (!isRecord(nestedDataset)) return undefined;
  const nestedMeta = (nestedDataset as IoTDatasetLike)._iotMeta;
  if (!isRecord(nestedMeta)) return undefined;
  return nestedMeta;
};

export const resolveAutoUnitFromIoTDataset = (dataset: unknown) => {
  const units = resolveIoTDatasetMeta(dataset)?.dataUnits;
  if (!units || Object.keys(units).length === 0) return '';

  const allValues = Object.values(units).filter(Boolean);
  if (allValues.length === 0) return '';

  return allValues.every((value) => value === allValues[0]) ? String(allValues[0]) : '';
};
