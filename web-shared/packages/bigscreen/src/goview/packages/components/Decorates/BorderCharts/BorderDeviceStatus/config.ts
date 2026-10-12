import type { ConfigType, CreateComponentType } from '@/packages/index.type';

import { RequestBodyEnum, RequestDataTypeEnum, RequestHttpEnum, RequestHttpIntervalEnum } from '@/enums/httpEnum';
import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';
import { PublicConfigClass } from '@/packages/public';
import { chartInitConfig } from '@/settings/designSetting';
import cloneDeep from 'lodash/cloneDeep';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type';

export const BorderDeviceStatusConfig: ConfigType = {
  key: 'BorderDeviceStatus',
  chartKey: 'VBorderDeviceStatus',
  conKey: 'VCBorderDeviceStatus',
  title: '边框-设备状态',
  category: ChatCategoryEnum.BORDER_CHART,
  categoryName: ChatCategoryEnumName.BORDER_CHART,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMPOSITE,
  image: 'border04.png',
};

// 字重类型
export type FontWeightType = 'bold' | 'normal';

// 完整文字属性接口
export interface FontStyleOption {
  blurShadow: number;
  colorShadow: string;
  fontColor: string;
  fontSize: number;
  fontWeight: FontWeightType;
  hShadow: number;
  letterSpacing: number;
  showShadow: boolean;
  vShadow: number;
}

// 比较运算符
export type CompareOperator = '<' | '<=' | '=' | '>' | '>=';

// 阈值颜色映射
export interface ThresholdColorType {
  color: string; // 颜色值
  operator: CompareOperator; // 比较运算符
  value: number; // 阈值百分比
}

// 设备指标类型
export interface DeviceMetricType {
  color: string; // 兜底默认色
  count: number; // 设备数量
  label: string; // "正常" / "离线" / "告警"
  percent: number; // 百分比 0-100
  thresholds: ThresholdColorType[]; // 阈值颜色映射（从大到小排列）
  useThreshold: boolean; // 是否启用阈值配色
}

// 边框04专用配置
export interface Border04OptionType {
  backgroundColor: string;
  borderTitle: string;
  borderTitleColor: string;
  borderTitleHeight: number;
  borderTitleSize: number;
  borderTitleWidth: number;
  colors: string[];
  dur?: number;
}

// 环形配置
export interface RingMetricsOptionType {
  countOption: FontStyleOption; // 数量样式
  labelOption: FontStyleOption; // 标签样式
  layoutGap: number; // 环形间距（默认20px）
  metrics: DeviceMetricType[]; // 3个指标数组
  percentOption: FontStyleOption; // 百分比样式
  ringSize: number; // 环形直径（默认120px）
  ringThickness: number; // 环形厚度（默认12px）
}

// 默认设备指标
const defaultMetrics: DeviceMetricType[] = [
  {
    label: '正常',
    percent: 85,
    count: 85,
    color: '#52c41a',
    useThreshold: true,
    thresholds: [{ operator: '>=', value: 80, color: '#52c41a' }],
  },
  {
    label: '离线',
    percent: 10,
    count: 10,
    color: '#8c8c8c',
    useThreshold: true,
    thresholds: [{ operator: '>=', value: 20, color: '#faad14' }],
  },
  {
    label: '告警',
    percent: 5,
    count: 5,
    color: '#ff4d4f',
    useThreshold: true,
    thresholds: [{ operator: '>=', value: 0, color: '#ff4d4f' }],
  },
];

// 默认环形配置
const ringMetricsOption: RingMetricsOptionType = {
  metrics: cloneDeep(defaultMetrics),
  ringSize: 120,
  ringThickness: 12,
  layoutGap: 20,
  labelOption: {
    fontSize: 16,
    fontColor: '#aaa',
    fontWeight: 'normal',
    letterSpacing: 0,
    showShadow: false,
    hShadow: 0,
    vShadow: 0,
    blurShadow: 8,
    colorShadow: '#0075ff',
  },
  percentOption: {
    fontSize: 24,
    fontColor: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0,
    showShadow: false,
    hShadow: 0,
    vShadow: 0,
    blurShadow: 8,
    colorShadow: '#0075ff',
  },
  countOption: {
    fontSize: 18,
    fontColor: '#4A9EF8FF',
    fontWeight: 'normal',
    letterSpacing: 0,
    showShadow: false,
    hShadow: 0,
    vShadow: 0,
    blurShadow: 8,
    colorShadow: '#0075ff',
  },
};

// 默认边框配置
const borderOption: Border04OptionType = {
  borderTitle: '设备状态',
  borderTitleWidth: 250,
  borderTitleHeight: 32,
  borderTitleSize: 18,
  borderTitleColor: '#fff',
  colors: ['#8aaafb', '#1f33a2'],
  backgroundColor: '#00000000',
  dur: 0.5,
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  // 设置合适的默认尺寸，3 个环形进度条需要足够宽度
  public override attr = { ...chartInitConfig, w: 500, h: 300, zIndex: -1 };
  public chartConfig = cloneDeep(BorderDeviceStatusConfig);
  // 默认 filter 脚本：将设备列表转换为 { normal, offline, alarm } 格式
  public override filter: any = `const list = data?.list || []
const total = list.length
const normal = list.filter(d => d.isOnline === 1).length
const offline = list.filter(d => d.isOnline !== 1).length
const alarm = 0
return { normal, offline, alarm }`;
  public key = BorderDeviceStatusConfig.key;
  public option = {
    // 边框配置（固定 Border04）
    borderKey: 'Border04',
    borderOption: cloneDeep(borderOption),
    // 环形指标配置
    ringMetricsOption: cloneDeep(ringMetricsOption),
    // 布局配置
    padding: 20,
  };
  // 默认请求配置：AJAX 模式调用设备列表接口
  public override request = {
    requestDataType: RequestDataTypeEnum.AJAX,
    requestHttpType: RequestHttpEnum.POST,
    requestUrl: '/api/v1/things/device/info/get-list',
    requestInterval: 60,
    requestIntervalUnit: RequestHttpIntervalEnum.SECOND,
    requestContentType: 0,
    requestParamsBodyType: RequestBodyEnum.JSON,
    requestSQLContent: { sql: 'select * from  where' },
    requestParams: {
      Body: {
        'form-data': {},
        'x-www-form-urlencoded': {},
        json: '{"page":{"page":1,"pageSize":500}}',
        xml: '',
      },
      Header: {},
      Params: {},
    },
    requestIoTDeviceConfig: {
      dataView: 'prop' as const,
      productID: '',
      areaIDs: [] as string[],
      mode: 'latest' as const,
      logTimeRange: '1h' as const,
      customTimeRange: undefined,
      logInterval: '10m',
      deviceName: '',
      deviceNames: [] as string[],
      dataIDs: [] as string[],
      dataID: '',
      aggFunc: 'last',
      aggFuncs: ['avg', 'min', 'max'] as string[],
      logAggEnabled: false,
      logAggFunc: 'avg' as const,
      logAggInterval: '10m',
      latestTimeFormat: 'HH:mm:ss',
      latestTimeCustomFormat: '',
    },
  };
}
