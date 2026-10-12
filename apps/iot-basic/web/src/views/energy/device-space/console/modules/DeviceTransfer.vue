<!--
  设备区域转移弹窗：选择目标区域并批量更新设备归属区域。
-->
<script setup lang="ts">
import { notifyRequestError } from '@vben/saas/request-error';

import type { GroupType } from '#/hooks/use-energy-tree';

import { computed, ref, watch } from 'vue';

import { ThingsApi } from '@vben/api';
import { message } from '@vben/saas';
import { $t } from '@vben/locales';
import { Button } from '@unitedrhino/saas-ui/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unitedrhino/saas-ui/ui/dialog';
import { Spinner } from '@unitedrhino/saas-ui/ui/spinner';

import EnergyTreeSelector from '#/components/energy/EnergyTreeSelector.vue';
import { extractList } from '#/utils/api-response';

interface DeviceRow {
  deviceName: string;
  productID: string;
}
type DeviceTransferScope = {
  areaID?: string;
  areaIDPath?: string;
  groupID?: string;
};

const props = defineProps<{
  /** areaID 当前设备所在区域，用于阻止转移到同一区域。 */
  areaID?: string;
  /** mode 标识转移已选设备，还是转移当前后端范围内全部设备。 */
  mode?: 'scope' | 'selected';
  /** open 控制转移弹窗显隐。 */
  open: boolean;
  /** rows 本次需要转移的设备行。 */
  rows: DeviceRow[];
  /** scope 后端全选范围字段，支持区域、区域路径或分组。 */
  scope?: DeviceTransferScope;
}>();

const emit = defineEmits<{
  /** success 转移成功后通知控制台刷新列表。 */
  success: [];
  /** update:open 同步弹窗显隐状态。 */
  'update:open': [open: boolean];
}>();

const dialogOpen = computed({
  get: () => props.open,
  set: (open: boolean) => emit('update:open', open),
});

const groupType = ref<GroupType>('areaID');
const loading = ref(false);
const searchValue = ref('');
const sending = ref(false);
const targetAreaKeys = ref<string[]>([]);
const treeData = ref<any[]>([]);

function flatToTree(list: any[]): any[] {
  const map: Record<string, any> = {};
  const tree: any[] = [];
  for (const item of list) {
    map[item.areaID] = {
      key: item.areaID,
      label: item.areaName,
      value: item.areaID,
      children: [],
    };
  }
  for (const item of list) {
    const node = map[item.areaID];
    if (item.parentAreaID && map[item.parentAreaID]) {
      map[item.parentAreaID].children.push(node);
    } else if (node) {
      tree.push(node);
    }
  }
  function clean(nodes: any[]) {
    for (const node of nodes) {
      if (node.children.length === 0) {
        delete node.children;
      } else {
        clean(node.children);
      }
    }
  }
  clean(tree);
  return tree;
}

async function fetchAreaTree() {
  loading.value = true;
  try {
    const response: any = await ThingsApi.postApiV1ThingsAreaInfoGetList({});
    const areaTree = flatToTree(extractList(response));
    const unclassified = { key: '2', label: $t('orgIotClient.console.unclassifiedArea'), value: '2' };
    treeData.value = [unclassified, ...areaTree];
  } catch (error) {
    console.error('fetchAreaTree error', error);
    notifyRequestError(error, () => $t('orgIotClient.console.areaLoadFailed'), (text) => message.error(text));
  } finally {
    loading.value = false;
  }
}

/** onConfirm 校验目标区域并提交批量转移。 */
async function onConfirm() {
  const targetAreaID = targetAreaKeys.value[0];
  if (!targetAreaID) {
    message.warning($t('orgIotClient.console.selectTargetArea'));
    return;
  }
  if (targetAreaID === props.areaID) {
    message.warning($t('orgIotClient.console.sameAreaForbidden'));
    return;
  }

  sending.value = true;
  try {
    const payload = props.mode === 'scope'
      ? {
          areaID: targetAreaID,
          ...(props.scope || {}),
        }
      : {
          areaID: targetAreaID,
          devices: props.rows.map((row) => ({
            deviceName: row.deviceName,
            productID: row.productID,
          })),
        };
    await ThingsApi.postApiV1ThingsDeviceInfoBatchUpdate(payload as any);
    message.success($t('orgIotClient.console.transferSuccess'));
    emit('success');
    dialogOpen.value = false;
  } catch (error) {
    console.error('transfer error', error);
    notifyRequestError(error, () => $t('orgIotClient.console.transferFailed'), (text) => message.error(text));
  } finally {
    sending.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    targetAreaKeys.value = [];
    searchValue.value = '';
    fetchAreaTree();
  },
);
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="flex max-h-[86vh] w-[calc(100vw-24px)] max-w-[520px] flex-col gap-0 p-0">
      <DialogHeader class="border-b px-5 py-4">
        <DialogTitle>{{ $t('orgIotClient.console.selectTargetAreaTitle') }}</DialogTitle>
        <DialogDescription>
          <template v-if="mode === 'scope'">{{ $t('orgIotClient.console.transferScopeDesc') }}</template>
          <template v-else>{{ $t('orgIotClient.console.transferRowsDesc', { count: rows.length }) }}</template>
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 px-5 py-4">
        <div class="h-[min(54vh,420px)] rounded-md border p-3">
          <EnergyTreeSelector
            v-model:selected-keys="targetAreaKeys"
            v-model:group-type="groupType"
            v-model:search-value="searchValue"
            :tree-data="treeData"
            :loading="loading"
            :multiple="false"
            :show-group-type="false"
          />
        </div>
      </div>

      <DialogFooter class="flex-col gap-2 border-t px-5 py-4 sm:flex-row">
        <Button class="w-full sm:w-auto" type="button" variant="outline" :disabled="sending" @click="dialogOpen = false">{{ $t('common.cancel') }}</Button>
        <Button class="w-full sm:w-auto" type="button" :disabled="sending" @click="onConfirm">
          <Spinner v-if="sending" class="size-4" />
          {{ $t('orgIotClient.console.confirmTransfer') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
