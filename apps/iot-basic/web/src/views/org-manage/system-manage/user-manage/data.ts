import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';

import { $t } from '@vben/saas';

// 用户接口类型定义
export interface SystemUser {
  id: string;
  username: string;
  nickname: string;
  tags?: string;
  createdTime: string;
  phone?: string;
  email?: string;
  deviceCount: number;
  status: 0 | 1;
  [key: string]: any;
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('orgManage.user.userId'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('orgManage.user.username'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('orgManage.user.nickname'),
    },
    {
      component: 'Input',
      fieldName: 'tags',
      label: $t('orgIotClient.org.tag'),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('orgManage.user.phoneNo'),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('orgManage.user.email'),
    },
    {
      component: 'InputNumber',
      fieldName: 'deviceCount',
      label: $t('orgManage.organization.deviceCount'),
      componentProps: {
        min: 0,
      },
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('orgManage.common.status'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('orgManage.user.account'),
      componentProps: {
        placeholder: $t('orgManage.user.accountPlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('orgManage.user.nickname'),
      componentProps: {
        placeholder: $t('orgManage.user.nicknamePlaceholder'),
      },
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('orgManage.common.status'),
    },
  ];
}

export function useColumns<T = SystemUser>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: $t('orgManage.user.userId'),
      width: 200,
    },
    {
      field: 'username',
      title: $t('orgManage.user.username'),
      width: 150,
    },
    {
      field: 'nickname',
      title: $t('orgManage.user.nickname'),
      width: 150,
    },
    {
      field: 'tags',
      title: $t('orgIotClient.org.tag'),
      width: 100,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'createdTime',
      title: $t('orgManage.clone.createTime'),
      width: 180,
      formatter: 'customTime',
    },
    {
      field: 'phone',
      title: $t('orgManage.user.phoneNo'),
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'email',
      title: $t('orgManage.user.email'),
      width: 180,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'deviceCount',
      title: $t('orgManage.organization.deviceCount'),
      width: 100,
      align: 'center',
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('orgManage.common.status'),
      width: 100,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('orgManage.user.username'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('orgManage.common.operation'),
      width: 150,
    },
  ];
}
