import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';
import type { CoreApi } from '@vben/api';

import { $t } from '@vben/saas';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      fieldName: 'id',
      label: $t('system.role.id'),
      dependencies: {
        triggerFields: ['id'],
        show: false,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 2 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('system.role.remark'),
    },
    {
      component: 'Input',
      fieldName: 'tenantApps',
      formItemClass: 'items-start',
      label: $t('orgManage.role.appScope'),
      modelPropName: 'modelValue',
      defaultValue: [],
      dependencies: {
        triggerFields: ['id'],
        if: (values: any) => !!values.id,
      },
    },

  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    // { component: 'Input', fieldName: 'id', label: $t('system.role.id') },
    {
      component: 'Select',
      componentProps: {
        // allowClear: true,
        clearable: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 2 },
        ],
      },
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    // {
    //   component: 'Input',
    //   fieldName: 'desc',
    //   label: $t('system.role.remark'),
    // },
    // {
    //   component: 'RangePicker',
    //   fieldName: 'createTime',
    //   label: $t('system.role.createTime'),
    // },
  ];
}

export function useColumns<T = CoreApi.RoleInfo>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 200,
    },
    {
      field: 'id',
      title: $t('system.role.id'),
      width: 200,
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'desc',
      minWidth: 100,
      title: $t('system.role.remark'),
    },
    {
      field: 'createdTime',
      title: $t('system.role.createTime'),
      width: 200,
      formatter: 'customTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 130,
    },
  ];
}
