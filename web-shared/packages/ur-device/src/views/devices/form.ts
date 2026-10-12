// import { ref, type Ref } from 'vue';
import { useVbenForm } from '../../adapter/form';
// import {
//   getAreaList,
//   getGroupList,
// } from '@vben/ur-hooks';
import { ThingsApi } from '@vben/api';

import { useArea } from '@vben/stores';
import { useGroup } from '@vben/stores';

export interface FormConfig {
  // gatewaySelectMap?: Ref<any[]>; // 网关选择映射
  onSubmit: (values: any) => void; // 表单提交回调
}

// 创建表单配置函数
export function useDeviceForm(config: FormConfig) {
  const { onSubmit } = config;

  const { getAreaOptions } = useArea();
  const { getGroupOptions } = useGroup();

  const getTreeSelectApi = async (params: any) => {
    if (!params?.node_type) {
      return [];
    }

    if (params?.node_type === 'area') {
      const res = getAreaOptions();

      console.log('res ----', res);

      return res;
    } else {
      return getGroupOptions();
    }
  };

  // const gatewaySelectMap = externalGatewaySelectMap || ref<any[]>([]);

  const [QueryForm, queryFormApi] = useVbenForm({
    layout: 'horizontal',
    schema: [
      {
        component: 'Select',
        fieldName: 'node_type',
        label: '节点类型',
        componentProps: {
          options: [
            { label: '建筑', value: 'building' },
            { label: '区域', value: 'area' },
          ],
          clearable: true,
        },
      },
      {
        component: 'ApiTreeSelect',
        fieldName: 'node_area',
        label: '节点选择',
        componentProps(values, _formApi) {
          return {
            api: getTreeSelectApi,
            params: {
              node_type: values.node_type,
            },
            clearable: true,
            labelField: 'label',
            valueField: 'key',
            childrenField: 'children',
            multiple: false,
            checkable: false,
            defaultExpandAll: true,
          };
        },
        dependencies: {
          triggerFields: ['node_type'],
          trigger(_values, formApi) {
            formApi.setFieldValue('node_area', undefined);
          },
          disabled: (values) => {
            return !values.node_type;
          },
        },
      },
      {
        component: 'Input',
        fieldName: 'deviceAlias',
        label: '仪表名称',
        componentProps: {
          clearable: true,
        },
      },
      {
        component: 'Input',
        fieldName: 'deviceName',
        label: '仪表地址',
        componentProps: {
          clearable: true,
        },
      },
      {
        component: 'ApiSelect',
        fieldName: 'gateway',
        label: '网关',
        componentProps: {
          api: async () => {
            const res = await ThingsApi.postApiV1ThingsDeviceInfoIndex({
              deviceTypes: [2],
              page: {
                page: 1,
                size: 1000,
              },
            });

            // gatewaySelectMap.value = res.list;

            return res.list.map((item: any) => ({
              label: item.deviceName + (item.deviceAlias ? '(' + item.deviceAlias + ')' : ''),
              value: JSON.stringify({
                id: item.id,
                deviceName: item.deviceName,
                productID: item.productID,
              }),
            }));
          },
          clearable: true,
        },
      },
      {
        component: 'Select',
        fieldName: 'deviceStatus',
        label: '设备状态',
        componentProps: {
          options: [
            { label: '未激活', value: 1 },
            { label: '在线', value: 2 },
            { label: '离线', value: 3 },
            { label: '异常', value: 4 },
            { label: '服务过期（仅 4G 设备）', value: 5 },
          ],
          clearable: true,
        },
      },
      {
        component: 'ApiTreeSelect',
        fieldName: 'node_area_filter',
        label: '节点过滤',
        componentProps(values, _formApi) {
          return {
            api: getTreeSelectApi,
            params: {
              node_type: values.node_type,
            },
            clearable: true,
            labelField: 'label',
            valueField: 'key',
            childrenField: 'children',
            multiple: false,
            checkable: false,
            defaultExpandAll: true,
          };
        },
        dependencies: {
          triggerFields: ['node_type'],
          trigger(_values, formApi) {
            formApi.setFieldValue('node_area', undefined);
          },
          disabled: (values) => {
            return !values.node_type;
          },
        },
      },
    ],
    handleSubmit: (values) => {
      onSubmit(values);
    },
    wrapperClass: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4',
  });

  return {
    QueryForm,
    queryFormApi,
    // gatewaySelectMap,
  };
}
