import type { GlobalThemeJsonType } from '@/settings/chartThemes';
import type { IoTTimeAxisLabelFormat } from './iotAggregation';

/** IoT 数据源元数据，附带在 dataset 上传递到适配器层 */
export interface IoTMetadata {
  /** 最新属性非良好或未上报的警示，键为设备与属性，不参与统计。 */
  qualityWarnings?: Record<string, string>;
  /** 数据视图: prop(单设备多属性) | device(多设备同属性) | agg(同属性多聚合) | deviceStatus(设备状态统计) | deviceInfo(设备信息) */
  dataView: 'prop' | 'device' | 'agg' | 'deviceStatus' | 'deviceInfo';
  /** 输出视图: distribution(分布表) | fields(字段宽表) */
  outputView?: 'distribution' | 'fields';
  /** 数据模式: latest(最新值轮询) | log(历史时序) */
  mode: 'latest' | 'log';
  /** 维度含义映射，如 { time: '时间', Ua: '相电压Ua' } */
  dimensionLabels?: Record<string, string>;
  /** 标记是否经累积器转换（prop+latest 累积为时序后为 true） */
  _accumulated?: boolean;
  /** 属性单位映射 { dimensionName: unit }，用于 yAxis.name 自动填充 */
  dataUnits?: Record<string, string>;
  /** 时间轴标签格式 */
  timeAxisLabelFormat?: IoTTimeAxisLabelFormat;
}

/** 第一阶段标准化 IoT meta 协议（运行态继续兼容 _iotMeta 命名） */
export interface IoTDatasetMeta {
  chartKey: string;
  dataView: IoTMetadata['dataView'];
  mode: IoTMetadata['mode'];
  outputView?: IoTMetadata['outputView'];
  dataUnits?: IoTMetadata['dataUnits'];
  timeAxisLabelFormat?: IoTMetadata['timeAxisLabelFormat'];
  mappings?: {
    itemName?: string;
    value?: string;
    x?: string;
    y?: string[];
  };
  extra?: Record<string, any>;
}

export type IoTDatasetValue = {
  dimensions: string[];
  source: Record<string, any>[];
} | number | string;

/** 第一阶段标准化 IoT dataset 协议 */
export interface StandardIoTDataset {
  dataset: IoTDatasetValue;
  meta: IoTDatasetMeta;
}

export interface IoTConsumerContext {
  chartKey: string;
  iotMeta?: IoTMetadata;
  mappingMode: 'nameValue' | 'xy' | null;
  mappings?: {
    itemName?: string;
    value?: string;
    x?: string;
    y?: string[];
  };
}

/** BI 映射配置：用户在 Step 2 中设定的 X/Y 轴绑定 */
export interface ChartMapping {
  /** X 轴维度：时间 / 设备名称 / 属性名称 */
  xDimension: 'time' | 'device' | 'property';
  /** Y 轴度量列表（属性名或设备别名） */
  yMetrics: string[];
  /** 是否用户手动设置过（区分 Smart Default vs 用户覆盖） */
  isUserOverride?: boolean;
}

/** @deprecated Phase 3.2 不再使用，保留供后续迭代参考。XY 映射模式（折线/柱状/散点） */
export interface XYMapping {
  mode: 'xy'
  xDimension: 'time' | 'device' | 'property'
  yMetrics: string[]
  isUserOverride?: boolean
}

/** name+value 映射模式（饼图/漏斗） */
export interface NameValueMapping {
  mode: 'nameValue'
  nameField: 'device' | 'name'
  valueField: string
  isUserOverride?: boolean
}

export type ChartMappingV2 = XYMapping | NameValueMapping

/** parseIoTMetaToSeries 返回的系列配置 */
export interface IoTSeriesConfig {
  series: Array<{
    type: string;
    encode: { x: string; y: string };
    name: string;
    [key: string]: any;
  }>;
  /** ECharts xAxis 配置，用于时间轴等特殊场景 */
  xAxis?: {
    type: 'time' | 'category' | 'value';
    [key: string]: any;
  };
}

export interface SimplifiedDataColumn {
  key: string;
  title: string;
  type: 'number' | 'string';
}

export interface SimplifiedDataGroup {
  key: string;
  title: string;
  columns: SimplifiedDataColumn[];
  rows: Record<string, any>[];
}

export interface SimplifiedDataState {
  columns?: SimplifiedDataColumn[];
  rows?: Record<string, any>[];
  groups?: SimplifiedDataGroup[];
  mappings?: Record<string, string | string[]>;
}

export interface MappingFieldDef {
  key: string;
  label: string;
  required?: boolean;
  multiple?: boolean;
  addable?: boolean;
  acceptTypes?: ('number' | 'string')[];
}

export type MappingSchema =
  | { fields: MappingFieldDef[]; mode: 'flat' }
  | { groups: Array<{ fields: MappingFieldDef[]; key: string; title: string }>; mode: 'grouped' }
  | { mode: 'none' };

/** 适配器接口 */
export interface DataAdapter {
  /**
   * 扁平行数据 → 完整 option 片段
   * 纯函数漏斗：不关心数据来源，只负责转换
   */
  toOption(rows: Record<string, any>[], currentOption: GlobalThemeJsonType): Partial<GlobalThemeJsonType>;

  /**
   * 完整 option → SimplifiedDataState（首次打开面板时的反向解析）
   */
  fromOption(option: GlobalThemeJsonType): SimplifiedDataState;

  /** 返回字段映射配置，无映射需求时可不实现 */
  getMappingSchema?(): MappingSchema;

  /** 返回数据摘要文本，用于面板顶部概览展示 */
  getSummaryText?(state: SimplifiedDataState): string;
}
