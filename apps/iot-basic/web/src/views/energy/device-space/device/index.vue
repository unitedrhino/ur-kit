<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

/**
 * org-iot-client 设备列表页。
 *
 * 负责展示当前组织项目下的设备，并在详情跳转时保留组织作用域路由前缀。
 */
import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import { useRoute, useRouter } from 'vue-router';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { NButton, useMessage } from 'naive-ui';
import { useVbenVxeGrid } from '@vben/saas';
import { buildOrgPath, extractOrgIdFromPath } from '#/router/org-scope';
import { useColumns, useGridFormSchema } from './data';
import { Api } from './index.api';
import Form from './modules/form.vue';

const message = useMessage();
/** 当前路由用于读取 URL 第一段组织 code。 */
const route = useRoute();
const router = useRouter();

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) {
    case 'detail': {
      const targetPath = `/device-space/device-info/${encodeURIComponent(row.productID)}/${encodeURIComponent(row.deviceName)}`;
      router.push(buildOrgPath(extractOrgIdFromPath(route.path), targetPath));
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    default:
      break;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
    submitButtonOptions: { ghost: true },
    wrapperClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const res = await Api.list(page.currentPage, page.pageSize, formValues);
          return { items: res.list, total: res.total };
        },
      },
      response: { list: 'items', total: 'total' },
    },
    rowConfig: { keyField: 'deviceName' },
    id: 'energy-device-space-device-grid',
    customConfig: { storage: true, mode: 'default' },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({ mode: 'create' });
  formDrawerApi.open();
}

async function onDelete(row: any) {
  if (!row.productID || !row.deviceName) return;
  try {
    await Api.delete(row.productID, row.deviceName);
    message.success($t('orgManage.common.deleteSuccess'));
    onRefresh();
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('orgManage.common.deleteFailed'), (text) => message.error(text));
  }
}

function onDrawerSuccess() {
  onRefresh();
}
</script>

<template>
  <Page title="" auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <NButton type="primary" size="small" @click="onCreate">{{ $t('orgIotClient.deviceSpace.addDevice') }}</NButton>
      </template>
    </Grid>
    <FormDrawer @success="onDrawerSuccess" />
  </Page>
</template>
