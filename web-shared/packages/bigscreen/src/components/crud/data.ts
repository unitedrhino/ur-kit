import type { OnActionClickFn, VbenFormSchema, VxeTableGridOptions } from '@vben/saas';

import { ThingsApi } from '@vben/api';
import { $t, useDictStore } from '@vben/saas';

import { deviceTypeOptions, deviceTypeToColorMapping } from './utils/constants';

function getDeviceNetTypeOptions() {
  return (
    useDictStore()
      .getDictMap('deviceNetType')
      ?.map((opt: any) => ({
        value: Number(opt.value),
        label: opt.label,
        type: 'success',
      })) ?? []
  );
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('iot.category.categoryName'),
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '产品类型',
      componentProps: {
        options: [
          { label: '设备', value: '1' },
          { label: '产品', value: '2' },
        ],
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('system.role.remark'),
      componentProps: {
        type: 'textarea',
      },
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  const deviceNetTypeOptions = getDeviceNetTypeOptions();
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '产品名称',
    },
    {
      component: 'Input',
      fieldName: 'productID',
      label: '产品ID',
    },
    {
      component: 'Select',
      fieldName: 'deviceType',
      label: '设备类型',
      componentProps: {
        clearable: true,
        options: deviceTypeOptions,
      },
    },
    {
      component: 'Select',
      fieldName: 'netType',
      label: '网络类型',
      componentProps: {
        clearable: true,
        options: deviceNetTypeOptions,
      },
    },
  ];
}

export function useColumns(onActionClick: OnActionClickFn<ThingsApi.ProductInfo>): VxeTableGridOptions<ThingsApi.ProductInfo>['columns'] {
  const deviceNetTypeOptions = getDeviceNetTypeOptions();
  return [
    {
      field: 'productID',
      title: '产品ID',
    },
    {
      field: 'productName',
      title: '产品名称',
    },
    {
      field: 'deviceType',
      title: '设备类型',
      cellRender: {
        name: 'CellTag',
        options: deviceTypeOptions.map((opt) => ({
          value: opt.value,
          label: opt.label,
          type: deviceTypeToColorMapping[opt.value],
        })),
      },
    },
    {
      field: 'netType',
      title: '网络类型',
      cellRender: {
        name: 'CellTag',
        options: deviceNetTypeOptions,
      },
    },
    {
      field: 'protocolCode',
      title: '协议 code',
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '启用', value: 1, type: 'success' },
          { label: '禁用', value: 2, type: 'error' },
        ],
      },
    },
    {
      field: 'createdTime',
      title: $t('product.list.createTime'),
      formatter: 'customTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'productName',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
          },
          'delete',
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
