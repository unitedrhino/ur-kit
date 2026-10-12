/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import type { OnActionClickFn, VbenFormSchema, VxeTableGridOptions } from '@vben/saas';

import type { DataSourceInfo } from './index.api';

import { $t } from '@vben/saas';

export const datasourceTypeOptions = [
  { label: 'HTTP', value: 'http', type: 'info' },
  { label: 'WebSocket', value: 'ws', type: 'warning' },
  { label: 'Mock', value: 'mock', type: 'default' },
  { label: 'MySQL', value: 'mysql', type: 'success' },
  { label: 'PostgreSQL', value: 'postgres', type: 'success' },
];

export const datasourceStatusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.renewal.statusNormal'); }, value: 1, type: 'success' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.abnormalLog'); }, value: 0, type: 'error' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('platformManage.devops.stUnknown'); }, value: 2, type: 'default' },
];

// 提取连接目标信息
export function getConnectionTarget(type: string, config: any): string {
  if (!config) return '-';

  switch (type) {
    case 'http':
    case 'ws': {
      return config.url || '-';
    }
    case 'mock': {
      return '-';
    }
    case 'mysql':
    case 'postgres': {
      return config.host && config.port ? `${config.host}:${config.port}` : '-';
    }
    default: {
      return '-';
    }
  }
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionDataSourceName'); },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'type',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.role.type'); },
      rules: 'required',
      componentProps: {
        options: datasourceTypeOptions.map(({ label, value }) => ({
          label,
          value,
        })),
      },
    },
    {
      component: 'Input',
      fieldName: 'config.url',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.baseURL'); },
      rules: 'required',
      componentProps: {
        placeholder: 'https://<api-host>',
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'http' || values.type === 'ws',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.mockData',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionMockData'); },
      rules: 'required',
      componentProps: {
        type: 'textarea',
        rows: 6,
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionMockDataInJsonFormat'); },
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mock',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.host',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionHostAddress'); },
      rules: 'required',
      defaultValue: '',
      componentProps: {
        placeholder: '<database-host>',
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql' || values.type === 'postgres',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'config.port',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgPark.ui.portNumber'); },
      rules: 'required',
      defaultValue: 3306,
      componentProps: {
        placeholder: 'MySQL: 3306, PostgreSQL: 5432',
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql' || values.type === 'postgres',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.database',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionDatabaseName'); },
      rules: 'required',
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionDatabaseName'); },
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql' || values.type === 'postgres',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.username',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.user.username'); },
      rules: 'required',
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionDatabaseUsername'); },
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql' || values.type === 'postgres',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.password',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.fwPassword'); },
      rules: 'required',
      componentProps: {
        type: 'password',
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionDatabasePassword'); },
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql' || values.type === 'postgres',
      },
    },
    {
      component: 'Input',
      fieldName: 'config.charset',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionCharacterSet'); },
      defaultValue: 'utf8mb4',
      componentProps: {
        placeholder: 'utf8mb4',
      },
      dependencies: {
        triggerFields: ['type'],
        if: (values) => values.type === 'mysql',
      },
    },
    {
      component: 'Input',
      fieldName: 'desc',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.remark'); },
      componentProps: {
        type: 'textarea',
        rows: 3,
      },
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionDataSourceName'); },
    },
    {
      component: 'Select',
      fieldName: 'type',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.role.type'); },
      componentProps: {
        clearable: true,
        options: datasourceTypeOptions.map(({ label, value }) => ({
          label,
          value,
        })),
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.status'); },
      componentProps: {
        clearable: true,
        options: datasourceStatusOptions.map(({ label, value }) => ({
          label,
          value,
        })),
      },
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn<DataSourceInfo>): VxeTableGridOptions<DataSourceInfo>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 48,
    },
    {
      field: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.agent.name'); },
      minWidth: 120,
    },
    {
      field: 'type',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.role.type'); },
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: datasourceTypeOptions,
      },
    },
    {
      field: 'connectionTarget',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('bigscreenManagement.ui.definitionConnectionTarget'); },
      minWidth: 180,
      formatter: ({ row }) => {
        return getConnectionTarget(row.type || '', row.config);
      },
    },
    {
      field: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.common.status'); },
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: datasourceStatusOptions,
      },
    },
    {
      field: 'desc',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.dept.desc'); },
      minWidth: 150,
      showOverflow: 'tooltip',
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
          {
            code: 'edit',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.edit'); },
          },
          {
            code: 'delete',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.delete'); },
          },
          {
            code: 'test',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('bigscreenManagement.ui.testConnection'); },
          },
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
