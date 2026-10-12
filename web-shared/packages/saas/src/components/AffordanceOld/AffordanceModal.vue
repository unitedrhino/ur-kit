<script lang="ts" setup generic="T extends { affordance?: string; type?: number; id?: string }">
import { notifyRequestError } from '@vben/saas/request-error';
import { $t } from '@vben/locales';

import { computed, ref, provide } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useMessage } from 'naive-ui';

import {
  createProForm,
  ProForm,
} from 'pro-naive-ui';

import AffordanceForm from './AffordanceForm.vue';

import type {
  PropertyAffordance,
  EventAffordance,
  ActionAffordance,
} from '../Affordance/schema-types';

import { transformFormData, transformApiDataToFormData } from './utils';

const emit = defineEmits<{
  success: [];
}>();

const props = defineProps<{
  onConfirm?: (data: T) => Promise<void> | void;
  isCreate: boolean;
}>();

const titleSuffix = ref<string>();
const message = useMessage();

// ProForm 表单初始数据结构
// 注意：bool 类型使用 mapping 对象，enum 类型使用 mappingList 数组
const initialFormData: Omit<T, 'affordance'> & {
  affordance?: PropertyAffordance | EventAffordance | ActionAffordance;
  modelFeatures?: string[];
} = {
  type: 1, // 默认 属性
  name: '',
  identifier: '',
  desc: '',
  isCanSceneLinkage: 1,
  funcGroup: 1,
  recordMode: 1,
  isPassword: 2,
  order: 0,
  extendConfig: '',
  modelFeatures: [],  // 默认为空数组，表示所有特性都未选中
  affordance: {
    isUseShadow: false,
    define: {
      type: 'bool',
      mapping: {
        '0': '关',
        '1': '开',
      },
    },
    mode: 'rw',
    controlMode: 1,
    recordMode: 1,
    isPassword: 2,

  } as PropertyAffordance
} as any;

const [Modal, modalApi] = useVbenModal({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<T>();
      console.log('data=========打开通用物模型 获取表单数据 data=', data);
      // 支持通过 id 或 identifier 判断是否为编辑态（ProductSchemaInfo/DeviceSchema 没有 id 字段）
      if (data?.id || (data as any)?.identifier) {
        console.log('data=========打开通用物模型 设置表单数据=', data);
        const transformData = transformApiDataToFormData(data);
        console.log('transformData=========transformData=', transformData);
        form.values.value = transformData as any;
      } else {
        // 重置 ProForm
        console.log('data=========打开通用物模型 重置表单数据=', initialFormData);
        form.values.value = initialFormData as any;
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

        //for debug add affordance json obj to req data
        let _data = data;
        if (_data.affordance) {
          (_data as any).affordance_for_debug = JSON.parse(_data.affordance);
        }
        console.log('_data=========onSubmit _data=', _data);

        await props.onConfirm(data);
      }
      modalApi.close();
      emit('success');
    } catch (error: any) {
      notifyRequestError(error, () => error.message || $t('console.im.operationFailed'), (text) => message.error(text));
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
const form = createProForm({
  initialValues: initialFormData,
  onReset: handleReset,
  onSubmit: handleSubmit,
  onSubmitFailed: handleSubmitFailed,
});

// 使用 computed 监听表单数据变化，用于条件显示
const formValues = form.values;
const currentType = computed(() => form.values.value.type);
const currentDataType = computed(() => (form.values.value.affordance as PropertyAffordance | undefined)?.define?.type);
const currentArrayType = computed(() => (form.values.value.affordance as PropertyAffordance | undefined)?.define?.arrayInfo?.type);

// 提供给子组件使用
provide('formValues', formValues);
provide('currentType', currentType);
provide('currentDataType', currentDataType);
provide('currentArrayType', currentArrayType);

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
  <Modal class="w-full max-w-[1100px]">
    <div class="flex pl-2 pr-2">
      <ProForm :form="form" :loading="insertOrUpdateLoading" label-placement="left" label-width="150px">
        <AffordanceForm
          :isCreate="props.isCreate"
          :form="form"
          :currentType="currentType"
          :currentDataType="currentDataType"
          :currentArrayType="currentArrayType"
        />
      </ProForm>
    </div>
  </Modal>
</template>
