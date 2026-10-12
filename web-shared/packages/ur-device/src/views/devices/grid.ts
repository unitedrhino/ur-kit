import { ref } from 'vue';
import type { VxeGridListeners, VxeGridProps } from '../../adapter/vxe-table';
import { useVbenVxeGrid } from '../../adapter/vxe-table';

import { getDevicesList } from './device_helpers';

interface RowType {
  [key: string]: any;
}

// 创建grid配置函数
export function useDeviceGrid() {
  const selectedRecords = ref<any[]>([]);
  // 将 queryParams 移到函数内部，每个实例独立
  const queryParams = ref<Record<string, any>>({});

  const gridOptions: VxeGridProps<RowType> = {
    height: 'auto',
    columns: [
      { type: 'checkbox', width: 50 },
      { title: '序号', type: 'seq', width: 50 },
      { field: 'deviceName', title: '设备名称' },
      { field: 'deviceAlias', title: '设备别名' },
      {
        field: 'createdTime',
        title: '创建时间',
        width: 150,
        formatter: (cell) => {
          return new Date(Number(cell.cellValue)).toLocaleString();
        },
      },
      {
        field: 'isEnable',
        title: '是否启用',
        slots: {
          default: 'isEnable',
        },
      },
      {
        field: 'status',
        title: '设备状态',
        slots: {
          default: 'status',
        },
      }, //1-未激活，2-在线，3-离线 4-异常(频繁上下线,告警中)
      {
        field: 'action',
        fixed: 'right',
        title: '操作',
        slots: {
          default: 'action',
        },
      },
    ],
    pagerConfig: {},
    sortConfig: {
      multiple: true,
    },
    importConfig: {},
    exportConfig: {},
    toolbarConfig: {
      zoom: true,
      export: true,
      custom: true,
      buttons: [],
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }) => {
          try {
            return await loadGridData(page.currentPage, page.pageSize, queryParams.value);
          } catch (e) {
            return {
              list: [],
              total: 0,
            };
          }
        },
      },
      response: {
        result: 'list',
      },
    },
  };

  const gridEvents: VxeGridListeners = {
    checkboxAll: ({ checked, records }) => {
      // console.log('checkboxAll', checked, records);
      selectedRecords.value = records;
    },
    checkboxChange: ({ checked, records }) => {
      // console.log('checkboxChange', checked, records);
      selectedRecords.value = records;
    },
  };

  const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, gridEvents });

  async function loadGridData(currentPage: number, pageSize: number, queryParams: Record<string, any>) {
    try {
      const result = await getDevicesList(currentPage, pageSize, queryParams);
      return result;
    } catch (e) {
      console.error(e);
      return {
        list: [],
        total: 0,
      };
    }
  }

  return {
    Grid,
    selectedRecords,
    gridApi,
    updateQueryParams: (params: Record<string, any>) => {
      queryParams.value = params;
      gridApi.query();
    },
  };
}
