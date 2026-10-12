<script lang="ts" setup>
// import type { NotificationType } from 'naive-ui';

import type { VxeGridListeners, VxeGridProps } from '../../adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { NCard, useMessage } from 'naive-ui';
// import { NCard, useMessage, useNotification } from 'naive-ui';

import { useVbenForm } from '../../adapter/form';
import { useVbenVxeGrid } from '../../adapter/vxe-table';

// import AddModal from './addModal.vue';
// import { MOCK_TABLE_DATA } from './table-data';
import { ThingsApi } from '@vben/api';

// import { postThingsGroupInfoIndex } from '#/api/v1/api';
// const notification = useNotification();

// const [Modal, modalApi] = useVbenModal();
// const [Modal, modalApi] = useVbenModal({
//   connectedComponent: AddModal,
// });

// 处理创建成功后的刷新
function handleCreateSuccess() {
  message.success('分组创建成功');
  // 这里可以刷新表格数据
  // gridApi.refresh();
}

const message = useMessage();
// function error() {
//   message.error('Once upon a time you dressed so fine');
// }

// function warning() {
//   message.warning('How many roads must a man walk down');
// }
// function success() {
//   message.success('Cause you walked hand in hand With another man in my place');
// }
// function loading() {
//   message.loading(
//     'If I were you, I will realize that I love you more than any other guy',
//   );
// }

// function notify(type: NotificationType) {
//   notification[type]({
//     content: '说点啥呢',
//     duration: 2500,
//     keepAliveOnHover: true,
//     meta: '想不出来',
//   });
// }

const onSubmit = (values: Record<string, any>) => {
  // console.log(values);
  console.error('onSubmit', values);
};

const [QueryForm] = useVbenForm({
  // 默认展开
  collapsed: false,
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    // 所有表单项
    componentProps: {
      class: 'w-full',
    },
    labelClass: 'text-left justify-start',
  },
  handleSubmit: onSubmit,
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '分组名称',
      // labelClass: 'text-left justify-start',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 大屏一行显示3个，中屏一行显示2个，小屏一行显示1个
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});

interface RowType {
  address: string;
  age: number;
  id: number;
  name: string;
  nickname: string;
  role: string;
}
const gridOptions: VxeGridProps<RowType> = {
  // checkboxConfig: {
  //   highlight: true,
  //   labelField: 'name',
  // },
  height: 'auto',
  columns: [
    { type: 'checkbox', width: 50 },
    { title: '序号', type: 'seq', width: 50 },
    { field: 'name', title: '分组名称', treeNode: true },
    { field: 'id', title: '分组ID' },
    { field: 'purpose', title: '用途' },
    { field: 'deviceCount', title: '设备数量统计' },
    // { field: 'isOnline', title: '在线状态' }, //1离线 2在线 只读
    // { field: 'netType', title: '设备类型' }, //通讯方式:1:其他,2:wi-fi,3:2G/3G/4G,4:5G,5:BLE,6:LoRaWAN,7:wifi+ble,8:有线网,9:4G+BLE
    // { field: 'status', title: '设备状态' }, //1-未激活，2-在线，3-离线 4-异常(频繁上下线,告警中)
  ],
  columnConfig: {
    resizable: true,
  },
  treeConfig: {
    transform: true,
    parentField: 'parentID',
    rowField: 'id',
  },
  pagerConfig: {},
  sortConfig: {
    multiple: true,
  },
  importConfig: {},
  exportConfig: {},
  toolbarConfig: {
    zoom: true,
    // import: true,
    export: true,
    // refresh: true,
    custom: true,
    buttons: [
      // { name: '创建分组', code: 'myAdd', status: 'primary' },
      // { name: '删除', code: 'myDel', status: 'error' },
      // { name: '保存', code: 'mySave', status: 'success' }
    ],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await ThingsApi.postApiV1ThingsGroupInfoIndex({
          purpose: 'building',
          page: {
            page: page.currentPage,
            size: page.pageSize,
          },
        });
      },
    },
    response: {
      result: 'list',
    },
  },
};

const gridEvents: VxeGridListeners<RowType> = {
  cellClick: ({ row }: { row: RowType }) => {
    // message.info(`cell-click: ${row.name}`);
  },
  // toolbarToolClick: ({ code }) => {
  //   console.log('toolbarToolClick', code);
  //   if (code === 'myAdd') {
  //     modalApi.open();
  //   }
  // },
  toolbarButtonClick: ({ code }: { code: string }) => {
    console.log('toolbarButtonClick', code);
    // if (code === 'myAdd') {
    //   modalApi.open();
    // }
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridEvents, gridOptions });

// const showBorder = gridApi.useStore((state) => state.gridOptions?.border);
// const showStripe = gridApi.useStore((state) => state.gridOptions?.stripe);

// function changeBorder() {
//   gridApi.setGridOptions({
//     // border: !showBorder.value,
//   });
// }

// function changeStripe() {
//   gridApi.setGridOptions({
//     // stripe: !showStripe.value,
//   });
// }

// function changeLoading() {
//   gridApi.setLoading(true);
//   setTimeout(() => {
//     gridApi.setLoading(false);
//   }, 2000);
// }
</script>

<template>
  <Page title="建筑分组" auto-content-height>
    <!-- <QueryForm /> -->
    <Grid v-on="gridEvents" />
  </Page>
</template>
