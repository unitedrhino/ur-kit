<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { useVbenDrawer } from '@vben/common-ui';
import { $t, useVbenForm } from '@vben/saas';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useFormSchema } from '../data';
import { Api } from '../index.api';

const emit = defineEmits<{
  success: [];
}>();
// SDK 的 ProductInfo 模型未声明 id，但编辑场景下后端返回的数据必带 id（提交更新接口需要），包内交叉类型补充
type ProductEditInfo = ThingsApi.ProductInfo & { id?: string };
const formData = ref<ProductEditInfo>();
const titleSuffix = ref<string>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<ProductEditInfo>();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      } else {
        formApi.resetForm();
        titleSuffix.value = '';
      }
    }
  },
});

function updateCategory(id: string, data: ThingsApi.ProductInfo) {
  return Api.update(id, data);
}
function createCategory(data: ThingsApi.ProductInfo) {
  return Api.create(data);
}

async function onSubmit() {
  try {
    await formApi.validate();
  } catch {
    return;
  }

  drawerApi.lock();
  const data = await formApi.getValues<Omit<ThingsApi.ProductInfo, 'children' | 'id'>>();

  try {
    await (formData.value?.id ? updateCategory(formData.value.id, data) : createCategory(data));
    drawerApi.close();
    emit('success');
  } finally {
    drawerApi.unlock();
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id ? $t('ui.actionTitle.edit', [$t('iot.category.title')]) : $t('ui.actionTitle.create', [$t('iot.category.title')]),
);
</script>
<template>
  <Drawer class="w-full max-w-[800px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
