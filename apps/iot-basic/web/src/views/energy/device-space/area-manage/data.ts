/** 文件说明：产品相关表单和筛选配置，公共产品选项标明平台共享来源。 */
import { formatProductOptionLabel } from '@vben/saas/product-scope';
import { h } from 'vue';

import { ThingsApi } from '@vben/api';
import { NButton } from 'naive-ui';

import type { VbenFormSchema } from '@vben/saas';
import type { OnActionClickFn, VxeTableGridOptions } from '@vben/saas';

import { $t } from '@vben/saas';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'areaName',
      label: $t('iotApp.area.areaName'),
      rules: 'required',
      componentProps: {
        placeholder: $t('iotApp.area.areaNamePlaceholder'),
      },
    },
    {
      component: 'Select',
      fieldName: 'useBy',
      label: $t('orgIotClient.deviceSpace.areaUsage'),
      componentProps: {
        options: [
          { label: $t('orgIotClient.deviceSpace.commonSpace'), value: 'commonSpace' },
          { label: $t('orgIotClient.deviceSpace.nonCommonSpace'), value: 'other' },
        ],
        placeholder: $t('orgIotClient.deviceSpace.usagePlaceholder'),
      },
    },
    {
      component: 'UploadImage',
      fieldName: 'areaImg',
      label: $t('orgIotClient.deviceSpace.floorPlan'),
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('iotApp.area.areaRemark'),
      componentProps: {
        type: 'textarea',
        rows: 3,
        placeholder: $t('iotApp.area.areaRemarkPlaceholder'),
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
      fieldName: 'areaName',
      label: $t('iotApp.area.areaName'),
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<ThingsApi.AreaInfo>,
): VxeTableGridOptions<ThingsApi.AreaInfo>['columns'] {
  return [
    {
      field: 'areaName',
      title: $t('iotApp.area.areaName'),
      minWidth: 160,
      treeNode: true,
    },
    {
      field: 'areaID',
      title: $t('iotApp.area.areaId'),
      width: 220,
      visible: false,
    },
    {
      field: 'areaImg',
      title: $t('orgIotClient.deviceSpace.floorPlan'),
      width: 80,
      cellRender: { name: 'CellImagePreview', props: { size: 36 } },
    },
    {
      field: 'useBy',
      title: $t('orgIotClient.deviceSpace.areaUsage'),
      width: 110,
      formatter({ cellValue }: { cellValue: string }) {
        const map: Record<string, string> = {
          commonSpace: $t('orgIotClient.deviceSpace.commonSpace'),
          other: $t('orgIotClient.deviceSpace.nonCommonSpace'),
        };
        return map[cellValue] || cellValue || '-';
      },
    },
    {
      field: 'deviceCount',
      title: $t('iotApp.area.deviceCount'),
      width: 90,
      slots: {
        default: ({ row }: { row: ThingsApi.AreaInfo }) => {
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
      field: 'groupCount',
      title: $t('iotApp.area.groupCount'),
      width: 90,
      slots: {
        default: ({ row }: { row: ThingsApi.AreaInfo }) => {
          const count = row.groupCount ?? 0;
          const text = count ? String(count) : $t('iotApp.area.add');
          return [
            h(NButton, {
              size: 'small',
              type: 'primary',
              quaternary: true,
              onClick: () => onActionClick({ code: 'viewGroups', row } as any),
            }, { default: () => text }),
          ];
        },
      },
    },
    {
      field: 'createdTime',
      title: $t('iotApp.group.createdTimeCol'),
      formatter: 'customTime',
      width: 160,
    },
    {
      field: 'desc',
      title: $t('iotApp.area.remarkCol'),
      minWidth: 120,
      formatter({ cellValue }: { cellValue: string }) {
        return cellValue || '-';
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'areaName',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'add', text: $t('orgIotClient.deviceSpace.addChildArea') },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 200,
    },
  ];
}

/** 将平铺的区域列表转换为嵌套树 */
interface TreeNode {
  label: string;
  value: string;
  children?: TreeNode[];
}

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

async function getAreaTreeOptions(): Promise<TreeNode[]> {
  const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({});
  return flatToTree(res?.list || []);
}

export function useAreaDevicesFormSchema(): VbenFormSchema[] {
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
      label: $t('iotApp.card.deviceId'),
    },
    {
      component: 'Input',
      fieldName: 'deviceAlias',
      label: $t('iotApp.card.deviceName'),
    },
  ];
}

export function useAreaSelectedDevicesFormSchema(defaultAreaID?: string | null): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      fieldName: 'areaID',
      label: $t('iotApp.deviceDetail.area'),
      defaultValue: defaultAreaID || undefined,
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.selectArea'),
        api: getAreaTreeOptions,
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

export function useAreaDevicesColumns(): VxeTableGridOptions<ThingsApi.DeviceInfo>['columns'] {
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
      title: $t('iotApp.productPage.product'),
    },
    {
      field: 'status',
      title: $t('iotApp.cardRoute.colStatus'),
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('iot.device.statusUnactivated'), value: 1, type: 'default' },
          { label: $t('iot.device.statusOnline'), value: 2, type: 'success' },
          { label: $t('iot.device.statusOffline'), value: 3, type: 'warning' },
          { label: $t('iot.device.statusAbnormal'), value: 4, type: 'error' },
        ],
      },
    },
  ];
}

export function useAreaGroupsFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('iotApp.area.groupName'),
    },
  ];
}

export function useGroupEditFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('iotApp.area.groupName'),
      rules: 'required',
      componentProps: {
        placeholder: $t('iotApp.area.areaNamePlaceholder'),
      },
    },
    {
      component: 'Input',
      fieldName: 'desc',
      label: $t('iotApp.area.descCol'),
      componentProps: {
        type: 'textarea',
        rows: 3,
        placeholder: $t('iotApp.group.descPlaceholder'),
        maxlength: 200,
        showCount: true,
      },
    },
  ];
}

export function useAreaGroupsColumns(
  onActionClick: OnActionClickFn<ThingsApi.GroupInfo>,
): VxeTableGridOptions<ThingsApi.GroupInfo>['columns'] {
  return [
    {
      field: 'name',
      title: $t('iotApp.area.groupName'),
      treeNode: true,
    },
    {
      field: 'deviceCount',
      title: $t('iotApp.area.deviceCount'),
      slots: {
        default: ({ row }: { row: ThingsApi.GroupInfo }) => {
          const count = row.deviceCount ?? 0;
          const text = count ? String(count) : $t('iotApp.area.add');
          return [
            h(NButton, {
              size: 'small',
              type: 'primary',
              quaternary: true,
              onClick: () => onActionClick({ code: 'viewGroupDevices', row } as any),
            }, { default: () => text }),
          ];
        },
      },
    },
    {
      field: 'createdTime',
      title: $t('iotApp.group.createdTimeCol'),
      formatter: 'customTime',
    },
    {
      field: 'desc',
      title: $t('iotApp.area.descCol'),
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 150,
    },
  ];
}
