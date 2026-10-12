<!-- 文件说明：编辑数组元素的数据定义。 -->
<script setup lang="ts">
import { $t } from '@vben/saas'
import { NInputNumber, NRadioButton, NRadioGroup } from 'naive-ui'
import { computed } from 'vue'

import type { Define } from './schema-types'

import XNumberDefinition from './x-number-definition.vue'

defineOptions({ name: 'XArrayDefinition', inheritAttrs: false })

const ARRAY_ELEMENT_OPTIONS = [
  { value: 'int', get label() { return $t('iotApp.schemaForm.dataTypeInt') } },
  { value: 'float', get label() { return $t('iotApp.schemaForm.dataTypeFloat') } },
  { value: 'string', get label() { return $t('iotApp.schemaForm.dataTypeString') } },
] as const

const props = defineProps<{ modelValue: Define }>()
const emit = defineEmits<{ 'update:modelValue': [Define] }>()

const elementType = computed({
  get: () => props.modelValue?.arrayInfo?.type ?? 'int',
  set: (v: string) => setElementType(v),
})

function setElementType(type: string) {
  const next = { ...props.modelValue }
  const prev = next.arrayInfo
  if (type === 'int') {
    next.arrayInfo = {
      type: 'int',
      min: prev?.min ?? '0',
      max: prev?.max ?? '100',
      step: prev?.step ?? '1',
      start: prev?.start ?? '0',
      unit: prev?.unit ?? '',
    }
  } else if (type === 'float') {
    next.arrayInfo = {
      type: 'float',
      min: prev?.min ?? '0.000',
      max: prev?.max ?? '100.000',
      step: prev?.step ?? '0.001',
      start: prev?.start ?? '0.000',
      unit: prev?.unit ?? '',
    }
  } else if (type === 'string') {
    next.arrayInfo = {
      type: 'string',
      max: prev?.max ?? '2048',
    }
  }
  emit('update:modelValue', next)
}

function updateArrayInfo(payload: Define) {
  const next = { ...props.modelValue }
  next.arrayInfo = payload
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="x-array-definition flex flex-col gap-3">
    <div>
      <div class="mb-2 text-xs text-gray-500">{{ $t('iotApp.schemaForm.elementType') }}</div>
      <NRadioGroup v-model:value="elementType" size="small">
        <NRadioButton
          v-for="opt in ARRAY_ELEMENT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </NRadioButton>
      </NRadioGroup>
    </div>
    <div>
      <template v-if="elementType === 'int' || elementType === 'float'">
        <XNumberDefinition
          :model-value="modelValue.arrayInfo ?? { type: elementType }"
          :is-float="elementType === 'float'"
          @update:model-value="updateArrayInfo"
        />
      </template>
      <template v-else-if="elementType === 'string'">
        <div>
          <div class="flex items-center gap-2">
            <NInputNumber
              :value="Number(modelValue.arrayInfo?.max) || 2048"
              :min="1"
              :max="2048"
              size="small"
              :placeholder="$t('iotApp.schemaForm.stringMaxPlaceholder')"
              class="flex-1"
              @update:value="(v) => updateArrayInfo({ ...modelValue.arrayInfo, type: 'string', max: v != null ? String(v) : '2048' })"
            />
            <span class="shrink-0 text-sm text-gray-500">{{ $t('iotApp.schemaForm.bytesUnit') }}</span>
          </div>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {{ $t('iotApp.schemaForm.stringLenTooltip') }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
