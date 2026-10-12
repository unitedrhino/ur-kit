/** 文件说明：共享大屏界面定义，保留业务字段并翻译展示文案。 */
import { $t as t } from '@vben/saas/locales';
import type { OnActionClickFn, VbenFormSchema, VxeTableGridOptions } from '@vben/saas';

import type { ComponentInfo } from './index.api';

import { $t } from '@vben/saas';

export const componentStatusOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.up'); }, value: 1, type: 'success' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.deviceDetail.down'); }, value: 2, type: 'warning' },
];

export const componentCategoryOptions = [{ /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionCustomComponent'); }, value: 'custom' }];

export const presetCategoryOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionMetricPresets'); }, value: 'Metrics' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionStatusPresets'); }, value: 'Status' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComparisonPresets'); }, value: 'Compare' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionGeneralPresets'); }, value: 'Common' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionContainerAndLayoutPresets'); }, value: 'Container' },
];

export const componentMetaCategoryOptions = [
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionCharts'); }, value: 'chart' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.memory.viewTable'); }, value: 'table' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionDecorations'); }, value: 'decorate' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.devicePage.logInfo'); }, value: 'info' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionMaps'); }, value: 'map' },
  { /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.opLog.actionOther'); }, value: 'other' },
];

export function useFormSchema(canManagePreset = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComponentName'); },
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'groupId',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.project.tabGroups'); },
      componentProps: {
        clearable: true,
        options: [],
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.selectGroup'); },
      },
    },
    {
      component: 'Select',
      fieldName: 'categoryId',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComponentType'); },
      rules: 'required',
      componentProps: {
        options: canManagePreset ? [...componentCategoryOptions, ...presetCategoryOptions] : componentCategoryOptions,
      },
    },
    {
      component: 'Input',
      fieldName: 'version',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.flow.versionLabel'); },
      rules: 'required',
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionEG100'); },
      },
    },
    {
      component: 'Input',
      fieldName: 'entry',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComponentEntry'); },
      componentProps: {
        /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get placeholder() { return t('bigscreenManagement.ui.definitionPackageNameOrUrl'); },
      },
    },
    {
      component: 'UploadImage',
      fieldName: 'cover',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionPreviewImage'); },
    },
    {
      component: 'Input',
      fieldName: 'description',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('iotApp.ota.moduleDesc'); },
      componentProps: {
        type: 'textarea',
        rows: 3,
      },
    },
  ];
}

export function useGridFormSchema(canManagePreset = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComponentName'); },
    },
    {
      component: 'Select',
      fieldName: 'categoryId',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('bigscreenManagement.ui.definitionComponentType'); },
      componentProps: {
        clearable: true,
        options: canManagePreset ? [...componentCategoryOptions, ...presetCategoryOptions] : componentCategoryOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get label() { return t('orgManage.common.status'); },
      componentProps: {
        clearable: true,
        options: componentStatusOptions.map(({ label, value }) => ({
          label,
          value,
        })),
      },
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn<ComponentInfo>): VxeTableGridOptions<ComponentInfo>['columns'] {
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
      field: 'categoryName',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.categoryLabel'); },
      formatter: ({ row }) => row.categoryName || row.categoryId || '--',
    },
    {
      field: 'version',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.versionLabel'); },
    },
    {
      field: 'status',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.common.status'); },
      cellRender: {
        name: 'CellTag',
        options: componentStatusOptions,
      },
    },
    {
      field: 'updatedTime',
      /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get title() { return t('orgManage.flow.updatedAtLabel'); },
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
            code: 'copy',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.flow.copy'); },
          },
          {
            code: 'delete',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('orgManage.common.delete'); },
          },
          {
            code: 'toggle',
            /** 按当前语言返回展示文案，避免静态配置保留旧语言。 */ get text() { return t('bigscreenManagement.ui.definitionListOrUnlist'); },
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
