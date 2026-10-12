<script setup lang="ts">
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';
import type { OnActionClickParams, VxeTableGridOptions } from '@vben/saas';
import { watch } from 'vue';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, useMessage } from 'naive-ui';

import { useVbenVxeGrid } from '@vben/saas';

import { Api } from './index.api';
import { sceneText } from './locales';

const props = withDefaults(
  defineProps<{
    /** 场景类型过滤（传入后 API 自动附加 type 参数） */
    sceneType?: string;
    /** API tag 参数 */
    tag?: string;
    /** 页面标题 */
    title?: string;
    /** 页面描述 */
    description?: string;
    /** 新增按钮跳转路由 */
    createRoute?: string;
    /** 新增按钮文案 */
    createButtonText?: string;
    /** 新版编辑器路由（灰度入口，留空则不显示按钮） */
    createRouteV2?: string;
    /** 新版编辑器按钮文案 */
    createButtonTextV2?: string;
    /** 编辑路由前缀（会自动拼接 ?id=xxx） */
    editRoutePrefix?: string;
    /** 日志路由前缀（会自动拼接 /:id?sceneName=&sceneDesc=） */
    logsRoutePrefix?: string;
    /** VxeGrid 持久化 ID */
    gridId?: string;
    /** 显示状态切换开关列（自动化场景） */
    showToggle?: boolean;
    /** 显示执行按钮（一键场景） */
    showExecute?: boolean;
    /** 显示场景类型列和筛选（合并视图） */
    showTypeColumn?: boolean;
  }>(),
  {
    title: 'orgIotClient.energyDashboard.sceneList',
    description:
      'orgEnergy.ui.automatedScenariosAllowSpaceEquipmentToAutomatic',
    createRoute: '/iot/scene/create',
    createButtonText: 'orgIotClient.energyDashboard.addScene',
    createRouteV2: '',
    createButtonTextV2: 'scene.ui.newVersionOfEditor',
    editRoutePrefix: '/iot/scene/create',
    logsRoutePrefix: '/iot/scene/logs',
    showToggle: false,
    showExecute: false,
    showTypeColumn: false,
  },
);

const message = useMessage();
const router = useRouter();

function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) {
    case 'edit': {
      router.push(`${props.editRoutePrefix}?id=${row.id}`);
      break;
    }
    case 'toggle': {
      onToggle(row);
      break;
    }
    case 'execute': {
      onExecute(row);
      break;
    }
    case 'detail': {
      router.push(
        `${props.logsRoutePrefix}/${row.id}?sceneName=${row.name}&sceneDesc=${row.desc}`,
      );
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}

/* ---------- 动态列 & 表单 ---------- */

function buildFormSchema() {
  const schema: any[] = [
    { component: 'Input', fieldName: 'name', label: $t('orgEnergy.ui.sceneName') },
  ];
  if (props.showTypeColumn) {
    schema.push({
      component: 'Select',
      fieldName: 'type',
      label: $t('scene.ui.sceneType'),
      componentProps: {
        placeholder: $t('scene.ui.pleaseSelectTheSceneType'),
        clearable: true,
        options: [
          { label: $t('orgIotClient.routes.automation'), value: 'auto' },
          { label: $t('iotApp.project.triggerManual'), value: 'manual' },
        ],
      },
    });
  }
  return schema;
}

function buildColumns() {
  const cols: any[] = [
    { field: 'name', title: $t('orgEnergy.ui.name') },
  ];

  if (props.showTypeColumn) {
    cols.push({
      field: 'type',
      title: $t('scene.ui.sceneType'),
      slots: { default: 'type' },
    });
  }

  cols.push({ field: 'desc', title: $t('orgEnergy.ui.description') });
  cols.push({
    field: 'lastRunTime',
    title: $t('orgEnergy.ui.lastExecutionTime'),
    formatter: 'customTime',
  });

  if (props.showToggle) {
    cols.push({
      field: 'status',
      title: $t('iotApp.av.colStatus'),
      cellRender: {
        name: 'CellSwitch',
        attrs: { onClick: onActionClick, code: 'toggle' },
        options: [
          { label: $t('orgEnergy.ui.enable'), value: 1 },
          { label: $t('orgEnergy.ui.disable'), value: 2 },
        ],
      },
    });
  }

  // 操作列
  const operations: any[] = [{ code: 'detail', text: $t('orgIotClient.console.logsBtn') }];
  if (props.showExecute) {
    operations.push({ code: 'execute', text: $t('orgIotClient.console.execute') });
  }
  operations.push({ code: 'edit', text: $t('iotApp.av.edit') });
  operations.push({ code: 'delete', text: $t('orgEnergy.ui.delete'), type: 'error' });

  cols.push({
    align: 'center',
    cellRender: {
      attrs: { nameField: 'name', onClick: onActionClick },
      name: 'CellOperation',
      options: operations,
    },
    field: 'operation',
    fixed: 'right',
    headerAlign: 'center',
    showOverflow: false,
    title: $t('orgIotClient.deviceLogs.hubAction'),
  });

  return cols;
}

/* ---------- Grid ---------- */

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: buildFormSchema(),
    submitOnChange: true,
    submitButtonOptions: { ghost: true },
  },
  gridOptions: {
    columns: buildColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params = { ...formValues };
          if (props.sceneType) params.type = props.sceneType;
          if (props.tag) params.tag = props.tag;
          const res = await Api.list(
            page.currentPage,
            page.pageSize,
            params,
          );
          return { items: res.list, total: res.total };
        },
      },
      response: { list: 'items', total: 'total' },
    },
    rowConfig: { keyField: 'id' },
    ...(props.gridId && {
      id: props.gridId,
      customConfig: { storage: true, mode: 'default' },
    }),
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

/** 语言切换后重建场景列表列头和筛选项，保留当前查询条件。 */
watch(() => preferences.app.locale, () => {
  gridApi.setGridOptions({ columns: buildColumns() });
  gridApi.formApi.updateSchema(buildFormSchema());
});

/* ---------- Actions ---------- */

function onRefresh() {
  gridApi.query();
}

async function onToggle(row: any) {
  const newStatus = row.status === 1 ? 2 : 1;
  await Api.update({ id: row.id, status: newStatus });
  message.success($t('platformManage.feedback.statusUpdated'));
  onRefresh();
}

async function onExecute(row: any) {
  await Api.manuallyTrigger(row.id);
  message.success($t('scene.ui.executionSuccessful'));
  onRefresh();
}

async function onDelete(row: any) {
  if (!row.id) return;
  await Api.delete(row.id);
  message.success($t('orgEnergy.ui.deleteSuccessfully'));
  onRefresh();
}
</script>

<template>
  <Page
    :title="sceneText(props.title)"
    :description="sceneText(props.description)"
    auto-content-height
  >
    <Grid>
      <template #toolbar-tools>
        <NButton
          type="primary"
          ghost
          @click="router.push(props.createRoute)"
        >
          <span class="icon-[mdi--plus] size-5"></span>
          {{ sceneText(props.createButtonText) }}
        </NButton>
        <NButton
          v-if="props.createRouteV2"
          type="info"
          ghost
          @click="router.push(props.createRouteV2)"
        >
          <span class="icon-[mdi--flask-outline] size-5"></span>
          {{ sceneText(props.createButtonTextV2) }}
        </NButton>
      </template>

      <template v-if="props.showTypeColumn" #type="{ row }">
        <span v-if="row.type === 'auto'">{{ $t('orgIotClient.routes.automation') }}</span>
        <span v-if="row.type === 'manual'">{{ $t('iotApp.project.triggerManual') }}</span>
      </template>
    </Grid>
  </Page>
</template>
