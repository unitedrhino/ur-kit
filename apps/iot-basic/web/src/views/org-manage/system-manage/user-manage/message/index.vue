<script setup lang="ts">
import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { useVbenVxeGrid } from '@vben/saas';

import { useColumns } from './data';
import { Api } from './index.api';
import Form from './modules/form.vue';
import type { CoreApi } from '@vben/api';

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
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const res = await Api.list({
            page: {
              page: page.currentPage,
              size: page.pageSize,
            },
            ...formValues,
          });

          return {
            data: res.list,
            total: res.total,
          };
        },
      },
      response: {
        list: 'data',
        total: 'total',
        rows: 'data',
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      // export: false,
      refresh: true,
      // zoom: true,
    },
    treeConfig: {
      parentField: 'pid',
      rowField: 'id',
      transform: false,
    },
  } as VxeTableGridOptions,
});

function onRefresh() {
  gridApi.query();
}
function onEdit(row: CoreApi.UserInfo) {
  formDrawerApi.setData(row).open();
}
function onAppend(row: CoreApi.UserInfo) {
  formDrawerApi.setData({ pid: row.userID }).open();
}
function onDelete(_row: CoreApi.UserInfo) {}
</script>

<template>
  <Page title="" auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <!-- <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <span class="icon-[mdi--plus] size-5"></span>
          {{ $t('product.create') }}
        </NButton>
      </template> -->
    </Grid>
  </Page>
</template>

<style scoped></style>
