<script lang="ts" setup>
// import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '@vben/saas';

import { computed, ref } from 'vue';

import { ThingsApi } from '@vben/api';
// import { IconifyIcon } from '@vben/icons';
// import { getPopupContainer } from '@vben/utils';
import { useVbenDrawer } from '@vben/common-ui';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

// import { useVbenForm, z } from '#/adapter/form';
import { useVbenForm } from '@vben/saas';
import { $t } from '@vben/locales';

// import { getMenuTypeOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();
// const formData = ref<ThingsApi.ProductInfo>();
const titleSuffix = ref<string>();
const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'productName',
    label: $t('orgManage.user.productName'),
  },
  {
    component: 'Upload',
    fieldName: 'productImg',
    label: $t('orgManage.user.productImage'),
    componentProps: {
      accept: 'image/*',
      listType: 'image-card',
      max: 1,
      // 自定义上传请求，这里需要根据实际的上传接口进行调整
      customRequest: ({ file, onFinish }: any) => {
        // TODO: 实现实际的图片上传逻辑
        // 例如：uploadImage(file).then(onFinish).catch(onError)
        // console.log('上传文件:', file);
        uploadImage(file);
        // 临时模拟上传成功
        setTimeout(() => {
          onFinish();
        }, 1000);
      },
    },
  },
];

// mock上传图片
function uploadImage(file: any) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(file);
    }, 1000);
  });
}

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<ThingsApi.ProductInfo>();
      // if (data?.type === 'link') {
      //   data.linkSrc = data.meta?.link;
      // } else if (data?.type === 'embedded') {
      //   data.linkSrc = data.meta?.iframeSrc;
      // }
      if (data) {
        // formData.value = data;
        // formApi.setValues(formData.value);
        // titleSuffix.value = formData.value.meta?.title
        //   ? $t(formData.value.meta.title)
        //   : '';
      } else {
        formApi.resetForm();
        titleSuffix.value = '';
      }
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    // const data =
    //   await formApi.getValues<
    //     Omit<ThingsApi.ProductInfo, 'children' | 'id'>
    //   >();

    try {
      // await (formData.value?.id
      //   ? updateMenu(formData.value.id, data)
      //   : createMenu(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(
  () => $t('orgManage.user.newProduct'),
  // formData.value?.id
  //   ? $t('ui.actionTitle.edit', [$t('product.name')])
  //   : $t('ui.actionTitle.create', [$t('product.name')]),
);
</script>
<template>
  <Drawer class="w-full max-w-[800px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
