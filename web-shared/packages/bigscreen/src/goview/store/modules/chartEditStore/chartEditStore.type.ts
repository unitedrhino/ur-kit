import type { RequestParams } from '@/enums/httpEnum';
import type { ConfigType, CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';
import type { ChartColorsNameType, CustomColorsType, GlobalThemeJsonType } from '@/settings/chartThemes/index';

import { RequestBodyEnum, RequestContentTypeEnum, RequestDataTypeEnum, RequestHttpEnum, RequestHttpIntervalEnum } from '@/enums/httpEnum';
import { PreviewScaleEnum } from '@/enums/styleEnum';
import { FilterEnum } from '@/packages/index.type';
import { HistoryActionTypeEnum } from '@/store/modules/chartHistoryStore/chartHistoryStore.type';

// 编辑画布属性
export enum EditCanvasTypeEnum {
  ACTIVE_GROUP_ID = 'activeGroupId',
  // 组件编辑模式元数据
  COMPONENT_META = 'componentMeta',
  // 组件模式模拟数据预览开关
  COMPONENT_MOCK_PREVIEW = 'componentMockPreview',
  CREATE_COMPONENT_CONFIG = 'createComponentConfig',
  EDIT_CONTENT_DOM = 'editContentDom',
  EDIT_LAYOUT_DOM = 'editLayoutDom',
  // 编辑器模式（project / component）
  EDITOR_MODE = 'editorMode',
  EXTERNAL_FILE_DRAG = 'externalFileDrag',
  IS_CODE_EDIT = 'isCodeEdit',
  IS_CREATE = 'isCreate',
  IS_DRAG = 'isDrag',
  // 隔离编辑模式
  IS_GROUP_ISOLATION = 'isGroupIsolation',
  IS_SELECT = 'isSelect',
  LOCK_SCALE = 'lockScale',
  OFFSET = 'offset',
  SCALE = 'scale',
  USER_SCALE = 'userScale',
}

// 编辑区域
export type EditCanvasType = {
  // 当前处于隔离编辑模式的 Group ID
  [EditCanvasTypeEnum.ACTIVE_GROUP_ID]: string | undefined;
  // 组件编辑模式元数据
  [EditCanvasTypeEnum.COMPONENT_META]: ComponentMetaType | null;
  // 组件模式模拟数据预览开关（默认开启，跳过真实请求）
  [EditCanvasTypeEnum.COMPONENT_MOCK_PREVIEW]: boolean;
  [EditCanvasTypeEnum.CREATE_COMPONENT_CONFIG]: ConfigType | null;
  [EditCanvasTypeEnum.EDIT_CONTENT_DOM]: HTMLElement | null;
  // 编辑区域 DOM
  [EditCanvasTypeEnum.EDIT_LAYOUT_DOM]: HTMLElement | null;
  // 编辑器模式
  [EditCanvasTypeEnum.EDITOR_MODE]: EditorMode;
  // 外部文件拖入中（仅用于图片上传蒙层提示）
  [EditCanvasTypeEnum.EXTERNAL_FILE_DRAG]: boolean;
  // 代码编辑中
  [EditCanvasTypeEnum.IS_CODE_EDIT]: boolean;
  // 初始化创建
  [EditCanvasTypeEnum.IS_CREATE]: boolean;
  // 拖拽中
  [EditCanvasTypeEnum.IS_DRAG]: boolean;
  // 是否处于 Group 隔离编辑模式
  [EditCanvasTypeEnum.IS_GROUP_ISOLATION]: boolean;
  // 框选中
  [EditCanvasTypeEnum.IS_SELECT]: boolean;
  // 锁定缩放
  [EditCanvasTypeEnum.LOCK_SCALE]: boolean;
  // 偏移大小
  [EditCanvasTypeEnum.OFFSET]: number;
  // 缩放
  [EditCanvasTypeEnum.SCALE]: number;
  // 缩放
  [EditCanvasTypeEnum.USER_SCALE]: number;
};

// 编辑器模式
export type EditorMode = 'component' | 'project';

// 组件编辑模式元数据
export interface ComponentMetaType {
  category?: string;
  id: string;
  isGroup?: boolean;
  name: string;
  thumbnail?: string;
  version?: string;
}

// 滤镜/背景色/宽高主题等
export enum EditCanvasConfigEnum {
  BACKGROUND = 'background',
  BACKGROUND_IMAGE = 'backgroundImage',
  CHART_CUSTOM_THEME_COLOR_INFO = 'chartCustomThemeColorInfo',
  CHART_THEME_COLOR = 'chartThemeColor',
  CHART_THEME_SETTING = 'chartThemeSetting',
  HEIGHT = 'height',
  PREVIEW_SCALE_TYPE = 'previewScaleType',
  PROJECT_NAME = 'projectName',
  SELECT_COLOR = 'selectColor',
  VCHART_THEME_NAME = 'vChartThemeName',
  WIDTH = 'width',
}

export interface EditCanvasConfigType {
  // 背景色
  [EditCanvasConfigEnum.BACKGROUND]?: string;
  // 背景图片
  [EditCanvasConfigEnum.BACKGROUND_IMAGE]?: null | string;
  // 自定义图表主题颜色
  [EditCanvasConfigEnum.CHART_CUSTOM_THEME_COLOR_INFO]?: CustomColorsType[];
  // 图表主题颜色
  [EditCanvasConfigEnum.CHART_THEME_COLOR]: ChartColorsNameType;
  // 图表全局配置
  [EditCanvasConfigEnum.CHART_THEME_SETTING]: GlobalThemeJsonType;
  // 大屏高度
  [EditCanvasConfigEnum.HEIGHT]: number;
  // 预览展示方式
  [EditCanvasConfigEnum.PREVIEW_SCALE_TYPE]: PreviewScaleEnum;
  // 大屏名称
  [EditCanvasConfigEnum.PROJECT_NAME]?: string;
  // 图表主题颜色
  [EditCanvasConfigEnum.SELECT_COLOR]: boolean;
  // vChart 主题
  [EditCanvasConfigEnum.VCHART_THEME_NAME]: string;
  // 大屏宽度
  [EditCanvasConfigEnum.WIDTH]: number;
  [FilterEnum.BLEND_MODE]: string;
  // 滤镜-亮度
  [FilterEnum.BRIGHTNESS]: number;
  // 滤镜-对比度
  [FilterEnum.CONTRAST]: number;
  // 滤镜-启用
  [FilterEnum.FILTERS_SHOW]: boolean;
  // 滤镜-色相
  [FilterEnum.HUE_ROTATE]: number;
  // 滤镜-不透明度
  [FilterEnum.OPACITY]: number;
  [FilterEnum.ROTATE_X]: number;
  [FilterEnum.ROTATE_Y]: number;
  // 变换（暂不使用）
  [FilterEnum.ROTATE_Z]: number;
  // 滤镜-饱和度
  [FilterEnum.SATURATE]: number;
  [FilterEnum.SKEW_X]: number;
  [FilterEnum.SKEW_Y]: number;
  // 模板来源（系统维护字段）
  templateSource?: {
    id: string;
    name: string;
  };
}

// 坐标轴信息

export enum EditCanvasTypeEnum {
  START_X = 'startX',
  START_Y = 'startY',
  X = 'x',
  Y = 'y',
}

// 鼠标位置
export type MousePositionType = {
  // 开始 X
  [EditCanvasTypeEnum.START_X]: number;
  // 开始 Y
  [EditCanvasTypeEnum.START_Y]: number;
  // X
  [EditCanvasTypeEnum.X]: number;
  // y
  [EditCanvasTypeEnum.Y]: number;
};

// 操作目标
export type TargetChartType = {
  hoverId?: string;
  selectId: string[];
};

// 数据记录
export type RecordChartType = {
  charts: Array<CreateComponentGroupType | CreateComponentType> | CreateComponentGroupType | CreateComponentType;
  type: HistoryActionTypeEnum.COPY | HistoryActionTypeEnum.CUT;
};

// Store 枚举
export enum ChartEditStoreEnum {
  COMPONENT_LIST = 'componentList',
  EDIT_CANVAS = 'editCanvas',
  // 以下需要存储
  EDIT_CANVAS_CONFIG = 'editCanvasConfig',
  EDIT_RANGE = 'editRange',
  MOUSE_POSITION = 'mousePosition',
  RECORD_CHART = 'recordChart',
  REQUEST_GLOBAL_CONFIG = 'requestGlobalConfig',
  RIGHT_MENU_SHOW = 'rightMenuShow',
  TARGET_CHART = 'targetChart',
}

// IoT 设备属性数据源配置
export interface RequestIoTDeviceConfigType {
  // ── 聚合函数（log 模式单选） ──
  aggFunc: string;
  // ── 多聚合（agg 模式，后续迭代） ──
  aggFuncs: string[];

  areaIDs: string[];
  chartMode?: 'aggregate' | 'ranking' | 'share' | 'singleStat' | 'traditional' | 'trend';
  aggregateViewMode?: 'ranking' | 'share';
  customTimeRange?: [number, number]; // [startTime, endTime] 毫秒时间戳
  // ── 旧字段（向后兼容） ──
  dataID?: string;
  // ── dataID → 属性中文名 映射（由组件从物模型 schema 填充） ──
  dataIDNames?: Record<string, string>;
  // ── 属性选择（统一为数组） ──
  dataIDs: string[];

  // ── 属性单位映射（ECharts 轴标题自动填充） ──
  dataUnits?: Record<string, string>;
  dataView: 'agg' | 'device' | 'prop';

  // ── 旧字段（向后兼容） ──
  deviceName?: string;
  // ── 设备选择（统一为数组） ──
  deviceNames: string[];

  groupBy?: 'area' | 'device' | 'none';

  intervalUnit?: 'd' | 'h' | 'n' | 'y';
  latestTimeCustomFormat?: string;
  // ── prop+latest 时间格式化 ──
  latestTimeFormat?: string;
  limit?: number;
  // ── 旧字段（向后兼容，可选）──
  logAggEnabled?: boolean;
  logAggFunc?: string;
  logAggInterval?: string;

  logAggregationMode?: 'day' | 'intraday' | 'month' | 'week';

  // log 模式聚合间隔（如 '10m', '1h'）
  logInterval: string;

  logTimeRange: '1h' | '6h' | '7d' | '24h' | '30d' | 'custom';

  // ── BI 映射配置（Phase 3.2 字段映射器） ──
  mapping?: {
    isUserOverride?: boolean;
    // Phase 3.2 新字段（singleValue：单值指标映射，由 singleValueFieldMapping 写入）
    mappingMode?: 'nameValue' | 'singleValue' | 'xy';
    // Phase 3.1 旧字段（向后兼容）
    mode?: 'nameValue' | 'xy';
    // nameValue 模式（饼图/漏斗）
    nameField?: string;
    valueField?: string;
    xDimension?: 'device' | 'property' | 'time';
    // XY 模式（折线/柱状/散点）
    xField?: string;
    yFields?: string[];
    yMetrics?: string[];
  };

  mode: 'latest' | 'log';

  // ── 数据视图（系统自动推导，不再由用户手动选择） ──
  // 'prop': 单设备·多属性；'device': 多设备·同属性；'agg': 同属性·多聚合
  outputView?: 'distribution' | 'fields';
  productCategoryCode?: string;
  productCategoryID?: number | string;

  // ── 共有 ──
  productID: string;
  queryType?: 'deviceInfo' | 'deviceStatus' | 'property';
  // ── 模板级聚合配置（TASK-045 新增）──
  scope?: 'area' | 'device' | 'tenant';
  selectedFields?: string[];
  sortBy?: 'valueAsc' | 'valueDesc';
  timeRange?: 'custom' | 'month' | 'today' | 'week' | 'year' | 'yesterday';
  templateAutoField?: string;
}

// 请求公共类型
type RequestPublicConfigType = {
  // 时间单位（时分秒）
  requestIntervalUnit: RequestHttpIntervalEnum;
  // 请求内容
  requestParams: RequestParams;
};

// 数据池项类型
export type RequestDataPondItemType = {
  dataPondId: string;
  dataPondName: string;
  dataPondRequestConfig: RequestConfigType;
};

// 全局的图表请求配置
export interface RequestGlobalConfigType extends RequestPublicConfigType {
  // 公共数据池
  requestDataPond: RequestDataPondItemType[];
  // 组件定制轮询时间
  requestInterval: number;
  // 请求源地址
  requestOriginUrl?: string;
}

// 单个图表请求配置
export interface RequestConfigType extends RequestPublicConfigType {
  // 请求内容主体方式 普通/sql
  requestContentType: RequestContentTypeEnum;
  // 所选全局数据池的对应 id
  requestDataPondId?: string;
  // 获取数据的方式
  requestDataType: RequestDataTypeEnum;
  // 请求方式 get/post/del/put/patch
  requestHttpType: RequestHttpEnum;
  // 组件定制轮询时间
  requestInterval?: number;
  // IoT 设备属性配置（IoTDevice 模式）
  requestIoTDeviceConfig?: RequestIoTDeviceConfigType;
  // 请求体类型
  requestParamsBodyType: RequestBodyEnum;
  // SQL 请求对象
  requestSQLContent: {
    sql: string;
  };
  // 源后续的 url
  requestUrl?: string;
}

// Store 类型
export interface ChartEditStoreType {
  [ChartEditStoreEnum.COMPONENT_LIST]: Array<CreateComponentGroupType | CreateComponentType>;
  [ChartEditStoreEnum.EDIT_CANVAS]: EditCanvasType;
  [ChartEditStoreEnum.EDIT_CANVAS_CONFIG]: EditCanvasConfigType;
  [ChartEditStoreEnum.MOUSE_POSITION]: MousePositionType;
  [ChartEditStoreEnum.RECORD_CHART]?: RecordChartType;
  [ChartEditStoreEnum.REQUEST_GLOBAL_CONFIG]: RequestGlobalConfigType;
  [ChartEditStoreEnum.RIGHT_MENU_SHOW]: boolean;
  [ChartEditStoreEnum.TARGET_CHART]: TargetChartType;
}

// 存储数据类型
export interface ChartEditStorage {
  [ChartEditStoreEnum.COMPONENT_LIST]: Array<CreateComponentGroupType | CreateComponentType>;
  [ChartEditStoreEnum.EDIT_CANVAS_CONFIG]: EditCanvasConfigType;
  [ChartEditStoreEnum.REQUEST_GLOBAL_CONFIG]: RequestGlobalConfigType;
}
