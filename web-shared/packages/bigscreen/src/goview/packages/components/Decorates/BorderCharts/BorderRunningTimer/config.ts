import type { ConfigType, CreateComponentType } from '@/packages/index.type';

import { RequestBodyEnum, RequestDataTypeEnum, RequestHttpEnum, RequestHttpIntervalEnum } from '@/enums/httpEnum';
import { ChartFrameEnum, PackagesCategoryEnum } from '@/packages/index.type';
import { PublicConfigClass } from '@/packages/public';
import { chartInitConfig } from '@/settings/designSetting';
import cloneDeep from 'lodash/cloneDeep';

import { ChatCategoryEnum, ChatCategoryEnumName } from '../../index.type';

export const BorderRunningTimerConfig: ConfigType = {
  key: 'BorderRunningTimer',
  chartKey: 'VBorderRunningTimer',
  conKey: 'VCBorderRunningTimer',
  title: '边框-累计运行时间',
  category: ChatCategoryEnum.BORDER_CHART,
  categoryName: ChatCategoryEnumName.BORDER_CHART,
  package: PackagesCategoryEnum.DECORATES,
  chartFrame: ChartFrameEnum.COMPOSITE,
  image: 'border04.png',
};

// 翻牌器类型
export type FlipType = 'down' | 'up';

// 翻牌器配置接口
export interface FlipperOptionType {
  dataset: number | string;
  flipperBgColor: string;
  flipperBorderWidth: number;
  flipperGap: number;
  flipperHeight: number;
  flipperLength: number;
  flipperRadius: number;
  flipperSpeed: number;
  flipperTextColor: string;
  flipperType: FlipType;
  flipperWidth: number;
}

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

// 单位配置
export interface UnitOptionType extends FontStyleOption {
  text: string;
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

// 天数翻牌器默认配置
const dayOption: FlipperOptionType = {
  dataset: 0,
  flipperLength: 4,
  flipperBgColor: '#16293E',
  flipperTextColor: '#4A9EF8FF',
  flipperWidth: 30,
  flipperHeight: 50,
  flipperRadius: 5,
  flipperGap: 8,
  flipperType: 'down',
  flipperSpeed: 450,
  flipperBorderWidth: 0,
};

// 小时翻牌器默认配置
const hourOption: FlipperOptionType = {
  dataset: 0,
  flipperLength: 2,
  flipperBgColor: '#16293E',
  flipperTextColor: '#4A9EF8FF',
  flipperWidth: 30,
  flipperHeight: 50,
  flipperRadius: 5,
  flipperGap: 8,
  flipperType: 'down',
  flipperSpeed: 450,
  flipperBorderWidth: 0,
};

// 天数单位配置
const dayUnitOption: UnitOptionType = {
  text: '天',
  fontSize: 18,
  fontColor: '#4A9EF8FF',
  fontWeight: 'normal',
  letterSpacing: 0,
  showShadow: false,
  hShadow: 0,
  vShadow: 0,
  blurShadow: 8,
  colorShadow: '#0075ff',
};

// 小时单位配置
const hourUnitOption: UnitOptionType = {
  text: '小时',
  fontSize: 18,
  fontColor: '#4A9EF8FF',
  fontWeight: 'normal',
  letterSpacing: 0,
  showShadow: false,
  hShadow: 0,
  vShadow: 0,
  blurShadow: 8,
  colorShadow: '#0075ff',
};

// 边框配置
const borderOption: Border04OptionType = {
  borderTitle: '累计运行时间',
  borderTitleWidth: 250,
  borderTitleHeight: 32,
  borderTitleSize: 18,
  borderTitleColor: '#fff',
  colors: ['#8aaafb', '#1f33a2'],
  backgroundColor: '#00000000',
  dur: 0.5,
};

export default class Config extends PublicConfigClass implements CreateComponentType {
  public override attr = { ...chartInitConfig, w: 900, h: 100, zIndex: -1 };
  public chartConfig = cloneDeep(BorderRunningTimerConfig);
  // filter 脚本：自动识别两种响应格式
  // 平台模式 (uptime API): 响应直接含 days/hours 字段，直接透传
  // 设备模式 (get-one API): 响应含 firstLogin 时间戳，换算为天/小时
  public override filter: any = `if (data?.days !== undefined) return { days: data.days ?? 0, hours: data.hours ?? 0 }
const fl = parseInt(data?.firstLogin || 0)
if (!fl || fl <= 0) return { days: 0, hours: 0 }
const now = Math.floor(Date.now() / 1000)
const diff = now - fl
if (diff <= 0) return { days: 0, hours: 0 }
return { days: Math.floor(diff / 86400), hours: Math.floor((diff % 86400) / 3600) }`;
  public key = BorderRunningTimerConfig.key;
  public option = {
    borderKey: 'Border04',
    borderOption: cloneDeep(borderOption),
    dayOption: cloneDeep(dayOption),
    hourOption: cloneDeep(hourOption),
    dayUnitOption: cloneDeep(dayUnitOption),
    hourUnitOption: cloneDeep(hourUnitOption),
    padding: 20,
    // 时间来源: 'platform' = 平台运行时间(默认), 'device' = 设备运行时间
    timeSource: 'platform' as 'device' | 'platform',
    // 设备模式下的产品/设备配置
    deviceConfig: {
      productID: '',
      deviceName: '',
    },
  };
  // 默认请求配置：平台模式调用 view 服务 uptime 接口
  public override request = {
    requestDataType: RequestDataTypeEnum.AJAX,
    requestHttpType: RequestHttpEnum.POST,
    requestUrl: '/api/v1/view/system/uptime',
    requestInterval: 3600,
    requestIntervalUnit: RequestHttpIntervalEnum.SECOND,
    requestContentType: 0,
    requestParamsBodyType: RequestBodyEnum.JSON,
    requestSQLContent: { sql: 'select * from  where' },
    requestParams: {
      Body: {
        'form-data': {},
        'x-www-form-urlencoded': {},
        json: '{}',
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
