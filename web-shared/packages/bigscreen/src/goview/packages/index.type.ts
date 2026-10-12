/** 文件说明：组件模型及枚举定义；混合模式展示标签随界面语言更新，协议值保持原值。 */
import { $t as editorT } from '@vben/saas/locales';
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { InteractActionsType } from '@/enums/eventEnum';
import type { GlobalThemeJsonType } from '@/settings/chartThemes/index';
import type { RequestConfigType } from '@/store/modules/chartEditStore/chartEditStore.type';

import { BaseEvent, EventLife, InteractEventOn, InteractEvents } from '@/enums/eventEnum';

export enum ChartFrameEnum {
  // 自定义带数据组件
  COMMON = 'common',
  // 复合组件（边框 + 图表叠加）
  COMPOSITE = 'composite',
  // 支持 dataset 的 echarts 框架
  ECHARTS = 'echarts',
  // UI 组件框架
  NAIVE_UI = 'naiveUI',
  // 无数据变更
  STATIC = 'static',
  // VChart 框架（保留用于兼容已保存大屏数据）
  VCHART = 'VChart',
}

// 组件配置
export type ConfigType = {
  // 分类
  category: string;
  // 分类名称
  categoryName: string;
  // 归类
  chartFrame?: ChartFrameEnum;
  // 画布组件 key
  chartKey: string;
  // 事件
  configEvents?: { [T: string]: Function };
  // 右侧设置面板组件 key
  conKey: string;
  // 组件预设的 dataset 值(图片/图标)
  dataset?: any;
  // 禁用 拖拽或双击生成组件
  disabled?: boolean;
  // 图标
  icon?: string;
  // 预览图
  image: string;
  // 组件 key
  key: string;
  // 所属包
  package: PackagesCategoryEnum | string;
  // 从指定路径创建创建该组件
  redirectComponent?: string;
  // 组件来源类型：undefined 等价于 'basic'，自定义组件为 'custom'
  sourceType?: 'basic' | 'custom';
  // 溯源标识：自定义组件在数据库中的记录 ID，基础组件为 undefined
  templateId?: string;
  // 标题
  title: string;
};

// 数据请求
interface requestConfig {
  request: RequestConfigType;
}

// Echarts 数据类型
export interface EchartsDataType {
  dimensions: string[];
  source: any[];
}

// 组件状态
export interface StatusType {
  hide: boolean;
  lock: boolean;
}

// 滤镜/变换枚举
export enum FilterEnum {
  // 混合模式
  BLEND_MODE = 'blendMode',

  // 亮度
  BRIGHTNESS = 'brightness',
  // 对比度
  CONTRAST = 'contrast',
  // 是否启用
  FILTERS_SHOW = 'filterShow',
  // 色相
  HUE_ROTATE = 'hueRotate',
  // 透明度
  OPACITY = 'opacity',

  ROTATE_X = 'rotateX',
  ROTATE_Y = 'rotateY',
  // 旋转
  ROTATE_Z = 'rotateZ',

  // 饱和度
  SATURATE = 'saturate',
  // 倾斜
  SKEW_X = 'skewX',

  SKEW_Y = 'skewY',
}

export const BlendModeEnumList = [
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.renewal.statusNormal'); }, value: 'normal' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendMultiply'); }, value: 'multiply' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendOverlay'); }, value: 'overlay' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendScreen'); }, value: 'screen' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendDarken'); }, value: 'darken' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendLighten'); }, value: 'lighten' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendColorDodge'); }, value: 'color-dodge' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendColorBurn'); }, value: 'color-burn;' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendHardLight'); }, value: 'hard-light' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendSoftLight'); }, value: 'soft-light' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendDifference'); }, value: 'difference' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.blendExclusion'); }, value: 'exclusion' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.hue'); }, value: 'hue' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.saturation'); }, value: 'saturation' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('orgManage.flow.fwColor'); }, value: 'color' },
  { /** 当前语言的混合模式标签，CSS 模式值保持不变。 */ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.brightness'); }, value: 'luminosity' },
];

// 组件实例类
export interface PublicConfigType {
  attr: { h: number; offsetX: number; offsetY: number; w: number; x: number; y: number; zIndex: number };
  events: {
    advancedEvents: {
      [K in EventLife]?: string;
    };
    baseEvent: {
      [K in BaseEvent]?: string;
    };
    interactEvents: {
      [InteractEvents.INTERACT_COMPONENT_ID]: string | undefined;
      [InteractEvents.INTERACT_FN]: { [name: string]: string };
      [InteractEvents.INTERACT_ON]: InteractEventOn | undefined;
    }[];
  };
  filter?: string;
  id: string;
  interactActions?: InteractActionsType[];
  isGroup: boolean;
  preview?: {
    // 预览超出隐藏
    overFlowHidden?: boolean;
  };
  status: StatusType;
  styles: {
    [FilterEnum.BLEND_MODE]: string;
    [FilterEnum.BRIGHTNESS]: number;
    [FilterEnum.CONTRAST]: number;
    [FilterEnum.FILTERS_SHOW]: boolean;
    [FilterEnum.HUE_ROTATE]: number;
    [FilterEnum.OPACITY]: number;

    [FilterEnum.ROTATE_X]: number;
    [FilterEnum.ROTATE_Y]: number;
    [FilterEnum.ROTATE_Z]: number;

    [FilterEnum.SATURATE]: number;
    [FilterEnum.SKEW_X]: number;
    [FilterEnum.SKEW_Y]: number;
    // 动画
    animations: string[];
  };
}

export interface CreateComponentType extends PublicConfigType, requestConfig {
  chartConfig: ConfigType;
  groupList?: Array<CreateComponentType>;
  key: string;
  option: GlobalThemeJsonType;
}

// 组件成组实例类
export interface CreateComponentGroupType extends CreateComponentType {
  groupList: Array<CreateComponentType>;
}

// 获取组件实例类中某个key对应value类型的方法
export type PickCreateComponentType<T extends keyof CreateComponentType> = Pick<CreateComponentType, T>[T];

// 包分类枚举
export enum PackagesCategoryEnum {
  CHARTS = 'Charts',
  DECORATES = 'Decorates',
  ICONS = 'Icons',
  INFORMATIONS = 'Informations',
  INTERACT = 'Interact',
  PHOTOS = 'Photos',
  PRESETS = 'Presets',
  TABLES = 'Tables',
  TEMPLATES = 'Templates',
}

// 包分类名称
export enum PackagesCategoryName {
  CHARTS = '图表',
  DECORATES = '小组件',
  ICONS = '图标',
  INFORMATIONS = '信息',
  INTERACT = '交互',
  PHOTOS = '图片',
  PRESETS = '默认',
  TABLES = '列表',
}

// 一级分类枚举
export enum PrimaryCategoryEnum {
  BASIC = 'basic',
  CUSTOM = 'custom',
  PRESETS = 'presets',
  TEMPLATES = 'templates',
}

export enum PrimaryCategoryName {
  BASIC = '基础',
  CUSTOM = '自定义',
  TEMPLATES = '模板',
}

// 获取组件
export enum FetchComFlagType {
  VIEW,
  CONFIG,
}

// 图表包类型
export type PackagesType = {
  [PackagesCategoryEnum.CHARTS]: ConfigType[];
  [PackagesCategoryEnum.DECORATES]: ConfigType[];
  [PackagesCategoryEnum.ICONS]: ConfigType[];
  [PackagesCategoryEnum.INFORMATIONS]: ConfigType[];
  [PackagesCategoryEnum.INTERACT]: ConfigType[];
  [PackagesCategoryEnum.PHOTOS]: ConfigType[];
  [PackagesCategoryEnum.PRESETS]: ConfigType[];
  [PackagesCategoryEnum.TABLES]: ConfigType[];
  [PackagesCategoryEnum.TEMPLATES]: ConfigType[];
};
