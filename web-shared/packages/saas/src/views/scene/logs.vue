<script setup lang="ts">
import { localizedSceneState } from './locales';

import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import { watch } from 'vue';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { useVbenVxeGrid, type VbenFormSchema } from '@vben/saas';
import { NButton, NSpace, NTag } from 'naive-ui';
import { useRoute, useRouter } from 'vue-router';
import * as z from 'zod';

import { Api } from './index.api';
import LogsDetailDrawer from './modules/logs_detail_drawer.vue';

type RowType = {
  name: string;
  desc: string;
  createdTime: string;
  [key: string]: any;
};

const formSchema: VbenFormSchema[] = localizedSceneState(() => ([
  {
    component: 'Select',
    label: $t('scene.ui.executionStatus'),
    fieldName: 'status',
    componentProps: {
      options: [
        { label: $t('orgIotClient.deviceLogs.resultSuccess'), value: 1 },
        { label: $t('orgIotClient.deviceLogs.resultFailed'), value: 0 },
      ],
    },
  },
  {
    component: 'DatePicker',
    label: $t('iotApp.ota.reviewExecTime'),
    fieldName: 'createdTime',
    componentProps: {
      type: 'datetimerange',
      clearable: true,
    },
  },
]));

const router = useRouter();
const route = useRoute();

const [Drawer, drawerApi] = useVbenDrawer({
  connectedComponent: LogsDetailDrawer,
});

const parsed = z.string().safeParse(route.params.id);
if (!parsed.success) {
  router.replace({ name: 'FallbackNotFound' });
}
const id = Number(parsed.data) || 0;

const sceneName = (route.query.sceneName as string) || '';
const sceneDesc = (route.query.sceneDesc as string) || '';

/** buildLogColumns 按当前语言生成场景日志表格列名。 */
function buildLogColumns() {
  return [
    { field: 'createdTime', title: $t('iotApp.ota.reviewExecTime'), formatter: 'customTime' },
    { field: 'trigger.type', title: $t('orgManage.cloneGroup.triggerTypeLabel') },
    { field: 'status', title: $t('scene.ui.executionStatus'), slots: { default: 'status' } },
    { field: 'action', title: $t('orgIotClient.deviceLogs.hubAction'), align: 'center', slots: { default: 'action' } },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
    layout: 'horizontal',
    wrapperClass: 'grid-cols-2',
    fieldMappingTime: [
      ['createdTime', ['start', 'end'], (value: any) => value / 1000],
    ],
  },
  gridOptions: {
    columns: buildLogColumns(),
    proxyConfig: {
      ajax: {
        query: async (_queryArgs: { page: unknown }, formValues: Record<string, unknown>) => {
          const res = await Api.logIndex({
            sceneID: id,
            ...formValues,
          });
          return res;
        },
      },
      response: { result: 'list' },
    },
  },
});

/** 语言切换时刷新场景日志列名和筛选项。 */
watch(() => preferences.app.locale, () => {
  gridApi.setGridOptions({ columns: buildLogColumns() });
  gridApi.formApi.updateSchema(formSchema);
});

function formatTime(time: string) {
  return new Date(parseInt(time) * 1000).toLocaleString(preferences.app.locale);
}

function showSceneLogInfo(row: RowType) {
  const actions = row?.actions || [];
  drawerApi
    .setState({
      title: `${$t('scene.ui.sceneLogDetails')} - ${formatTime(row.createdTime)} - ${row.trigger.type}`,
    })
    .setData({ actions })
    .open();
}
</script>

<template>
  <Page :title="$t('scene.ui.sceneNameName', { name: sceneName })" :description="sceneDesc">
    <Drawer />
    <Grid class="mt-4">
      <template #status="{ row }">
        <NTag :type="row.status === 1 ? 'success' : 'error'">
                {{ row.status === 1 ? $t('orgIotClient.deviceLogs.resultSuccess') : $t('orgIotClient.deviceLogs.resultFailed') }}
        </NTag>
      </template>

      <template #action="{ row }">
        <NSpace align="center" justify="center">
          <NButton size="small" @click="showSceneLogInfo(row)" text>
            {{ $t('iotApp.deviceDetail.viewDetails') }}
          </NButton>
        </NSpace>
      </template>
    </Grid>
  </Page>
</template>
