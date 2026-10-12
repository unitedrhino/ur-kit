import type { CreateComponentGroupType, CreateComponentType } from '@/packages/index.type';

import type { SimplifiedDataType } from './types';

import { RequestDataTypeEnum } from '@/enums/httpEnum';
import { requestConfig } from '@/packages/public/publicConfig';
import cloneDeep from 'lodash/cloneDeep';

import { inferSimplifiedData } from './inferSimplifiedData';
import { createDefaultCompositeAdapterConfig } from './types';

/**
 * 实例脱敏：清除与画布实例绑定的运行时数据，
 * 保留视觉配置（styles / filter / option）
 */
export const desensitizeComponent = (component: CreateComponentType): CreateComponentType => {
  const clone = cloneDeep(component);

  // 1. 清除实例 ID（拖入画布时会重新生成）
  clone.id = '';

  // 2. 重置坐标 & 偏移
  clone.attr.x = 0;
  clone.attr.y = 0;
  clone.attr.offsetX = 0;
  clone.attr.offsetY = 0;
  clone.attr.zIndex = -1;

  // 3. 重置数据源为静态
  clone.request = cloneDeep(requestConfig);
  clone.request.requestDataType = RequestDataTypeEnum.STATIC;

  // 4. 清除事件绑定
  clone.events = {
    baseEvent: {},
    advancedEvents: {},
    interactEvents: [],
  };

  // 5. 解锁 & 显示
  clone.status = { lock: false, hide: false };

  return clone;
};

/**
 * 子组件脱敏：清除实例数据但保留组内相对坐标
 * 用于分组组件封装时对 groupList 中每个子组件的处理
 */
const desensitizeChildComponent = (child: CreateComponentType): CreateComponentType => {
  const clone = cloneDeep(child);

  clone.id = '';
  // 保留 x/y（组内相对坐标），仅清除偏移
  clone.attr.offsetX = 0;
  clone.attr.offsetY = 0;
  clone.attr.zIndex = -1;

  clone.request = cloneDeep(requestConfig);
  clone.request.requestDataType = RequestDataTypeEnum.STATIC;

  clone.events = {
    baseEvent: {},
    advancedEvents: {},
    interactEvents: [],
  };

  clone.status = { lock: false, hide: false };

  return clone;
};

/**
 * 分组组件脱敏：清除容器实例数据 + 递归脱敏子组件
 * 子组件保留组内相对坐标，容器坐标重置为 0
 * 增强版 Group：保留容器配置（containerType、borderKey、borderOption、padding）
 */
export const desensitizeGroupComponent = (group: CreateComponentGroupType): CreateComponentGroupType => {
  const clone = cloneDeep(group) as CreateComponentGroupType;

  // 容器级脱敏
  clone.id = '';
  clone.attr.x = 0;
  clone.attr.y = 0;
  clone.attr.offsetX = 0;
  clone.attr.offsetY = 0;
  clone.attr.zIndex = -1;
  clone.status = { lock: false, hide: false };

  // Group：保留容器配置字段（边框装饰等）
  const preservedOption = {
    containerType: clone.option?.containerType,
    borderKey: clone.option?.borderKey,
    borderOption: clone.option?.borderOption,
    padding: clone.option?.padding,
    designWidth: clone.option?.designWidth,
    designHeight: clone.option?.designHeight,
  };

  // 递归脱敏子组件（保留相对坐标）
  clone.groupList = (clone.groupList || []).map((child) => desensitizeChildComponent(child));

  // 恢复保留的容器配置
  clone.option = { ...clone.option, ...preservedOption };

  return clone;
};

/**
 * 元数据注入：标记为自定义组件 + 生成降维数据结构
 */
export const injectCustomMeta = (component: CreateComponentType, exposedProps?: string[], adapterType?: string): CreateComponentType => {
  // 标记来源类型
  component.chartConfig.sourceType = 'custom';

  // 推断或保留 _simplifiedData
  const simplified: SimplifiedDataType = inferSimplifiedData(component);

  // 写入 exposedProps 白名单
  if (exposedProps && exposedProps.length > 0) {
    simplified.exposedProps = exposedProps;
  }

  // 写入用户指定的 adapterType
  if (adapterType) {
    simplified.adapterType = adapterType;
  }

  component.option._simplifiedData = simplified;

  return component;
};

/**
 * 分组组件元数据注入：标记 sourceType + 注入组合适配器配置
 */
export const injectGroupCustomMeta = (group: CreateComponentGroupType, exposedProps?: string[], originalChildIds?: string[]): CreateComponentGroupType => {
  group.chartConfig.sourceType = 'custom';

  if (!group.option) group.option = {} as any;

  // 优先使用调用方传入的原始 ID（脱敏前记录），避免 desensitizeGroupComponent 清空 id 后丢失
  const childIds = originalChildIds ?? (group.groupList || []).map((child) => child.id);

  group.option._simplifiedData = {
    editMode: 'composite',
    isComposite: true,
    exposedProps: exposedProps && exposedProps.length > 0 ? exposedProps : undefined,
    compositeAdapter: createDefaultCompositeAdapterConfig(childIds),
  };

  return group;
};

/**
 * 组装单组件模板 JSON（用于 API 提交）
 */
export const generateCustomComponentTemplate = (component: CreateComponentType, meta: { category?: string; name: string; thumbnail?: string }) => {
  return {
    type: 'single_template',
    version: 2,
    name: meta.name,
    category: meta.category ?? 'custom',
    thumbnail: meta.thumbnail || '',
    component,
  };
};

/**
 * 组装分组组件模板 JSON（用于 API 提交）
 */
export const generateGroupComponentTemplate = (group: CreateComponentGroupType, meta: { category?: string; name: string; thumbnail?: string }) => {
  return {
    type: 'group_template',
    version: 3,
    name: meta.name,
    category: meta.category ?? 'custom',
    thumbnail: meta.thumbnail || '',
    groupList: group.groupList,
    attr: { w: group.attr.w, h: group.attr.h },
    styles: group.styles,
    option: group.option,
    chartConfig: group.chartConfig,
  };
};
