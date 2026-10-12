import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { NButton, NImage, NTag } from 'naive-ui';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        return h(NImage, { src: row[column.field] });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(NButton, { size: 'small', type: 'primary', quaternary: true }, { default: () => props?.text });
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
    vxeUI.formats.add('customTime', {
      tableCellFormatMethod({ cellValue }) {
        if (!cellValue) {
          return '--';
        }
        if (cellValue === '0' || cellValue === 0) {
          return '-';
        }

        let timeMs = 0;
        if (typeof cellValue === 'string') {
          const trimmed = cellValue.trim();
          if (!trimmed) {
            return '-';
          }
          if (/^\d+$/.test(trimmed)) {
            timeMs = Number.parseInt(trimmed, 10);
          } else {
            const parsed = Date.parse(trimmed);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return '-';
            }
            timeMs = parsed;
          }
        } else if (typeof cellValue === 'number') {
          timeMs = cellValue;
        } else if (cellValue instanceof Date) {
          timeMs = cellValue.getTime();
        } else {
          return '-';
        }

        if (!Number.isFinite(timeMs) || timeMs <= 0) {
          return '-';
        }
        if (timeMs <= 9_999_999_999) {
          timeMs = timeMs * 1000;
        }

        return new Date(timeMs).toLocaleString('zh-CN');
      },
    });
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
