<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '../../adapter/form';
import { useMessage } from 'naive-ui';

import { ThingsApi } from '@vben/api';

import { convertListToTree } from '@vben/utils';

//@ts-ignore
import { get } from 'lodash';

const message = useMessage();

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      const incomingOptions = (data?.selectedDevices || []) as Array<{
        label: string;
        value: string | number;
      }>;
      formApi.setValues({
        selectedDevices: incomingOptions.map((i) => i.value),
      });
    }
  },
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  handleSubmit: async (values) => {
    try {
      // 走 设备关联 区域 接口
      console.log('values', values);
      const selectedDevices = values.selectedDevices.map((item: any) => {
        const { deviceName, productID } = JSON.parse(item);
        return {
          productID,
          deviceName,
        };
      });

      console.log('selectedDevices', selectedDevices);

      const res = await ThingsApi.postApiV1ThingsDeviceInfoMultiUpdate(
        {
          devices: selectedDevices,
          areaID: values.linkAreaID,
        },
        {
          responseReturn: 'body',
        },
      );
      if (res.code === 200) {
        message.success('关联成功');
        modalApi.close();
      } else {
        message.error(res.msg || '关联失败');
      }

      // 触发父组件刷新
    } catch (error) {
      console.error('保存失败:', error);
      message.error('关联失败');
    }
  },
  schema: [
    {
      label: '选中的设备列表',
      fieldName: 'selectedDevices',
      component: 'Select',
      componentProps() {
        const data = modalApi.getData<Record<string, any>>();
        return {
          options: (data?.selectedDevices || []) as Array<{
            label: string;
            value: string | number;
          }>,
          multiple: true,
          clearable: true,
          placeholder: '请选择设备',
          maxTagCount: 3,
          onUpdateValue: (value: any) => {
            modalApi.setState({
              title: '已经选中' + value.length + '个设备，请选择关联区域',
            });
          },
        };
      },
    },
    {
      label: '关联区域',
      fieldName: 'linkAreaID',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({
            page: {
              page: 1,
              size: 1000,
            },
          });
          const treeData = convertListToTree(
            (res.list || []).map((item) => ({
              label: item.areaName || '',
              value: item.areaID || '',
              parentID: item.parentAreaID || '',
            })),
          );

          return treeData;
        },
        labelField: 'label',
        valueField: 'value',
        placeholder: '请选择关联区域',
        clearable: true,
        defaultExpandAll: true,
      },
      rules: 'selectRequired',
    },
  ],
});
</script>

<template>
  <Modal :footer="false">
    <Form />
  </Modal>
</template>
