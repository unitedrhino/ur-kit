<script setup lang="ts">
/**
 * org-iot-client 场景日志列表页。
 *
 * 当前应用尚未接入场景日志详情路由，操作入口避免跳转到旧应用裸路径。
 */
import { $t } from '@vben/locales';
import type { VxeTableGridOptions } from '@vben/saas';

import { onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { ThingsApi } from '@vben/api';
import { useVbenVxeGrid } from '@vben/saas';
import { useMessage } from 'naive-ui';

const message = useMessage();

function onActionClick({ code, row }: any) {
  if (code === 'log') {
    message.warning($t('orgIotClient.energyDashboard.sceneDetailNotAvailable', { name: row.name || row.id || '-' }));
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      { component: 'Input', fieldName: 'name', label: $t('orgIotClient.energyDashboard.sceneName') },
    ],
    submitOnChange: true,
    submitButtonOptions: { ghost: true },
  },
  gridOptions: {
    columns: [
      { field: 'name', title: $t('orgIotClient.energyDashboard.sceneName') },
      { field: 'desc', title: $t('orgIotClient.energyDashboard.sceneDesc') },
      { field: 'lastRunTime', title: $t('orgIotClient.energyDashboard.lastRunTime'), formatter: 'customTime' },
      {
        align: 'center',
        cellRender: {
          attrs: { nameField: 'name', onClick: onActionClick },
          name: 'CellOperation',
          options: [{ code: 'log', text: $t('iotApp.devicePage.log') }],
        },
        field: 'operation',
        fixed: 'right',
        headerAlign: 'center',
        showOverflow: false,
        title: $t('orgManage.common.operation'),
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const res = await ThingsApi.postApiV1ThingsRuleSceneInfoGetList({
            page: { page: page.currentPage, size: page.pageSize },
            ...formValues,
          });
          return { items: (res as any).list, total: (res as any).total };
        },
      },
      response: { list: 'items', total: 'total' },
    },
    rowConfig: { keyField: 'id' },
    id: 'energy-scene-log-grid',
    customConfig: { storage: true, mode: 'default' },
    toolbarConfig: { export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

onMounted(() => {
  gridApi.query();
});
</script>

<template>
  <Page title="" auto-content-height>
    <Grid />
  </Page>
</template>
