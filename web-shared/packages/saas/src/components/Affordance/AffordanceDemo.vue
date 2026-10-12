<!-- 文件说明：展示物模型字段编辑控件及多语言表单布局。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import { provide } from 'vue'
import { createProForm } from 'pro-naive-ui'
import { ProButton, ProForm, ProInput } from 'pro-naive-ui'

import XDigital from './x-digital.vue'
import XEnumMapping from './x-enum-mapping.vue'
import XStruct from './x-struct.vue'

const form = createProForm({
  initialValues: { name: '2222' },
  onSubmit: (values) => console.log(values),
})

provide('form', form)
</script>

<template>
  <div>
    <ProForm :form="form" label-placement="top">
      <XDigital path="name" :label="$t('iotApp.schemaForm.name')" required />
      <ProInput :placeholder="$t('iotApp.schemaForm.requiredInput')" path="content" :label="$t('iotApp.schemaForm.content')" />
      <XEnumMapping path="affordance.define.mapping" :label="$t('iotApp.schemaForm.mapping')" />
      <XStruct path="affordance.define.specs" :label="$t('iotApp.schemaForm.struct')" />
      <ProButton attr-type="submit">{{ $t('iotApp.schemaForm.submit') }}</ProButton>
    </ProForm>
  </div>
</template>
