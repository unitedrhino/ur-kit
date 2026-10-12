/** 文件说明：请求协议枚举与界面名称映射；时间展示名称支持多语言。 */
import { $t as editorT } from '@vben/saas/locales';
/**
 * @description: 请求结果集
 */
export enum ResultEnum {
  DATA_SUCCESS = 0,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  SERVER_FORBIDDEN = 403,
  SUCCESS = 200,
  TIMEOUT = 60_000,
}

// 数据相关
export enum RequestDataTypeEnum {
  // 请求数据
  AJAX = 1,
  // IoT 设备属性（Things API 直连）
  IoTDevice = 5,
  // 数据池
  Pond = 2,
  // 静态数据
  STATIC = 0,
}

// 请求主体类型
export enum RequestContentTypeEnum {
  // 普通请求
  DEFAULT = 0,
  // SQL请求
  SQL = 1,
}

/**
 * @description: 请求方法
 */
export enum RequestHttpEnum {
  DELETE = 'delete',
  GET = 'get',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
}

/**
 * @description: 请求间隔
 */
export enum RequestHttpIntervalEnum {
  // 天
  DAY = 'day',
  // 时
  HOUR = 'hour',
  // 分
  MINUTE = 'minute',
  // 秒
  SECOND = 'second',
}

/**
 * @description: 请求间隔名称
 */
export const SelectHttpTimeNameObj = {
  /** 当前语言的时间单位名称。 */ get [RequestHttpIntervalEnum.SECOND]() { return editorT('orgManage.cloneGroup.unitSeconds'); },
  /** 当前语言的时间单位名称。 */ get [RequestHttpIntervalEnum.MINUTE]() { return editorT('bigscreenEditor.ui.minutes'); },
  /** 当前语言的时间单位名称。 */ get [RequestHttpIntervalEnum.HOUR]() { return editorT('orgIotClient.energyDashboard.granularityHour'); },
  /** 当前语言的时间单位名称。 */ get [RequestHttpIntervalEnum.DAY]() { return editorT('orgManage.flow.unitDay'); },
};

/**
 * @description: 请求头部类型
 */
export enum RequestBodyEnum {
  FORM_DATA = 'form-data',
  JSON = 'json',
  NONE = 'none',
  X_WWW_FORM_URLENCODED = 'x-www-form-urlencoded',
  XML = 'xml',
}

/**
 * @description: 请求头部类型数组
 */
export const RequestBodyEnumList = [
  RequestBodyEnum.NONE,
  RequestBodyEnum.FORM_DATA,
  RequestBodyEnum.X_WWW_FORM_URLENCODED,
  RequestBodyEnum.JSON,
  RequestBodyEnum.XML,
];

/**
 * @description: 请求参数类型
 */
export enum RequestParamsTypeEnum {
  BODY = 'Body',
  HEADER = 'Header',
  PARAMS = 'Params',
}

/**
 * @description: 请求参数主体
 */
export type RequestParamsObjType = {
  [T: string]: string;
};
export type RequestParams = {
  [RequestParamsTypeEnum.BODY]: {
    [RequestBodyEnum.FORM_DATA]: RequestParamsObjType;
    [RequestBodyEnum.JSON]: string;
    [RequestBodyEnum.X_WWW_FORM_URLENCODED]: RequestParamsObjType;
    [RequestBodyEnum.XML]: string;
  };
  [RequestParamsTypeEnum.HEADER]: RequestParamsObjType;
  [RequestParamsTypeEnum.PARAMS]: RequestParamsObjType;
};

/**
 * @description:  常用的contentTyp类型
 */
export enum ContentTypeEnum {
  // form-data  上传
  FORM_DATA = 'multipart/form-data;charset=UTF-8',
  // application/x-www-form-urlencoded 一般配合qs
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  // json
  JSON = 'application/json;charset=UTF-8',
  // text
  TEXT = 'text/plain;charset=UTF-8',
  // xml
  XML = 'application/xml;charset=UTF-8',
}
