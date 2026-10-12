/**
 * 文件说明：告警规则触发条件物模型加载
 * 根据告警目标（产品/品类/指定设备）加载对应物模型字段，供 StepCondition 使用。
 */
import { ref } from 'vue';
import { ThingsApi } from '@vben/api';
import type { AlarmObjectSchema, AlarmTarget, SchemaField } from '../types/alarm-v2.types';

/** 内置在线状态字段 */
const onlineField: SchemaField = {
  id: '_online',
  dataID: '_online',
  name: '在线状态',
  sourceType: 'online',
  valueType: 'bool',
};

/** 物模型类型转条件数据源类型：1-属性 2-事件 3-行为 */
function mapType(type?: number): 'property' | 'event' | 'action' {
  if (type === 2) return 'event';
  if (type === 3) return 'action';
  return 'property';
}

/** SchemaDefine 是告警编辑器需要读取的最小物模型数据定义。 */
interface SchemaDefine {
  arrayInfo?: SchemaDefine;
  max?: string | number;
  specs?: Array<{
    dataType?: SchemaDefine;
    define?: SchemaDefine;
    id?: string;
    identifier?: string;
    name?: string;
  }>;
  type?: string;
  unit?: string;
}

/** ARRAY_INDEX_FALLBACK_MAX 数组点位的缺省数量上限（物模型未声明 max 时使用，与场景联动一致）。 */
const ARRAY_INDEX_FALLBACK_MAX = 10;

/** SchemaListItem 兼容产品、品类和设备物模型列表的共同字段。 */
interface SchemaListItem {
  affordance?: string | {
    define?: SchemaDefine;
    input?: SchemaParams;
    params?: SchemaParams;
  };
  identifier?: string;
  name?: string;
  type?: number;
}

/** SchemaParam 描述事件或行为原始参数。 */
interface SchemaParam {
  dataType?: SchemaDefine;
  define?: SchemaDefine;
  id?: string;
  identifier?: string;
  name?: string;
  type?: string;
}

/** SchemaParams 兼容历史数组格式和当前后端使用的标识符映射格式。 */
type SchemaParams = Record<string, SchemaDefine | SchemaParam> | SchemaParam[];

/** normalizeValueType 把后端数据类型收敛为告警能力矩阵使用的枚举。 */
function normalizeValueType(
  type?: string,
): SchemaField['valueType'] | undefined {
  if (
    [
      'array',
      'bool',
      'enum',
      'float',
      'int',
      'matrix',
      'string',
      'struct',
      'timestamp',
    ].includes(type ?? '')
  ) {
    return type as SchemaField['valueType'];
  }
  return undefined;
}

/** parseAffordance 安全解析接口中的物模型能力 JSON。 */
function parseAffordance(item: SchemaListItem): Exclude<SchemaListItem['affordance'], string | undefined> {
  if (!item.affordance) return {};
  if (typeof item.affordance !== 'string') return item.affordance;
  try {
    return JSON.parse(item.affordance) as Exclude<
      SchemaListItem['affordance'],
      string | undefined
    >;
  } catch {
    return {};
  }
}

/** normalizeSchemaParams 把数组和对象映射统一为带标识符的参数列表。 */
function normalizeSchemaParams(params?: SchemaParams): SchemaParam[] {
  if (!params) return [];
  if (Array.isArray(params)) return params;
  return Object.entries(params).map(([identifier, raw]) => {
    const param = raw as SchemaParam;
    return {
      ...param,
      identifier: param.identifier ?? param.id ?? identifier,
      define:
        param.define ??
        param.dataType ??
        (param.type ? (param as SchemaDefine) : undefined),
    };
  });
}

/** mapSchemaParam 把事件或行为参数转换为可过滤的子字段。 */
function mapSchemaParam(
  param: SchemaParam,
  sourceType: 'action' | 'event' | 'property',
): SchemaField {
  const define = param.define ?? param.dataType;
  const identifier = param.identifier ?? param.id ?? '';
  return {
    id: identifier,
    dataID: identifier,
    name: param.name ?? identifier,
    sourceType,
    unit: define?.unit,
    valueType: normalizeValueType(define?.type),
  };
}

/** mapSchemaItem 把接口物模型条目转换为带类型和参数定义的告警字段。 */
function mapSchemaItem(item: SchemaListItem): SchemaField {
  const sourceType = mapType(item.type);
  const affordance = parseAffordance(item);
  const define = affordance.define;
  const params =
    sourceType === 'event'
      ? affordance.params
      : sourceType === 'action'
        ? affordance.input
        : define?.specs;
  const children = normalizeSchemaParams(params).map((param) =>
    mapSchemaParam(param, sourceType),
  );

  // 数组属性保留整字段并携带 arrayMeta（点位上限与结构体成员定义），
  // 由条件编辑器渲染「属性 → 点位 → 成员」级联下拉，dataID 拼点分路径提交。
  if (sourceType === 'property' && normalizeValueType(define?.type) === 'array' && define?.arrayInfo) {
    return {
      id: item.identifier ?? '',
      dataID: item.identifier ?? '',
      name: item.name ?? item.identifier ?? '',
      sourceType,
      unit: define?.unit,
      valueType: 'array',
      arrayMeta: buildArrayMeta(define),
    };
  }

  return {
    id: item.identifier ?? '',
    dataID: item.identifier ?? '',
    name: item.name ?? item.identifier ?? '',
    sourceType,
    unit: define?.unit,
    valueType: normalizeValueType(define?.type),
    children: children.length > 0 ? children : undefined,
  };
}

/** ArrayMeta 数组属性的点位选择元数据（点位上限、元素类型与结构体成员定义）。 */
export interface ArrayFieldMeta {
  max: number;
  struct: boolean;
  /** 元素类型（纯数组时用于子字段 valueType 与默认聚合/比较符）。 */
  elementValueType?: string;
  elementUnit?: string;
  specs: Array<{ identifier: string; name: string; valueType?: string; unit?: string }>;
}

/** buildArrayMeta 从物模型 define 提取数组点位的级联选择元数据。 */
export function buildArrayMeta(define?: SchemaDefine): ArrayFieldMeta | undefined {
  const elem = define?.arrayInfo;
  if (!elem) return undefined;
  const declared = Number(define?.max);
  const max =
    Number.isFinite(declared) && declared > 0 ? Math.min(Math.floor(declared), 256) : ARRAY_INDEX_FALLBACK_MAX;
  const struct = elem.type === 'struct';
  const specs = (struct ? (elem.specs ?? []) : [])
    .filter((spec) => spec.identifier)
    .map((spec) => ({
      identifier: spec.identifier!,
      name: spec.name ?? spec.identifier!,
      valueType: normalizeValueType((spec.dataType ?? spec.define)?.type),
      unit: (spec.dataType ?? spec.define)?.unit,
    }));
  return {
    max,
    struct,
    elementValueType: normalizeValueType(elem.type),
    elementUnit: elem.unit,
    specs,
  };
}

/**
 * buildArrayDataID 拼接数组属性的点分查询路径：属性.点位[.成员]。
 * 后端 ParseDataID/评估链路按该路径定位测点。
 */
export function buildArrayDataID(fieldDataID: string, point: number, member?: string): string {
  return member ? `${fieldDataID}.${point}.${member}` : `${fieldDataID}.${point}`;
}

/** ResolvedArraySelection 数组叶子 dataID 的反解结果。 */
export interface ResolvedArraySelection {
  /** 是否已包含点位（dataID 以字段路径开头且带点位）。 */
  hasPoint: boolean;
  point?: number;
  member?: string;
  /** 成员的 valueType（struct 成员按 specs 反查；纯数组取元素类型）。 */
  memberValueType?: string;
  memberUnit?: string;
  /** dataID 是否完整（有点位，struct 时还有成员）。 */
  complete: boolean;
}

/** parseArrayDataID 从叶子的 dataID 反解出点位/成员选择与成员类型。 */
export function parseArrayDataID(
  field: { dataID: string; arrayMeta?: ArrayFieldMeta },
  dataID?: string,
): ResolvedArraySelection {
  const meta = field.arrayMeta;
  const result: ResolvedArraySelection = {
    hasPoint: false,
    complete: false,
    memberValueType: meta?.elementValueType,
    memberUnit: meta?.elementUnit,
  };
  if (!meta || !dataID || !dataID.startsWith(`${field.dataID}.`)) return result;
  const rest = dataID.slice(field.dataID.length + 1);
  const parts = rest.split('.');
  // 尾点占位（属性.）的点位段为空串，Number('') === 0 会误判成已选点位0
  const point = parts[0] === '' ? Number.NaN : Number(parts[0]);
  if (!Number.isInteger(point) || point < 0 || point >= meta.max) return result;
  result.hasPoint = true;
  result.point = point;
  if (meta.struct) {
    const member = parts[1] ?? '';
    result.member = member;
    const spec = meta.specs.find((item) => item.identifier === member);
    if (spec) {
      result.memberValueType = spec.valueType;
      result.memberUnit = spec.unit;
    }
    result.complete = Boolean(member) && Boolean(spec);
  } else {
    result.complete = parts.length === 1;
  }
  return result;
}

function emptySchema(): AlarmObjectSchema {
  return { metricFields: [], eventFields: [], actionFields: [], onlineFields: [onlineField] };
}

function toAlarmObjectSchema(list: SchemaField[]): AlarmObjectSchema {
  return {
    metricFields: list
      .filter((field) => field.sourceType === 'property')
      .flatMap(flattenPropertyField),
    eventFields: list.filter((f) => f.sourceType === 'event'),
    actionFields: list.filter((f) => f.sourceType === 'action'),
    onlineFields: [onlineField],
  };
}

/** flattenPropertyField 把一级结构体成员展开成后端支持的 property.member 查询路径。
 *  数组属性保留整字段（携带 arrayMeta），点位/成员由条件编辑器级联选择。 */
function flattenPropertyField(field: SchemaField): SchemaField[] {
  if (field.valueType !== 'struct' || !field.children?.length) return [field];
  return field.children.map((child) => {
    const dataID = `${field.dataID}.${child.dataID}`;
    return {
      ...child,
      dataID,
      id: dataID,
      name: `${field.name} / ${child.name}`,
      sourceType: 'property',
    };
  });
}

export function useAlarmSchema() {
  const loading = ref(false);
  const schema = ref<AlarmObjectSchema>(emptySchema());
  const error = ref('');

  async function loadSchema(target: AlarmTarget) {
    loading.value = true;
    error.value = '';
    try {
      if (target.selectType === 'fixed' && target.devices && target.devices.length > 0) {
        // 指定设备：以第一个设备为准加载设备物模型（包含产品物模型）
        const device = target.devices[0];
        if (!device) {
          schema.value = emptySchema();
          return;
        }
        const resp = await ThingsApi.postApiV1ThingsDeviceSchemaGetList({
          productID: device.productID,
          deviceName: device.name,
          withProductSchema: true,
        });
        const list = (resp.list ?? []).map(mapSchemaItem);
        schema.value = toAlarmObjectSchema(list);
        return;
      }

      if (target.targetKind === 'category' && target.categoryID) {
        // 品类物模型通过通用物模型接口查询，需要带 type 才能区分属性/事件/行为
        const detailResp = await ThingsApi.postApiV1ThingsSchemaCommonGetList({
          productCategoryID: target.categoryID,
          page: { page: 1, size: 999 },
        });
        const list = (detailResp.list ?? []).map(mapSchemaItem);
        schema.value = toAlarmObjectSchema(list);
        return;
      }

      if (target.targetKind === 'product' && target.productID) {
        const resp = await ThingsApi.postApiV1ThingsProductSchemaGetList({
          productID: target.productID,
          page: { page: 1, size: 999 },
        });
        const list = (resp.list ?? []).map(mapSchemaItem);
        schema.value = toAlarmObjectSchema(list);
        return;
      }

      schema.value = emptySchema();
    } catch (e: any) {
      error.value = e?.message ?? '加载物模型失败';
      schema.value = emptySchema();
    } finally {
      loading.value = false;
    }
  }

  return { schema, loading, error, loadSchema };
}
