<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { ref, computed, nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { NButton, useMessage } from 'naive-ui';

import { useVbenVxeGrid } from '@vben/saas';

import { useAddDevicesFormSchema, useAddDevicesColumns, useSelectedDevicesFormSchema } from '../data';

import type { ThingsApi } from '@vben/api';
import { Api } from '../index.api';

const message = useMessage();

const groupID = ref<string | null>(null);
const groupName = ref<string>('');
const groupOperationType = ref<'add' | 'selectedDevices'>('add');
const selectedCount = ref(0);

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ThingsApi.GroupInfo & { operationType: 'add' | 'selectedDevices' }>();
      groupID.value = data?.id ?? null;
      groupName.value = data?.name ?? '';
      groupOperationType.value = data?.operationType ?? 'add';
      selectedCount.value = 0;
      const schema = groupOperationType.value === 'selectedDevices'
        ? useSelectedDevicesFormSchema()
        : useAddDevicesFormSchema();
      gridApi.setState({ formOptions: { schema } });
      nextTick(() => {
        if (groupOperationType.value === 'selectedDevices' && groupID.value) {
          gridApi.formApi.setFieldValue('groupID', groupID.value);
        }
        gridApi.query();
      });
    }
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useAddDevicesFormSchema(),
    submitOnChange: true,
    showDefaultActions: false,
  },
  gridOptions: {
    columns: useAddDevicesColumns(),
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: { page: { currentPage: number, pageSize: number } }, formValues: any) => {
          const params = { ...formValues };
          if (groupOperationType.value === 'add') {
            params.notGroupID = groupID.value;
          } else if (!params.groupID) {
            params.groupID = groupID.value;
          }
          const res = await Api.getAddDevicesList(page.currentPage, page.pageSize, params);
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
    checkboxConfig: {
      checkMethod: () => true,
    },
    id:'iot-add-devices-grid',
    customConfig: {
      storage: true,
      mode:'default'
    },
  },
  gridEvents: {
    checkboxChange: () => {
      selectedCount.value = gridApi.grid?.getCheckboxRecords()?.length ?? 0;
    },
    checkboxAll: () => {
      selectedCount.value = gridApi.grid?.getCheckboxRecords()?.length ?? 0;
    },
  },
});

async function onSubmit() {
  modalApi.lock();
  try {
    if (!groupID.value) {
      message.error($t('iotApp.group.selectFirst'));
      modalApi.unlock();
      return;
    }
    const selectedRows = gridApi.grid?.getCheckboxRecords();
    if (!selectedRows?.length) {
      message.warning($t('orgIotClient.deviceSpace.selectDevicesFirst'));
      modalApi.unlock();
      return;
    }

    const list = selectedRows.map((item: ThingsApi.DeviceCore) => ({
      deviceName: item.deviceName,
      productID: item.productID,
    }));
    if (groupOperationType.value === 'add') {
      await Api.addGroupDevice(groupID.value, list);
      message.success($t('orgManage.user.addSuccess'));
    } else {
      await Api.deleteGroupDevice(groupID.value, list);
      message.success($t('orgIotClient.deviceSpace.unbindSuccess'));
    }

    modalApi.close();
  } catch (error) {
    modalApi.unlock();
  } finally {
    modalApi.unlock();
  }
}

async function onUnbind() {
  if (!groupID.value) return;
  const selectedRows = gridApi.grid?.getCheckboxRecords();
  if (!selectedRows?.length) {
    message.warning($t('orgIotClient.deviceSpace.selectUnbindFirst'));
    return;
  }
  const list = selectedRows.map((item: ThingsApi.DeviceCore) => ({
    deviceName: item.deviceName,
    productID: item.productID,
  }));
  try {
    await Api.deleteGroupDevice(groupID.value, list);
    message.success($t('orgIotClient.deviceSpace.unbindSuccess'));
    selectedCount.value = 0;
    gridApi.query();
  } catch (error) {
    notifyRequestError(error, () => $t('orgIotClient.deviceSpace.unbindFailed'), (text) => message.error(text));
  }
}

const getModalTitle = computed(() => {
  if (groupOperationType.value === 'add') {
    return groupName.value ? $t('orgIotClient.deviceSpace.addDevicesOf', { name: groupName.value }) : $t('orgIotClient.deviceSpace.addDevicesTitle');
  }
  return $t('orgIotClient.deviceSpace.selectedDevicesTitle');
});

const isDeleteMode = computed(() => groupOperationType.value === 'selectedDevices');

function onSwitchToAdd() {
  groupOperationType.value = 'add';
  selectedCount.value = 0;
  gridApi.setState({ formOptions: { schema: useAddDevicesFormSchema() } });
  gridApi.query();
}

function onSwitchToSelected() {
  groupOperationType.value = 'selectedDevices';
  selectedCount.value = 0;
  gridApi.setState({ formOptions: { schema: useSelectedDevicesFormSchema() } });
  nextTick(() => {
    if (groupID.value) {
      gridApi.formApi.setFieldValue('groupID', groupID.value);
    }
    gridApi.query();
  });
}
</script>
<template>
  <Modal :title="getModalTitle" class="w-[1200px] h-[800px]">
    <Grid></Grid>
    <template v-if="isDeleteMode" #prepend-footer>
      <div class="mr-auto flex gap-2">
        <NButton type="error" :disabled="selectedCount === 0" @click="onUnbind">
          {{ $t('iotApp.devicePage.unbind') }} {{ selectedCount > 0 ? `(${selectedCount})` : '' }}
        </NButton>
        <NButton type="primary" @click="onSwitchToAdd">
          {{ $t('iotApp.area.add') }}
        </NButton>
      </div>
    </template>
    <template v-if="!isDeleteMode" #prepend-footer>
      <NButton class="mr-auto" @click="onSwitchToSelected">
        {{ $t('orgIotClient.deviceSpace.selectedDevicesTitle') }}
      </NButton>
    </template>
  </Modal>
</template>
