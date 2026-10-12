/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import type { VbenFormSchema, VxeTableGridOptions } from '@vben/saas';

import type { ScreenInfo } from './index.api';

import { $t } from '@vben/saas';

export const screenStatusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defDraft'); }, value: 2, type: 'warning' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.defPublished'); }, value: 1, type: 'success' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.session.archive'); }, value: 3, type: 'default' },
];

export const screenResolutionOptions = [
  { label: '1920×1080', value: '1920x1080' },
  { label: '2560×1440', value: '2560x1440' },
  { label: '3840×2160', value: '3840x2160' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.custom'); }, value: 'custom' },
];

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.dashboardName'); },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'resolution',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.av.colResolution'); },
      componentProps: {
        options: screenResolutionOptions,
      },
      defaultValue: '1920x1080',
    },
    {
      component: 'InputNumber',
      fieldName: 'customWidth',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.customWidth'); },
      componentProps: {
        min: 320,
        max: 10_000,
      },
      dependencies: {
        triggerFields: ['resolution'],
        if: (values) => values.resolution === 'custom',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'customHeight',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.customHeight'); },
      componentProps: {
        min: 320,
        max: 10_000,
      },
      dependencies: {
        triggerFields: ['resolution'],
        if: (values) => values.resolution === 'custom',
      },
    },
    {
      component: 'Input',
      fieldName: 'templateSourceName',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.templateSource'); },
      componentProps: {
        disabled: true,
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionDashboardsCreatedWithoutATemplateHaveNoSourceTemplate'); },
      },
      dependencies: {
        triggerFields: ['templateSourceName'],
        if: (values) => !!values.templateSourceName,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.status'); },
      componentProps: {
        options: screenStatusOptions.map(({ label, value }) => ({ label, value })),
      },
      defaultValue: 2,
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
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.dashboardName'); },
    },
    {
      component: 'Select',
      fieldName: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.status'); },
      componentProps: {
        clearable: true,
        options: screenStatusOptions.map(({ label, value }) => ({ label, value })),
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'updatedAt',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.updatedAtLabel'); },
      componentProps: {
        type: 'daterange',
        clearable: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'createdUserID',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.createdBy'); },
    },
  ];
}

export function useColumns(): VxeTableGridOptions<ScreenInfo>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 48,
    },
    {
      field: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.agent.name'); },
      slots: {
        default: 'name',
      },
    },
    {
      field: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.common.status'); },
      cellRender: {
        name: 'CellTag',
        options: screenStatusOptions,
      },
    },
    {
      field: 'updatedTime',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.updatedAtLabel'); },
      formatter: 'customTime',
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 320,
      slots: {
        default: 'operation',
      },
    },
  ];
}
