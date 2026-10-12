<script lang="ts" setup>
  import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';
  import type { CoreApi } from '@vben/api';

  import { Page, useVbenDrawer } from '@vben/common-ui';
  import { Plus } from '@vben/icons';

  import { NButton } from 'naive-ui';

  import { useVbenVxeGrid } from '@vben/saas';
  // import { deleteRole, getRoleList, updateRole } from '#/api';
  import { $t } from '@vben/saas';

  import { useColumns, useGridFormSchema } from './data';
  import Form from './modules/form.vue';

  import { Api } from './index.api';

  const [FormDrawer, formDrawerApi] = useVbenDrawer({
    connectedComponent: Form,
    destroyOnClose: true,
  });

  const [Grid, gridApi] = useVbenVxeGrid({
    formOptions: {
      fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
      schema: useGridFormSchema(),
      submitOnChange: true,
    },
    gridOptions: {
      columns: useColumns(onActionClick, onStatusChange),
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

      toolbarConfig: {
        custom: true,
        export: false,
        refresh: true,
        search: true,
        zoom: true,
      },
    } as VxeTableGridOptions<CoreApi.RoleInfo>,
  });

  function onActionClick(e: OnActionClickParams<CoreApi.RoleInfo>) {
    switch (e.code) {
      case 'delete': {
        onDelete(e.row);
        break;
      }
      case 'edit': {
        onEdit(e.row);
        break;
      }
    }
  }

  /**
   * 状态开关即将改变
   * @param newStatus 期望改变的状态值
   * @param row 行数据
   * @returns 返回false则中止改变
   */
  async function onStatusChange(_newStatus: number, _row: CoreApi.RoleInfo) {
    try {
      // TODO: 实现状态切换逻辑
      return false;
    } catch {
      return false;
    }
  }

  function onEdit(row: CoreApi.RoleInfo) {
    formDrawerApi.setData(row).open();
  }

  function onDelete(_row: CoreApi.RoleInfo) {
    // TODO: 实现删除角色逻辑
  }

  function onRefresh() {
    gridApi.query();
  }

  function onCreate() {
    formDrawerApi.setData({}).open();
  }
  </script>
  <template>
    <Page auto-content-height>
      <FormDrawer @success="onRefresh" />
      <Grid :table-title="$t('system.role.list')">
        <template #toolbar-tools>
          <NButton type="primary" @click="onCreate">
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
          </NButton>
        </template>
      </Grid>
    </Page>
  </template>
