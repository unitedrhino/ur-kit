import type { ThingsApi } from '@vben/api';

import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';

import { $t } from '@vben/saas';

export function useColumns(_onActionClick: OnActionClickFn<ThingsApi.ProductInfo>): VxeTableGridOptions<ThingsApi.ProductInfo>['columns'] {
  return [
    // {
    //   field: 'productName',
    //   title: $t('product.list.productName'),
    //   width: 250,
    // },
    {
      field: 'group',
      title: $t('orgManage.user.messageGroup'),
      width: 250,
    },
    {
      field: 'subject',
      title: $t('orgManage.user.messageSubject'),
      width: 250,
    },
    {
      field: 'createdTime',
      title: $t('product.list.createTime'),
      formatter: 'customTime',
    },
    // {
    //   field: 'body',
    //   title: '消息内容',
    //   width: 250,
    // },
    {
      field: 'isRead',
      title: $t('orgManage.user.readStatus'),
      width: 250,
      formatter: ({ cellValue }) => (cellValue === 1 ? $t('orgManage.common.yes') : $t('orgManage.common.no')),
    },

    // {
    //   align: 'right',
    //   cellRender: {
    //     attrs: {
    //       nameField: 'name',
    //       onClick: onActionClick,
    //     },
    //     name: 'CellOperation',
    //     options: [
    //       // {
    //       //   code: 'append',
    //       //   text: '新增下级',
    //       // },
    //       'edit', // 默认的编辑按钮
    //       'delete', // 默认的删除按钮
    //     ],
    //   },
    //   field: 'operation',
    //   fixed: 'right',
    //   headerAlign: 'center',
    //   showOverflow: false,
    //   title: $t('system.menu.operation'),
    //   width: 200,
    // },
  ];
}
