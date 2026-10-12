/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import type { OnActionClickFn, VbenFormSchema, VxeTableGridOptions } from '@vben/saas';

import type { TemplateInfo } from './index.api';

import { $t } from '@vben/saas';

export const templateSourceOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.system'); }, value: 'system' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.custom'); }, value: 'custom' },
];

export const templateResolutionOptions = [
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
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.menu.templateName'); },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'resolution',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.av.colResolution'); },
      componentProps: {
        options: templateResolutionOptions,
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
      fieldName: 'tags',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.tags'); },
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('scene.ui.commaSeparated'); },
      },
    },
    {
      component: 'UploadImage',
      fieldName: 'indexImage',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgPark.ui.cover'); },
    },
    {
      component: 'Input',
      fieldName: 'desc',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.ota.moduleDesc'); },
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
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.menu.templateName'); },
    },
    {
      component: 'Input',
      fieldName: 'tags',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.productPage.tags'); },
    },
    {
      component: 'Select',
      fieldName: 'source',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.pointLog.source'); },
      componentProps: {
        clearable: true,
        options: templateSourceOptions,
      },
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn<TemplateInfo>): VxeTableGridOptions<TemplateInfo>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 48,
    },
    {
      field: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.agent.name'); },
    },
    {
      field: 'tags',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('iotApp.productPage.tags'); },
      formatter: ({ row }) => (row.tags && row.tags.length > 0 ? row.tags.join(',') : '--'),
    },
    {
      field: 'source',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.pointLog.source'); },
      formatter: ({ row }) => row.source || '--',
    },
    {
      field: 'updatedTime',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.updatedAtLabel'); },
      formatter: ({ row }) => row.updatedTime || '--',
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
            code: 'createScreen',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('bigscreenManagement.ui.definitionCreateFromThisTemplate'); },
          },
          {
            code: 'delete',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.delete'); },
            type: 'error',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
    },
  ];
}
