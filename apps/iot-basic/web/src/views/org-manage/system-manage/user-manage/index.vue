<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

  import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';


  import { CoreApi } from '@vben/api';
  import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

  import { NButton, useMessage } from 'naive-ui';

  import { useVbenVxeGrid } from '@vben/saas';
  import { $t, SaasAvatar } from '@vben/saas';

  import { useColumns, useGridFormSchema } from './data';
  import { Api } from './index.api';
  import Form from './modules/form.vue';
  import Add from './modules/add.vue';

  const message = useMessage();
  const [FormDrawer, formDrawerApi] = useVbenDrawer({
    connectedComponent: Form,
    destroyOnClose: true,
  });
  const [AddModal, addModalApi] = useVbenModal({
    connectedComponent: Add,
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
    formOptions: {
      // fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
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
      proxyConfig: {
        ajax: {
          query: async ({ page }, formValues) => {
            const res = await Api.list(page.currentPage, page.pageSize, formValues);

            return {
              items: res.list,
              total: res.total,
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
      id: 'iot-device-grid',
      customConfig: {
        storage: true,
        mode: 'default',
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
    } as VxeTableGridOptions,
  });

  function onRefresh() {
    gridApi.query();
  }
  function onEdit(row: CoreApi.TenantInfo) {
    formDrawerApi.setData(row).open();
  }
  function onCreate() {
    addModalApi.open();
  }
  function onAppend(row: CoreApi.TenantInfo) {
    formDrawerApi.setData({ pid: row.code }).open();
  }
  function onDelete(row: CoreApi.UserInfo) {
    if (!row.userID) return;
    Api.delete(row.userID)
      .then(() => {
        message.success($t('orgManage.common.deleteSuccess'));
        onRefresh();
      })
      .catch((requestError) => {
        notifyRequestError(requestError, () => $t('orgManage.common.deleteFailed'), (text) => message.error(text));
      });
  }
  function onDetail(row: CoreApi.TenantInfo) {
    message.warning($t('orgIotClient.org.detailNotAvailable', { code: row.code || '-' }));
  }
  </script>

  <template>
    <Page title="" auto-content-height>
      <FormDrawer @success="onRefresh" />
      <AddModal @success="onRefresh" />
      <Grid>
        <template #toolbar-tools>
          <NButton type="primary" @click="onCreate" ghost>
            <span class="icon-[mdi--plus] size-5"></span>
            {{ $t('ui.actionTitle.create') }}
          </NButton>
        </template>
        <template #avatar="{ row }">
          <div class="flex items-center justify-center">
            <SaasAvatar :avatar="row.avatar" :name="row.nickName || row.userName" :size="32" class="rounded-full" />
          </div>
        </template>
      </Grid>
    </Page>
  </template>

  <style scoped></style>
