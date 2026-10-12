type IoTMetaCarrier = {
  _iotMeta?: unknown;
  dataset?: unknown;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasDirectIoTMeta = (value: unknown) => isObjectRecord(value) && isObjectRecord((value as IoTMetaCarrier)._iotMeta);

/**
 * 统一判断运行态数据是否携带 IoT 元信息，兼容：
 * 1) dataset 本体直接挂载 `_iotMeta`
 * 2) 外层对象通过 `dataset._iotMeta` 透传
 */
export const hasIoTDatasetMeta = (value: unknown): boolean => {
  if (hasDirectIoTMeta(value)) return true;

  if (!isObjectRecord(value)) return false;
  const nestedDataset = (value as IoTMetaCarrier).dataset;
  return hasDirectIoTMeta(nestedDataset);
};
