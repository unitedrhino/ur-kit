// 生产构建回归样例：真实 VXE 表格、共享导出与按格式预览，不依赖生产账号。
import { createApp, h, ref } from 'vue';
import { VxeTable, VxeColumn } from 'vxe-table';
import { VxeUI } from 'vxe-pc-ui';
import 'vxe-table/lib/style.css';
import 'vxe-pc-ui/lib/style.css';
import { installLazyXlsx } from '../../src/adapter/lazy-xlsx';
import Preview from '../../src/views/knowledge-base/source-preview.vue';
import { exportToExcel } from '../../src/utils/excel-export';
installLazyXlsx(VxeUI);
createApp({
  setup() {
    const file = ref('');
    const table = ref();
    const error = ref('');
    return () =>
      h('div', [
        ...['pdf', 'docx', 'xlsx', 'csv', 'md', 'svg', 'dxf'].map((ext) => h('button', { onClick: () => (file.value = `sample.${ext}`) }, ext)),
        h('button', { onClick: () => (file.value = '') }, '关闭'),
        h(
          'button',
          {
            onClick: async () => {
              try {
                await exportToExcel('验证', [{ header: '名称', key: 'name' }], [{ name: '设备' }], 'shared.xlsx');
              } catch (e) {
                error.value = String(e);
              }
            },
          },
          '共享导出',
        ),
        h(
          'button',
          {
            onClick: async () => {
              try {
                await table.value.exportData({ type: 'xlsx', filename: 'table', message: false });
              } catch (e) {
                error.value = String(e);
              }
            },
          },
          '表格导出',
        ),
        h(
          'button',
          {
            onClick: async () => {
              try {
                await table.value.importData({ type: 'xlsx', message: false });
              } catch (e) {
                error.value = String(e);
              }
            },
          },
          '表格导入',
        ),
        h(
          VxeTable,
          { ref: table, data: [{ name: '设备', value: 42 }], exportConfig: {} },
          { default: () => [h(VxeColumn, { field: 'name', title: '名称' }), h(VxeColumn, { field: 'value', title: '值' })] },
        ),
        h('div', { id: 'error' }, error.value),
        file.value ? h(Preview, { url: `/${file.value}`, filename: file.value }) : null,
      ]);
  },
}).mount('#app');
