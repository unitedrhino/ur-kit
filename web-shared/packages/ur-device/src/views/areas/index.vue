<script lang="ts" setup>
import type { VxeGridProps, VxeGridListeners } from '../../adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { useVbenVxeGrid } from '../../adapter/vxe-table';
import { NButton, NImage, useMessage, useDialog } from 'naive-ui';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

import { useAreaStore } from '@vben/stores';
import MutationsModal from './mutationsModal.vue';

// 初始化stores和工具
const areaStore = useAreaStore();
const message = useMessage();
const dialog = useDialog();

const [Modal, modalApi] = useVbenModal({
  connectedComponent: MutationsModal,
  onOpenChange: (isOpen) => {
    // 当模态框关闭时刷新表格
    if (!isOpen) {
      refreshGrid();
    }
  },
});

// 刷新表格数据
const refreshGrid = () => {
  if (gridApi) {
    gridApi.query();
  }
};

interface RowType {
  areaID: string;
  areaName: string;
  parentAreaID?: string;
  deviceCount?: number;
  areaImg?: string;
  areaType?: string;
  areaStatus?: string;
  desc?: string;
  useBy?: string;
  [key: string]: any;
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
    { field: 'areaName', title: '区域名称', treeNode: true, dragSort: true },
    { field: 'useBy', title: '区域用途' },
    { field: 'desc', title: '区域描述' },
    { field: 'areaID', title: '区域ID' },
    // { field: 'purpose', title: '用途' },
    { field: 'deviceCount', title: '设备数量统计' },
    { field: 'areaImg', title: '区域图片', slots: { default: 'areaImg' } },
    // { field: 'isOnline', title: '在线状态' }, //1离线 2在线 只读
    // { field: 'netType', title: '设备类型' }, //通讯方式:1:其他,2:wi-fi,3:2G/3G/4G,4:5G,5:BLE,6:LoRaWAN,7:wifi+ble,8:有线网,9:4G+BLE
    // { field: 'status', title: '设备状态' }, //1-未激活，2-在线，3-离线 4-异常(频繁上下线,告警中)
    { slots: { default: 'action' }, title: '操作' },
  ],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
  },
  columnConfig: {
    resizable: true,
  },
  treeConfig: {
    transform: true,
    parentField: 'parentAreaID',
    rowField: 'areaID',
  },
  rowConfig: {
    // drag: true,
  },
  rowDragConfig: {
    isCrossDrag: true,
    isSelfToChildDrag: true,
    isToChildDrag: true,
    showGuidesStatus: false,
    // showGuidesStatus: true,
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
      { name: '创建分组', code: 'myAdd', status: 'primary' },
      // { name: '删除', code: 'myDel' },
      // { name: '保存', code: 'mySave', status: 'success' }
    ],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await areaStore.getAreas({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
    response: {
      result: 'list',
    },
  },
};

const gridEvents: VxeGridListeners<RowType> = {
  cellClick: ({ row }) => {
    // 可以添加单击行的处理逻辑
    console.log('cellClick', row);
    router.push({
      name: 'AreasDetail',
      params: { id: row.areaID },
    });
  },
  toolbarButtonClick: ({ code }: { code: string }) => {
    console.log('toolbarButtonClick', code);
    if (code === 'myAdd') {
      modalApi.setState({ title: '创建分组' }).setData({}).open();
    } else if (code === 'myDel') {
      // TODO: 实现批量删除功能
      message.info('批量删除功能正在开发中');
    }
  },
  // rowDragstart: ({row}) => {
  //   // console.log('onDragStart', row);
  // },
  // rowDragend: ({newRow, oldRow, dragPos}) => {
  //   // console.log('onDragEnd', newRow, oldRow, dragPos);

  //   // console.log('oldRow.parentAreaID', oldRow.parentAreaID);
  //   // console.log('newRow.parentAreaID', newRow.parentAreaID);
  //   // console.log('oldRow.sort', oldRow.sort);
  //   // console.log('newRow.sort', newRow.sort);

  //   // //parentAreaID
  //   // const needsUpdate = {
  //   //   parentAreaID: oldRow.parentAreaID !== newRow.parentAreaID,
  //   //   sort: oldRow.sort !== newRow.sort || oldRow.parentAreaID !== newRow.parentAreaID
  //   // }

  //   // console.log('needsUpdate', needsUpdate);

  // },
  // onDrag: (params) => {
  //   console.log('onDrag', params);
  // },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, gridEvents });

// 处理编辑
function handleEdit(row: RowType) {
  console.log('handleEdit', row);
  modalApi
    .setState({ title: '编辑分组' })
    .setData({
      areaName: row.areaName,
      areaID: row.areaID,
      areaImg: row.areaImg,
      areaType: row.areaType,
      areaStatus: row.areaStatus,
      parentAreaID: row.parentAreaID,
      desc: row.desc,
      useBy: row.useBy,
    })
    .open();
}

// 处理单个删除
function handleDelete(row: RowType) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除区域 "${row.areaName}" 吗？此操作不可撤销。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await areaStore.deleteArea(row.areaID);
        message.success('删除成功');
        refreshGrid();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    },
  });
}

// TODO: 批量删除功能待实现
// function handleBatchDelete() {
//   // 实现批量删除逻辑
// }

let baseUrl = import.meta.env.VITE_GLOB_API_URL;
//如果baseUrl以/结尾，则去掉
if (baseUrl.endsWith('/')) {
  baseUrl = baseUrl.slice(0, -1);
}

// 组件挂载时加载数据
onMounted(() => {
  areaStore.getAreas();
});
</script>

<template>
  <Page title="区域分组" auto-content-height>
    <Modal />
    <!-- <QueryForm /> -->
    <Grid>
      <template #action="{ row }">
        <NButton text @click="handleEdit(row)" style="margin-right: 8px">编辑</NButton>
        <NButton text type="error" @click.stop="handleDelete(row)">删除</NButton>
      </template>

      <template #areaImg="{ row }">
        <NImage :src="baseUrl + row?.areaImg" height="30" width="30" v-if="row?.areaImg" />
      </template>
    </Grid>
  </Page>
</template>
