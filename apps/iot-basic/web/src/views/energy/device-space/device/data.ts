/** 文件说明：产品相关表单和筛选配置，公共产品选项标明平台共享来源。 */
import { formatProductOptionLabel } from '@vben/saas/product-scope';
import { $t } from '@vben/locales';
import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';

import { ThingsApi } from '@vben/api';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      fieldName: 'productID',
      label: $t('iotApp.productPage.product'),
      rules: 'required',
      componentProps: {
        placeholder: $t('iotApp.devicePage.productPlaceholder'),
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsProductInfoGetList({
            page: { page: 1, size: 1000 },
          });
          return res?.list?.map((item) => ({
            label: formatProductOptionLabel(item),
            value: item.productID,
          }));
        },
      },
    },
    {
      component: 'Input',
      fieldName: 'deviceName',
      label: $t('iotApp.card.deviceId'),
      rules: 'required',
      componentProps: {
        placeholder: $t('orgIotClient.deviceSpace.deviceIdRule'),
        maxlength: 48,
      },
    },
    {
      component: 'Input',
      fieldName: 'deviceAlias',
      label: $t('iotApp.devicePage.deviceAlias'),
      componentProps: {
        placeholder: $t('orgIotClient.deviceSpace.aliasOptionalPlaceholder'),
      },
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'deviceName',
      label: $t('iotApp.card.deviceId'),
    },
    {
      component: 'Input',
      fieldName: 'deviceAlias',
      label: $t('iotApp.card.deviceName'),
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('iotApp.cardRoute.colStatus'),
      componentProps: {
        clearable: true,
        options: [
          { label: $t('orgIotClient.deviceStatus.online'), value: '2' },
          { label: $t('orgIotClient.deviceStatus.offline'), value: '3' },
          { label: $t('orgIotClient.deviceStatus.inactive'), value: '1' },
        ],
      },
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<any>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deviceName',
      title: $t('iotApp.card.deviceId'),
      cellRender: {
        name: 'CellLink',
        attrs: {
          onClick: ({ row }: { row: any }) => {
            onActionClick({ code: 'detail', row });
          },
        },
      },
    },
    { field: 'deviceAlias', title: $t('iotApp.card.deviceName') },
    { field: 'productName', title: $t('iotApp.productPage.product') },
    {
      field: 'status',
      title: $t('iotApp.cardRoute.colStatus'),
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('orgIotClient.deviceStatus.online'), value: 2, type: 'success' },
          { label: $t('orgIotClient.deviceStatus.offline'), value: 3, type: 'warning' },
          { label: $t('orgIotClient.deviceStatus.inactive'), value: 1, type: 'default' },
          { label: $t('orgIotClient.deviceStatus.fault'), value: 4, type: 'error' },
        ],
      },
    },
    {
      field: 'createdTime',
      title: $t('iotApp.group.createdTimeCol'),
      formatter: 'customTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'deviceName',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'detail', text: $t('iotApp.cardRoute.detail') },
          { code: 'delete', text: $t('iotApp.categoryPage.delete'), type: 'error' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('iotApp.card.actions'),
    },
  ];
}
