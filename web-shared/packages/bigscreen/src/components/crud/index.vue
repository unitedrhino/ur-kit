<script setup lang="ts">
// import type { Product } from './index.api';

import type { OnActionClickParams } from '@vben/saas';

import { ThingsApi } from '@vben/api';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t, useVbenVxeGrid } from '@vben/saas';

import { NButton, useMessage } from 'naive-ui';

import { useColumns } from './data';
import { Api } from './index.api';
import Form from './modules/form.vue';

// import Step from './step.vue';

const message = useMessage();
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    default: {
      break;
    }
  }
}
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    // pagerConfig: {
    //   enabled: false,
    // },
    proxyConfig: {
      ajax: {
        query: async ({ page }: { page: { currentPage: number; pageSize: number } }, formValues: any) => {
          const res = await Api.list(page.currentPage, page.pageSize, formValues);

          // console.log('res ===================== ', res);
          return {
            items: res.list,
            total: res.total,
            // total:res.length,
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
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'pid',
      rowField: 'id',
      transform: false,
    },
  },
});

function onRefresh() {
  gridApi.query();
}
function onEdit(row: ThingsApi.ProductInfo) {
  formDrawerApi.setData(row).open();
}
function onCreate() {
  formDrawerApi.setData({}).open();
  // router.push('/iot/product/add');
}
function onAppend(row: ThingsApi.ProductInfo) {
  formDrawerApi.setData({ pid: row.productID }).open();
}
function onDelete(row: ThingsApi.ProductInfo) {
  if (!row.productID) return;
  Api.delete(row.productID)
    .then(() => {
      message.success('删除成功');
      onRefresh();
    })
    .catch(() => {
      message.error('删除失败');
    });
}
function onDetail(_row: ThingsApi.ProductInfo) {
  // router.push(`iot/product/info/${_row.productID}?tab=devices`);
}
</script>

<template>
  <Page title="" auto-content-height>
    <RouterView />
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate" ghost>
          <span class="icon-[mdi--plus] size-5"></span>
          {{ $t('ui.actionTitle.create') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>
