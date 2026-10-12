<script setup lang="ts">
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '../../adapter/form';
import { useMessage } from 'naive-ui';

import { ThingsApi } from '@vben/api';
import { useAreaStore } from '@vben/stores';

import { convertListToTree } from '@vben/utils';

import { useAccessStore } from '@vben/stores';

import type { UploadFileInfo } from 'naive-ui';

//@ts-ignore
import { get } from 'lodash';

const accessStore = useAccessStore();

const areaStore = useAreaStore();
const message = useMessage();

// 是否为编辑模式
const isEdit = ref(false);

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<Record<string, any>>();
      console.log('Modal opened with data:', data);

      // 判断是否为编辑模式
      isEdit.value = !!data?.areaID;

      // 设置表单初始值
      if (isEdit.value) {
        formApi.setValues({
          areaID: data.areaID,
          parentAreaID: data.parentAreaID,
          areaName: data.areaName,
          desc: data.desc || data.remark,
          // areaImg: [data.areaImg],
          areaType: data.areaType,
          areaStatus: data.areaStatus,
        });
      } else {
        // 新建时重置表单
        formApi.resetForm();
      }
    }
  },
});

const isUpdateAreaImg = ref(false);
const areaImg = ref('');

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  handleSubmit: async (values) => {
    try {
      console.log('Form submit:', values);
      const { file, ...rest } = values;

      if (isUpdateAreaImg.value) {
        rest.areaImg = areaImg.value;
        rest.isUpdateAreaImg = true;
      }

      if (isEdit.value) {
        // 更新区域
        await areaStore.updateArea({
          ...rest,
          areaID: values.areaID,
          projectID: '1786838173980422144',
        });
        message.success('区域更新成功');
      } else {
        // 创建区域
        await areaStore.createArea({ ...rest, projectID: '1786838173980422144' });
        message.success('区域创建成功');
      }

      modalApi.close();

      // 触发父组件刷新
    } catch (error) {
      console.error('保存失败:', error);
      message.error(isEdit.value ? '更新失败' : '创建失败');
    }
  },
  // handleReset: () => {
  //     modalApi.close();
  // },
  schema: [
    {
      label: '区域ID',
      fieldName: 'areaID',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '请选择区域ID',
      },
      dependencies: {
        show: (values) => {
          console.log('show', values);
          return isEdit.value;
        },
        triggerFields: ['areaID'],
      },
    },
    {
      label: '上级区域',
      fieldName: 'parentAreaID',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const res = await ThingsApi.postApiV1ThingsAreaInfoGetList({
            page: {
              page: 1,
              size: 1000,
            },
          });
          return convertListToTree(
            (res.list || []).map((item) => ({
              label: item.areaName || '',
              value: item.areaID || '',
              parentID: item.parentAreaID || '',
            })),
          );
        },
        labelField: 'label',
        valueField: 'value',
        placeholder: '请选择上级区域',
        clearable: true,
      },
      dependencies: {
        disabled: (values) => {
          return isEdit.value;
        },
        triggerFields: ['parentAreaID'],
      },
      // rules: 'selectRequired',
    },
    {
      label: '区域用途',
      fieldName: 'purpose',
      component: 'Select',
      componentProps: {
        options: [
          { label: '通用空间', value: 'commonSpace' },
          { label: '默认', value: 'default' },
        ],
        placeholder: '请选择区域用途',
        clearable: true,
      },
    },
    {
      label: '区域名称',
      fieldName: 'areaName',
      component: 'Input',
      componentProps: {
        placeholder: '请输入区域名称',
      },
      rules: 'required',
    },
    {
      label: '平面图',
      fieldName: 'file',
      component: 'Upload',
      defaultValue: [],
      componentProps: {
        accept: '.png,.jpg,.jpeg',
        disabled: false,
        multiple: false,
        showUploadList: true,
        listType: 'image-card',
        // maxCount: 1,
        max: 1,
        action: import.meta.env.VITE_GLOB_API_URL + 'api/v1/system/common/upload-file',
        headers: {
          'Ithings-Token': accessStore.accessToken,
        },
        onFinish: ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
          console.log('onFinish file', file, event);
          // formApi.setValues({
          //     areaImg: res.data.url,
          // });
          const resp = (event?.target as XMLHttpRequest).response;
          const data = JSON.parse(resp);
          console.log('onFinish resp', data);

          // const fileUri = get(data, 'data.fileUri', '');
          const filePath = get(data, 'data.filePath', '');
          // formApi.setValues({
          //     areaImg: data.url,
          // });
          console.log('onFinish filePath', filePath);

          areaImg.value = filePath;
          isUpdateAreaImg.value = true;
        },
      },
      renderComponentContent: () => {
        return {
          default: () => '上传平面图',
        };
      },
    },
    {
      label: '区域描述',
      fieldName: 'desc',
      component: 'Input',
      componentProps: {
        type: 'textarea',
        placeholder: '请输入区域描述',
        rows: 3,
      },
    },
  ],
});
</script>

<template>
  <Modal :footer="false">
    <Form />
  </Modal>
</template>
