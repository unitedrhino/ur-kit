/** 文件说明：提供物模型编辑选项与默认数据定义。 */
import { createOptionsAndMapping } from '@vben/saas';
import { $t } from '@vben/locales';

import type { Define } from './schema-types';

// ---------------------------------------------------------------------------
// XStruct / XStructDefinition 用
// ---------------------------------------------------------------------------

/** 结构体/数据定义支持的数据类型选项 */
export const DATA_TYPE_OPTIONS = [
  { get label() { return $t('iotApp.schemaForm.dataTypeBool') }, value: 'bool' },
  { get label() { return $t('iotApp.schemaForm.dataTypeInt') }, value: 'int' },
  { get label() { return $t('iotApp.schemaForm.dataTypeString') }, value: 'string' },
  { get label() { return $t('iotApp.schemaForm.dataTypeFloat') }, value: 'float' },
  { get label() { return $t('iotApp.schemaForm.dataTypeEnum') }, value: 'enum' },
  { get label() { return $t('iotApp.schemaForm.dataTypeTimestamp') }, value: 'timestamp' },
  { get label() { return $t('iotApp.schemaForm.dataTypeArray') }, value: 'array' },
  { get label() { return $t('iotApp.schemaForm.dataTypeMatrix') }, value: 'matrix' },
  { get label() { return $t('iotApp.schemaForm.dataTypeStruct') }, value: 'struct' },
];

/** 根据数据类型初始化默认 Define */
export function initDefineByType(type: Define['type']): Define {
  const base = { type }
  if (type === 'bool') return { ...base, mapping: { '0': '关', '1': '开' } }
  if (type === 'int') return { ...base, min: '0', max: '100', step: '1', start: '0', unit: '' }
  if (type === 'float') return { ...base, min: '0.000', max: '100.000', step: '0.001', start: '0.000', unit: '' }
  if (type === 'string') return { ...base, max: '2048' }
  if (type === 'enum') return { ...base, mapping: { '1': '选项1' } }
  if (type === 'timestamp') return base
  if (type === 'array') {
    return {
      ...base,
      max: '10',
      arrayInfo: { type: 'int', min: '0', max: '100', step: '1', start: '0', unit: '' },
    }
  }
  if (type === 'struct') return { ...base, specs: [] }
  if (type === 'matrix') return { ...base, arrayInfo: { type: 'int', min: '0', max: '100', step: '1', start: '0', unit: '' } }
  return base
}

/** 参数名/标识符校验提示 */
export const IDENTIFIER_HINT = $t('iotApp.schemaForm.identifierHint')

// ---------------------------------------------------------------------------
// AffordanceForm 用
// ---------------------------------------------------------------------------

//物模型类型 1:property属性 2:event事件 3:action行为
export const schemaTypeEnum = {
  PROPERTY: 1,
  EVENT: 2,
  ACTION: 3,
} as const;

export const {
  options: schemaTypeOptions,
  mapping: schemaTypeMapping,
  mapping2: schemaTypeToColorMapping,
} = createOptionsAndMapping([
  [schemaTypeEnum.PROPERTY, $t('iotApp.schemaForm.property'), 'success'],
  [schemaTypeEnum.EVENT, $t('iotApp.schemaForm.event'), 'primary'],
  [schemaTypeEnum.ACTION, $t('iotApp.schemaForm.action'), 'warning'],
]);


//用户权限操作: 1:r(只读) 3:rw(可读可写)
export const schemaUserPermEnum = {
  READ_ONLY: 1,
  READ_WRITE: 3,
} as const;
export const schemaUserPermOptions = [
  { value: schemaUserPermEnum.READ_ONLY, get label() { return $t('iotApp.schemaForm.accessReadOnly') }, color: 'success' },
  { value: schemaUserPermEnum.READ_WRITE, get label() { return $t('iotApp.schemaForm.accessReadWrite') }, color: 'primary' },
];

// 设备影子选项
export const shadowTypeOptions = [
  { value: true, get label() { return $t('iotApp.schemaForm.shadowOn') } },
  { value: false, get label() { return $t('iotApp.schemaForm.shadowOff') } },
];

// 读写类型选项
export const modeOptions = [
  { value: 'rw', get label() { return $t('iotApp.schemaForm.accessReadWrite') } },
  { value: 'r', get label() { return $t('iotApp.schemaForm.accessReadOnly') } },
];

// 数据类型选项（属性用） - 根据 devices-model/handle/config.ts
export const dataTypeOptions = [
  { value: 'bool', get label() { return $t('iotApp.schemaForm.dataTypeBool') } },
  { value: 'int', get label() { return $t('iotApp.schemaForm.dataTypeInt') } },
  { value: 'string', get label() { return $t('iotApp.schemaForm.dataTypeString') } },
  { value: 'float', get label() { return $t('iotApp.schemaForm.dataTypeFloat') } },
  { value: 'enum', get label() { return $t('iotApp.schemaForm.dataTypeEnum') } },
  { value: 'timestamp', get label() { return $t('iotApp.schemaForm.dataTypeTimestamp') } },
  { value: 'struct', get label() { return $t('iotApp.schemaForm.dataTypeStruct') } },
  { value: 'array', get label() { return $t('iotApp.schemaForm.dataTypeArray') } },
  { value: 'matrix', get label() { return $t('iotApp.schemaForm.dataTypeMatrix') } },
];

// 结构体内部数据类型选项（不包含 struct 本身，避免无限嵌套）
export const dataTypeStructOptionsList = [
  { value: 'bool', get label() { return $t('iotApp.schemaForm.dataTypeBool') } },
  { value: 'int', get label() { return $t('iotApp.schemaForm.dataTypeInt') } },
  { value: 'string', get label() { return $t('iotApp.schemaForm.dataTypeString') } },
  { value: 'float', get label() { return $t('iotApp.schemaForm.dataTypeFloat') } },
  { value: 'enum', get label() { return $t('iotApp.schemaForm.dataTypeEnum') } },
  { value: 'timestamp', get label() { return $t('iotApp.schemaForm.dataTypeTimestamp') } },
  { value: 'array', get label() { return $t('iotApp.schemaForm.dataTypeArray') } },
];

// 数组元素类型选项
export const arrayElementTypeOptions = [
  { value: 'int', get label() { return $t('iotApp.schemaForm.dataTypeInt') } },
  { value: 'float', get label() { return $t('iotApp.schemaForm.dataTypeFloat') } },
  { value: 'string', get label() { return $t('iotApp.schemaForm.dataTypeString') } },
  { value: 'bool', get label() { return $t('iotApp.schemaForm.dataTypeBool') } },
  { value: 'enum', get label() { return $t('iotApp.schemaForm.dataTypeEnum') } },
  { value: 'struct', get label() { return $t('iotApp.schemaForm.dataTypeStruct') } },
];

// 事件类型选项
export const eventTypeOptions = [
  { value: 'alert', get label() { return $t('iotApp.schemaForm.eventAlert') } },
  { value: 'fault', get label() { return $t('iotApp.schemaForm.eventFault') } },
  { value: 'info', get label() { return $t('iotApp.schemaForm.eventInfo') } },
];

/** 事件通知方向 / 行为调用方向（ActionDir） */
export const eventDirOptions = [
  { value: 'up', get label() { return $t('iotApp.schemaForm.dirUp') } },
  { value: 'down', get label() { return $t('iotApp.schemaForm.dirDown') } },
];

// 控制模式选项
export const controlModeOptions = [
  { value: 1, get label() { return $t('iotApp.schemaForm.controlGroupAndSingle') } },
  { value: 2, get label() { return $t('iotApp.schemaForm.controlSingle') } },
];

// 功能分类选项
export const funcGroupOptions = [
  { value: 1, get label() { return $t('iotApp.schemaForm.funcNormal') } },
  { value: 2, get label() { return $t('iotApp.schemaForm.funcSystem') } },
];

// 存储历史记录选项 记录模式
export const recordModeOptions = [
  { value: 1, get label() { return $t('iotApp.schemaForm.recordAll') } },
  { value: 2, get label() { return $t('iotApp.schemaForm.recordDiff') } },
  { value: 3, get label() { return $t('iotApp.schemaForm.recordNone') } },
];

// 密码类型选项
export const isPasswordOptions = [
  { value: 1, get label() { return $t('iotApp.schemaForm.yes') } },
  { value: 2, get label() { return $t('iotApp.schemaForm.no') } },
];

// 场景联动选项
export const sceneLinkageOptions = [
  { value: 1, get label() { return $t('iotApp.schemaForm.yes') } },
  { value: 2, get label() { return $t('iotApp.schemaForm.no') } },
];

// 布尔值初始值选项
export const boolInitialValueOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
];
