import { createOptionsAndMapping } from '@vben/saas';

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
  [schemaTypeEnum.PROPERTY, '属性', 'success'],
  [schemaTypeEnum.EVENT, '事件', 'primary'],
  [schemaTypeEnum.ACTION, '行为', 'warning'],
]);


//用户权限操作: 1:r(只读) 3:rw(可读可写)
export const schemaUserPermEnum = {
  READ_ONLY: 1,
  READ_WRITE: 3,
} as const;
export const schemaUserPermOptions = [
  { value: schemaUserPermEnum.READ_ONLY, label: '只读', color: 'success' },
  { value: schemaUserPermEnum.READ_WRITE, label: '可读可写', color: 'primary' },
];

// 设备影子选项
export const shadowTypeOptions = [
  { value: true, label: '开启' },
  { value: false, label: '关闭' },
];

// 读写类型选项
export const modeOptions = [
  { value: 'rw', label: '读写' },
  { value: 'r', label: '只读' },
];

// 数据类型选项（属性用） - 根据 devices-model/handle/config.ts
export const dataTypeOptions = [
  { value: 'bool', label: '布尔型' },
  { value: 'int', label: '整数型' },
  { value: 'string', label: '字符串' },
  { value: 'float', label: '浮点型' },
  { value: 'enum', label: '枚举整型' },
  { value: 'timestamp', label: '时间型' },
  { value: 'struct', label: '结构体' },
  { value: 'array', label: '数组' },
];

// 结构体内部数据类型选项（不包含 struct 本身，避免无限嵌套）
export const dataTypeStructOptionsList = [
  { value: 'bool', label: '布尔型' },
  { value: 'int', label: '整数型' },
  { value: 'string', label: '字符串' },
  { value: 'float', label: '浮点型' },
  { value: 'enum', label: '枚举整型' },
  { value: 'timestamp', label: '时间型' },
  { value: 'array', label: '数组' },
];

// 数组元素类型选项
export const arrayElementTypeOptions = [
  { value: 'int', label: '整数型' },
  { value: 'float', label: '浮点型' },
  { value: 'string', label: '字符串' },
  { value: 'bool', label: '布尔型' },
  { value: 'enum', label: '枚举整型' },
  { value: 'struct', label: '结构体' },
];

// 事件类型选项
export const eventTypeOptions = [
  { value: 'alert', label: '告警' },
  { value: 'fault', label: '故障' },
  { value: 'info', label: '信息' },
];

// 控制模式选项（在 devices-model 中已注释，但保留以备后用）
// export const controlModeOptions = [
//   { value: 1, label: '全部' },
//   { value: 2, label: '只能单控' },
// ];

// 功能分类选项
export const funcGroupOptions = [
  { value: 1, label: '普通功能' },
  { value: 2, label: '系统功能' },
];

// 存储历史记录选项 记录模式
export const recordModeOptions = [
  { value: 1, label: '记录历史记录' },
  { value: 2, label: '只记录差异值' },
  { value: 3, label: '不记录历史记录' },
];

// 密码类型选项
export const isPasswordOptions = [
  { value: 1, label: '是' },
  { value: 2, label: '否' },
];

// 场景联动选项
export const sceneLinkageOptions = [
  { value: 1, label: '是' },
  { value: 2, label: '否' },
];

// 布尔值初始值选项
export const boolInitialValueOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
];
