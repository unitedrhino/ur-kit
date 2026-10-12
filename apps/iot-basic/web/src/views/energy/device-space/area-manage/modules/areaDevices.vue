<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { ref, computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { NButton, useMessage } from 'naive-ui';

import { useVbenVxeGrid } from '@vben/saas';

import { useAreaDevicesFormSchema, useAreaDevicesColumns, useAreaSelectedDevicesFormSchema } from '../data';

import type { ThingsApi } from '@vben/api';
import { Api } from '../index.api';

/** 未分类区域虚拟节点 ID（后端 def.NotClassified = 2） */
const UNCLASSIFIED_AREA_ID = '2';

const message = useMessage();

const areaID = ref<string | null>(null);
const areaName = ref<string>('');
const operationType = ref<'add' | 'selectedDevices'>('add');
const selectedCount = ref(0);
const onSuccessCallback = ref<(() => void) | null>(null);

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ThingsApi.AreaInfo & { operationType: 'add' | 'selectedDevices'; onSuccess?: () => void }>();
      areaID.value = data?.areaID ?? null;
      areaName.value = data?.areaName ?? '';
      operationType.value = data?.operationType ?? 'add';
      onSuccessCallback.value = data?.onSuccess ?? null;
      selectedCount.value = 0;
      const schema = operationType.value === 'selectedDevices'
        ? useAreaSelectedDevicesFormSchema(areaID.value)
        : useAreaDevicesFormSchema();
      gridApi.setState({ formOptions: { schema } });
      // Grid 挂载时 proxyConfig 会自动触发首次查询，无需手动 query
      // selectedDevices 模式的 areaID 通过 schema defaultValue 和 query 回调 fallback 设置
    }
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useAreaDevicesFormSchema(),
    submitOnChange: true,
    showDefaultActions: false,
  },
  gridOptions: {
    columns: useAreaDevicesColumns(),
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }: { page: { currentPage: number; pageSize: number } }, formValues: any) => {
          const params = { ...formValues };
          if (operationType.value === 'selectedDevices') {
            if (!params.areaID) {
              params.areaID = areaID.value;
            }
          } else if (operationType.value === 'add') {
            // 添加模式：只显示未分配区域的设备（areaID=2 为"未分类"节点）
            params.areaID = UNCLASSIFIED_AREA_ID;
          }
          const res = await Api.getDevicesList(page.currentPage, page.pageSize, params);
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
    id: 'energy-area-devices-grid',
    customConfig: {
      storage: true,
      mode: 'default',
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
    if (!areaID.value) {
      message.error($t('orgIotClient.deviceSpace.areaInfoMissing'));
      modalApi.unlock();
      return;
    }
    const selectedRows = gridApi.grid?.getCheckboxRecords();
    if (!selectedRows?.length) {
      message.warning($t('orgIotClient.deviceSpace.selectDevicesFirst'));
      modalApi.unlock();
      return;
    }

    const devices = selectedRows.map((item: ThingsApi.DeviceCore) => ({
      deviceName: item.deviceName,
      productID: item.productID,
    }));

    if (operationType.value === 'add') {
      await Api.batchUpdateDevices(devices, areaID.value);
      message.success($t('orgManage.user.addSuccess'));
    } else {
      await Api.batchUpdateDevices(devices, UNCLASSIFIED_AREA_ID);
      message.success($t('orgIotClient.deviceSpace.unbindSuccess'));
    }

    onSuccessCallback.value?.();
    modalApi.close();
  } catch {
    modalApi.unlock();
  } finally {
    modalApi.unlock();
  }
}

async function onUnbind() {
  if (!areaID.value) return;
  const selectedRows = gridApi.grid?.getCheckboxRecords();
  if (!selectedRows?.length) {
    message.warning($t('orgIotClient.deviceSpace.selectUnbindFirst'));
    return;
  }
  const devices = selectedRows.map((item: ThingsApi.DeviceCore) => ({
    deviceName: item.deviceName,
    productID: item.productID,
  }));
  try {
    await Api.batchUpdateDevices(devices, UNCLASSIFIED_AREA_ID);
    message.success($t('orgIotClient.deviceSpace.unbindSuccess'));
    selectedCount.value = 0;
    onSuccessCallback.value?.();
    gridApi.query();
  } catch (requestError) {
    notifyRequestError(requestError, () => $t('orgIotClient.deviceSpace.unbindFailed'), (text) => message.error(text));
  }
}

const getModalTitle = computed(() => {
  if (operationType.value === 'add') {
    return areaName.value ? $t('orgIotClient.deviceSpace.addDevicesOf', { name: areaName.value }) : $t('orgIotClient.deviceSpace.addDevicesTitle');
  }
  return areaName.value ? $t('orgIotClient.deviceSpace.selectedDevicesOf', { name: areaName.value }) : $t('orgIotClient.deviceSpace.selectedDevicesTitle');
});

const isSelectedMode = computed(() => operationType.value === 'selectedDevices');

function onSwitchToAdd() {
  operationType.value = 'add';
  selectedCount.value = 0;
  gridApi.setState({ formOptions: { schema: useAreaDevicesFormSchema() } });
  // submitOnChange 会在 schema 字段变化时自动触发查询
}

function onSwitchToSelected() {
  operationType.value = 'selectedDevices';
  selectedCount.value = 0;
  gridApi.setState({ formOptions: { schema: useAreaSelectedDevicesFormSchema(areaID.value) } });
  // submitOnChange 会在 schema 字段变化时自动触发查询
}
</script>

<template>
  <Modal :title="getModalTitle" class="w-[1200px] h-[900px]">
    <Grid></Grid>
    <template v-if="isSelectedMode" #prepend-footer>
      <div class="mr-auto flex gap-2">
        <NButton type="error" :disabled="selectedCount === 0" @click="onUnbind">
          {{ $t('iotApp.devicePage.unbind') }} {{ selectedCount > 0 ? `(${selectedCount})` : '' }}
        </NButton>
        <NButton type="primary" @click="onSwitchToAdd">
          {{ $t('iotApp.area.add') }}
        </NButton>
      </div>
    </template>
    <template v-if="!isSelectedMode" #prepend-footer>
      <NButton class="mr-auto" @click="onSwitchToSelected">
        {{ $t('orgIotClient.deviceSpace.selectedDevicesTitle') }}
      </NButton>
    </template>
  </Modal>
</template>
