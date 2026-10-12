<script lang="ts" setup>
import { notifyRequestError } from '@vben/saas/request-error';

import { computed, ref } from 'vue';

import { ThingsApi } from '@vben/api';

import { $t } from '@vben/saas';

import { useVbenModal } from '@vben/common-ui';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { NButton, NInput, NSpace, useMessage } from 'naive-ui';

import { useVbenForm } from '@vben/saas';

import { useFormSchema } from '../data';
import { Api } from '../index.api';

const emit = defineEmits<{
  success: [data: { id?: string; parentID?: string; isEdit: boolean }];
}>();

const formData = ref<ThingsApi.GroupInfo>();
const tags = ref<{ key: string; value: string }[]>([]);
const message = useMessage();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

function addTag() {
  tags.value.push({ key: '', value: '' });
}
function removeTag(index: number) {
  tags.value.splice(index, 1);
}
function tagsToObject(): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const tag of tags.value) {
    if (tag.key) obj[tag.key] = tag.value;
  }
  return obj;
}
function objectToTags(obj?: Record<string, string> | null): { key: string; value: string }[] {
  if (!obj) return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema: [
    {
      component: 'ApiSelect',
      fieldName: 'parentID',
      label: $t('orgIotClient.deviceSpace.parentGroup'),
      componentProps: {
        clearable: true,
        placeholder: $t('orgIotClient.deviceSpace.parentGroupPlaceholder'),
        api: async () => {
          const res = await Api.list();
          return (res?.list || []).map((item) => ({
            label: item.name,
            value: item.id,
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
      const data = modalApi.getData<ThingsApi.GroupInfo>();
      if (data?.id) {
        // 编辑模式
        formData.value = data;
        formApi.setValues(data);
        tags.value = objectToTags(data.tags as Record<string, string>);
      } else {
        // 新增模式
        formData.value = undefined;
        formApi.resetForm();
        tags.value = [];
        if (data?.parentID) {
          formApi.setValues({
            parentID: data.parentID,
            purpose: data.purpose,
            productID: data.productID,
            areaID: data.areaID,
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
    const values = await formApi.getValues<ThingsApi.GroupInfo>();
    const data = { ...values, tags: tagsToObject() };

    try {
      const isEdit = !!formData.value?.id;
      const res = isEdit
        ? await Api.update(data)
        : await Api.create(data);
      modalApi.close();
      emit('success', {
        id: isEdit ? values.id : (res as { id?: string })?.id || '',
        parentID: values.parentID || '',
        isEdit,
      });
    } catch (err: any) {
      notifyRequestError(err, () => err?.msg || err?.message || $t('orgIotClient.deviceSpace.operationFailed'), (text) => message.error(text));
    } finally {
      modalApi.unlock();
    }
  }
}

const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit')
    : $t('ui.actionTitle.create'),
);
</script>
<template>
  <Modal class="w-[560px]" :title="getTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
    <div class="mx-4 mb-4">
      <div class="mb-2 text-sm font-medium">{{ $t('orgIotClient.deviceSpace.groupTagTitle') }}</div>
      <NSpace v-for="(tag, i) in tags" :key="i" class="mb-2" align="center">
        <NInput v-model:value="tag.key" :placeholder="$t('orgIotClient.deviceSpace.tagKeyPlaceholder')" style="width: 180px" />
        <NInput v-model:value="tag.value" :placeholder="$t('orgIotClient.deviceSpace.tagValuePlaceholder')" style="width: 180px" />
        <NButton text type="error" @click="removeTag(i)">
          <span class="icon-[mdi--minus-circle] size-5"></span>
        </NButton>
      </NSpace>
      <NButton text type="primary" @click="addTag">
        <span class="icon-[mdi--plus] size-4 mr-1"></span>
        {{ $t('orgIotClient.deviceSpace.addNewTag') }}
      </NButton>
    </div>
  </Modal>
</template>
