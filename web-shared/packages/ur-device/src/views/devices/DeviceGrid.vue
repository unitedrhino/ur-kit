<script lang="ts" setup>
import { NButton, NTag } from 'naive-ui';
import { useVbenModal } from '@vben/common-ui';
import { useRouter } from 'vue-router';
import { useDeviceGrid } from './grid';

import LinkAreaModel from './linkAreaModel.vue';

import { getDeviceStatusInfo, getDeviceStatusLabel } from './device_helpers';

const router = useRouter();

// 使用grid配置
const { Grid, selectedRecords, gridApi, updateQueryParams } = useDeviceGrid();

// const props = defineProps<Props>();

// 关联区域
const [Modal, modalApi] = useVbenModal({
  connectedComponent: LinkAreaModel,
  onOpenChange: (isOpen) => {
    if (!isOpen) {
      //refreshGrid();
    }
  },
});

function handleLinkArea() {
  console.log('LinkAreaModel', LinkAreaModel);
  console.log('handleLinkArea', modalApi);
  modalApi
    .setState({
      title: '已经选中' + selectedRecords.value.length + '个设备，请选择关联区域',
    })
    .setData({
      selectedDevices: selectedRecords.value.map((item) => ({
        label: item.deviceName + (item.deviceAlias ? '(' + item.deviceAlias + ')' : ''),
        value: JSON.stringify({
          deviceName: item.deviceName,
          productID: item.productID,
        }),
      })),
    })
    .open();
}

function handleDetail(device: any) {
  router.push({
    name: 'DevicesDetail',
    query: { deviceName: device.deviceName, productID: device.productID },
  });
}

defineExpose({
  gridApi,
  updateQueryParams,
});
</script>

<template>
  <div class="flex h-[calc(100vh-300px)] flex-col">
    <Modal />
    <Grid>
      <template #toolbar-actions>
        <NButton type="primary" v-if="selectedRecords.length > 0" @click="handleLinkArea">关联区域</NButton>
      </template>

      <template #isEnable="{ row }">
        <NTag :type="row.isEnable === 1 ? 'success' : 'error'">
          {{ row.isEnable === 1 ? '启用' : '禁用' }}
        </NTag>
      </template>

      <template #isOnline="{ row }">
        <NTag :type="row.isOnline === 1 ? 'default' : 'success'">
          {{ row.isOnline === 1 ? '离线' : '在线' }}
        </NTag>
      </template>

      <template #status="{ row }">
        <NTag :color="getDeviceStatusInfo(row.status)">
          {{ getDeviceStatusLabel(row.status) }}
        </NTag>
      </template>

      <template #action="{ row }">
        <NButton @click="handleDetail(row)" size="small" text>详情</NButton>
      </template>
    </Grid>
  </div>
</template>
