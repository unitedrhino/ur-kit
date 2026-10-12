/** 文件说明：转换、验证并格式化物模型编辑数据。 */
import type { AffordanceFormData } from './form-types';
import type { PropertyAffordance } from './schema-types';

import { $t } from '@vben/locales';

/** createInitialAffordanceFormData 创建新建表单的初始值，每次返回新的嵌套对象。 */
export function createInitialAffordanceFormData(): AffordanceFormData {
  return {
    // ---- 公共字段 ----
    type: 1,
    name: '',
    identifier: '',
    desc: '',
    extendConfig: '',
    order: 0,

    // ---- 根级别模型特性（必填，有默认值）----
    funcGroup: 1,
    isCanSceneLinkage: 2,

    // ---- affordance：属性/事件/行为的具体定义 ----
    affordance: {
      define: {
        type: 'bool',
        mapping: { '0': '关', '1': '开' },
      },
      mode: 'rw',
      recordMode: 1,
      isUseShadow: false,
      controlMode: 1,
      isPassword: 2,
    } as PropertyAffordance,
  };
}

/**
 * 数据格式转换函数：表单数据 → API 数据（提交时）
 * - 将 affordance 对象转换为 JSON 字符串
 * - 递归删除空字符串、null、undefined、空数组和空对象，避免提交无意义字段
 * - 删除行为 input/output 中自动添加但未填写的参数占位行
 * - 按物模型类型过滤隐藏字段，避免类型切换后提交其他类型的残留配置
 */
export function transformFormData(rawData: any): any {
  const cleanedData = cleanSubmitValue(prepareSubmitPayload(rawData));
  const data = isPlainObject(cleanedData) ? { ...cleanedData } : {};

  // 如果有 affordance，转为 JSON 字符串（Define 结构直出，无需转换）
  if (data.affordance !== undefined) {
    data.affordance =
      typeof data.affordance === 'string'
        ? data.affordance
        : JSON.stringify(data.affordance);
  }

  return data;
}

type SubmitRecord = Record<string, unknown>;

/**
 * getStructRowsValidationError 校验 XStruct 行数据。
 *
 * 可选字段允许自动创建的全空占位行；只要用户填写了名称或标识符之一，就必须补全整行。
 * @param allowEmpty - 是否允许参数列表为空（事件/行为参数允许为空）
 */
export function getStructRowsValidationError(value: unknown, required: boolean, allowEmpty: boolean = false): string | undefined {
  const rows = Array.isArray(value) ? value : [];

  // 如果允许为空，且参数列表为空，跳过校验
  if (allowEmpty && rows.length === 0) {
    return undefined;
  }

  if (required && rows.length === 0) {
    return $t('iotApp.schemaForm.paramRequired');
  }

  for (const [index, row] of rows.entries()) {
    if (!isPlainObject(row)) {
      continue;
    }

    const nameEmpty = isBlankText(row.name);
    const identifierEmpty = isBlankText(row.identifier);

    if (nameEmpty && identifierEmpty) {
      if (required) {
        return $t('iotApp.schemaForm.paramNameIdentifierRequiredAt', { index: index + 1 });
      }
      continue;
    }

    if (nameEmpty) {
      return $t('iotApp.schemaForm.paramNameRequiredAt', { index: index + 1 });
    }

    if (identifierEmpty) {
      return $t('iotApp.schemaForm.paramIdentifierRequiredAt', { index: index + 1 });
    }
  }

  return undefined;
}

/** prepareSubmitPayload 复制提交数据，并在通用空值清理前处理物模型专用占位数据。 */
function prepareSubmitPayload(rawData: unknown): unknown {
  if (!isPlainObject(rawData)) {
    return rawData;
  }

  const data: SubmitRecord = { ...rawData };
  data.affordance = normalizeAffordanceBySchemaType(data.type, data.affordance);
  return data;
}

/** isPlainObject 判断值是否为普通对象，用于递归清理表单提交数据。 */
function isPlainObject(value: unknown): value is SubmitRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/** normalizeAffordanceBySchemaType 按功能类型保留当前 API 契约需要的 affordance 字段。 */
function normalizeAffordanceBySchemaType(type: unknown, affordance: unknown): unknown {
  const data = pruneAffordancePlaceholders(affordance);
  if (!isPlainObject(data)) {
    return data;
  }

  if (type === 1) {
    return pickSubmitFields(data, [
      'define',
      'mode',
      'recordMode',
      'isUseShadow',
      'controlMode',
      'isPassword',
    ]);
  }

  if (type === 2) {
    return pickSubmitFields(data, ['type', 'dir', 'params']);
  }

  if (type === 3) {
    return pickSubmitFields(data, ['dir', 'input', 'output']);
  }

  return data;
}

/** pickSubmitFields 从对象中按白名单复制字段，保留 false 和 0 等有效值。 */
function pickSubmitFields(data: SubmitRecord, keys: string[]): SubmitRecord {
  const result: SubmitRecord = {};
  for (const key of keys) {
    if (data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
}

/** pruneAffordancePlaceholders 删除行为/事件参数中自动生成但未填写名称和标识符的占位行，并清理空的 define。 */
function pruneAffordancePlaceholders(affordance: unknown): unknown {
  if (!isPlainObject(affordance)) {
    return affordance;
  }

  const data: SubmitRecord = { ...affordance };
  // 处理事件 params 和行为 input/output
  for (const key of ['input', 'output', 'params']) {
    const list = data[key];
    if (Array.isArray(list)) {
      data[key] = list
        .filter((item) => !isEmptyParamPlaceholder(item))
        .map((item) => {
          // 如果 define 为空或 type 为空，移除 define 字段（事件/行为参数允许不定义数据类型）
          const define = isPlainObject(item) ? item.define : undefined;
          if (isPlainObject(item) && (!isPlainObject(define) || !define.type)) {
            const { define, ...rest } = item;
            return rest;
          }
          return item;
        });
    }
  }
  return data;
}

/** isEmptyParamPlaceholder 判断参数行是否只是 XStruct 自动创建的空占位行。 */
function isEmptyParamPlaceholder(item: unknown): boolean {
  if (!isPlainObject(item)) {
    return false;
  }

  return isBlankText(item.identifier) && isBlankText(item.name);
}

/** isBlankText 使用 trim 判断用户是否实际填写了文本。 */
function isBlankText(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * cleanSubmitValue 递归清理提交数据中的空值。
 *
 * 空字符串会用 trim 仅判断是否为空，非空字符串保持原值，避免改变用户输入。
 */
function cleanSubmitValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim() === '' ? undefined : value;
  }

  if (Array.isArray(value)) {
    const list = value
      .map((item) => cleanSubmitValue(item))
      .filter((item) => item !== undefined);

    return list.length > 0 ? list : undefined;
  }

  if (isPlainObject(value)) {
    const record: SubmitRecord = {};

    for (const [key, item] of Object.entries(value)) {
      const cleanedItem = cleanSubmitValue(item);
      if (cleanedItem !== undefined) {
        record[key] = cleanedItem;
      }
    }

    return Object.keys(record).length > 0 ? record : undefined;
  }

  return value;
}

/**
 * transformFormData 的反向操作：API 数据 → 表单数据（修改时）
 * - 将 affordance JSON 字符串解析为对象
 */
export function transformApiDataToFormData(rawData: any): any {
  const data = { ...rawData };

  // 如果有 affordance，解析 JSON（Define 结构直入，无需转换）
  if (data?.affordance) {
    if (typeof data.affordance === 'string') {
      data.affordance = JSON.parse(data.affordance);
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// 物模型表格数据定义格式化工具
// ---------------------------------------------------------------------------

/**
 * 格式化单个 define 为展示文本
 */
function formatDefine(define: any): string {
  if (!define?.type) return '-';
  const type = define.type;
  switch (type) {
    case 'bool':
    case 'enum':
      return formatBoolOrEnum(define);
    case 'int':
    case 'float':
      return formatNumber(define);
    case 'string':
      return formatString(define);
    case 'timestamp':
      return $t('iotApp.schemaForm.utcHint');
    case 'struct':
      return formatStruct(define);
    case 'array':
      return formatArray(define);
    default:
      return '-';
  }
}

/** 将参数数组格式化为多行文本（用于事件 params、行为 input/output） */
function formatParamsList(list: any[]): string {
  if (!Array.isArray(list) || list.length === 0) return '-';
  return list
    .map((p: any) => {
      const name = p?.identifier ?? p?.name ?? '-';
      const def = p?.define ? formatDefine(p.define) : '-';
      return `${name}: ${def}`;
    })
    .join('\n');
}

/**
 * 格式化数据定义（affordance）供表格展示
 * - 属性：affordance 有顶层 define
 * - 事件：affordance 有 params 数组
 * - 行为：affordance 有 input（调用参数）、output（返回参数）数组
 * @param affordance - affordance JSON 字符串或对象
 * @returns 格式化后的纯文本字符串
 */
export function formatDataDefinition(affordance: any): string {
  try {
    const affordanceObj =
      typeof affordance === 'string' ? JSON.parse(affordance) : affordance;

    // 事件：params 数组
    const params = affordanceObj?.params;
    if (Array.isArray(params) && params.length > 0) {
      return formatParamsList(params);
    }

    // 行为：input（调用参数）+ output（返回参数）
    const input = affordanceObj?.input;
    const output = affordanceObj?.output;
    if (Array.isArray(input) || Array.isArray(output)) {
      const sections: string[] = [];
      if (Array.isArray(input) && input.length > 0) {
        sections.push(`${$t('iotApp.schemaTags.inputParams')}:\n${formatParamsList(input)}`);
      }
      if (Array.isArray(output) && output.length > 0) {
        sections.push(`${$t('iotApp.schemaTags.outputParams')}:\n${formatParamsList(output)}`);
      }
      return sections.length > 0 ? sections.join('\n\n') : '-';
    }

    // 属性：顶层 define
    if (!affordanceObj?.define) {
      return '-';
    }

    return formatDefine(affordanceObj.define);
  } catch {
    return '-';
  }
}

function formatBoolOrEnum(define: any): string {
  const mapping = define?.mapping;
  if (!mapping) return '-';

  const entries = Object.entries(mapping);
  if (entries.length === 0) return '-';

  return entries.map(([key, value]) => `${key} - ${value}`).join('\n');
}

function formatNumber(define: any): string {
  const { min, max, start, step, unit } = define;
  const parts: string[] = [];

  if (min !== undefined || max !== undefined) {
    parts.push(`${$t('iotApp.schemaTags.range')}: ${min ?? ''} - ${max ?? ''}`);
  }
  if (start !== undefined) {
    parts.push(`${$t('iotApp.schemaTags.initial')}: ${start}`);
  }
  if (step !== undefined) {
    parts.push(`${$t('iotApp.schemaTags.step')}: ${step}`);
  }
  parts.push(`${$t('iotApp.schemaTags.unit')}: ${unit ?? '-'}`);

  return parts.length > 0 ? parts.join('\n') : '-';
}

function formatString(define: any): string {
  const { max } = define;
  if (max !== undefined) {
    return `${$t('iotApp.schemaTags.strLen')}: 0 - ${max}`;
  }
  return '-';
}

function formatStruct(define: any): string {
  const specs = define?.specs;
  if (!Array.isArray(specs) || specs.length === 0) {
    return $t('iotApp.schemaForm.structEmpty');
  }
  const items = specs.map((s: any) => `${s?.identifier ?? '-'}: ${s?.define?.type ?? '-'}`);
  return `${$t('iotApp.schemaForm.struct')}: ${items.join(', ')}`;
}

function formatArray(define: any): string {
  const arrInfo = define?.arrayInfo;
  const max = define?.max;
  const parts: string[] = [];
  if (arrInfo?.type) {
    parts.push(`${$t('iotApp.schemaForm.elementType')}: ${arrInfo.type}`);
    if (arrInfo.min !== undefined || arrInfo.max !== undefined) {
      parts.push(`${$t('iotApp.schemaForm.rangeLabel')}: ${arrInfo.min ?? ''} - ${arrInfo.max ?? ''}`);
    }
  }
  if (max !== undefined) {
    parts.push(`${$t('iotApp.schemaForm.maxLengthLabel')}: ${max}`);
  }
  return parts.length > 0 ? parts.join('\n') : $t('iotApp.schemaForm.dataTypeArray');
}
