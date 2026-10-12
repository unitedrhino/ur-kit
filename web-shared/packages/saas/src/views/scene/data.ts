/** 文件说明：能源中心业务配置与本地化界面文案。 */
import { $t } from '@vben/locales';
import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn } from '@vben/saas';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('orgEnergy.ui.sceneName'),
      componentProps: {
        placeholder: $t('scene.ui.pleaseEnterTheSceneName'),
        clearable: true,
      },
    },
    {
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
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn) {
  return [
    { type: 'checkbox' as const, width: 50 },
    { type: 'seq' as const, title: $t('orgMall.goods.index'), width: 60 },
    { field: 'name', title: $t('orgEnergy.ui.sceneName') },
    {
      field: 'type',
      title: $t('scene.ui.sceneType'),
      slots: { default: 'type' },
    },
    {
      field: 'lastRunTime',
      title: $t('orgEnergy.ui.lastExecutionTime'),
      formatter: 'customTime' as any,
    },
    { field: 'desc', title: $t('orgEnergy.ui.sceneDescription') },
    {
      field: 'createdTime',
      title: $t('orgEnergy.ui.creationTime'),
      formatter: 'customTime' as any,
    },
    {
      field: 'status',
      title: $t('iotApp.av.colStatus'),
      slots: { default: 'status' },
    },
    {
      field: 'action',
      title: $t('orgIotClient.deviceLogs.hubAction'),
      align: 'center' as const,
      width: 200,
      cellRender: {
        name: 'CellOperation',
        props: {
          onClick: onActionClick,
          menus: [
            { code: 'detail', text: $t('orgIotClient.console.logsBtn') },
            { code: 'edit', text: $t('iotApp.av.edit') },
            { code: 'delete', text: $t('orgEnergy.ui.delete'), danger: true },
          ],
        },
      },
    },
  ];
}

export function useLogColumns() {
  return [
    {
      field: 'createdTime',
      title: $t('iotApp.ota.reviewExecTime'),
      formatter: 'customTime' as any,
    },
    { field: 'trigger.type', title: $t('orgManage.cloneGroup.triggerTypeLabel') },
    {
      field: 'status',
      title: $t('scene.ui.executionStatus'),
      slots: { default: 'status' },
    },
    {
      field: 'action',
      title: $t('orgIotClient.deviceLogs.hubAction'),
      align: 'center' as const,
      slots: { default: 'action' },
    },
  ];
}
