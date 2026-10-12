/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import type { OnActionClickFn, VbenFormSchema, VxeTableGridOptions } from '@vben/saas';
import { $t } from '@vben/saas';

import type { DatasetInfo } from './index.api';
import { datasetTypeOptions } from './index.api';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.agent.name'); },
    },
    {
      component: 'Select',
      fieldName: 'type',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.role.type'); },
      componentProps: {
        clearable: true,
        options: datasetTypeOptions,
      },
    },
    {
      component: 'Input',
      fieldName: 'tags',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.tags'); },
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('iotApp.project.fuzzySearch'); },
      },
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<DatasetInfo>,
): VxeTableGridOptions<DatasetInfo>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 48,
    },
    {
      field: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.agent.name'); },
      minWidth: 140,
    },
    {
      field: 'type',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.role.type'); },
      width: 110,
      cellRender: {
        name: 'CellTag',
        options: datasetTypeOptions.map((o) => ({
          label: o.label,
          value: o.value,
          type: 'info',
        })),
      },
    },
    {
      field: 'sourceName',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.dataSource'); },
      width: 120,
      formatter: ({ row }) => row.sourceName || '--',
    },
    {
      field: 'tags',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('iotApp.productPage.tags'); },
      width: 140,
      formatter: ({ row }) => row.tags || '--',
    },
    {
      field: 'updatedTime',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.updatedAtLabel'); },
      width: 160,
      formatter: 'customTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.edit'); } },
          { code: 'delete', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.delete'); } },
          { code: 'preview', /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.flow.previewLabel'); } },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 180,
    },
  ];
}
