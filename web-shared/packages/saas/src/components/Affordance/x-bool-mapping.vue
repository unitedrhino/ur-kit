<!-- 文件说明：编辑并验证布尔值映射。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import type { FormItemRule } from 'naive-ui'
import { NFormItem } from 'naive-ui'
import { computed } from 'vue'
import { proInputProps, useProField } from 'pro-naive-ui'

import type { Define } from './schema-types'

import XBoolDefinition from './x-bool-definition.vue'

defineOptions({ name: 'XBoolMapping', inheritAttrs: false })

const props = defineProps(proInputProps)
const { field } = useProField(props)

const rule = computed<FormItemRule | undefined>(() => {
  if (!props.required) return undefined
  return {
    required: true,
    validator(_rule, value: unknown) {
      const def = value as Define | undefined
      const m0 = def?.mapping?.['0']?.trim()
      const m1 = def?.mapping?.['1']?.trim()
    if (!m0 || !m1) return new Error($t('iotApp.schemaForm.boolMappingRequired'))
      return true
    },
    trigger: ['blur', 'input'],
  }
})

const defineValue = computed(
  () => (field.value?.value ?? { type: 'bool', mapping: { '0': '关', '1': '开' } }) as Define,
)

function handleUpdate(v: Define) {
  field.value.value = v
}
</script>

<template>
  <NFormItem
    :label="props.title ?? props.label"
    :path="props.path"
    :required="props.required"
    :rule="rule"
  >
    <XBoolDefinition :model-value="defineValue" @update:model-value="handleUpdate" />
  </NFormItem>
</template>
