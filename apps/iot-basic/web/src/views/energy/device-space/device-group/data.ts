/** 文件说明：产品相关表单和筛选配置，公共产品选项标明平台共享来源。 */
import { formatProductOptionLabel } from '@vben/saas/product-scope';
import { h } from 'vue';

import { CoreApi, ThingsApi } from '@vben/api';
import { NButton } from 'naive-ui';

import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';

import { $t } from '@vben/saas';

interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
}

/** 将平铺的区域列表转换为嵌套树（NTreeSelect 需要嵌套结构） */
function flatToTree(list: ThingsApi.AreaInfo[]): TreeNode[] {
  const map: Record<string, TreeNode & { _parentID?: string }> = {};
  const roots: TreeNode[] = [];
  for (const item of list) {
    map[item.areaID!] = { label: item.areaName || item.areaID || '', value: item.areaID!, _parentID: item.parentAreaID };
  }
  for (const node of Object.values(map)) {
    if (node._parentID && map[node._parentID]) {
      const parent = map[node._parentID]!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** 获取当前项目的区域树选项 */
async function getAreaTreeOptions(): Promise<TreeNode[]> {
  const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({});
  return flatToTree(res?.list || []);
}


export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('iot.group.groupId'),
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('iot.group.groupName'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      fieldName: 'purpose',
      label: $t('iot.group.purpose'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.groupUsagePlaceholder'),
        api: async () => {
          const res = await CoreApi.postApiV1SystemDictDetailGetList({ dictCode: 'deviceGroupPurpose' });
          return (res?.list || []).map((item) => ({
            label: item.label || item.value,
            value: item.value,
          }));
        },
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'productID',
      label: $t('iotApp.productPage.product'),
      componentProps: {
        clearable: true,
        placeholder: $t('iotApp.devicePage.productPlaceholder'),
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsProductInfoGetList({
            page: { page: 1, size: 1000 },
          });
          return (res?.list || []).map((item) => ({
            label: formatProductOptionLabel(item),
            value: item.productID,
          }));
        },
      },
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'areaID',
      label: $t('iotApp.deviceDetail.area'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.selectArea'),
        api: getAreaTreeOptions,
      },
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('iot.group.desc'),
      componentProps: {
        type: 'textarea',
        rows: 4,
        placeholder: $t('iotApp.group.descPlaceholder'),
        maxlength: 200,
        showCount: true,
      },
    },
  ];
}


export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('iot.group.groupName'),
    },
    {
      component: 'ApiSelect',
      fieldName: 'purpose',
      label: $t('iot.group.purpose'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.groupUsagePlaceholder'),
        api: async () => {
          const res = await CoreApi.postApiV1SystemDictDetailGetList({ dictCode: 'deviceGroupPurpose' });
          return (res?.list || []).map((item) => ({
            label: item.label || item.value,
            value: item.value,
          }));
        },
      },
    },
    {
      component: 'ApiTreeSelect',
      fieldName: 'areaID',
      label: $t('iotApp.deviceDetail.area'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.selectArea'),
        api: getAreaTreeOptions,
      },
    }

    // {
    //   component: 'Input',
    //   fieldName: 'deviceAlias',
    //   label: $t('iot.device.deviceAlias'),
    // },
    // {
    //   component: 'ApiSelect',
    //   fieldName: 'productID',
    //   label: $t('iot.device.productName'),
    //   componentProps: {
    //     clearable: true,
    //     api: async () => {
    //       const res = await ThingsApi.postApiV1ThingsProductInfoIndex({
    //         page: {
    //           page: 1,
    //           size: 1000,
    //         },
    //       });
    //       return res?.list?.map((item) => ({
    //         label: item.productName,
    //         value: item.productID,
    //       }));
    //     },
    //   },
    // },
    // {
    //   component: 'Input',
    //   fieldName: 'account',
    //   label: $t('iot.device.account'),
    // },
    // { component: 'Input', fieldName: 'id', label: $t('system.role.id') },
    // {
    //   component: 'Select',
    //   componentProps: {
    //     // allowClear: true,
    //     clearable: true,
    //     options: [
    //       { label: $t('common.enabled'), value: 1 },
    //       { label: $t('common.disabled'), value: 2 },
    //     ],
    //   },
    //   fieldName: 'status',
    //   label: $t('system.role.status'),
    // },
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

export function useColumns(onActionClick: OnActionClickFn<ThingsApi.GroupInfo>): VxeTableGridOptions<ThingsApi.GroupInfo>['columns'] {
  return [
    {
      field: 'name',
      title: $t('iot.group.groupName'),
      minWidth: 160,
      treeNode: true,
    },
    {
      field: 'purpose',
      title: $t('iot.group.purpose'),
      width: 100,
    },
    {
      field: 'productName',
      title: $t('iotApp.productPage.product'),
      width: 120,
    },
    {
      field: 'deviceCount',
      title: $t('iotApp.area.deviceCount'),
      width: 80,
      slots: {
        default: ({ row }: { row: ThingsApi.GroupInfo }) => {
          const text = row.deviceCount ? String(row.deviceCount) : $t('iotApp.area.add');
          const code = row.deviceCount ? 'selectedDevices' : 'addDevices';
          return [
            h(NButton, {
              size: 'small',
              type: 'primary',
              quaternary: true,
              onClick: () => onActionClick({ code, row } as any),
            }, { default: () => text }),
          ];
        },
      },
    },
    {
      field: 'createdTime',
      title: $t('iot.group.createdTime'),
      formatter: 'customTime',
      width: 160,
    },
    {
      field: 'desc',
      title: $t('iot.group.desc'),
      minWidth: 120,
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
          { code: 'append', text: $t('orgIotClient.deviceSpace.addChildGroup') },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 260,
    },
  ];
}


export function useAddDevicesFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      fieldName: 'productID',
      label: $t('iotApp.productPage.product'),
      componentProps: {
        clearable: true,
        placeholder: $t('iotApp.devicePage.productPlaceholder'),
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsProductInfoGetList({
            page: { page: 1, size: 1000 },
          });
          return (res?.list || []).map((item) => ({
            label: formatProductOptionLabel(item),
            value: item.productID,
          }));
        },
      },
    },
    {
      component: 'Input',
      fieldName: 'deviceName',
      label: $t('iot.device.deviceName'),
    },
    {
      component: 'Input',
      fieldName: 'deviceAlias',
      label: $t('iot.device.deviceAlias'),
    },
  ];
}

/** 获取分组树选项 */
async function getGroupTreeOptions(): Promise<TreeNode[]> {
  const res = await ThingsApi.postApiV1ThingsGroupInfoGetList({
    page: { page: 1, size: 1000 },
  });
  const list = res?.list || [];
  const map: Record<string, TreeNode & { _parentID?: string }> = {};
  const roots: TreeNode[] = [];
  for (const item of list) {
    map[item.id!] = { label: item.name || item.id || '', value: item.id!, _parentID: item.parentID };
  }
  for (const node of Object.values(map)) {
    if (node._parentID && map[node._parentID]) {
      const parent = map[node._parentID]!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function useSelectedDevicesFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      fieldName: 'groupID',
      label: $t('iotApp.dataFlow.colGroup'),
      componentProps: {
        clearable: true,
        placeholder: $t('iotApp.group.selectFirst'),
        api: getGroupTreeOptions,
      },
    },
    {
      component: 'ApiSelect',
      fieldName: 'productID',
      label: $t('iotApp.productPage.product'),
      componentProps: {
        clearable: true,
        placeholder: $t('iotApp.devicePage.productPlaceholder'),
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsProductInfoGetList({
            page: { page: 1, size: 1000 },
          });
          return (res?.list || []).map((item) => ({
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
    },
    {
      component: 'Input',
      fieldName: 'deviceAlias',
      label: $t('iotApp.card.deviceName'),
    },
  ];
}

export function useAddDevicesSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'deviceName',
      label: $t('iot.device.deviceName'),
    },
  ];
}

export function useAddDevicesColumns(): VxeTableGridOptions<ThingsApi.ProductInfo>['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      field: 'deviceName',
      title: $t('iot.device.deviceName'),
    },
    {
      field: 'deviceAlias',
      title: $t('iot.device.deviceAlias'),
    },
    {
      field: 'productName',
      title: $t('iot.device.productName'),
    },
    {
      field: 'status', //1-未激活，2-在线，3-离线 4-异常(频繁上下线,告警中)
      title: $t('iot.device.status'),
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('iot.device.statusUnactivated'), value: 1 ,type: 'default'},
          { label: $t('iot.device.statusOnline'), value: 2 ,type: 'success'},
          { label: $t('iot.device.statusOffline'), value: 3 ,type: 'warning'},
          { label: $t('iot.device.statusAbnormal'), value: 4 ,type: 'error'},
        ],
      },
    },
  ];
}
