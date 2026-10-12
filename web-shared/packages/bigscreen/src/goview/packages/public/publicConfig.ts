import type { SimplifiedDataType } from '@/packages/custom/types';
import type { CreateComponentGroupType, CreateComponentType, PublicConfigType } from '@/packages/index.type';
import type { RequestConfigType } from '@/store/modules/chartEditStore/chartEditStore.type'

import { BaseEvent, EventLife } from '@/enums/eventEnum'
import {
  RequestBodyEnum,
  RequestContentTypeEnum,
  RequestDataTypeEnum,
  RequestHttpEnum,
  RequestHttpIntervalEnum
} from '@/enums/httpEnum'
import {
  ChartFrameEnum
  
  
  
} from '@/packages/index.type'
import { chartInitConfig, groupTitle  } from '@/settings/designSetting'
import { getUUID } from '@/utils'
import cloneDeep from 'lodash/cloneDeep'

// 请求基础属性
export const requestConfig: RequestConfigType = {
  requestDataType: RequestDataTypeEnum.STATIC,
  requestHttpType: RequestHttpEnum.GET,
  requestUrl: '',
  requestInterval: undefined,
  requestIntervalUnit: RequestHttpIntervalEnum.SECOND,
  requestContentType: RequestContentTypeEnum.DEFAULT,
  requestParamsBodyType: RequestBodyEnum.NONE,
  requestSQLContent: {
    sql: 'select * from  where'
  },
  requestParams: {
    Body: {
      'form-data': {},
      'x-www-form-urlencoded': {},
      json: '',
      xml: ''
    },
    Header: {},
    Params: {}
  },
  requestIoTDeviceConfig: {
    queryType: 'property' as const,
    outputView: 'distribution' as const,
    dataView: 'prop' as const,
    productID: '',
    productCategoryCode: '',
    productCategoryID: undefined,
    areaIDs: [] as string[],
    mode: 'latest' as const,
    logTimeRange: '1h' as const,
    customTimeRange: undefined,
    logAggregationMode: 'intraday' as const,
    logInterval: '10m',
    deviceNames: [] as string[],
    dataIDs: [] as string[],
    aggFunc: 'last',
    aggFuncs: ['avg', 'min', 'max'] as string[],
    logAggEnabled: false,
    logAggFunc: 'avg' as const,
    logAggInterval: '10m',
    latestTimeFormat: 'HH:mm:ss',
    latestTimeCustomFormat: '',
    mapping: undefined,
    selectedFields: [] as string[],
    // ── 模板级聚合配置默认值（TASK-045 新增）──
    scope: 'tenant',
    groupBy: 'none',
    chartMode: 'singleStat',
    timeRange: 'today',
    intervalUnit: 'h',
    sortBy: 'valueDesc',
    limit: 10,
  },
}

// 单实例类（implements PublicConfigType，不继承基类，故字段不加 override 修饰符）
export class PublicConfigClass implements PublicConfigType {
  // 基本信息
  public attr = { ...chartInitConfig, zIndex: -1 }
  // 事件
  public events = {
    baseEvent: {
      [BaseEvent.ON_CLICK]: undefined,
      [BaseEvent.ON_DBL_CLICK]: undefined,
      [BaseEvent.ON_MOUSE_ENTER]: undefined,
      [BaseEvent.ON_MOUSE_LEAVE]: undefined
    },
    advancedEvents: {
      [EventLife.VNODE_MOUNTED]: undefined,
      [EventLife.VNODE_BEFORE_MOUNT]: undefined
    },
    interactEvents: []
  }
  // 数据过滤
  public filter = undefined
  public id = getUUID()
  public isGroup = false
  // 预览
  public preview = {
    overFlowHidden: false
  }
  // 请求
  public request = cloneDeep(requestConfig)
  // 状态
  public status = {
    lock: false,
    hide: false
  }
  // 基本样式
  public styles = {
    // 使用滤镜
    filterShow: false,
    // 色相
    hueRotate: 0,
    // 饱和度
    saturate: 1,
    // 对比度
    contrast: 1,
    // 亮度
    brightness: 1,
    // 透明
    opacity: 1,

    // 旋转
    rotateZ: 0,
    rotateX: 0,
    rotateY: 0,

    // 倾斜
    skewX: 0,
    skewY: 0,

    // 混合模式
    blendMode: 'normal',

    // 动画
    animations: []
  }
}

// 多选成组类
export class PublicGroupConfigClass extends PublicConfigClass implements CreateComponentGroupType {
  // 基本信息
  public override attr = { w: 0, h: 0, x: 0, y: 0, offsetX: 0, offsetY: 0, zIndex: -1 }
  // 名称
  public chartConfig: CreateComponentGroupType['chartConfig'] = {
    key: 'group',
    chartKey: 'group',
    conKey: 'VEnhancedGroupConfig',
    category: 'group',
    categoryName: 'group',
    package: 'group',
    chartFrame: ChartFrameEnum.COMMON,
    title: groupTitle,
    image: ''
  }
  // 组成员列表
  public groupList: Array<CreateComponentType> = []
  // 标识
  public override id = getUUID()
  // 成组
  public override isGroup = true
  // ---- 原有 ---
  // key
  public key = 'group'
  // 配置（Group 的 option）
  public option: GroupOption = {
    containerType: 'none',
    padding: 0,
  }
}

// Group 的 option 类型定义
export interface GroupOption {
  _simplifiedData?: SimplifiedDataType
  borderKey?: string
  borderOption?: Record<string, any>
  /** 视觉容器类型：none=无装饰，border=边框装饰（可选） */
  containerType?: 'border' | 'none'
  designHeight?: number
  /** 设计尺寸（Group 创建时的原始尺寸），用于 resize 时计算缩放比 */
  designWidth?: number
  padding?: number
}
