<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import { nextTick, ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NButton, useMessage } from 'naive-ui';
import { extractList } from '#/utils/api-response';

import { useVbenVxeGrid } from '@vben/saas';

import { useColumns, useGridFormSchema } from './data';
import { Api } from './index.api';
import Form from './modules/form.vue';
import BatchCreate from './modules/batchCreate.vue';
import AddDevices from './modules/addDevices.vue';

const message = useMessage();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [BatchCreateModal, batchCreateModalApi] = useVbenModal({
  connectedComponent: BatchCreate,
  destroyOnClose: true,
});

const [AddDevicesModal, addDevicesModalApi] = useVbenModal({
  connectedComponent: AddDevices,
  destroyOnClose: true,
  onClosed() {
    gridApi.query();
  },
});

// 记录新增后需要展开/选中的分组信息
const pendingNewGroup = ref<{ id: string; parentID: string } | null>(null);

function onActionClick({ code, row }: OnActionClickParams<ThingsApi.GroupInfo>) {
  switch (code) {
    case 'append': {
      formModalApi.setData({
        parentID: row.id,
        purpose: row.purpose,
        productID: row.productID,
        areaID: row.areaID,
      }).open();
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      formModalApi.setData(row).open();
      break;
    }
    case 'addDevices': {
      onAddDevices(row);
      break;
    }
    case 'selectedDevices': {
      onDeleteDevices(row);
      break;
    }
    default: {
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid<ThingsApi.GroupInfo>({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
    submitButtonOptions: {
      ghost: true,
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    treeConfig: {
      parentField: 'parentID',
      rowField: 'id',
      transform: true,
      expandAll: true,
    },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const res = await Api.list(formValues);
          return {
            items: extractList(res),
            total: (res as any)?.total ?? (res as any)?.data?.total ?? 0,
          };
        },
      },
      response: {
        list: 'items',
        total: 'total',
      },
    },
    rowConfig: {
      keyField: 'id',
      isCurrent: true,
      isHover: true,
    },
    id: 'energy-device-group-grid',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
} as any);

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onBatchCreate() {
  batchCreateModalApi.open();
}

function onDelete(row: ThingsApi.GroupInfo) {
  if (!row.id) return;
  Api.delete(row.id)
    .then(() => {
      message.success($t('orgManage.common.deleteSuccess'));
      onRefresh();
    })
    .catch((err: any) => {
      notifyRequestError(err, () => err?.message || $t('orgManage.common.deleteFailed'), (text) => message.error(text));
    });
}

function onAddDevices(row: ThingsApi.GroupInfo) {
  addDevicesModalApi
    .setData({
      ...row,
      operationType: 'add',
    })
    .open();
}

function onDeleteDevices(row: ThingsApi.GroupInfo) {
  addDevicesModalApi
    .setData({
      ...row,
      operationType: 'selectedDevices',
    })
    .open();
}

async function onFormSuccess(data: { id?: string; parentID?: string; isEdit: boolean }) {
  if (!data.isEdit && data.id) {
    pendingNewGroup.value = { id: data.id, parentID: data.parentID || '' };
  }
  await gridApi.query();
  if (pendingNewGroup.value) {
    await nextTick();
    const grid = gridApi.grid;
    if (grid) {
      const { id, parentID } = pendingNewGroup.value;
      if (parentID) {
        const parentRow = grid.getRowById(parentID);
        if (parentRow) {
          await grid.setTreeExpand(parentRow, true);
        }
      }
      const newRow = grid.getRowById(id);
      if (newRow) {
        await grid.setCurrentRow(newRow);
        await grid.scrollToRow(newRow);
      }
    }
    pendingNewGroup.value = null;
  }
}
</script>

<template>
  <Page title="" auto-content-height>
    <FormModal @success="onFormSuccess" />
    <BatchCreateModal @success="onRefresh" />
    <AddDevicesModal />
    <Grid>
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate" ghost>
          <span class="icon-[mdi--plus] size-5"></span>
          {{ $t('orgIotClient.deviceSpace.addGroup') }}
        </NButton>
        <NButton type="primary" ghost class="ml-2" @click="onBatchCreate">
          <span class="icon-[mdi--file-tree] size-5"></span>
          {{ $t('orgIotClient.deviceSpace.batchCreateGroupTitle') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>
