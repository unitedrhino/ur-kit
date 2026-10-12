<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import { nextTick, ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useProjectStore } from '@vben/stores';

import { NButton, useMessage } from 'naive-ui';

import { useVbenVxeGrid } from '@vben/saas';
import { extractList } from '#/utils/api-response';

import { useColumns } from './data';
import { Api } from './index.api';
import Form from './modules/form.vue';
import BatchCreate from './modules/batchCreate.vue';
import AreaDevices from './modules/areaDevices.vue';
import AreaGroups from './modules/areaGroups.vue';

const message = useMessage();
const projectStore = useProjectStore();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DeviceModal, deviceModalApi] = useVbenModal({
  connectedComponent: AreaDevices,
  destroyOnClose: true,
  onClosed() {
    onRefresh();
  },
});

const [GroupModal, groupModalApi] = useVbenModal({
  connectedComponent: AreaGroups,
  destroyOnClose: true,
});

const [BatchCreateModal, batchCreateModalApi] = useVbenModal({
  connectedComponent: BatchCreate,
  destroyOnClose: true,
});

// 记录新增后需要展开/选中的区域信息
const pendingNewArea = ref<{ areaID: string; parentAreaID: string } | null>(null);

function onActionClick({ code, row }: OnActionClickParams<ThingsApi.AreaInfo>) {
  switch (code) {
    case 'add': {
      const projectID = projectStore.currentProjectID || '';
      formModalApi.setData({ projectID, parentAreaID: row.areaID }).open();
      break;
    }
    case 'edit': {
      formModalApi.setData(row).open();
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'addDevices': {
      deviceModalApi.setData({ areaID: row.areaID, areaName: row.areaName, operationType: 'add', onSuccess: () => onRefreshDelayed() }).open();
      break;
    }
    case 'selectedDevices': {
      deviceModalApi.setData({ areaID: row.areaID, areaName: row.areaName, operationType: 'selectedDevices', onSuccess: () => onRefreshDelayed() }).open();
      break;
    }
    case 'viewGroups': {
      groupModalApi.setData({ areaID: row.areaID, areaName: row.areaName, onSuccess: () => onRefresh() }).open();
      break;
    }
    default: {
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid<ThingsApi.AreaInfo>({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    treeConfig: {
      parentField: 'parentAreaID',
      rowField: 'areaID',
      transform: true,
      expandAll: true,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          const projectID = projectStore.currentProjectID;
          if (!projectID) return { items: [], total: 0 };
          const res = await Api.list(projectID);
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
      keyField: 'areaID',
      isCurrent: true,
      isHover: true,
    },
    id: 'energy-area-manage-grid',
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

/** 操作后立即刷新 + 延迟再刷一次（后端异步更新 deviceCount/groupCount 缓存） */
function onRefreshDelayed() {
  gridApi.query();
  setTimeout(() => gridApi.query(), 1000);
}

function onCreate() {
  const projectID = projectStore.currentProjectID || '';
  const currentRow = gridApi.grid?.getCurrentRecord?.();
  const parentAreaID = currentRow?.areaID || undefined;
  formModalApi.setData({ projectID, parentAreaID }).open();
}

function onBatchCreate() {
  const projectID = projectStore.currentProjectID || '';
  batchCreateModalApi.setData({ projectID }).open();
}

function onDelete(row: ThingsApi.AreaInfo) {
  if (!row.areaID) return;
  if (row.deviceCount && row.deviceCount > 0) {
    message.warning($t('orgIotClient.deviceSpace.deleteHasDevices', { count: row.deviceCount }));
    return;
  }
  const projectID = projectStore.currentProjectID || '';
  Api.delete(row.areaID, projectID)
    .then(() => {
      message.success($t('orgManage.common.deleteSuccess'));
      onRefresh();
    })
    .catch((err: any) => {
      notifyRequestError(err, () => err?.message || $t('orgManage.common.deleteFailed'), (text) => message.error(text));
    });
}

async function onFormSuccess(data: { areaID?: string; parentAreaID?: string; isEdit: boolean }) {
  if (!data.isEdit && data.areaID) {
    pendingNewArea.value = { areaID: data.areaID, parentAreaID: data.parentAreaID || '' };
  }
  await gridApi.query();
  if (pendingNewArea.value) {
    await nextTick();
    const grid = gridApi.grid;
    if (grid) {
      const { areaID, parentAreaID } = pendingNewArea.value;
      if (parentAreaID) {
        const parentRow = grid.getRowById(parentAreaID);
        if (parentRow) {
          await grid.setTreeExpand(parentRow, true);
        }
      }
      const newRow = grid.getRowById(areaID);
      if (newRow) {
        await grid.setCurrentRow(newRow);
        await grid.scrollToRow(newRow);
      }
    }
    pendingNewArea.value = null;
  }
}
</script>

<template>
  <Page title="" auto-content-height>
    <FormModal @success="onFormSuccess" />
    <BatchCreateModal @success="onRefresh" />
    <DeviceModal />
    <GroupModal />
    <Grid>
      <template #toolbar-tools>
        <NButton type="primary" ghost @click="onCreate">
          <span class="icon-[mdi--plus] size-5"></span>
          {{ $t('orgIotClient.deviceSpace.addArea') }}
        </NButton>
        <NButton type="primary" ghost @click="onBatchCreate" class="ml-2">
          <span class="icon-[mdi--file-tree] size-5"></span>
          {{ $t('orgIotClient.deviceSpace.batchCreateAreaTitle') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>
