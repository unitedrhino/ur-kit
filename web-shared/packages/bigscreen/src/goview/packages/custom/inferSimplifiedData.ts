import type { CreateComponentType } from '@/packages/index.type';

import type { SimplifiedDataType, TableColumnDef } from './types';

/** 无数据型 category 白名单 */
const NO_DATA_CATEGORIES = new Set(['Decorates', 'Icons']);

/** 单值型 category 白名单 */
const FORM_CATEGORIES = new Set(['Informations', 'Texts']);

/**
 * 从组件 option 中自动推断 SimplifiedData
 * 路由优先级：预置 _simplifiedData > category 分型 > dataset 反推
 */
export const inferSimplifiedData = (component: CreateComponentType): SimplifiedDataType => {
  const option = component.option;

  // 已有预置数据，直接返回
  if (option._simplifiedData) return option._simplifiedData;

  // 基于 category 的三态路由
  const category = component.chartConfig?.category;

  // 无数据型：装饰 / 图标类组件
  if (category && NO_DATA_CATEGORIES.has(category)) {
    return { editMode: 'none' };
  }

  // 单值型：文本 / 信息类组件
  if (category && FORM_CATEGORIES.has(category)) {
    return inferFormMode(option);
  }

  // 列表型：从 ECharts dataset 推断
  return inferTableMode(option);
};

/** 单值型推断：从 option 中提取常见文本/数值字段作为表单项 */
const inferFormMode = (option: any): SimplifiedDataType => {
  const fields: SimplifiedDataType['fields'] = [];
  const values: Record<string, any> = {};

  // 标题文本
  if (option.title?.text !== undefined) {
    fields.push({ key: 'title.text', label: '标题', type: 'text' });
    values['title.text'] = option.title.text;
  }

  // series[0].data[0].value — 常见单值指标
  const firstValue = option.series?.[0]?.data?.[0]?.value;
  if (firstValue !== undefined) {
    fields.push({ key: 'series.0.data.0.value', label: '数值', type: 'number' });
    values['series.0.data.0.value'] = firstValue;
  }

  // 兜底：至少返回空表单
  return { editMode: 'form', fields, values };
};

/** 列表型推断：从 ECharts dataset 反推列定义和行数据 */
const inferTableMode = (option: any): SimplifiedDataType => {
  const dataset = option.dataset;
  if (dataset?.dimensions && Array.isArray(dataset.source)) {
    const columns: TableColumnDef[] = dataset.dimensions.map((dim: string, index: number) => ({
      key: dim,
      label: dim,
      type: index === 0 ? ('string' as const) : ('number' as const),
      editable: true,
    }));
    return {
      editMode: 'table',
      columns,
      rows: dataset.source.map((row: any) => ({ ...row })),
    };
  }

  return { editMode: 'table', columns: [], rows: [] };
};
