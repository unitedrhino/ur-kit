<script lang="ts" setup>
import { $t } from '@vben/locales';
import { ref } from 'vue';
import { useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid } from '@vben/saas';
import { ThingsApi } from '@vben/api';

import {
  NDescriptions,
  NDescriptionsItem,
  NList,
  NListItem,
  NSpace,
  NTag,
} from 'naive-ui';

type RowType = {
  name: string;
  desc: string;
  createdTime: string;
  [key: string]: any;
};

const datas = ref<ThingsApi.SceneLogAction[]>([]);

const [Grid, gridApi] = useVbenVxeGrid<RowType>({});

const [Drawer, drawerApi] = useVbenDrawer({
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = drawerApi.getData<Record<string, any>>();
      datas.value = data?.actions || [];

      gridApi.setGridOptions({
        showOverflow: true,
        columns: [
          {
            type: 'expand',
            width: 80,
            slots: { content: 'expand_content' },
          },
          {
            field: 'type',
            title: $t('scene.ui.executionType'),
            width: 80,
            slots: { default: 'type' },
          },
          {
            field: 'status',
            title: $t('iotApp.av.colStatus'),
            slots: { default: 'status' },
            width: 80,
          },
          { field: 'code', title: $t('orgManage.opLog.statusCode') },
          { field: 'msg', title: $t('orgEnergy.ui.information') },
          { field: 'msgToken', title: 'msgToken', width: 100 },
          { field: 'delay', title: $t('platformManage.devops.lblDelay') },
        ],
        data: datas.value,
        pagerConfig: {
          autoHidden: false,
          total: datas.value.length,
        },
      });
    }
  },
});

const getActionType = (type: string) => {
  switch (type) {
    case 'notify':
      return $t('console.message.severityInfo');
    case 'delay':
      return $t('scene.ui.delay');
    case 'device':
      return $t('scene.ui.deviceOutput');
    case 'alarm':
      return $t('orgIotClient.deviceLogs.toneAlert');
    default:
      return type;
  }
};
</script>

<template>
  <Drawer>
    <Grid>
      <template #type="{ row }">
        {{ getActionType(row.type || '') }}
      </template>
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'error'">
          {{ row.status === 1 ? $t('orgIotClient.deviceLogs.resultSuccess') : $t('orgIotClient.deviceLogs.resultFailed') }}
        </NTag>
      </template>
      <template #expand_content="{ row }">
        <NDescriptions :column="1" :bordered="true" class="mt-4">
          <NDescriptionsItem :label="$t('orgIotClient.console.devices')" v-if="row.device">
            <div>{{ $t('scene.ui.deviceExecutionType') }}: {{ row.device?.type }}</div>
            <div>{{ $t('iotApp.productPage.productId') }}: {{ row.device?.productID }}</div>
            <div>{{ $t('iotApp.productPage.productName') }}: {{ row.device?.productName }}</div>
            <div>{{ $t('iot.device.deviceId') }}: {{ row.device?.deviceName }}</div>
            <div>{{ $t('orgEnergy.ui.deviceName') }}: {{ row.device?.deviceAlias }}</div>
            <div>{{ $t('scene.ui.executionInformationCountItems', { count: row.device?.values?.length ?? 0 }) }}</div>
            <NList hoverable clickable>
              <NListItem
                :title="$t('scene.ui.indexThExecutionInformation', { index: device_index + 1 })"
                v-for="(device, device_index) in row.device?.values"
                :key="device.dataID"
              >
                <div>{{ $t('scene.ui.triggerId') }}: {{ device.dataID }}</div>
                <div>{{ $t('scene.ui.triggerName') }}: {{ device.dataName }}</div>
                <div>{{ $t('scene.ui.executionValue') }}: {{ device.value }}</div>
              </NListItem>
            </NList>
          </NDescriptionsItem>

          <NDescriptionsItem :label="$t('orgIotClient.deviceLogs.toneAlert')" v-if="row.alarm">
            {{ row.alarm.mode === 'trigger' ? $t('scene.ui.triggerAlarm') : $t('scene.ui.clearAlarm') }}
          </NDescriptionsItem>

          <NDescriptionsItem :label="$t('iotApp.schemaTags.scene')" v-if="row.scene">
            <NSpace>
              <div>{{ $t('scene.ui.sceneId') }}: {{ row.scene.sceneID }}</div>
              <div>{{ $t('orgEnergy.ui.sceneName') }}: {{ row.scene.sceneName }}</div>
            </NSpace>
          </NDescriptionsItem>
        </NDescriptions>
      </template>
    </Grid>
  </Drawer>
</template>
