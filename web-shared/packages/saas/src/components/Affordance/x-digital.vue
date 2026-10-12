<!-- 文件说明：编辑并验证数值型物模型字段。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import type { FormItemRule } from 'naive-ui'
import { NFormItem, NInputNumber, NTooltip } from 'naive-ui'
import { computed, useAttrs } from 'vue'
import { proInputProps, useProField } from 'pro-naive-ui'

defineOptions({ name: 'XInputDigital', inheritAttrs: false })

const props = defineProps({
  ...proInputProps,
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  precision: { type: Number, default: undefined },
  tooltip: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
})

const attrs = useAttrs()
const { field } = useProField(props)

const rule = computed<FormItemRule | undefined>(() => {
  if (!props.required) return undefined
  return {
    required: true,
    message: $t('iotApp.schemaForm.requiredInput'),
    trigger: ['blur', 'input'],
  }
})

const formItemProps = computed(() => ({
  label: props.title ?? props.label,
  path: props.path,
  required: props.required,
  rule: rule.value,
  ...attrs,
}))

function handleUpdateValue(val: number | null) {
  field.value.value = val == null ? '' : String(val)
}
</script>

<template>
  <NFormItem v-bind="formItemProps">
    <template v-if="tooltip" #label>
      <NTooltip>
        <template #trigger>
          <span class="inline-flex items-center">
            {{ title ?? label }}
            <span class="icon-[lucide--circle-help] ml-1 size-4 cursor-help opacity-50" />
          </span>
        </template>
        <div style="max-width: 320px">
          {{ tooltip }}
        </div>
      </NTooltip>
    </template>
    <div class="flex w-full items-center gap-2">
      <NInputNumber
        :value="field.value?.value !== '' && field.value?.value != null ? Number(field.value.value) : undefined"
        :min="min"
        :max="max"
        :precision="precision"
        class="min-w-0 flex-1"
        @update:value="handleUpdateValue"
      />
      <span v-if="suffix" class="shrink-0 text-sm text-gray-500">{{ suffix }}</span>
      <slot name="suffix" />
    </div>
  </NFormItem>
</template>
