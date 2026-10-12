/**
 * 设备控制弹窗的数据模型工具，集中处理单控/群控请求参数、物模型归一化和下发载荷。
 */

export type ControlPrimitiveValue = boolean | number | string;

export interface DeviceRow {
  deviceAlias?: string;
  deviceName: string;
  productID: string;
  productName?: string;
  status?: number | string;
  withProperties?: Record<string, { value?: unknown; dataName?: string }>;
}

export interface EnumOption {
  label: string;
  value: string;
}

export interface SchemaInputParam {
  define?: ControlDefine;
  identifier: string;
  name?: string;
}

export const CONTROL_SCHEMA_TYPE_PROPERTY = 1;
export const CONTROL_SCHEMA_TYPE_ACTION = 3;

export interface ControlDefine {
  max?: number;
  min?: number;
  start?: number;
  step?: number;
  type?: string;
  unit?: string;
  mapping?: EnumOption[];
}

export interface ControlSchemaItem {
  affordance?: {
    controlMode?: number | string;
    define?: ControlDefine;
    dir?: string;
    input?: SchemaInputParam[];
    output?: SchemaInputParam[];
    mode?: string;
  };
  id?: number | string;
  identifier: string;
  initialValue?: ControlPrimitiveValue;
  name?: string;
  /** schemaType 对齐物模型类型：1=property 属性，3=action 行为。 */
  schemaType?: number;
  /** isReadonly 标记当前属性是否为只读字段（mode === 'r'）。 */
  isReadonly?: boolean;
  /** 兼容项，保留原始类型字段。 */
  type?: number;
}

export interface ControlResult {
  code?: number | string;
  deviceName?: string;
  msg?: string;
  productID?: string;
}

export interface ControlFailureState {
  count: number;
  results: ControlResult[];
}

interface SchemaRequestOptions {
  omitControlMode?: boolean;
  omitPropertyMode?: boolean;
  propertyMode?: 'r' | 'rw';
  productSceneMode?: 'r' | 'rw' | 'none';
  type?: number;
  funcGroup?: number;
  projectID?: string;
}

/** buildDeviceKey 生成弹窗内设备重选使用的稳定键。 */
export function buildDeviceKey(row: DeviceRow) {
  return `${row.productID}:${row.deviceName}`;
}

/** buildSchemaRequest 构造设备控制属性 schema 查询参数，多设备时开启群控过滤。 */
export function buildSchemaRequest(rows: DeviceRow[], options: SchemaRequestOptions = {}) {
  const productIDs = [...new Set(rows.map((row) => row.productID).filter(Boolean))];
  return {
    page: { page: 1, size: 9999 },
    productIDs,
    ...(options.projectID ? { projectID: options.projectID } : {}),
    ...(rows.length > 1 && !options.omitControlMode ? { controlMode: 1 } : {}),
    productSceneMode: options.productSceneMode || 'rw',
    ...(options.omitPropertyMode ? {} : { propertyMode: options.propertyMode || 'rw' }),
    funcGroup: options.funcGroup ?? 1,
    ...(options.type !== undefined ? { type: options.type } : {}),
  };
}

/** isMissingControlModeColumnError 识别旧后端仍按 control_mode 物理列过滤导致的数据库错误。 */
export function isMissingControlModeColumnError(error: unknown) {
  const text = JSON.stringify(error ?? '');
  return text.includes('control_mode') && text.includes('does not exist');
}

/** buildControlDevices 将表格行精简为后端控制下发需要的设备标识。 */
export function buildControlDevices(rows: DeviceRow[]) {
  return rows.map((row) => ({
    productID: row.productID,
    deviceName: row.deviceName,
  }));
}

/** selectRowsByKeys 根据设备键保留弹窗当前控制目标。 */
export function selectRowsByKeys(rows: DeviceRow[], keys: string[]) {
  const selected = new Set(keys);
  return rows.filter((row) => selected.has(buildDeviceKey(row)));
}

/** buildChangedControlPayload 只保留用户改动过的控制项，避免把默认值误下发。 */
export function buildChangedControlPayload(
  changedValues: Record<string, ControlPrimitiveValue | undefined>,
  allowIdentifiers?: Set<string>,
) {
  const payload: Record<string, ControlPrimitiveValue> = {};
  for (const [key, value] of Object.entries(changedValues)) {
    if (value !== undefined && (!allowIdentifiers || allowIdentifiers.has(key))) {
      payload[key] = value;
    }
  }
  return payload;
}

/** buildChangedActionItems 只收集已进入改动/选中状态、需要随批量下发执行的行为项。 */
export function buildChangedActionItems(items: ControlSchemaItem[], changedIdentifiers: Record<string, boolean | undefined>) {
  return items.filter((item) => item.schemaType === CONTROL_SCHEMA_TYPE_ACTION && changedIdentifiers[item.identifier] === true);
}

/** collectFailedControlResults 按后端返回 code 过滤群控失败设备。 */
export function collectFailedControlResults(results: ControlResult[]) {
  return results.filter((item) => Number(item.code) !== 200);
}

/** buildFailedControlMap 将设备级失败结果挂到本次改动过的每个控制项上。 */
export function buildFailedControlMap(payload: Record<string, ControlPrimitiveValue>, failures: ControlResult[]) {
  const map: Record<string, ControlFailureState> = {};
  if (failures.length === 0) {
    return map;
  }
  for (const identifier of Object.keys(payload)) {
    map[identifier] = {
      count: failures.length,
      results: failures,
    };
  }
  return map;
}

/** buildRetryDevices 单项重试时优先只重发失败设备，无法匹配时回退到原控制目标。 */
export function buildRetryDevices(rows: DeviceRow[], failures: ControlResult[] | undefined) {
  if (!failures || failures.length === 0) {
    return buildControlDevices(rows);
  }

  const rowByDeviceName = new Map(rows.map((row) => [row.deviceName, row]));
  const retryDevices = failures
    .map((failure) => {
      if (failure.productID && failure.deviceName) {
        return {
          productID: failure.productID,
          deviceName: failure.deviceName,
        };
      }
      const matchedRow = failure.deviceName ? rowByDeviceName.get(failure.deviceName) : undefined;
      return matchedRow
        ? {
            productID: matchedRow.productID,
            deviceName: matchedRow.deviceName,
          }
        : null;
    })
    .filter((device): device is { deviceName: string; productID: string } => Boolean(device));

  const unique = new Map(retryDevices.map((device) => [`${device.productID}:${device.deviceName}`, device]));
  return unique.size > 0 ? [...unique.values()] : buildControlDevices(rows);
}

function toNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeEnumMapping(mapping: unknown): EnumOption[] {
  if (Array.isArray(mapping)) {
    return mapping.map((item) => ({
      label: String(item?.label ?? item?.name ?? item?.value ?? ''),
      value: String(item?.value ?? item?.key ?? item?.id ?? ''),
    }));
  }
  if (mapping && typeof mapping === 'object') {
    return Object.entries(mapping).map(([value, label]) => ({
      label: String(label),
      value: String(value),
    }));
  }
  return [];
}

function buildActionInputTemplate(params: SchemaInputParam[] = []) {
  if (!Array.isArray(params) || params.length === 0) {
    return '';
  }

  const result: Record<string, unknown> = {};
  for (const param of params) {
    const define = param.define ?? {};
    if (define.type === 'bool') {
      result[param.identifier] = 0;
      continue;
    }
    if (define.type === 'enum') {
      const mapping = normalizeEnumMapping(define.mapping);
      result[param.identifier] = mapping[0]?.value ?? '';
      continue;
    }
    if (define.type === 'float' || define.type === 'int') {
      result[param.identifier] = toNumber(define.start, 0);
      continue;
    }
    result[param.identifier] = '';
  }

  return JSON.stringify(result, null, 2);
}

/** normalizeControlSchemas 解析后端物模型定义，并补充单设备当前属性值。 */
export function normalizeControlSchemas(list: any[], rows: DeviceRow[]): ControlSchemaItem[] {
  const currentProperties = rows.length === 1 ? rows[0]?.withProperties : undefined;
  const mergedItems = new Map<string, ControlSchemaItem>();

  list.forEach((raw) => {
    const item = { ...raw } as ControlSchemaItem;
    if (typeof item.affordance === 'string') {
      try {
        item.affordance = JSON.parse(item.affordance);
      } catch {
        item.affordance = undefined;
      }
    }

    const schemaType = Number(item.type ?? CONTROL_SCHEMA_TYPE_PROPERTY);
    item.schemaType = Number.isFinite(schemaType) ? schemaType : CONTROL_SCHEMA_TYPE_PROPERTY;

    if (
      item.schemaType !== CONTROL_SCHEMA_TYPE_ACTION &&
      rows.length > 1 &&
      Number(item.affordance?.controlMode ?? 1) !== 1
    ) {
      return;
    }

    if (item.schemaType === CONTROL_SCHEMA_TYPE_ACTION) {
      item.isReadonly = false;
      const inputParams = Array.isArray(item.affordance?.input) ? item.affordance.input : [];
      item.initialValue = buildActionInputTemplate(inputParams);
      const key = `${item.schemaType}:${item.identifier}`;
      const existing = mergedItems.get(key);
      if (!existing || existing.isReadonly) {
        mergedItems.set(key, item);
      }
      return;
    }

    if (item.schemaType !== CONTROL_SCHEMA_TYPE_PROPERTY) {
      return;
    }

    const define = item.affordance?.define;
    if (!define || !['bool', 'enum', 'int', 'float'].includes(String(define.type))) {
      return;
    }

    item.isReadonly = item.affordance?.mode === 'r';

    if (define.type === 'int' || define.type === 'float') {
      define.min = toNumber(define.min, 0);
      define.max = toNumber(define.max, 100);
      define.step = toNumber(define.step, define.type === 'float' ? 0.1 : 1);
      define.start = toNumber(define.start, define.min);
    }

    if (define.type === 'enum') {
      define.mapping = normalizeEnumMapping(define.mapping);
    }

    const currentValue = currentProperties?.[item.identifier]?.value;
    if (currentValue !== undefined) {
      if (define.type === 'bool') {
        item.initialValue = Number(currentValue) === 1;
      } else if (define.type === 'int' || define.type === 'float') {
        item.initialValue = toNumber(currentValue, Number(define.start ?? 0));
      } else {
        item.initialValue = String(currentValue);
      }
    }

    const key = `${item.schemaType}:${item.identifier}`;
    const existing = mergedItems.get(key);
    if (!existing || existing.isReadonly) {
      mergedItems.set(key, item);
    }
  });

  return [...mergedItems.values()];
}
