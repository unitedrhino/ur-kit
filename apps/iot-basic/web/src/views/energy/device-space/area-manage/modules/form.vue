<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ThingsApi } from '@vben/api';
import { $t } from '@vben/locales';

import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '@vben/saas';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useFormSchema } from '../data';
import { Api } from '../index.api';

const emit = defineEmits<{
  success: [data: { areaID?: string; parentAreaID?: string; isEdit: boolean }];
}>();

const formData = ref<ThingsApi.AreaInfo>();
const currentProjectID = ref<string>('');

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: [
    {
      component: 'ApiSelect',
      fieldName: 'parentAreaID',
      label: $t('iotApp.project.parentArea'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.parentAreaPlaceholder'),
        api: async () => {
          if (!currentProjectID.value) return [];
          const res = await Api.list(currentProjectID.value);
          return (res?.list || []).map((item) => ({
            label: item.areaNamePath || item.areaName || item.areaID,
            value: item.areaID,
          }));
        },
      },
    },
    ...useFormSchema(),
  ],
  showDefaultActions: false,
  submitOnEnter: true,
  handleSubmit: () => onSubmit(),
  wrapperClass: 'grid-cols-1 gap-x-4',
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ThingsApi.AreaInfo & { projectID?: string }>();
      if (data?.areaID) {
        // 编辑模式
        formData.value = data;
        currentProjectID.value = data.projectID || '';
        formApi.setValues(data);
      } else {
        // 新增模式
        formData.value = undefined;
        currentProjectID.value = data?.projectID || '';
        formApi.resetForm();
        if (data) {
          formApi.setValues({
            parentAreaID: data.parentAreaID || undefined,
          });
        }
      }
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    modalApi.lock();
    const values = await formApi.getValues<ThingsApi.AreaInfo>();
    const isEdit = !!formData.value?.areaID;
    const data = {
      ...values,
      projectID: currentProjectID.value,
      ...(isEdit ? { areaID: formData.value!.areaID } : {}),
    };
    try {
      const res = isEdit ? await Api.update(data) : await Api.create(data);
      modalApi.close();
      emit('success', {
        areaID: isEdit ? data.areaID : (res as { areaID?: string })?.areaID || '',
        parentAreaID: data.parentAreaID || '',
        isEdit,
      });
    } finally {
      modalApi.unlock();
    }
  }
}

const getTitle = computed(() =>
  formData.value?.areaID ? $t('orgIotClient.deviceSpace.editArea') : $t('orgIotClient.deviceSpace.addArea'),
);
</script>

<template>
  <Modal class="w-[560px]" :title="getTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Modal>
</template>
