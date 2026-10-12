/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import { RequestDataTypeEnum, RequestHttpEnum, RequestHttpIntervalEnum, SelectHttpTimeNameObj } from '@/enums/httpEnum';

// 匹配结果
export enum DataResultEnum {
  FAILURE = 2,
  NULL = 0,
  SUCCESS = 1,
}

/** 保留数据时间线的稳定历史标识，展示标签单独翻译。 */
export enum TimelineTitleEnum {
  CONTENT = '数据内容',
  FILTER = '数据过滤',
  MAPPING = '数据映射',
}

/** 时间线展示标签在读取时跟随当前语言，不改变历史枚举值。 */
export const TimelineTitleLabels = {
  /** 数据内容步骤标题。 */ get CONTENT() { return editorT('bigscreenEditor.ui.dataContent'); },
  /** 数据过滤步骤标题。 */ get FILTER() { return editorT('bigscreenEditor.ui.dataFiltering'); },
  /** 字段映射步骤标题。 */ get MAPPING() { return editorT('bigscreenEditor.ui.dataMapping'); },
};

/** 保留请求方式的历史标识，选择项仅翻译显示标签。 */
export enum SelectCreateDataEnum {
  AJAX = '动态请求',
  IoTDevice = '设备属性',
  Pond = '公共接口',
  STATIC = '静态数据',
}

/** 请求方式选项；标签为当前语言文案，值为稳定请求枚举。 */
export interface SelectCreateDataType {
  label: string;
  value: RequestDataTypeEnum;
  disabled?: boolean;
}

// ajax 请求类型
export interface SelectHttpType {
  label: RequestHttpEnum;
  value: RequestHttpEnum;
  disabled?: boolean;
  style?: object;
}

// 类型选项
export const selectTypeOptions: SelectHttpType[] = [
  {
    label: RequestHttpEnum.GET,
    value: RequestHttpEnum.GET,
    style: {
      color: 'greenyellow',
      fontWeight: 'bold',
    },
  },
  {
    label: RequestHttpEnum.POST,
    value: RequestHttpEnum.POST,
    style: {
      color: 'skyblue',
      fontWeight: 'bold',
    },
  },
  {
    label: RequestHttpEnum.PUT,
    value: RequestHttpEnum.PUT,
    style: {
      color: 'goldenrod',
      fontWeight: 'bold',
    },
  },
  {
    label: RequestHttpEnum.PATCH,
    value: RequestHttpEnum.PATCH,
    style: {
      color: 'violet',
      fontWeight: 'bold',
    },
  },
  {
    label: RequestHttpEnum.DELETE,
    value: RequestHttpEnum.DELETE,
    disabled: true,
    style: {
      fontWeight: 'bold',
    },
  },
];

// ajax 请求间隔
export interface SelectHttpTimeType {
  label: string;
  value: RequestHttpIntervalEnum;
  disabled?: boolean;
}

// 时间选项
export const selectTimeOptions: SelectHttpTimeType[] = [
  {
    /** 当前语言的时间单位标签。 */ get label() { return SelectHttpTimeNameObj[RequestHttpIntervalEnum.SECOND]; },
    value: RequestHttpIntervalEnum.SECOND,
  },
  {
    /** 当前语言的时间单位标签。 */ get label() { return SelectHttpTimeNameObj[RequestHttpIntervalEnum.MINUTE]; },
    value: RequestHttpIntervalEnum.MINUTE,
  },
  {
    /** 当前语言的时间单位标签。 */ get label() { return SelectHttpTimeNameObj[RequestHttpIntervalEnum.HOUR]; },
    value: RequestHttpIntervalEnum.HOUR,
  },
  {
    /** 当前语言的时间单位标签。 */ get label() { return SelectHttpTimeNameObj[RequestHttpIntervalEnum.DAY]; },
    value: RequestHttpIntervalEnum.DAY,
  },
];
