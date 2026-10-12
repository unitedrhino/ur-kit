<!-- 文件说明：承载物模型编辑表单并提交修改。 -->
<script lang="ts" setup generic="T extends { affordance?: string; type?: number; id?: string; identifier?: string }">
import { notifyRequestError } from '@vben/saas/request-error';

import { ref, provide } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useMessage, NSpace } from 'naive-ui';

import { createProForm, ProForm } from 'pro-naive-ui';

import AffordanceForm from './AffordanceForm.vue';

import { $t } from '@vben/saas';

import { createInitialAffordanceFormData, transformApiDataToFormData, transformFormData } from './utils';

import type { AffordanceFormData } from './form-types';

const emit = defineEmits<{
  success: [];
  /** 点击「从参数生成」链接时触发，父组件打开 GenFromParamsModal */
  openGenFromParams: [];
}>();

const props = withDefaults(
  defineProps<{
    onConfirm?: (data: T) => Promise<void> | void;
    isCreate: boolean;
    /** 可选类型，如 [1] 仅属性（设备物模型），默认 [1,2,3] 全部 */
    allowedSchemaTypes?: number[];
    /** 属性下可用的数据类型，如 ['bool','int','string','float','enum','timestamp'] 排除结构体/数组，默认全部 */
    allowedDataTypes?: string[];
    /** 标识符是否可编辑，默认跟随 isCreate */
    identifierEditable?: boolean;
  }>(),
  { allowedSchemaTypes: () => [1, 2, 3], allowedDataTypes: undefined, identifierEditable: undefined },
);

const titleSuffix = ref<string>();
const message = useMessage();

const initialFormData = createInitialAffordanceFormData();

const [Modal, modalApi] = useVbenModal({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<T>();
      // console.log('data=========打开通用物模型 获取表单数据 data=', data);
      // 支持通过 id 或 identifier 判断是否为编辑态（ProductSchemaInfo/DeviceSchema 没有 id 字段）
      if (data?.id || (data as { identifier?: string })?.identifier) {
        // console.log('data=========打开通用物模型 设置表单数据=', data);
        const transformData = transformApiDataToFormData(data) as AffordanceFormData;
        // console.log('transformData=========transformData=', transformData);
        form.values.value = transformData;
      } else {
        // 重置 ProForm
        // console.log('data=========打开通用物模型 重置表单数据=', initialFormData);
        form.values.value = createInitialAffordanceFormData();
        titleSuffix.value = '';
      }
    }
  },
});

async function onSubmit() {
  // 使用 ProForm 的验证
  const valid = await form.validate();
  if (valid) {
    modalApi.lock();
    const rawData: any = form.values.value;
    const data = transformFormData(rawData) as T;
    try {
      if (props.onConfirm) {
        await props.onConfirm(data);
      }
      modalApi.close();
      emit('success');
    } catch (error: any) {
      notifyRequestError(error, () => error?.msg || error?.message || error?.detail || $t('iotApp.common.saveFailed'), (text) => message.error(text));
    } finally {
      modalApi.unlock();
    }
  }
}

// const getDrawerTitle = computed(
//   () =>
//     form.values.value?.id || form.values.value?.identifier
//       ? $t('ui.actionTitle.edit', [props.title || $t('iot.schema.title')])
//       : $t('ui.actionTitle.create', [props.title || $t('iot.schema.title')]),
// );

function handleReset() {
  console.log('handleReset');
}
function handleSubmit(values: any) {
  console.log('handleSubmit', values);
}
function handleSubmitFailed(errors: any) {
  console.log('handleSubmitFailed', errors);
}

const insertOrUpdateLoading = ref(false);
const form = createProForm<AffordanceFormData>({
  initialValues: initialFormData,
  onReset: handleReset,
  onSubmit: handleSubmit,
  onSubmitFailed: handleSubmitFailed,
});

// 提供给子组件使用
provide('formValues', form.values);
provide('form', form);

// 暴露 modalApi 的方法
defineExpose({
  open: (data?: T) => {
    if (data) {
      modalApi.setData(data);
    }
    modalApi.open();
  },
  close: () => modalApi.close(),
  setData: (data: T) => modalApi.setData(data),
  getData: () => modalApi.getData<T>(),
});
</script>
<template>
  <Modal class="!w-[calc(100vw-32px)] max-w-[1100px]">
    <template #title>
      <NSpace>
        <span>{{ modalApi.useStore?.()?.value?.title ?? $t('iot.schema.title') }}</span>
        <a v-if="props.isCreate" class="text-primary cursor-pointer whitespace-nowrap text-sm hover:underline" @click.prevent="emit('openGenFromParams')">
          {{ $t('iotApp.schemaForm.generateFromParams') }}
        </a>
      </NSpace>
    </template>
    <div class="flex min-w-0 px-2">
      <ProForm class="w-full min-w-0" :form="form" :loading="insertOrUpdateLoading" label-placement="top">
        <AffordanceForm
          :isCreate="props.isCreate"
          :form="form"
          :allowed-schema-types="props.allowedSchemaTypes"
          :allowed-data-types="props.allowedDataTypes"
          :identifier-editable="props.identifierEditable"
        />
      </ProForm>
    </div>
  </Modal>
</template>
