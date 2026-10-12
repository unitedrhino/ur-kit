<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';

import { nextTick, ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { $t } from '@vben/locales';
import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { NButton, useMessage } from 'naive-ui';

import { useVbenForm, useVbenVxeGrid } from '@vben/saas';

import {
  useAreaGroupsColumns,
  useGroupEditFormSchema,
} from '../data';
import { Api } from '../index.api';
import AddDevices from '../../device-group/modules/addDevices.vue';

const message = useMessage();

const [AddDevicesModal, addDevicesModalApi] = useVbenModal({
  connectedComponent: AddDevices,
  destroyOnClose: true,
  onClosed() {
    gridApi.query();
    onSuccessCallback?.();
  },
});

let areaID = '';
let areaName = '';
let onSuccessCallback: (() => void) | null = null;

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData<{
        areaID: string;
        areaName: string;
        onSuccess?: () => void;
      }>();
      if (data) {
        areaID = data.areaID;
        areaName = data.areaName;
        onSuccessCallback = data.onSuccess || null;
        modalApi.setState({ title: $t('iotApp.area.groupListOf', { name: areaName }) });
        await nextTick();
        gridApi.query();
      }
    }
  },
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<ThingsApi.GroupInfo>) {
  switch (code) {
    case 'edit': {
      editingGroup.value = row;
      formDrawerApi.setData(row).open();
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'viewGroupDevices': {
      const operationType = (row.deviceCount ?? 0) > 0 ? 'selectedDevices' : 'add';
      addDevicesModalApi.setData({ ...row, operationType }).open();
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useAreaGroupsColumns(onActionClick),
    minHeight: 300,
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
          if (!areaID) return { items: [], total: 0 };
          const res = await Api.getGroupList(1, 500, {
            ...formValues,
            areaID,
            page: { page: 1, size: 500, orders: [{ field: 'name', sort: 1 }] },
          });
          return { items: res.list, total: res.total };
        },
      },
      response: { list: 'items', total: 'total' },
    },
    id: 'area-groups-grid',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: false,
    },
  } as VxeTableGridOptions,
});

// --- 创建/编辑表单 ---
const editingGroup = ref<ThingsApi.GroupInfo | null>(null);

const [EditForm, editFormApi] = useVbenForm({
  commonConfig: { colon: true },
  schema: useGroupEditFormSchema(),
  showDefaultActions: false,
});

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  onConfirm: onFormSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = formDrawerApi.getData<ThingsApi.GroupInfo>();
      if (data?.id) {
        editingGroup.value = data;
        editFormApi.setValues(data);
      } else {
        editingGroup.value = null;
        editFormApi.resetForm();
      }
    }
  },
});

async function onFormSubmit() {
  const { valid } = await editFormApi.validate();
  if (!valid) return;

  formDrawerApi.lock();
  try {
    const values = await editFormApi.getValues<ThingsApi.GroupInfo>();
    if (editingGroup.value?.id) {
      await Api.updateGroup({ ...values, id: editingGroup.value.id });
      message.success($t('orgIotClient.deviceSpace.updateSuccess'));
    } else {
      await Api.createGroup({ ...values, areaID });
      message.success($t('orgIotClient.deviceSpace.createSuccess'));
    }
    formDrawerApi.close();
    gridApi.query();
    onSuccessCallback?.();
  } catch (err: any) {
    notifyRequestError(err, () => err?.message || $t('orgIotClient.deviceSpace.operationFailed'), (text) => message.error(text));
  } finally {
    formDrawerApi.unlock();
  }
}

function onCreate() {
  editingGroup.value = null;
  formDrawerApi.setData({}).open();
}

function onDelete(row: ThingsApi.GroupInfo) {
  if (!row.id) return;
  Api.deleteGroup(row.id)
    .then(() => {
      message.success($t('orgManage.common.deleteSuccess'));
      gridApi.query();
      onSuccessCallback?.();
    })
    .catch((err: any) => {
      notifyRequestError(err, () => err?.message || $t('orgManage.common.deleteFailed'), (text) => message.error(text));
    });
}
</script>

<template>
  <Modal :title="$t('iotApp.area.groupListTitle')" class="w-[780px]" :footer="false">
    <FormDrawer :title="editingGroup?.id ? $t('orgIotClient.deviceSpace.editGroup') : $t('orgIotClient.deviceSpace.addGroup')">
      <EditForm />
    </FormDrawer>
    <AddDevicesModal />
    <div class="pb-4">
      <Grid>
        <template #toolbar-tools>
          <NButton type="primary" ghost size="small" @click="onCreate">
            <span class="icon-[mdi--plus] size-4"></span>
            {{ $t('orgIotClient.deviceSpace.addGroup') }}
          </NButton>
        </template>
      </Grid>
    </div>
  </Modal>
</template>
