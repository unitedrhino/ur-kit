/** 文件说明：共享大屏编辑器界面定义，保留业务字段并翻译展示文案。 */
import { $t as editorT } from '@vben/saas/locales';
import type { DataAdapter, MappingSchema } from './types';

import cloneDeep from 'lodash-es/cloneDeep';

import { resolveIoTConsumerContext } from './iotConsumerContext';

/**
 * 饼图适配器：将扁平行数据转为 ECharts pie 配置
 * 使用 encode: { itemName, value } 而非 X/Y 轴
 *
 * prop+latest 宽表 → 自动转为长表 {name, value}，每属性一片
 * 其他格式 → 直接使用 dimensions[0]/[1] 作为默认
 */
export const pieAdapter: DataAdapter = {
  toOption(rows, currentOption) {
    if (rows.length === 0) return {};
    // rows 非空时首行必存在，此兜底仅为满足严格索引类型收窄
    const dimensions = Object.keys(rows[0] ?? {});
    const { iotMeta } = resolveIoTConsumerContext(currentOption as any);
    const buildPieSeries = (nameField: string, valueField: string) => {
      const template = cloneDeep(currentOption?.series?.[0] ?? {});
      delete template.data;
      return {
        ...template,
        type: 'pie',
        encode: { itemName: nameField, value: valueField },
      };
    };

    const toLongFieldSource = (sourceRows: Record<string, any>[]) => {
      const longSource: { name: string; value: number }[] = [];
      sourceRows.forEach((row: any) => {
        const { name: _rowName, ...values } = row;
        Object.entries(values).forEach(([field, value]) => {
          if (typeof value === 'number' && Number.isFinite(value)) {
            longSource.push({ name: field, value });
          }
        });
      });
      return longSource;
    };

    // prop+latest 宽表 → 转为长表，使饼图每属性一片
    if (iotMeta?.dataView === 'prop' && iotMeta?.mode === 'latest' && rows.length > 0) {
      const longSource = toLongFieldSource(rows);
      return {
        dataset: { dimensions: ['name', 'value'], source: longSource },
        series: [buildPieSeries('name', 'value')],
      } as any;
    }

    // deviceInfo.fields / deviceStatus.fields：单行宽表 → 长表
    if ((iotMeta?.dataView === 'deviceInfo' || iotMeta?.dataView === 'deviceStatus') && iotMeta?.outputView === 'fields' && rows.length > 0) {
      const longSource = toLongFieldSource(rows);
      if (longSource.length > 0) {
        return {
          dataset: { dimensions: ['name', 'value'], source: longSource },
          series: [buildPieSeries('name', 'value')],
        } as any;
      }
    }

    // 已经是标准 name/value 长表时，直接使用，避免首帧被误转成多片 `value`
    if (dimensions.length === 2 && dimensions[0] === 'name' && dimensions[1] === 'value') {
      return {
        dataset: { dimensions: ['name', 'value'], source: rows },
        series: [buildPieSeries('name', 'value')],
      } as any;
    }

    // 其他单行宽表：如果首列是 name 且后续为数值列，也转成长表
    if (dimensions[0] === 'name' && rows.length > 0) {
      const longSource = toLongFieldSource(rows);
      if (longSource.length > 0) {
        return {
          dataset: { dimensions: ['name', 'value'], source: longSource },
          series: [buildPieSeries('name', 'value')],
        } as any;
      }
    }

    // 默认使用第一个维度作为名称，第二个维度作为数值
    const nameField = dimensions[0] ?? 'name';
    // dimensions.length>1 时第二列必存在，此兜底仅为满足严格索引类型收窄
    const valueField = dimensions.length > 1 ? (dimensions[1] ?? 'value') : 'value';

    return {
      dataset: { dimensions, source: rows },
      series: [buildPieSeries(nameField, valueField)],
    } as any;
  },

  fromOption(option) {
    const dataset = option.dataset;
    if (!dataset?.source) return { rows: [] };
    const rows = Array.isArray(dataset.source) ? dataset.source.map((row: any) => ({ ...row })) : [];
    return { rows };
  },

  getMappingSchema(): MappingSchema {
    return {
      mode: 'flat',
      fields: [
        { key: 'name', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.nameSector'); }, required: true, acceptTypes: ['string'] },
        { key: 'value', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return editorT('bigscreenEditor.ui.valueSize'); }, required: true, acceptTypes: ['number'] },
      ],
    };
  },
};
