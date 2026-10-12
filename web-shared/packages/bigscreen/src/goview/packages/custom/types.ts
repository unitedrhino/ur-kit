import type { RequestConfigType, RequestIoTDeviceConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

/** 极简面板编辑模式：table=列表型 | form=单值型 | none=无数据型 | composite=组合组件型 */
export type SimplifiedEditMode = 'composite' | 'form' | 'none' | 'table';

export type CompositeSourceType = 'ajax' | 'iot' | 'static';
export type CompositeOutputKind = 'array' | 'dataset' | 'object' | 'scalar';
export type CompositeOutputTransformType = 'aggregate' | 'identity' | 'pick' | 'script' | 'toDataset';
export type CompositeBindingWriteMode = 'dataset' | 'patch' | 'path';

/** 组合组件顶层数据源 */
export interface CompositeDataSource {
  // requestIoTDeviceConfig 需从 RequestConfigType 中剔除后单独声明为 Partial，
  // 避免与 RequestConfigType 的同名必填字段交叉后强约束，导致局部更新（仅 queryType）无法通过类型检查
  config?: Omit<Partial<RequestConfigType>, 'requestIoTDeviceConfig'> & {
    requestIoTDeviceConfig?: Partial<RequestIoTDeviceConfigType>;
    staticPayload?: any;
  };
  enabled: boolean;
  id: string;
  name: string;
  type: CompositeSourceType;
}

/** 组合组件输出口：从 source 或其它 output 派生的中间结果 */
export interface CompositeDataOutput {
  aggregateKeys?: string[];
  fromOutputId?: string;
  id: string;
  kind: CompositeOutputKind;
  name: string;
  path?: string;
  sourceId: string;
  transformType: CompositeOutputTransformType;
}

/** 组合组件子绑定：output → 子组件属性 */
export interface CompositeChildBinding {
  /** 子组件 ID（对应 groupList 中的 child.id） */
  childId: string;
  /** 兼容旧结构：目标字段路径 */
  childProp: string;
  /** 来源 output 标识 */
  outputId?: string;
  /** 兼容旧结构：来源字段路径 */
  sourceField: string;
  /** 目标字段路径（lodash path，如 'option.dataset'） */
  targetPath?: string;
  /** 来源值路径（如 'days' / 'stats.avg'） */
  valuePath?: string;
  /** 写入模式：path=写单值路径，dataset=写 dataset，patch=对象合并 */
  writeMode?: CompositeBindingWriteMode;
}

/** 组合组件顶层数据适配器配置 */
export interface CompositeAdapterConfig {
  /** 数据接口地址 */
  api: string;
  /** 子组件字段绑定列表 */
  childBindings: CompositeChildBinding[];
  /** 请求方法 */
  method: 'GET' | 'POST';
  /** 兼容模式：legacyApi=旧接口直连；dataBus=新多数据源模型 */
  mode?: 'dataBus' | 'legacyApi';
  /** 输出口列表 */
  outputs: CompositeDataOutput[];
  /** 顶层数据源列表 */
  sources: CompositeDataSource[];
}

const createCompositeNodeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createCompositeDataSource = (partial?: Partial<CompositeDataSource>): CompositeDataSource => ({
  config: partial?.config ?? {},
  enabled: partial?.enabled ?? true,
  id: partial?.id ?? createCompositeNodeId('source'),
  name: partial?.name ?? '主数据源',
  type: partial?.type ?? 'static',
});

export const createCompositeDataOutput = (sourceId: string, partial?: Partial<CompositeDataOutput>): CompositeDataOutput => ({
  aggregateKeys: partial?.aggregateKeys ?? [],
  fromOutputId: partial?.fromOutputId,
  id: partial?.id ?? createCompositeNodeId('output'),
  kind: partial?.kind ?? 'object',
  name: partial?.name ?? '原始输出',
  path: partial?.path ?? '',
  sourceId: partial?.sourceId ?? sourceId,
  transformType: partial?.transformType ?? 'identity',
});

export const createCompositeChildBinding = (childId: string, partial?: Partial<CompositeChildBinding>): CompositeChildBinding => ({
  childId,
  childProp: partial?.childProp ?? partial?.targetPath ?? '',
  outputId: partial?.outputId,
  sourceField: partial?.sourceField ?? partial?.valuePath ?? '',
  targetPath: partial?.targetPath ?? partial?.childProp ?? '',
  valuePath: partial?.valuePath ?? partial?.sourceField ?? '',
  writeMode: partial?.writeMode ?? 'path',
});

export const createDefaultCompositeAdapterConfig = (childIds: string[]): CompositeAdapterConfig => {
  const primarySource = createCompositeDataSource({
    id: 'source_primary',
    name: '主数据源',
    type: 'static',
  });
  const rawOutput = createCompositeDataOutput(primarySource.id, {
    id: 'output_raw',
    kind: 'object',
    name: '原始输出',
    transformType: 'identity',
  });

  return {
    api: '',
    childBindings: childIds.map((childId) =>
      createCompositeChildBinding(childId, {
        outputId: rawOutput.id,
      }),
    ),
    method: 'GET',
    mode: 'dataBus',
    outputs: [rawOutput],
    sources: [primarySource],
  };
};

export const normalizeCompositeAdapterConfig = (adapter: CompositeAdapterConfig | undefined, childIds: string[]): CompositeAdapterConfig => {
  const fallback = createDefaultCompositeAdapterConfig(childIds);
  const current = adapter ?? fallback;

  const sources = current.sources?.length
    ? current.sources.map((source) => createCompositeDataSource(source))
    : [
        createCompositeDataSource({
          id: 'source_primary',
          name: '主数据源',
          type: current.api ? 'ajax' : 'static',
        }),
      ];

  const primarySourceId = sources[0]?.id ?? 'source_primary';
  const outputs = current.outputs?.length
    ? current.outputs.map((output) => createCompositeDataOutput(output.sourceId || primarySourceId, output))
    : [
        createCompositeDataOutput(primarySourceId, {
          id: 'output_raw',
          kind: 'object',
          name: '原始输出',
          transformType: 'identity',
        }),
      ];

  const defaultOutputId = outputs[0]?.id;
  const existingBindings = current.childBindings?.length
    ? current.childBindings
    : childIds.map((childId) => createCompositeChildBinding(childId, { outputId: defaultOutputId }));

  return {
    api: current.api ?? '',
    childBindings: existingBindings.map((binding, index) => {
      const fallbackChildId = childIds[index] ?? binding.childId ?? '';
      return createCompositeChildBinding(fallbackChildId, {
        ...binding,
        outputId: binding.outputId ?? defaultOutputId,
      });
    }),
    method: current.method ?? 'GET',
    mode: current.mode ?? 'dataBus',
    outputs,
    sources,
  };
};

/** 表格模式的列定义 */
export interface TableColumnDef {
  editable?: boolean; // 默认 true
  key: string; // 字段名，对应 dataset.source 中的 key
  label: string; // 列显示名
  // 兼容展示名：SimplifiedDataColumn 与历史配置数据使用 title，展示时优先 title
  title?: string;
  type: 'number' | 'string';
}

/** 表单模式的字段定义 */
export interface FormFieldDef {
  defaultValue?: any;
  key: string; // 写入 option 的路径，如 'title.text'
  label: string; // 字段显示名
  options?: { label: string; value: any }[];
  type: 'color' | 'number' | 'select' | 'text';
}

/** 挂载在 option._simplifiedData 上的结构 */
export interface SimplifiedDataType {
  /** IoT 数据源元数据（运行时由 useChartDataFetch 自动注入，适配器 + SmartMapping 读取） */
  _iotMeta?: {
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
    timeAxisLabelFormat?: string;
  };
  /** 指定数据适配器类型，优先于 chartKey 查表 */
  adapterType?: string;
  /** Phase 3: BI 映射配置（从 requestIoTDeviceConfig.mapping 桥接，适配器读取） */
  chartMapping?: {
    isUserOverride?: boolean;
    mode: 'nameValue' | 'xy';
    nameField?: 'device' | 'name';
    valueField?: string;
    xDimension?: 'device' | 'property' | 'time';
    yMetrics?: string[];
  };
  /** 表格模式：列定义 */
  columns?: TableColumnDef[];
  /** 组合组件顶层数据适配器配置（editMode === 'composite' 时有效） */
  compositeAdapter?: CompositeAdapterConfig;
  /** 编辑模式 */
  editMode: SimplifiedEditMode;
  /** 属性白名单（右侧"定制"Tab 仅展示这些项） */
  exposedProps?: string[];
  /** 表单模式：字段定义 */
  fields?: FormFieldDef[];
  /** 标记为由 Group 生成的组合组件 */
  isComposite?: true;
  /** 用户在 SmartMapping UI 中配置的字段映射（防御 2：UI 优先于推导） */
  mappings?: Record<string, string | string[]>;
  /** 表格模式：行数据（扁平数组） */
  rows?: Record<string, any>[];
  /** 表单模式：字段值 */
  values?: Record<string, any>;
}
